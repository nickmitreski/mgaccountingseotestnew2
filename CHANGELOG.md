# Changelog

All notable changes to the MG Accounting Website will be documented in this file.

## [1.1.2] - 2024-03-19

### Changed
- Updated deployment configuration for Vercel
- Fixed static site deployment settings
- Removed Next.js dependencies
- Added proper static site serving configuration

## [1.1.1] - 2024-03-19

### Fixed
- Fixed chatbot response format to prevent mock conversations
- Removed emojis and casual language from responses
- Ensured direct, professional responses to user queries
- Improved system prompts for better response quality

## [1.1.0] - 2024-03-19

### Added
- Enhanced chatbot with improved typing indicators
- Topic detection system for better context awareness
- Optimized chat history storage with timestamps
- Service-specific response guidelines
- Quote handling for services

### Changed
- Updated system prompt for more professional responses
- Reduced maximum response length to 30 words
- Improved conversation flow and context handling
- Enhanced typing indicator animation

### Fixed
- Chat history persistence in session storage
- Response timing for more natural interaction
- Topic detection accuracy

## [1.0.0] - 2024-03-18

### Added
- Initial website launch
- AI-powered chatbot integration
- Calendly meeting scheduling
- Responsive design
- Service information pages

## [1.1.3] - 2024-05-06

### Added
- Updated README with detailed API deployment and troubleshooting instructions for Vercel.
- Clarified required directory structure and vercel.json config for serverless API.
- Added troubleshooting steps for 404 errors on /api/chatbot.

### Fixed
- Documentation improvements to help ensure successful chatbot API deployment.

## [1.1.4] - 2024-05-06

### Fixed
- Fixed 404 error on /api/chatbot by ensuring the knowledge base is loaded in api/chatbot.js and the function is valid for Vercel deployment.

## [1.1.5] - 2024-05-06

### Enhanced
- Added "type": "commonjs" to package.json for Vercel compatibility.
- Improved README with a fresh Vercel deployment checklist and troubleshooting tips.
- Added repository and description fields to package.json for clarity. 