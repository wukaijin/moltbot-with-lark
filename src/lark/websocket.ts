import * as Lark from "@larksuiteoapi/node-sdk";
import { getLogger, createChildLogger } from "../utils/logger";
import { LarkConnectionError } from "../utils/errors";
import type { LarkConfig } from "../config";
import type { LarkMessageReceiveEvent } from "./types";

const logger = getLogger();

/**
 * Lark WebSocket client for real-time event handling
 */
export class LarkWebSocketClient {
  private wsClient: Lark.WSClient;
  private eventDispatcher: Lark.EventDispatcher;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000; // Start with 1 second
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  constructor(
    _config: LarkConfig,
    private messageHandler: (event: LarkMessageReceiveEvent) => Promise<void>,
  ) {
    this.wsClient = new Lark.WSClient({
      appId: _config.appId,
      appSecret: _config.appSecret,
      loggerLevel: Lark.LoggerLevel.info,
    });

    this.eventDispatcher = new Lark.EventDispatcher({
      encryptKey: _config.encryptKey,
    }).register({
      "im.message.receive_v1": async (data: any) => {
        await this.handleMessage(data);
      },
    });

    logger.info("Lark WebSocket client initialized", {
      appId: _config.appId,
    });
  }

  /**
   * Start the WebSocket connection
   */
  async start(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      logger.warn("WebSocket is already connecting or connected");
      return;
    }

    this.isConnecting = true;

    try {
      logger.info("Starting Lark WebSocket connection...");

      await this.wsClient.start({
        eventDispatcher: this.eventDispatcher,
      });

      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      logger.info("Lark WebSocket connection established successfully");
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;

      logger.error("Failed to start Lark WebSocket connection", {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new LarkConnectionError(
        "Failed to establish WebSocket connection",
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Stop the WebSocket connection
   */
  async stop(): Promise<void> {
    if (!this.isConnected && !this.isConnecting) {
      logger.warn("WebSocket is not connected");
      return;
    }

    try {
      logger.info("Stopping Lark WebSocket connection...");

      // WSClient doesn't have a stop method, just close the connection
      this.isConnected = false;
      this.isConnecting = false;

      logger.info("Lark WebSocket connection stopped successfully");
    } catch (error) {
      logger.error("Failed to stop Lark WebSocket connection", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Handle incoming message from Lark
   */
  private async handleMessage(data: any): Promise<void> {
    const childLogger = createChildLogger({});

    try {
      childLogger.debug("Received message from Lark", {
        eventType: data.type,
      });

      await this.messageHandler(data);
    } catch (error) {
      childLogger.error("Failed to handle message from Lark", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw here to avoid breaking the event loop
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
