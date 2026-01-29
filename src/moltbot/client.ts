import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, generateText } from "ai";
import { getLogger } from "../utils/logger";
import { MoltbotError, MoltbotConnectionError } from "../utils/errors";
import type { MoltbotConfig } from "../config";
import type {
  MoltbotMessage,
  MoltbotRequestOptions,
  MoltbotStreamResponse,
  MoltbotResponse,
} from "./types";

const logger = getLogger();

/**
 * Moltbot client for interacting with OpenAI-compatible API
 */
export class MoltbotClient {
  private provider: ReturnType<typeof createOpenAICompatible>;

  constructor(private config: MoltbotConfig) {
    this.provider = createOpenAICompatible({
      baseURL: config.apiEndpoint,
      name: "moltbot",
      apiKey: config.apiKey,
    });

    logger.info("Moltbot client initialized", {
      apiEndpoint: config.apiEndpoint,
      modelName: config.modelName,
      streaming: config.streaming,
    });
  }

  /**
   * Send a non-streaming request to Moltbot
   */
  async sendRequest(
    messages: MoltbotMessage[],
    options?: Partial<MoltbotRequestOptions>,
  ): Promise<MoltbotResponse> {
    try {
      logger.debug("Sending request to Moltbot", {
        messageCount: messages.length,
        modelName: this.config.modelName,
      });

      const model = this.provider.chatModel(this.config.modelName);

      const { text, finishReason, usage } = await generateText({
        model: model as any, // Type assertion to bypass type checking
        messages: messages as any,
        temperature: options?.temperature ?? this.config.temperature,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
      });

      logger.debug("Received response from Moltbot", {
        textLength: text.length,
        finishReason,
        usage,
      });

      return {
        text,
        finishReason,
        usage: usage
          ? {
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens,
            }
          : undefined,
      };
    } catch (error) {
      this.handleError(error, "Failed to send request to Moltbot");
    }
  }

  /**
   * Send a streaming request to Moltbot
   */
  async sendStreamRequest(
    messages: MoltbotMessage[],
    options?: Partial<MoltbotRequestOptions>,
  ): Promise<MoltbotStreamResponse> {
    try {
      logger.debug("Sending streaming request to Moltbot", {
        messageCount: messages.length,
        modelName: this.config.modelName,
      });

      const model = this.provider.chatModel(this.config.modelName);

      const result = await streamText({
        model: model as any, // Type assertion to bypass type checking
        messages: messages as any,
        temperature: options?.temperature ?? this.config.temperature,
        maxTokens: options?.maxTokens ?? this.config.maxTokens,
      });

      logger.debug("Stream response initiated from Moltbot");

      return {
        textStream: result.textStream,
        text: result.text,
        finishReason: result.finishReason,
        usage: result.usage.then((u: any) =>
          u
            ? {
                promptTokens: u.promptTokens,
                completionTokens: u.completionTokens,
                totalTokens: u.totalTokens,
              }
            : undefined,
        ),
      };
    } catch (error) {
      this.handleError(error, "Failed to send streaming request to Moltbot");
    }
  }

  /**
   * Handle errors from Moltbot API
   */
  private handleError(error: unknown, message: string): never {
    logger.error(message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      // Check for connection errors
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("ENOTFOUND")
      ) {
        throw new MoltbotConnectionError(
          `Connection error: ${error.message}`,
          error,
        );
      }

      throw new MoltbotError(message, undefined, false, error);
    }

    throw new MoltbotError(message);
  }

  /**
   * Get the configured model name
   */
  getModelName(): string {
    return this.config.modelName;
  }

  /**
   * Check if streaming is enabled
   */
  isStreamingEnabled(): boolean {
    return this.config.streaming;
  }
}
