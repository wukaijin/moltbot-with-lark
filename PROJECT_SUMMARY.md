# Moltbot with Lark - Project Summary

## Overview

This is a TypeScript Node.js project that bridges Lark (飞书) WebSocket connections to Moltbot's AI agent. The project uses `@larksuiteoapi/node-sdk` for Lark integration and `@ai-sdk/openai-compatible` for Moltbot integration.

## Project Structure

```
moltbot-with-lark/
├── config/
│   ├── config.example.json    # Configuration template
│   └── .env.example          # Environment variables template
├── dist/                     # Compiled JavaScript output
├── src/
│   ├── config/
│   │   ├── index.ts          # Configuration exports
│   │   ├── loader.ts         # Configuration loader
│   │   └── schema.ts        # Zod validation schemas
│   ├── lark/
│   │   ├── client.ts         # Lark API client
│   │   ├── handlers.ts       # Message parsing and filtering
│   │   ├── sender.ts         # Message sender with retry logic
│   │   ├── types.ts          # TypeScript type definitions
│   │   └── websocket.ts      # WebSocket client
│   ├── moltbot/
│   │   ├── client.ts         # Moltbot API client
│   │   └── types.ts          # TypeScript type definitions
│   ├── bridge/
│   │   ├── context.ts        # Conversation context manager
│   │   ├── processor.ts      # Stream processor
│   │   └── transformer.ts    # Message transformer
│   ├── utils/
│   │   ├── errors.ts         # Custom error classes
│   │   ├── logger.ts         # Winston logger
│   │   └── retry.ts         # Retry logic
│   └── index.ts             # Main application entry point
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Features Implemented

### 1. Configuration Management

- Environment variable loading via `dotenv`
- JSON configuration file support
- Zod schema validation
- Type-safe configuration access

### 2. Lark Integration

- WebSocket long connection using `Lark.WSClient`
- Event dispatcher for `im.message.receive_v1` events
- Message parsing (text, markdown, cards, images, files)
- Message sending with retry logic
- Auto-reconnect on connection failure

### 3. Moltbot Integration

- OpenAI-compatible provider using `createOpenAICompatible()`
- Streaming response support via `streamText()`
- Non-streaming response support via `generateText()`
- Configurable temperature and max tokens

### 4. Message Transformation

- Converts between Lark and Moltbot message formats
- Supports text, markdown, and card formats
- Handles mentions and attachments

### 5. Stream Processing

- Accumulates streaming chunks
- Sends partial updates to Lark (every 100 chars or 1 second)
- Configurable thresholds

### 6. Conversation Context

- Maintains message history per chat
- Configurable history size (default: 10 messages)
- Automatic expiry (default: 24 hours)
- Periodic cleanup

### 7. Error Handling

- Custom error classes (AppError, LarkError, MoltbotError, BridgeError)
- User-friendly error messages
- Retry logic with exponential backoff
- Graceful degradation

### 8. Logging

- Winston logger with structured logging
- JSON/text format support
- Child loggers with context
- Configurable log levels

### 9. Graceful Shutdown

- SIGTERM and SIGINT handlers
- Proper connection cleanup
- Error reporting

## Installation

1. Install dependencies:

```bash
npm install
```

2. Copy configuration templates:

```bash
cp config/config.example.json config/config.json
cp config/.env.example config/.env
```

3. Edit configuration files:

- `config/config.json`: Application settings
- `config/.env`: Sensitive credentials

## Configuration

### Environment Variables (.env)

```env
# Lark Configuration
LARK_APP_ID=your_lark_app_id
LARK_APP_SECRET=your_lark_app_secret
LARK_ENCRYPT_KEY=your_lark_encrypt_key

# Moltbot Configuration
MOLTBOT_API_ENDPOINT=https://api.moltbot.com/v1
MOLTBOT_API_KEY=your_moltbot_api_key
MOLTBOT_MODEL_NAME=gpt-4

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
```

### Configuration File (config.json)

```json
{
  "lark": {
    "appId": "${LARK_APP_ID}",
    "appSecret": "${LARK_APP_SECRET}",
    "encryptKey": "${LARK_ENCRYPT_KEY}"
  },
  "moltbot": {
    "apiEndpoint": "${MOLTBOT_API_ENDPOINT}",
    "apiKey": "${MOLTBOT_API_KEY}",
    "modelName": "${MOLTBOT_MODEL_NAME}",
    "temperature": 0.7,
    "maxTokens": 2000,
    "streaming": true
  },
  "features": {
    "messageCards": true,
    "fileAttachments": false
  },
  "conversation": {
    "maxHistorySize": 10,
    "expiryHours": 24
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": {
      "enabled": true,
      "path": "./logs/app.log"
    }
  }
}
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## How It Works

1. **Initialization**: The application loads configuration from environment variables and JSON file
2. **WebSocket Connection**: Connects to Lark WebSocket server for real-time message events
3. **Message Reception**: Receives messages from Lark via WebSocket
4. **Message Parsing**: Parses Lark message content (text, markdown, cards, etc.)
5. **Message Filtering**: Skips messages from bots and messages without content
6. **Context Management**: Adds message to conversation history
7. **Moltbot Request**: Sends request to Moltbot with conversation history
8. **Stream Processing**: Processes streaming response (if enabled)
9. **Partial Updates**: Sends partial updates to Lark during streaming
10. **Final Response**: Sends final response to Lark
11. **Context Update**: Adds assistant response to conversation history

## API Compatibility

### Lark SDK

- Version: Latest
- Used: `@larksuiteoapi/node-sdk`
- Features: WebSocket client, Event dispatcher, Message client

### Moltbot SDK

- Version: Latest
- Used: `@ai-sdk/openai-compatible`
- Features: OpenAI-compatible provider, Streaming support

## Troubleshooting

### Build Errors

If you encounter build errors, run:

```bash
npm run type-check
```

### Connection Issues

Check your environment variables and ensure:

- Lark credentials are correct
- Moltbot API endpoint is accessible
- Network connectivity is stable

### Logging

Logs are written to:

- Console (stdout/stderr)
- File: `./logs/app.log` (if enabled)

## Dependencies

### Production

- `@larksuiteoapi/node-sdk`: Lark SDK
- `@ai-sdk/openai-compatible`: OpenAI-compatible provider
- `ai`: AI SDK
- `zod`: Schema validation
- `winston`: Logging
- `dotenv`: Environment variables

### Development

- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `jest`: Testing framework
- `@types/jest`: Jest type definitions
- `ts-jest`: TypeScript preprocessor for Jest
- `eslint`: Linting
- `@typescript-eslint/parser`: TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin`: TypeScript ESLint plugin

## License

MIT

## Support

For issues or questions, please refer to the project README.md or contact the development team.
