// api/chatbot.js

const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

// Read the knowledge base file synchronously
const knowledgeBase = fs.readFileSync(path.join(process.cwd(), 'knowledge_base.txt'), 'utf8');

// Define safety settings (can be adjusted)
const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

const SYSTEM_PROMPT = `You are a professional Australian tax and accounting assistant for MG Accounting. Your responses should be:

1. Professional and authoritative - use proper business terminology while remaining clear and accessible
2. Concise - keep responses brief and to the point (max 30 words)
3. Accurate - base all answers on the provided knowledge base
4. Context-aware - consider the conversation history and detected topics when responding
5. Helpful - provide actionable information when possible

CRITICAL RULES:
- NEVER include mock conversations in your responses
- NEVER include "User:" or "Assistant:" in your responses
- NEVER include multiple responses in a single message
- ALWAYS respond directly to the user's question
- NEVER use emojis or casual language

Guidelines:
- Use proper business language, avoiding casual terms and emojis
- Maintain a professional yet approachable tone
- Focus on one key point per response
- If unsure, suggest consulting with MG Accounting
- Never use jargon without explanation
- Keep responses under 30 words unless specifically asked for more detail
- Provide direct, actionable answers

Conversation Flow:
- Start with a clear, direct answer
- If the topic is complex, break it into steps
- End with a relevant follow-up question or next step
- Use the conversation history to maintain context
- If the user switches topics, acknowledge the change

Knowledge Base:
${knowledgeBase}

Remember: You are a professional advisor, not a casual friend. Maintain appropriate business communication standards while being helpful and clear. Your goal is to provide accurate, actionable information while guiding users toward professional consultation when needed.`;

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.mgaccounting.com.au');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        console.error('Mistral API key not configured');
        return res.status(500).json({ error: 'Mistral API key not configured' });
    }

    try {
        const { message, history } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Combine history with current message for context
        const conversationContext = history ? `${history}\nUser: ${message}` : `User: ${message}`;
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'mistral-small',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: conversationContext }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            console.error('Mistral API error:', response.status, response.statusText);
            throw new Error(`Mistral API request failed with status ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Invalid Mistral API response format:', data);
            throw new Error('Invalid Mistral API response format');
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error in chatbot API:', error);
        res.status(500).json({ 
            error: 'Failed to get response from Mistral API',
            details: error.message
        });
    }
} 