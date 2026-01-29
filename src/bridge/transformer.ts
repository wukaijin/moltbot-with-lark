import { getLogger } from "../utils/logger";
import { TransformationError } from "../utils/errors";
import type { ParsedLarkMessage, LarkPostContent } from "../lark/types";
import type {
  ParsedMessageForMoltbot,
  FormattedResponseForLark,
  MessageAttachment,
} from "../moltbot/types";

const logger = getLogger();

/**
 * Transform Lark message to Moltbot format
 */
export function transformLarkToMoltbot(
  message: ParsedLarkMessage,
): ParsedMessageForMoltbot {
  try {
    logger.debug("Transforming Lark message to Moltbot format", {
      messageId: message.messageId,
      messageType: message.messageType,
    });

    let text = "";
    const attachments: MessageAttachment[] = [];

    // Extract text content
    if (message.textContent) {
      text = message.textContent;
    } else if (message.postContent) {
      // Extract text from post content
      text = extractTextFromPost(message.postContent);
    }

    // Extract attachments
    if (message.imageKey) {
      attachments.push({
        type: "image",
        key: message.imageKey,
      });
    }

    if (message.fileKey) {
      attachments.push({
        type: "file",
        key: message.fileKey,
      });
    }

    // Build context
    const context = {
      chatId: message.chatId,
      senderId: message.senderId,
      senderType: message.senderType,
      timestamp: message.timestamp,
      messageId: message.messageId,
    };

    // Add mentions to text
    if (message.mentions && message.mentions.length > 0) {
      const mentionText = message.mentions.map((m) => `@${m.name}`).join(" ");
      text = `${mentionText} ${text}`;
    }

    const result: ParsedMessageForMoltbot = {
      text,
      attachments: attachments.length > 0 ? attachments : undefined,
      context,
    };

    logger.debug("Transformed Lark message to Moltbot format", {
      textLength: text.length,
      attachmentCount: attachments.length,
    });

    return result;
  } catch (error) {
    logger.error("Failed to transform Lark message to Moltbot format", {
      error: error instanceof Error ? error.message : String(error),
      messageId: message.messageId,
    });
    throw new TransformationError(
      "Failed to transform Lark message",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Transform Moltbot response to Lark format
 */
export function transformMoltbotToLark(
  response: string,
  format: "text" | "markdown" | "card" = "text",
): FormattedResponseForLark {
  try {
    logger.debug("Transforming Moltbot response to Lark format", {
      responseLength: response.length,
      format,
    });

    if (format === "text") {
      return {
        text: response,
        format: "text",
      };
    }

    if (format === "markdown") {
      // Convert markdown to Lark markdown format
      const larkMarkdown = convertMarkdownToLark(response);
      return {
        text: larkMarkdown,
        format: "markdown",
      };
    }

    if (format === "card") {
      // Convert markdown to interactive card
      const card = convertMarkdownToCard(response);
      return {
        text: "", // Card content is separate
        format: "card",
        card,
      };
    }

    return {
      text: response,
      format: "text",
    };
  } catch (error) {
    logger.error("Failed to transform Moltbot response to Lark format", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new TransformationError(
      "Failed to transform Moltbot response",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Extract text from Lark post content
 */
function extractTextFromPost(post: LarkPostContent): string {
  const elements = post.zh_cn || post.en_us || [];
  return elements
    .map((element) => {
      if (element.tag === "text") {
        return element.text || "";
      }
      if (element.tag === "a") {
        return element.text || element.href || "";
      }
      if (element.tag === "at") {
        return `@${element.user_id || element.name || ""}`;
      }
      return "";
    })
    .join("");
}

/**
 * Convert markdown to Lark markdown format
 */
function convertMarkdownToLark(markdown: string): string {
  // Lark supports most markdown syntax, so we just need to handle some special cases
  let larkMarkdown = markdown;

  // Convert code blocks
  larkMarkdown = larkMarkdown.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      return `\`\`\`${lang || ""}\n${code}\n\`\`\``;
    },
  );

  // Convert inline code
  larkMarkdown = larkMarkdown.replace(/`([^`]+)`/g, "`$1`");

  // Convert bold
  larkMarkdown = larkMarkdown.replace(/\*\*([^*]+)\*\*/g, "**$1**");

  // Convert italic
  larkMarkdown = larkMarkdown.replace(/\*([^*]+)\*/g, "*$1*");

  // Convert links
  larkMarkdown = larkMarkdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "[$2]($1)");

  return larkMarkdown;
}

/**
 * Convert markdown to interactive card
 */
function convertMarkdownToCard(markdown: string): any {
  // Simple markdown to card conversion
  // This is a basic implementation, can be enhanced

  const lines = markdown.split("\n");
  const elements: any[] = [];

  for (const line of lines) {
    if (line.trim() === "") {
      // Add divider
      elements.push({ tag: "hr" });
    } else if (line.startsWith("# ")) {
      // Header
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: line.substring(2),
        },
      });
    } else if (line.startsWith("## ")) {
      // Subheader
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: line.substring(3),
        },
      });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // List item
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: line.substring(2),
        },
      });
    } else {
      // Regular text
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: line,
        },
      });
    }
  }

  return {
    config: {
      wide_screen_mode: true,
    },
    header: {
      title: {
        tag: "plain_text",
        content: "Response",
      },
    },
    elements,
  };
}
