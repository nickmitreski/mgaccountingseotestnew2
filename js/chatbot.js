class Chatbot {
    constructor() {
        this.container = document.getElementById('chatbot-container');
        this.toggle = document.getElementById('chatbot-toggle');
        this.window = document.getElementById('chatbot-window');
        this.close = document.getElementById('chatbot-close');
        this.messages = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.send = document.getElementById('chatbot-send');
        this.badge = document.querySelector('.chatbot-badge');
        
        this.isOpen = false;
        this.conversationHistory = [];
        this.hasScheduledMeeting = false;
        this.calendlyWidget = null;
        
        // Check if all required elements exist
        if (!this.container || !this.toggle || !this.window || !this.close || 
            !this.messages || !this.input || !this.send || !this.badge) {
            console.error('Required chatbot elements not found');
            return;
        }
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Toggle chat window
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleChat();
        });

        // Close chat window
        this.close.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleChat();
        });

        // Send message
        this.send.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.sendMessage();
        });

        // Handle Enter key
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                this.sendMessage();
            }
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.container.contains(e.target) && 
                !e.target.closest('.chatbot-container')) {
                this.toggleChat();
            }
        });
    }

    toggleChat() {
        if (!this.window || !this.badge) {
            console.error('Chatbot elements not found');
            return;
        }
        
        this.isOpen = !this.isOpen;
        this.window.classList.toggle('active', this.isOpen);
        this.badge.style.display = this.isOpen ? 'none' : 'flex';
        
        if (this.isOpen && this.input) {
            this.input.focus();
        }
    }

    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.input.value = '';

        // Show typing indicator with estimated time
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div class="typing-text">Thinking...</div>
        `;
        this.messages.appendChild(typingIndicator);
        this.messages.scrollTop = this.messages.scrollHeight;

        // Start response timer
        const startTime = Date.now();
        
        try {
            // Add chat history to the message
            const storedHistory = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
            const lastFewMessages = storedHistory.slice(-6); // Get last 6 messages for context
            const historyContext = lastFewMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
            
            // Get response from Mistral API
            const response = await this.getAIResponse(message);
            
            // Calculate response time and ensure minimum display time
            const responseTime = Date.now() - startTime;
            const minDisplayTime = 1000; // Minimum 1 second display time
            const remainingTime = Math.max(0, minDisplayTime - responseTime);
            
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
            
            // Remove typing indicator
            this.messages.removeChild(typingIndicator);
            
            // Add bot response
            this.addMessage(response, 'bot');
            
            // Check if response contains meeting scheduling suggestion
            if (response.toLowerCase().includes('schedule a meeting') && !this.hasScheduledMeeting) {
                this.addCalendlyWidget();
            }

            // Store the message in session storage with timestamp
            const currentHistory = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
            currentHistory.push({ 
                role: 'user', 
                content: message,
                timestamp: new Date().toISOString(),
                topic: this.detectTopic(message)
            });
            currentHistory.push({ 
                role: 'assistant', 
                content: response,
                timestamp: new Date().toISOString(),
                topic: this.detectTopic(response)
            });
            sessionStorage.setItem('chatHistory', JSON.stringify(currentHistory));
        } catch (error) {
            // Remove typing indicator
            this.messages.removeChild(typingIndicator);
            
            // Add error message
            this.addMessage("I apologize, but I'm having trouble processing your request. Please try again or contact MG Accounting directly for assistance.", 'bot');
        }
    }

    async getAIResponse(message) {
        try {
            // Add chat history to the request for context
            const storedHistory = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
            const lastFewMessages = storedHistory.slice(-6); // Get last 6 messages for context
            const historyContext = lastFewMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

            // Use the correct API endpoint URL
            const apiUrl = window.location.hostname === 'localhost' 
                ? '/api/chatbot'
                : 'https://mg-accounting.vercel.app/api/chatbot';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: historyContext
                })
            });

            if (!response.ok) {
                console.error('API response not ok:', response.status, response.statusText);
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error in getAIResponse:', error);
            return "I apologize, but I'm having trouble processing your request. Please try again or contact MG Accounting directly at (03) 9563 4666 for immediate assistance.";
        }
    }

    prepareContext() {
        return {
            website: 'MG Accounting',
            services: [
                'Tax Planning & Returns',
                'Business Advisory',
                'Bookkeeping & Payroll',
                'Wealth Management',
                'SMSF Services',
                'Business Structuring'
            ],
            location: 'Oakleigh, Melbourne',
            contact: {
                phone: '(03) 9563 4666',
                email: 'info@mgaccounting.com.au',
                address: '7-9 Station Street, Oakleigh VIC 3166'
            },
            knowledge_base: `=== MG Accounting Information ===

**About Us:**
- Established in 1990, MG Accounting is a trusted financial partner for businesses and individuals across Australia.
- With over 30 years of experience navigating economic landscapes, we provide strategic, innovative accounting and financial advice tailored to clients' unique goals.
- Our core values are integrity, diligence, transparency, fairness, humility, and respect.
- We prioritize client privacy and confidentiality, leveraging a network of trusted referral partners.
- Recognized for excellence in accounting services, with a focus on sustainable client growth.

**Services:**
- **Tax Planning & Returns:**
  - Strategic tax planning and compliance for individuals and businesses.
  - Maximizing deductions and minimizing liabilities through tailored strategies.
  - Services include individual tax returns, business tax planning, and tax minimization strategies.
  - Example: Optimizing deductions for work-related expenses or business costs.
- **Business Advisory:**
  - Expert guidance for business growth, strategic planning, and performance optimization.
  - Services include growth strategies, performance analysis, and business structure setup.
  - Example: Assisting startups with financial forecasting or established firms with expansion plans.
- **Bookkeeping & Payroll:**
  - Accurate, efficient financial record-keeping and streamlined payroll management.
  - Services include financial records management, payroll processing, BAS & IAS lodgment, and cloud computing solutions.
  - Utilizes platforms like Xero and MYOB for real-time financial insights.
- **Wealth Management:**
  - Comprehensive wealth-building and protection strategies for long-term financial security.
  - Services include investment planning, retirement strategies, and asset protection.
  - Example: Developing diversified investment portfolios or retirement plans.
- **SMSF Services:**
  - Expert self-managed super fund (SMSF) setup, management, compliance, and auditing.
  - Services include investment strategy development and regulatory reporting.
  - Example: Ensuring SMSF compliance with ATO regulations for maximum benefits.
- **Business Structuring:**
  - Optimal business structure setup and advice to protect assets and minimize risk.
  - Services include entity structure setup (e.g., sole trader, company, trust), risk management, and succession planning.
  - Example: Advising on trust structures for tax efficiency and asset protection.

**Client Statistics:**
- Individual/Sole Trader Tax Returns lodged: 10,000+
- Company Tax Returns lodged: 7,500+
- Trust Tax Returns lodged: 5,000+
- Partnerships & SMSF Tax Returns lodged: 4,500+

**Clients:**
- Serves diverse industries: Retail & Hospitality, Healthcare, Construction, Professional Services, Transport & Logistics, Food & Beverage.
- Notable clients: Ferguson Plarre, 7-Eleven, Gloria Jeans, Australia Post, privately owned cafes/restaurants, poultry shops.
- Example: Provided tax planning for retail chains to optimize deductions.

**Contact Information:**
- Address: 7-9 Station Street, Oakleigh VIC 3166, Australia
- Email: info@mgaccounting.com.au
- Phone: (03) 9563 4666
- Business Hours: Monday - Friday, 9:00 AM - 5:00 PM

=== General Australian Tax Information ===

**Important Notes for Chatbot and Users:**
- **Chatbot Directive:** For every tax-related question, include: "For personalized tax advice, please contact MG Accounting at info@mgaccounting.com.au or (03) 9563 4666."
- **User Disclaimer:** This information is general and not a substitute for professional advice. For personalized tax advice, contact MG Accounting at info@mgaccounting.com.au or (03) 9563 4666.
- The Australian financial year runs from July 1 to June 30, administered by the Australian Taxation Office (ATO).

**Tax File Number (TFN):**
- Required for employment, government payments, and tax purposes in Australia.
- Apply online via the ATO or by paper; keep TFN secure and update details as needed.
- Example: Needed to lodge tax returns or open bank accounts.

**Tax Return:**
- Individuals with taxable income must lodge annually, typically by October 31.
- Lodge online via myGov or by paper; tax agents can assist.
- ATO's Tax Help program offers free assistance for low-income earners.
- Example: Declare income from wages, investments, or side hustles.

**Income and Deductions:**
- **Income:** Declare all sources, including wages, business income, investments, and crypto assets.
- **Deductions:** Claim eligible expenses to reduce taxable income.
- **Common Deductions:**
  - Work-related expenses: Uniforms, tools, work travel, home office costs.
  - Self-education expenses: Courses related to current employment.
  - Charitable donations: To ATO-registered charities.
  - Professional fees: Tax agent fees, union dues.
  - Investment expenses: Interest on loans for income-producing assets.
- **How to Claim Deductions:**
  - Maintain records (e.g., receipts, invoices) for five years.
  - Ensure expenses are directly related to income generation.
  - Example: Keep a logbook for work-related car expenses.

**Medicare Levy:**
- A 2% levy on taxable income to fund Australia's public health system.
- **Exemptions and Reductions:**
  - Low-income earners may qualify for reductions or exemptions.
  - For 2024-25, thresholds increased by 4.7% from 2023-24:
    - Singles: Lower threshold ~$27,222, Upper threshold ~$34,028.
    - Families: Varies based on income and dependents.
  - Example: No levy if income is below $27,222 for singles.

**Medicare Levy Surcharge (MLS):**
- Applies to high-income earners without private hospital cover.
- **Thresholds for 2024-25:**
  - Singles: Base ≤$97,000 (0%), Tier 1 $97,001–$113,000 (1%), Tier 2 $113,001–$151,000 (1.25%), Tier 3 ≥$151,001 (1.5%).
  - Families: Base ≤$194,000 (0%), Tier 1 $194,001–$226,000 (1%), Tier 2 $226,001–$302,000 (1.25%), Tier 3 ≥$302,001 (1.5%).
  - Family threshold increases by $1,500 per dependent child after the first.
- Example: A single earner with $120,000 income pays 1.25% MLS without private cover.

**Investments and Assets:**
- **Capital Gains Tax (CGT):** Applies to profits from selling assets like property or shares.
  - 50% discount for assets held over 12 months (individuals).
- **Negative Gearing:** Offset investment losses (e.g., property loan interest) against other income.
- **Crypto Assets:** Gains from trading or selling crypto are taxable as capital gains or income.
- Example: Selling shares held for two years may qualify for a CGT discount.

**Superannuation:**
- A retirement savings system with employer and personal contributions.
- **Contribution Limits (2024-25):**
  - Concessional (pre-tax): $30,000 (e.g., employer super guarantee).
  - Non-concessional (after-tax): $110,000.
- **Taxation:**
  - Concessional contributions taxed at 15% (higher for high earners).
  - Non-concessional contributions untaxed unless exceeding caps.
- **SMSF:** Offers investment control but requires strict ATO compliance.
- Example: Salary sacrificing to super can reduce taxable income.

**Goods and Services Tax (GST):**
- A 10% tax on most goods and services.
- **Registration:** Mandatory for businesses with annual turnover ≥$75,000 ($150,000 for non-profits).
- **GST-Free Items:** Includes basic food, medical services, and education.
- Example: A café must register for GST if turnover exceeds $75,000.

**Income Tax Rates (2024-25):**
| Taxable Income Range       | Tax Rate                                      |
|----------------------------|-----------------------------------------------|
| $0 – $18,200              | Nil                                           |
| $18,201 – $45,000         | 16c for each $1 over $18,200                  |
| $45,001 – $135,000        | $4,288 plus 30c for each $1 over $45,000      |
| $135,001 – $190,000       | $31,288 plus 37c for each $1 over $135,000    |
| $190,001 and over         | $51,638 plus 45c for each $1 over $190,000    |
- Note: Excludes Medicare levy (2%).

**Low-Income Tax Offset (LITO) (2024-25):**
- Maximum $700 for taxable incomes below $37,500.
- Phases out at 5% from $37,500 to $45,000, then 1.5% to $66,667 (nil).
- Example: $30,000 income qualifies for full $700 offset.

**Other Tax Offsets:**
- **Seniors and Pensioners Tax Offset (SAPTO):** For eligible seniors/pensioners.
- **Private Health Insurance Rebate:** Income-tested rebate for private health cover.
- **Invalid and Invalid Carer Offset:** For maintaining an invalid or carer.
- Example: SAPTO can reduce tax for retirees with low incomes.

**Business Structures and Taxation:**
- **Sole Trader:** Income taxed at individual rates; simple but no liability protection.
- **Partnership:** Income split among partners, taxed at individual rates.
- **Company:** Flat 30% tax rate (25% for small businesses); offers liability protection.
- **Trust:** Income distributed to beneficiaries, taxed at their rates.
- Example: A company structure suits businesses needing asset protection.

**Tax Planning Strategies:**
- **Maximize Deductions:** Claim all eligible expenses with proper records.
- **Super Contributions:** Salary sacrifice to reduce taxable income.
- **Income Splitting:** Distribute income via trusts or partnerships (if applicable).
- **Timing Income/Expenses:** Defer income or bring forward expenses to lower tax.
- Example: Donating to charity before June 30 can reduce taxable income.

**Residency and International Tax:**
- **Residency Status:** Determines tax obligations; residents taxed on worldwide income.
- **Non-Residents:** Taxed only on Australian-sourced income at different rates.
- **Moving Overseas:** Report foreign income and assets; may need to lodge returns.
- Example: A non-resident pays 32.5% on the first $135,000 of Australian income.

**Special Groups:**
- **Aboriginal and Torres Strait Islander Peoples:** May access specific tax concessions.
- **Norfolk Island Residents:** Unique tax arrangements apply.
- **People with Disabilities:** Eligible for certain offsets or exemptions.
- Example: Disability support pension recipients may qualify for tax offsets.

**Financial Difficulties or Disasters:**
- ATO offers payment plans or extensions for hardship or disaster-affected individuals.
- Example: Deferring tax payments for bushfire-affected businesses.

**Death and Final Tax Return:**
- Estates may need to lodge a final tax return for the deceased.
- Superannuation and assets may have tax implications.
- Example: Super death benefits may be taxed depending on beneficiaries.`
        };
    }

    getDefaultResponse(error = null) {
        if (error) {
            console.error('Using default response due to error:', error);
        }
        return "I apologize, but I'm having trouble processing your request. Please try again or contact MG Accounting directly at (03) 9563 4666 for immediate assistance.";
    }

    createPrompt(message, context) {
        // Updated Prompt: More detailed persona, conversational style, accounting focus
        return `You are 'MG Assistant', a friendly and knowledgeable virtual assistant for MG Accounting. 
Act like a helpful human accounting specialist based in our Oakleigh office. Be conversational, empathetic, and professional. 
Your primary goal is to answer user questions about Australian tax and accounting, explain our services, and assist users where possible. If a question is complex or requires personalized advice, gently guide them towards scheduling a consultation.

Key Information:
- Firm: MG Accounting
- Location: ${context.location} (${context.contact.address})
- Services: ${context.services.join(', ')}
- Contact: Phone ${context.contact.phone}, Email ${context.contact.email}
- Tone: Warm, approachable, expert, clear, concise. Avoid overly technical jargon unless explaining a concept. Use 'we' to refer to MG Accounting.
- Goal: Help users, provide accurate information based on general Australian accounting principles, and encourage consultation for specific advice.

Conversation History (Last 4 exchanges):
${this.conversationHistory.slice(-4).map(msg => `${msg.role === 'user' ? 'Client' : 'Assistant'}: ${msg.content}`).join('\n')}

Current User Query:
Client: ${message}

Your Response (as MG Assistant):`;
    }

    addMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        messageDiv.textContent = content;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;
        
        this.conversationHistory.push({ role, content });
    }

    addCalendlyWidget() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot';
        messageDiv.innerHTML = `
            <div class="calendly-widget-container">
                <p>I can help you schedule a consultation. Please select a time that works best for you:</p>
                <div class="calendly-inline-widget" data-url="https://calendly.com/mg-accounting" style="min-width:320px;height:600px;"></div>
            </div>
        `;
        this.messages.appendChild(messageDiv);
        this.messages.scrollTop = this.messages.scrollHeight;

        // Initialize Calendly widget
        if (window.Calendly) {
            window.Calendly.initInlineWidgets();
        }

        // Listen for Calendly events
        window.addEventListener('calendly.event_scheduled', (e) => {
            this.hasScheduledMeeting = true;
            this.addMessage("Great! I see you've scheduled a meeting. Is there anything else I can help you with?", 'bot');
        });
    }

    detectTopic(message) {
        const topics = {
            tax: ['tax', 'deduction', 'return', 'ato', 'income', 'gst'],
            business: ['business', 'company', 'structure', 'abn', 'gst'],
            superannuation: ['super', 'superannuation', 'retirement', 'smsf'],
            bookkeeping: ['bookkeeping', 'accounting', 'record', 'xero', 'myob'],
            payroll: ['payroll', 'salary', 'wage', 'employee', 'payg'],
            general: ['hello', 'hi', 'help', 'thanks', 'thank']
        };

        const lowerMessage = message.toLowerCase();
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => lowerMessage.includes(keyword))) {
                return topic;
            }
        }
        return 'general';
    }
}

// Initialize the chatbot when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 