import { getLogger } from "../utils/logger";
import type { MoltbotMessage } from "../moltbot/types";

const logger = getLogger();

/**
 * Conversation context for a single chat
 */
interface ConversationContext {
  chatId: string;
  messages: MoltbotMessage[];
  lastActivity: number;
  messageCount: number;
}

/**
 * Conversation context manager for maintaining chat history
 */
export class ConversationContextManager {
  private conversations: Map<string, ConversationContext> = new Map();
  private maxHistoryLength: number = 10;
  private maxAge: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor(maxHistoryLength: number = 10, maxAgeHours: number = 24) {
    this.maxHistoryLength = maxHistoryLength;
    this.maxAge = maxAgeHours * 60 * 60 * 1000;

    logger.info("Conversation context manager initialized", {
      maxHistoryLength,
      maxAgeHours,
    });
  }

  /**
   * Add a message to conversation context
   */
  addMessage(chatId: string, message: MoltbotMessage): void {
    let context = this.conversations.get(chatId);

    if (!context) {
      context = {
        chatId,
        messages: [],
        lastActivity: Date.now(),
        messageCount: 0,
      };
      this.conversations.set(chatId, context);
      logger.debug("Created new conversation context", { chatId });
    }

    // Add message to history
    context.messages.push(message);
    context.lastActivity = Date.now();
    context.messageCount++;

    // Trim history if too long
    if (context.messages.length > this.maxHistoryLength) {
      const removed = context.messages.splice(
        0,
        context.messages.length - this.maxHistoryLength,
      );
      logger.debug("Trimmed conversation history", {
        chatId,
        removedCount: removed.length,
        remainingCount: context.messages.length,
      });
    }

    logger.debug("Added message to conversation context", {
      chatId,
      role: message.role,
      messageCount: context.messageCount,
      historyLength: context.messages.length,
    });
  }

  /**
   * Get conversation context for a chat
   */
  getContext(chatId: string): MoltbotMessage[] {
    const context = this.conversations.get(chatId);

    if (!context) {
      logger.debug("No conversation context found", { chatId });
      return [];
    }

    // Check if context is expired
    const age = Date.now() - context.lastActivity;
    if (age > this.maxAge) {
      logger.debug("Conversation context expired", {
        chatId,
        age,
        maxAge: this.maxAge,
      });
      this.conversations.delete(chatId);
      return [];
    }

    return context.messages;
  }

  /**
   * Clear conversation context for a chat
   */
  clearContext(chatId: string): void {
    const context = this.conversations.get(chatId);

    if (context) {
      logger.debug("Clearing conversation context", {
        chatId,
        messageCount: context.messageCount,
      });
      this.conversations.delete(chatId);
    }
  }

  /**
   * Get statistics about conversations
   */
  getStats(): {
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: { chatId: string; lastActivity: number };
    newestConversation?: { chatId: string; lastActivity: number };
  } {
    let totalMessages = 0;
    let oldestConversation:
      | { chatId: string; lastActivity: number }
      | undefined;
    let newestConversation:
      | { chatId: string; lastActivity: number }
      | undefined;

    for (const [chatId, context] of this.conversations.entries()) {
      totalMessages += context.messageCount;

      if (
        !oldestConversation ||
        context.lastActivity < oldestConversation.lastActivity
      ) {
        oldestConversation = { chatId, lastActivity: context.lastActivity };
      }

      if (
        !newestConversation ||
        context.lastActivity > newestConversation.lastActivity
      ) {
        newestConversation = { chatId, lastActivity: context.lastActivity };
      }
    }

    return {
      totalConversations: this.conversations.size,
      totalMessages,
      oldestConversation,
      newestConversation,
    };
  }

  /**
   * Clean up expired conversations
   */
  cleanupExpiredConversations(): number {
    const now = Date.now();
    const expiredChatIds: string[] = [];

    for (const [chatId, context] of this.conversations.entries()) {
      const age = now - context.lastActivity;
      if (age > this.maxAge) {
        expiredChatIds.push(chatId);
      }
    }

    for (const chatId of expiredChatIds) {
      this.conversations.delete(chatId);
    }

    if (expiredChatIds.length > 0) {
      logger.info("Cleaned up expired conversations", {
        count: expiredChatIds.length,
      });
    }

    return expiredChatIds.length;
  }

  /**
   * Get all active conversation IDs
   */
  getActiveConversations(): string[] {
    return Array.from(this.conversations.keys());
  }

  /**
   * Check if a conversation exists
   */
  hasConversation(chatId: string): boolean {
    return this.conversations.has(chatId);
  }
}
