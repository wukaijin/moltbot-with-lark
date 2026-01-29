import { getLogger, createChildLogger } from "../utils/logger";
import { getUserErrorMessage } from "../utils/errors";
import type {
  LarkMessageReceiveEvent,
  ParsedLarkMessage,
  LarkMessageType,
} from "./types";

const logger = getLogger();

/**
 * Parse Lark message content
 */
export function parseLarkMessage(
  event: LarkMessageReceiveEvent,
): ParsedLarkMessage {
  const { message, sender } = event.event;
  const childLogger = createChildLogger({
    messageId: message.message_id,
    chatId: message.chat_id,
  });

  try {
    // Parse content based on message type
    let textContent: string | undefined;
    let postContent: any;
    let imageKey: string | undefined;
    let fileKey: string | undefined;

    const content = JSON.parse(message.content);

    switch (message.msg_type) {
      case "text":
        textContent = content.text;
        break;

      case "post":
        postContent = content.post;
        break;

      case "image":
        imageKey = content.image_key;
        break;

      case "file":
        fileKey = content.file_key;
        break;

      default:
        childLogger.warn("Unsupported message type", {
          messageType: message.msg_type,
        });
    }

    const parsedMessage: ParsedLarkMessage = {
      messageId: message.message_id,
      chatId: message.chat_id,
      senderId: sender.sender_id.open_id,
      senderType: sender.sender_type,
      messageType: message.msg_type as LarkMessageType,
      textContent,
      postContent,
      imageKey,
      fileKey,
      mentions: message.mentions,
      timestamp: Date.now(),
    };

    childLogger.debug("Parsed Lark message", {
      messageType: parsedMessage.messageType,
      hasText: !!textContent,
      hasPost: !!postContent,
      hasImage: !!imageKey,
      hasFile: !!fileKey,
      mentionCount: message.mentions?.length || 0,
    });

    return parsedMessage;
  } catch (error) {
    childLogger.error("Failed to parse Lark message", {
      error: error instanceof Error ? error.message : String(error),
      rawContent: message.content,
    });
    throw new Error(
      `Failed to parse message: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Check if message should be processed
 */
export function shouldProcessMessage(message: ParsedLarkMessage): boolean {
  // Skip messages from bots
  if (message.senderType === "bot") {
    logger.debug("Skipping message from bot", {
      messageId: message.messageId,
      senderId: message.senderId,
    });
    return false;
  }

  // Skip messages without content
  if (
    !message.textContent &&
    !message.postContent &&
    !message.imageKey &&
    !message.fileKey
  ) {
    logger.debug("Skipping message without content", {
      messageId: message.messageId,
    });
    return false;
  }

  return true;
}

/**
 * Format error message for Lark
 */
export function formatErrorMessage(error: Error): string {
  const userMessage = getUserErrorMessage(error);

  return `❌ ${userMessage}`;
}

/**
 * Format success message for Lark (optional)
 */
export function formatSuccessMessage(): string {
  return "✅";
}
