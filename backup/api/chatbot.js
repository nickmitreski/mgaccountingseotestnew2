// api/chatbot.js

// Ensure we're using node-fetch if running in a Node.js environment locally
// Vercel's environment provides fetch globally.
const fetch = global.fetch || require('node-fetch');

// Define safety settings (can be adjusted)
const safetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("API key not found in environment variables.");
        return res.status(500).json({ error: "Server configuration error: API key missing." });
    }

    try {
        const { prompt, generationConfig } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Missing 'prompt' in request body." });
        }

        // Construct the correct API URL with the key as a query parameter
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: safetySettings,
            generationConfig: generationConfig || { // Use provided config or default
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        console.log("Sending request to Google API:", apiUrl);
        // console.log("Request body:", JSON.stringify(requestBody, null, 2)); // Optional: log full body

        const googleApiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Google API response status:", googleApiResponse.status);

        if (!googleApiResponse.ok) {
            const errorText = await googleApiResponse.text();
            console.error('Google API Error Response:', errorText);
            // Forward a generic error to the client, log the specific one
            return res.status(googleApiResponse.status).json({ error: "Failed to get response from AI service." });
        }

        const data = await googleApiResponse.json();
        // console.log("Google API Response Data:", JSON.stringify(data, null, 2)); // Optional: log full data

        // Extract the text response
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('No text found in Google API response:', data);
            return res.status(500).json({ error: "AI service returned an unexpected response format." });
        }

        // Send the extracted text back to the frontend
        res.status(200).json({ text: text });

    } catch (error) {
        console.error('Error in /api/chatbot handler:', error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
} 