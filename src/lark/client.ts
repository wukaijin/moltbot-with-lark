import * as Lark from "@larksuiteoapi/node-sdk";
import { getLogger, createChildLogger } from "../utils/logger";

const logger = getLogger();

/**
 * Lark client for sending messages
 */
export class LarkClient {
  private client: Lark.Client;

  constructor() {
    this.client = new Lark.Client({
      appId: process.env.LARK_APP_ID || "",
      appSecret: process.env.LARK_APP_SECRET || "",
    });

    logger.info("Lark client initialized");
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
      childLogger.info("Sending text message", {
        textLength: text.length,
        replyToMessageId,
      });

      await this.client.im.message.create({
        data: {
          receive_id: chatId,
          msg_type: "text",
          content: JSON.stringify({ text }),
          uuid: replyToMessageId,
        },
        params: {
          receive_id_type: "chat_id",
        },
      });

      childLogger.debug("Text message sent successfully");
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
      childLogger.info("Sending card message", {
        replyToMessageId,
      });

      await this.client.im.message.create({
        data: {
          receive_id: chatId,
          msg_type: "interactive",
          content: JSON.stringify(card),
          uuid: replyToMessageId,
        },
        params: {
          receive_id_type: "chat_id",
        },
      });

      childLogger.debug("Card message sent successfully");
    } catch (error) {
      childLogger.error("Failed to send card message", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
