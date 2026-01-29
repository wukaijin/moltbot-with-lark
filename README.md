# Moltbot with Lark

A TypeScript Node.js project that bridges Lark (飞书) WebSocket connections to Moltbot's AI agent with streaming responses.

## Features

- ✅ **WebSocket Long Connection**: Real-time bidirectional communication with Lark
- ✅ **Streaming Responses**: Send partial updates to Lark as Moltbot responds
- ✅ **Message Transformation**: Convert between Lark and Moltbot formats
- ✅ **Message Cards**: Support for interactive cards and rich text
- ✅ **File Attachments**: Handle images and files
- ✅ **Conversation Context**: Maintain conversation history with automatic cleanup
- ✅ **Error Handling**: Comprehensive error handling with retry logic
- ✅ **Configuration**: Environment variables + JSON files with Zod validation
- ✅ **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

## Architecture

```
Lark Platform → Lark WebSocket Client → Message Handler → Transformer → Moltbot Client → Moltbot Agent
                      ↑                                          ↓
                      └─────── Stream Processor ←────────────┘
                                   ↓
                           Lark Message Sender → Lark Platform
```

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn or pnpm
- Lark app credentials
- Moltbot API credentials

### Setup

1. Install dependencies:

```bash
npm install
```

2. Copy configuration templates:

```bash
cp config/config.example.json config/config.json
cp config/.env.example config/.env
```

3. Edit `config/.env` with your credentials:

```bash
# Lark Configuration
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
LARK_ENCRYPT_KEY=your_encrypt_key

# Moltbot Configuration
MOLTBOT_API_ENDPOINT=https://api.moltbot.com/v1
MOLTBOT_API_KEY=your_api_key
MOLTBOT_MODEL_NAME=gpt-4

# Application Configuration
NODE_ENV=production
LOG_LEVEL=info
```

4. (Optional) Edit `config/config.json` for advanced settings:

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

5. Start the application:

```bash
# Development mode (with ts-node)
npm run dev

# Build for production
npm run build

# Production mode
npm start
```

## Configuration

### Environment Variables

| Variable               | Description                          | Required | Default     |
| ---------------------- | ------------------------------------ | -------- | ----------- |
| `LARK_APP_ID`          | Lark application ID                  | Yes      | -           |
| `LARK_APP_SECRET`      | Lark application secret              | Yes      | -           |
| `LARK_ENCRYPT_KEY`     | Lark encryption key                  | No       | -           |
| `MOLTBOT_API_ENDPOINT` | Moltbot API endpoint                 | Yes      | -           |
| `MOLTBOT_API_KEY`      | Moltbot API key                      | Yes      | -           |
| `MOLTBOT_MODEL_NAME`   | Moltbot model name                   | Yes      | -           |
| `NODE_ENV`             | Environment (development/production) | No       | development |
| `LOG_LEVEL`            | Log level (error, warn, info, debug) | No       | info        |

### JSON Configuration Options

#### Lark Configuration

- `appId`: Lark application ID
- `appSecret`: Lark application secret
- `encryptKey`: Lark encryption key for event verification

#### Moltbot Configuration

- `apiEndpoint`: Moltbot API endpoint URL
- `apiKey`: Moltbot API key
- `modelName`: Model name to use (e.g., gpt-4, gpt-3.5-turbo)
- `temperature`: Sampling temperature (0.0 - 2.0)
- `maxTokens`: Maximum tokens in response
- `streaming`: Enable streaming responses

#### Features Configuration

- `messageCards`: Enable interactive message cards
- `fileAttachments`: Enable file attachment handling

#### Conversation Configuration

- `maxHistorySize`: Maximum messages to keep in history
- `expiryHours`: Hours before conversation expires

#### Logging Configuration

- `level`: Log level (error, warn, info, debug)
- `format`: Log format (json, text)
- `file.enabled`: Enable file logging
- `file.path`: Path to log file

## Usage

### Development

```bash
# Run in development mode with ts-node
npm run dev

# Run TypeScript compiler in watch mode
npm run dev:watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Project Structure

```
moltbot-with-lark/
├── config/                    # Configuration files
│   ├── config.example.json    # Configuration template
│   └── .env.example          # Environment variables template
├── dist/                     # Compiled JavaScript output
├── src/
│   ├── config/               # Configuration management
│   │   ├── index.ts         # Configuration exports
│   │   ├── loader.ts        # Configuration loader
│   │   └── schema.ts       # Zod validation schemas
│   ├── lark/                # Lark integration
│   │   ├── client.ts        # Lark API client
│   │   ├── handlers.ts      # Message parsing and filtering
│   │   ├── sender.ts        # Message sender with retry logic
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── websocket.ts     # WebSocket client
│   ├── moltbot/             # Moltbot integration
│   │   ├── client.ts        # Moltbot API client
│   │   └── types.ts        # TypeScript type definitions
│   ├── bridge/              # Bridge logic
│   │   ├── context.ts       # Conversation context manager
│   │   ├── processor.ts     # Stream processor
│   │   └── transformer.ts   # Message transformer
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   ├── logger.ts        # Winston logger
│   │   └── retry.ts        # Retry logic
│   └── index.ts            # Main application entry point
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
└── README.md
```

## Features in Detail

### WebSocket Connection

- Real-time bidirectional communication with Lark
- Automatic reconnection with exponential backoff
- Event dispatcher for handling incoming messages
- Connection state management
- Graceful shutdown handling

### Streaming Responses

- Process streaming responses from Moltbot
- Send partial updates to Lark (every 100 chars or 1 second)
- Support for both streaming and non-streaming modes
- Configurable thresholds for partial updates
- Smooth user experience with real-time feedback

### Message Transformation

- Transform Lark messages to Moltbot format
- Transform Moltbot responses to Lark format
- Support for text, markdown, and card formats
- Handle mentions, attachments, and rich text
- Preserve message context and metadata

### Conversation Context

- Maintain conversation history per chat
- Configurable history length (default: 10 messages)
- Automatic cleanup of expired conversations (default: 24 hours)
- Support for multiple simultaneous conversations
- Periodic cleanup to prevent memory leaks

### Error Handling

- Custom error types for different components
- Transient error detection for retry logic
- Exponential backoff for retries
- User-friendly error messages
- Comprehensive logging with stack traces

### Retry Logic

- Configurable retry attempts (default: 3)
- Exponential backoff with jitter
- Transient error detection
- Per-operation retry configuration
- Circuit breaker pattern support

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

## Dependencies

### Production

- `@larksuiteoapi/node-sdk` - Lark SDK for Node.js
- `@ai-sdk/openai-compatible` - OpenAI-compatible provider for AI SDK
- `ai` - Vercel AI SDK for streaming responses
- `zod` - Schema validation
- `winston` - Logging
- `dotenv` - Environment variable management

### Development

- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `ts-node` - TypeScript execution in development
- `jest` - Testing framework
- `@types/jest` - Jest type definitions
- `ts-jest` - TypeScript preprocessor for Jest
- `eslint` - Linting
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint plugin

## Troubleshooting

### Build Errors

If you encounter build errors, run:

```bash
npm run type-check
```

This will show detailed TypeScript compilation errors.

### Connection Issues

Check your environment variables and ensure:

- Lark credentials are correct
- Moltbot API endpoint is accessible
- Network connectivity is stable
- Firewall rules allow WebSocket connections

### Logging

Logs are written to:

- Console (stdout/stderr)
- File: `./logs/app.log` (if enabled in config)

Log levels:

- `error`: Error messages only
- `warn`: Warnings and errors
- `info`: Informational messages (default)
- `debug`: Detailed debugging information

### Performance Issues

- Reduce `maxHistorySize` in conversation config
- Disable `streaming` if not needed
- Increase `chunkThreshold` and `timeThreshold` in stream processor
- Adjust `temperature` and `maxTokens` in Moltbot config

## Development

### Adding New Features

1. Create feature branch
2. Implement feature in appropriate module
3. Add tests for new functionality
4. Update documentation
5. Submit pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code structure
- Add JSDoc comments for public APIs
- Use Winston logger for logging
- Handle errors appropriately

## API Compatibility

### Lark SDK

- Version: Latest
- Used: `@larksuiteoapi/node-sdk`
- Features: WebSocket client, Event dispatcher, Message client

### Moltbot SDK

- Version: Latest
- Used: `@ai-sdk/openai-compatible`
- Features: OpenAI-compatible provider, Streaming support

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please refer to the project documentation or contact the development team.

## Changelog

### Version 1.0.0

- Initial release
- WebSocket connection to Lark
- Streaming responses from Moltbot
- Message transformation between formats
- Conversation context management
- Error handling and retry logic
- Comprehensive logging
- Graceful shutdown
