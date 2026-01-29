import { getLogger, createChildLogger } from "../utils/logger";
import { retry } from "../utils/retry";
import { LarkClient } from "./client";
import type { LarkStreamUpdate } from "./types";

const logger = getLogger();

/**
 * Lark message sender with retry logic
 */
export class LarkMessageSender {
  constructor(
    private larkClient: LarkClient,
    private features: {
      messageCards: boolean;
      fileAttachments: boolean;
    },
  ) {
    logger.info("Lark message sender initialized", {
      messageCards: features.messageCards,
      fileAttachments: features.fileAttachments,
    });
  }

  /**
   * Send a text message to Lark
   */
  async sendTextMessage(
    chatId: string,
    text: string,
    replyToMessageId?: string,
  ): Promise<void> {
    const childLogger = createChildLogger({ chatId });

    try {
      await retry(
        () => this.larkClient.sendTextMessage(chatId, text, replyToMessageId),
        {
          maxAttempts: 3,
        },
      );

      childLogger.info("Text message sent successfully", {
        textLength: text.length,
        replyToMessageId,
      });
    } catch (error) {
      childLogger.error("Failed to send text message", {
        error: error instanceof Error ? error.message : String(error),
        textLength: text.length,
      });
      throw error;
    }
  }

  /**
   * Send a card message to Lark
   */
  async sendCardMessage(
    chatId: string,
    card: any,
    replyToMessageId?: string,
  ): Promise<void> {
    const childLogger = createChildLogger({ chatId });

    try {
      await retry(
        () => this.larkClient.sendCardMessage(chatId, card, replyToMessageId),
        {
          maxAttempts: 3,
        },
      );

      childLogger.info("Card message sent successfully", {
        replyToMessageId,
      });
    } catch (error) {
      childLogger.error("Failed to send card message", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send a streaming update to Lark
   */
  async sendStreamUpdate(update: LarkStreamUpdate): Promise<void> {
    const childLogger = createChildLogger({
      chatId: update.chatId,
    });

    try {
      if (this.features.messageCards && !update.isComplete) {
        // Send as card for partial updates
        const card = {
          config: {
            wide_screen_mode: true,
          },
          header: {
            title: {
              tag: "plain_text",
              content: "AI Response",
            },
          },
          elements: [
            {
              tag: "div",
              text: {
                tag: "lark_md",
                content: update.content,
              },
            },
          ],
        };

        await retry(
          () => this.larkClient.sendCardMessage(update.chatId, card),
          {
            maxAttempts: 3,
          },
        );

        childLogger.debug("Partial card update sent", {
          contentLength: update.content.length,
        });
      } else {
        // Send as text for complete updates or if cards are disabled
        await retry(
          () =>
            this.larkClient.sendTextMessage(
              update.chatId,
              update.content,
              update.messageId,
            ),
          {
            maxAttempts: 3,
          },
        );

        childLogger.debug("Text update sent", {
          isComplete: update.isComplete,
          contentLength: update.content.length,
        });
      }
    } catch (error) {
      childLogger.error("Failed to send stream update", {
        error: error instanceof Error ? error.message : String(error),
        isComplete: update.isComplete,
      });
      throw error;
    }
  }

  /**
   * Send an error message to Lark
   */
  async sendErrorMessage(
    chatId: string,
    error: Error,
    replyToMessageId?: string,
  ): Promise<void> {
    const childLogger = createChildLogger({ chatId });

    try {
      const errorMessage = `❌ ${error.message}`;

      await retry(
        () =>
          this.larkClient.sendTextMessage(
            chatId,
            errorMessage,
            replyToMessageId,
          ),
        {
          maxAttempts: 3,
        },
      );

      childLogger.info("Error message sent successfully", {
        errorMessage: error.message,
      });
    } catch (error) {
      childLogger.error("Failed to send error message", {
        error: error instanceof Error ? error.message : String(error),
        originalError: error instanceof Error ? error.message : String(error),
      });
      // Don't throw here to avoid infinite loops
    }
  }
}
