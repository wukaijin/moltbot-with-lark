# Moltbot with Lark - Architecture Plan

## Project Overview

Create a TypeScript Node.js project that bridges Lark (飞书) long connections to moltbot's agent using:

- Lark SDK: `@larksuiteoapi/node-sdk`
- Moltbot SDK: `@ai-sdk/openai-compatible`
- Configuration: Environment-based JSON file reading

## Clarifying Questions (To Be Answered)

### 1. Lark Integration

**Question:** What type of Lark long connection should be used?

- Webhook (HTTP callback) - Lark sends events to your server
- Event subscription (WebSocket/SSE) - Real-time bidirectional connection
- Message API polling - Periodic polling for new messages
- Other (please specify)

**Question:** Which Lark features need to be supported?

- Receiving messages from users/bots
- Sending messages back to Lark
- Handling events (user actions, bot status changes)
- File attachments, images, rich text
- All of the above
- Other (please specify)

### 2. Moltbot Integration

**Question:** What should happen when a Lark message is received?

- Forward directly to moltbot agent without modification
- Transform/format the message before forwarding
- Add metadata (user info, conversation context)
- Store conversation history
- Other (please specify)

**Question:** How should moltbot responses be handled?

- Send back to the same Lark conversation as plain text
- Format responses (markdown, cards, rich text)
- Handle streaming responses
- Other (please specify)

### 3. Configuration Management

**Question:** Configuration structure preference?

- Single JSON file with all settings (e.g., `config.json`)
- Multiple JSON files (e.g., `lark-config.json`, `moltbot-config.json`)
- Environment variables + JSON files combination
- Other (please specify)

**Question:** Required configuration parameters?

- Lark: app_id, app_secret, webhook_url, encrypt_key, verification_token
- Moltbot: api_endpoint, api_key, model_name, temperature, max_tokens
- Server: port, host, cors_settings
- Logging: level, format, output
- Other (please specify)

### 4. Project Structure

**Question:** Project structure preference?

- Monorepo with separate packages
- Single package with modular structure
- Other (please specify)

**Question:** Testing framework preference?

- Jest
- Vitest
- Mocha
- Other (please specify)

### 5. Deployment & Operations

**Question:** Deployment target?

- Local development only
- Cloud platform (AWS, GCP, Azure, Vercel, etc.)
- Docker container
- Other (please specify)

**Question:** Logging and monitoring?

- Simple console logging
- Structured logging (winston, pino)
- External monitoring (Sentry, Datadog)
- Other (please specify)

## Preliminary Architecture

### High-Level Flow

```
Lark Platform → Lark SDK → Message Handler → Moltbot SDK → Moltbot Agent
                      ↑                                      ↓
                      └─────── Response Handler ←────────────┘
```

### Proposed Project Structure

```
moltbot-with-lark/
├── src/
│   ├── config/           # Configuration management
│   │   ├── index.ts      # Config loader and validator
│   │   └── schema.ts     # TypeScript interfaces for config
│   ├── lark/             # Lark integration
│   │   ├── client.ts     # Lark SDK client setup
│   │   ├── handlers.ts   # Event/message handlers
│   │   └── types.ts      # Lark type definitions
│   ├── moltbot/          # Moltbot integration
│   │   ├── client.ts     # Moltbot SDK client setup
│   │   ├── handlers.ts   # Response handlers
│   │   └── types.ts      # Moltbot type definitions
│   ├── bridge/           # Bridge logic
│   │   ├── transformer.ts # Message transformation
│   │   └── router.ts     # Routing logic
│   ├── server/           # HTTP/WebSocket server
│   │   ├── index.ts      # Server setup
│   │   └── routes.ts     # API routes
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # Logging utility
│   │   └── errors.ts     # Error handling
│   └── index.ts          # Application entry point
├── config/               # Configuration files
│   ├── config.json       # Main configuration
│   └── config.example.json # Configuration template
├── tests/                # Test files
├── package.json
├── tsconfig.json
└── README.md
```

### Key Components

#### 1. Configuration Module

- Load JSON config from environment-specified path
- Validate configuration against schema
- Provide type-safe access to config values
- Support environment variable overrides

#### 2. Lark Integration

- Initialize Lark SDK with credentials
- Set up event listeners/webhook handlers
- Parse incoming messages/events
- Transform Lark message format to internal format

#### 3. Moltbot Integration

- Initialize Moltbot SDK with credentials
- Send messages to moltbot agent
- Handle streaming responses (if needed)
- Transform moltbot responses to Lark format

#### 4. Bridge Logic

- Route messages between Lark and Moltbot
- Maintain conversation context
- Handle errors and retries
- Transform message formats

#### 5. Server

- HTTP server for webhook endpoints
- WebSocket server (if needed)
- Health check endpoints
- Graceful shutdown handling

### Technology Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **Package Manager**: npm/yarn/pnpm
- **Lark SDK**: @larksuiteoapi/node-sdk
- **Moltbot SDK**: @ai-sdk/openai-compatible
- **Validation**: zod or ajv
- **Logging**: winston or pino
- **Testing**: Jest or Vitest
- **HTTP Server**: express or fastify

### Configuration Schema (Preliminary)

```json
{
  "lark": {
    "appId": "string",
    "appSecret": "string",
    "encryptKey": "string?",
    "verificationToken": "string?",
    "webhookUrl": "string?"
  },
  "moltbot": {
    "apiEndpoint": "string",
    "apiKey": "string",
    "modelName": "string",
    "temperature": "number?",
    "maxTokens": "number?"
  },
  "server": {
    "port": "number",
    "host": "string",
    "cors": {
      "enabled": "boolean",
      "origins": "string[]"
    }
  },
  "logging": {
    "level": "string",
    "format": "string",
    "output": "string[]"
  }
}
```

## Next Steps

1. **Answer clarifying questions** to refine requirements
2. **Finalize architecture** based on answers
3. **Create detailed implementation plan** with specific tasks
4. **Review and approve** before implementation

---

**Note**: This plan will be updated based on your answers to the clarifying questions above.
