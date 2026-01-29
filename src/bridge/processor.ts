import { getLogger, createChildLogger } from "../utils/logger";
import { retry } from "../utils/retry";
import type { MoltbotStreamResponse } from "../moltbot/types";
import type { StreamProcessingOptions } from "../moltbot/types";

const logger = getLogger();

/**
 * Stream processor for handling Moltbot streaming responses
 */
export class StreamProcessor {
  private buffer: string = "";
  private lastUpdateTime: number = 0;
  private isComplete: boolean = false;

  constructor(
    private chatId: string,
    private onPartialUpdate: (
      chatId: string,
      content: string,
      isComplete: boolean,
    ) => Promise<void>,
    private options: StreamProcessingOptions = {},
  ) {
    this.options = {
      chunkThreshold: options.chunkThreshold || 100,
      timeThreshold: options.timeThreshold || 1000,
      sendPartialUpdates: options.sendPartialUpdates ?? true,
    };
  }

  /**
   * Process streaming response from Moltbot
   */
  async process(streamResponse: MoltbotStreamResponse): Promise<string> {
    const childLogger = createChildLogger({ chatId: this.chatId });

    try {
      childLogger.info("Starting to process streaming response");

      let fullResponse = "";
      let chunkCount = 0;

      // Process text stream
      for await (const chunk of streamResponse.textStream) {
        chunkCount++;
        this.buffer += chunk;
        fullResponse += chunk;
        const now = Date.now();

        childLogger.debug("Received stream chunk", {
          chunkIndex: chunkCount,
          chunkLength: chunk.length,
          bufferLength: this.buffer.length,
        });

        // Check if we should send a partial update
        if (this.shouldSendPartialUpdate(now)) {
          await this.sendPartialUpdate(this.buffer, false);
          this.lastUpdateTime = now;
        }
      }

      // Send final update
      this.isComplete = true;
      await this.sendPartialUpdate(fullResponse, true);

      childLogger.info("Stream processing completed", {
        totalChunks: chunkCount,
        finalLength: fullResponse.length,
      });

      // Wait for finish reason
      const finishReason = await streamResponse.finishReason;
      childLogger.debug("Stream finish reason", { finishReason });

      return fullResponse;
    } catch (error) {
      childLogger.error("Error processing stream", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Check if we should send a partial update
   */
  private shouldSendPartialUpdate(now: number): boolean {
    if (!this.options.sendPartialUpdates) {
      return false;
    }

    const timeSinceLastUpdate = now - this.lastUpdateTime;
    const bufferLength = this.buffer.length;

    return (
      bufferLength >= this.options.chunkThreshold! ||
      (bufferLength > 0 && timeSinceLastUpdate >= this.options.timeThreshold!)
    );
  }

  /**
   * Send partial update to Lark
   */
  private async sendPartialUpdate(
    content: string,
    isComplete: boolean,
  ): Promise<void> {
    try {
      await retry(
        () => this.onPartialUpdate(this.chatId, content, isComplete),
        {
          maxAttempts: 3,
        },
      );

      if (isComplete) {
        this.buffer = "";
      }
    } catch (error) {
      logger.error("Failed to send partial update", {
        chatId: this.chatId,
        error: error instanceof Error ? error.message : String(error),
        isComplete,
      });
      throw error;
    }
  }

  /**
   * Get current buffer content
   */
  getBuffer(): string {
    return this.buffer;
  }

  /**
   * Check if processing is complete
   */
  getIsComplete(): boolean {
    return this.isComplete;
  }

  /**
   * Reset processor for reuse
   */
  reset(): void {
    this.buffer = "";
    this.lastUpdateTime = 0;
    this.isComplete = false;
  }
}
