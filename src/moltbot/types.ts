/**
 * Moltbot types and interfaces
 */

// Moltbot message types
export interface MoltbotMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Moltbot stream chunk
export interface MoltbotStreamChunk {
  text: string;
  isComplete: boolean;
}

// Moltbot request options
export interface MoltbotRequestOptions {
  model: string;
  messages: MoltbotMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Moltbot response
export interface MoltbotResponse {
  text: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Moltbot stream response
export interface MoltbotStreamResponse {
  textStream: AsyncIterable<string>;
  text: Promise<string>;
  finishReason: Promise<string | undefined>;
  usage: Promise<
    | {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      }
    | undefined
  >;
}

// Parsed message from Lark for Moltbot
export interface ParsedMessageForMoltbot {
  text: string;
  attachments?: MessageAttachment[];
  context?: MessageContext;
}

// Message attachment
export interface MessageAttachment {
  type: "image" | "file" | "audio" | "video";
  key: string;
  url?: string;
  name?: string;
  size?: number;
}

// Message context
export interface MessageContext {
  chatId: string;
  senderId: string;
  senderType: string;
  timestamp: number;
  messageId: string;
}

// Formatted response for Lark
export interface FormattedResponseForLark {
  text: string;
  format: "text" | "markdown" | "card";
  card?: LarkCardData;
}

// Lark card data
export interface LarkCardData {
  title?: string;
  content: LarkCardContent[];
  actions?: LarkCardAction[];
}

export interface LarkCardContent {
  type: "text" | "markdown" | "image" | "divider";
  content?: string;
  imageKey?: string;
}

export interface LarkCardAction {
  type: "button" | "link";
  text: string;
  url?: string;
  value?: any;
}

// Stream processing options
export interface StreamProcessingOptions {
  chunkThreshold?: number; // Characters before sending partial update
  timeThreshold?: number; // Milliseconds before sending partial update
  sendPartialUpdates?: boolean;
}
