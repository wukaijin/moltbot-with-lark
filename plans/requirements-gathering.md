# Requirements Gathering - Moltbot with Lark

## Please Select Your Preferences

Please choose ONE option from each question below:

### 1. Lark Connection Mode

- [ ] **WebSocket Long Connection** (recommended for real-time)
- [ ] **Webhook** (simpler, works with any HTTP server)
- [ ] **Both** (support both modes with configuration)

### 2. Moltbot Response Mode

- [ ] **Non-streaming** (wait for complete response before sending to Lark)
- [ ] **Streaming** (send partial updates to Lark as they arrive)
- [ ] **Configurable** (choose per request)

### 3. Message Transformation

- [ ] **Direct forwarding** (no transformation)
- [ ] **Add metadata** (user info, conversation context)
- [ ] **Format conversion** (markdown, cards, rich text)
- [ ] **Conversation history management**

### 4. Configuration Structure

- [ ] **Single JSON file** with all settings
- [ ] **Multiple JSON files** (lark.json, moltbot.json, server.json)
- [ ] **Environment variables + JSON files** combination

### 5. Additional Features (Select All That Apply)

- [ ] Message cards and interactive elements
- [ ] File attachments and images
- [ ] Multiple conversations simultaneously
- [ ] Conversation history and context
- [ ] Error handling and retry logic
- [ ] Logging and monitoring

---

## Quick Reference

**WebSocket vs Webhook:**

- **WebSocket**: Real-time, lower latency, better for streaming, requires persistent connection
- **Webhook**: Simpler, works anywhere, easier to debug, no persistent connection needed

**Streaming vs Non-streaming:**

- **Non-streaming**: Wait for full response, simpler, better for short answers
- **Streaming**: Show response as it generates, better UX for long responses
- **Configurable**: Choose based on message length or user preference

**Message Transformation:**

- **Direct forwarding**: Pass message as-is, fastest
- **Add metadata**: Include user info, timestamp, context
- **Format conversion**: Convert between markdown, cards, rich text
- **Conversation history**: Maintain context across messages

---

**Please reply with your selections (e.g., "1: WebSocket, 2: Non-streaming, 3: Direct forwarding, 4: Single JSON, 5: Error handling, Logging")**
