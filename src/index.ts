import { loadConfig, initLogger } from "./config";
import { getLogger } from "./utils/logger";
import { LarkWebSocketClient } from "./lark/websocket";
import { LarkClient } from "./lark/client";
import { LarkMessageSender } from "./lark/sender";
import { MoltbotClient } from "./moltbot/client";
import { StreamProcessor } from "./bridge/processor";
import { ConversationContextManager } from "./bridge/context";
import {
  transformLarkToMoltbot,
  transformMoltbotToLark,
} from "./bridge/transformer";
import { parseLarkMessage, shouldProcessMessage } from "./lark/handlers";
import type { Config } from "./config";
import type { LarkMessageReceiveEvent } from "./lark/types";

/**
 * Main application class
 */
class MoltbotWithLark {
  private larkWebSocketClient: LarkWebSocketClient;
  private larkClient: LarkClient;
  private larkSender: LarkMessageSender;
  private moltbotClient: MoltbotClient;
  private conversationManager: ConversationContextManager;
  private isShuttingDown: boolean = false;

  constructor(config: Config) {
    // Initialize logger
    initLogger(config.logging);
    const logger = getLogger();

    logger.info("Initializing Moltbot with Lark application", {
      larkAppId: config.lark.appId,
      moltbotModel: config.moltbot.modelName,
      features: config.features,
    });

    // Initialize Lark clients
    this.larkClient = new LarkClient();
    this.larkSender = new LarkMessageSender(this.larkClient, {
      messageCards: config.features.messageCards,
      fileAttachments: config.features.fileAttachments,
    });

    // Initialize Moltbot client
    this.moltbotClient = new MoltbotClient(config.moltbot);

    // Initialize conversation context manager
    this.conversationManager = new ConversationContextManager();

    // Initialize WebSocket client with message handler
    this.larkWebSocketClient = new LarkWebSocketClient(
      config.lark,
      this.handleLarkMessage.bind(this),
    );

    logger.info("Application initialized successfully");
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    const logger = getLogger();

    try {
      logger.info("Starting Moltbot with Lark application...");

      // Start WebSocket connection
      await this.larkWebSocketClient.start();

      logger.info("Application started successfully");
      logger.info("Listening for Lark messages...");

      // Setup graceful shutdown handlers
      this.setupShutdownHandlers();

      // Start periodic cleanup
      this.startPeriodicCleanup();
    } catch (error) {
      logger.error("Failed to start application", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    const logger = getLogger();

    if (this.isShuttingDown) {
      logger.warn("Application is already shutting down");
      return;
    }

    this.isShuttingDown = true;
    logger.info("Stopping Moltbot with Lark application...");

    try {
      // Stop WebSocket connection
      await this.larkWebSocketClient.stop();

      logger.info("Application stopped successfully");
    } catch (error) {
      logger.error("Error stopping application", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Handle incoming message from Lark
   */
  private async handleLarkMessage(
    event: LarkMessageReceiveEvent,
  ): Promise<void> {
    const logger = getLogger();

    if (this.isShuttingDown) {
      logger.debug("Ignoring message during shutdown");
      return;
    }

    try {
      // Parse Lark message
      const parsedMessage = parseLarkMessage(event);

      // Check if message should be processed
      if (!shouldProcessMessage(parsedMessage)) {
        return;
      }

      logger.info("Processing message from Lark", {
        messageId: parsedMessage.messageId,
        chatId: parsedMessage.chatId,
        messageType: parsedMessage.messageType,
      });

      // Transform to Moltbot format
      const moltbotMessage = transformLarkToMoltbot(parsedMessage);

      // Add to conversation context
      this.conversationManager.addMessage(parsedMessage.chatId, {
        role: "user",
        content: moltbotMessage.text,
      });

      // Get conversation history
      const conversationHistory = this.conversationManager.getContext(
        parsedMessage.chatId,
      );

      // Build messages for Moltbot
      const messages = [
        ...conversationHistory,
        {
          role: "user",
          content: moltbotMessage.text,
        },
      ];

      // Send to Moltbot
      if (this.moltbotClient.isStreamingEnabled()) {
        await this.handleStreamingResponse(
          parsedMessage.chatId,
          parsedMessage.messageId,
          messages,
        );
      } else {
        await this.handleNonStreamingResponse(
          parsedMessage.chatId,
          parsedMessage.messageId,
          messages,
        );
      }

      // Add assistant response to conversation context
      // This will be done after receiving the response
    } catch (error) {
      logger.error("Error handling Lark message", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Send error message to Lark
      await this.larkSender.sendErrorMessage(
        event.event.message.chat_id,
        error instanceof Error ? error : new Error(String(error)),
        event.event.message.message_id,
      );
    }
  }

  /**
   * Handle streaming response from Moltbot
   */
  private async handleStreamingResponse(
    chatId: string,
    messageId: string,
    messages: any[],
  ): Promise<void> {
    const logger = getLogger();

    try {
      // Send streaming request to Moltbot
      const streamResponse =
        await this.moltbotClient.sendStreamRequest(messages);

      // Create stream processor
      const processor = new StreamProcessor(
        chatId,
        async (chatId: string, content: string, isComplete: boolean) => {
          await this.larkSender.sendStreamUpdate({
            chatId,
            messageId: isComplete ? undefined : messageId,
            content,
            isComplete,
          });
        },
        {
          chunkThreshold: 100,
          timeThreshold: 1000,
          sendPartialUpdates: true,
        },
      );

      // Process stream
      const fullResponse = await processor.process(streamResponse);

      // Transform response to Lark format

      // Add assistant response to conversation context
      this.conversationManager.addMessage(chatId, {
        role: "assistant",
        content: fullResponse,
      });

      logger.info("Streaming response completed", {
        chatId,
        responseLength: fullResponse.length,
      });
    } catch (error) {
      logger.error("Error handling streaming response", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Handle non-streaming response from Moltbot
   */
  private async handleNonStreamingResponse(
    chatId: string,
    messageId: string,
    messages: any[],
  ): Promise<void> {
    const logger = getLogger();

    try {
      // Send non-streaming request to Moltbot
      const response = await this.moltbotClient.sendRequest(messages);

      // Transform response to Lark format

      // Send response to Lark
      await this.larkSender.sendTextMessage(
        chatId,
        response.text,
        messageId,
      );

      // Add assistant response to conversation context
      this.conversationManager.addMessage(chatId, {
        role: "assistant",
        content: response.text,
      });

      logger.info("Non-streaming response completed", {
        chatId,
        responseLength: response.text.length,
      });
    } catch (error) {
      logger.error("Error handling non-streaming response", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupShutdownHandlers(): void {
    const logger = getLogger();

    // Handle SIGTERM
    process.on("SIGTERM", async () => {
      logger.info("Received SIGTERM signal");
      await this.stop();
      process.exit(0);
    });

    // Handle SIGINT
    process.on("SIGINT", async () => {
      logger.info("Received SIGINT signal");
      await this.stop();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled promise rejection", {
        reason: String(reason),
        promise,
      });
    });
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    const logger = getLogger();

    // Clean up expired conversations every hour
    setInterval(
      () => {
        const cleaned = this.conversationManager.cleanupExpiredConversations();
        if (cleaned > 0) {
          logger.info("Periodic cleanup completed", {
            cleanedConversations: cleaned,
          });
        }
      },
      60 * 60 * 1000,
    ); // 1 hour

    logger.info("Periodic cleanup started");
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Load configuration
    const config = loadConfig();

    // Create and start application
    const app = new MoltbotWithLark(config);
    await app.start();
  } catch (error) {
    const logger = getLogger();
    logger.error("Failed to start application", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  main();
}

export { MoltbotWithLark };
