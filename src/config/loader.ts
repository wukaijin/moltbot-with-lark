import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ConfigSchema, JsonConfig, Config } from "./schema";
import { getLogger } from "../utils/logger";

export const logger = getLogger();

/**
 * Load and validate configuration from environment variables and JSON file
 */
export function loadConfig(configPath?: string): Config {
  // Load environment variables
  dotenv.config();

  // Load JSON configuration
  const jsonConfig = loadJsonConfig(configPath);

  // Merge environment variables and JSON configuration
  const mergedConfig = mergeConfigs(jsonConfig);

  // Validate merged configuration
  const validatedConfig = ConfigSchema.parse(mergedConfig);

  return validatedConfig;
}

/**
 * Load JSON configuration from file
 */
function loadJsonConfig(configPath?: string): JsonConfig {
  const defaultConfigPath = path.join(process.cwd(), "config", "config.json");
  const configFilePath = configPath || defaultConfigPath;

  try {
    const configContent = fs.readFileSync(configFilePath, "utf-8");
    const jsonConfig = JSON.parse(configContent);
    return jsonConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.warn(
        `Configuration file not found at ${configFilePath}, using defaults`,
      );
      return getDefaultJsonConfig();
    }
    throw new Error(`Failed to load configuration file: ${error}`);
  }
}

/**
 * Get default JSON configuration
 */
function getDefaultJsonConfig(): JsonConfig {
  return {
    lark: {
      connectionMode: "websocket",
    },
    moltbot: {
      modelName: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000,
      streaming: true,
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    features: {
      messageCards: true,
      fileAttachments: true,
      errorHandling: true,
      retryLogic: true,
    },
    logging: {
      level: "info",
      format: "json",
    },
  };
}

/**
 * Merge environment variables and JSON configuration
 */
function mergeConfigs(jsonConfig: JsonConfig): Config {
  return {
    lark: {
      appId: process.env.LARK_APP_ID || "",
      appSecret: process.env.LARK_APP_SECRET || "",
      encryptKey: process.env.LARK_ENCRYPT_KEY,
      verificationToken: process.env.LARK_VERIFICATION_TOKEN,
      connectionMode: jsonConfig.lark.connectionMode,
    },
    moltbot: {
      apiEndpoint: process.env.MOLTBOT_API_ENDPOINT || "",
      apiKey: process.env.MOLTBOT_API_KEY || "",
      modelName: jsonConfig.moltbot.modelName,
      temperature: jsonConfig.moltbot.temperature,
      maxTokens: jsonConfig.moltbot.maxTokens,
      streaming: jsonConfig.moltbot.streaming,
    },
    server: {
      port: parseInt(
        process.env.PORT || String(jsonConfig.server?.port || 3000),
        10,
      ),
      host: jsonConfig.server?.host || "0.0.0.0",
    },
    features: {
      messageCards: jsonConfig.features?.messageCards ?? true,
      fileAttachments: jsonConfig.features?.fileAttachments ?? true,
      errorHandling: jsonConfig.features?.errorHandling ?? true,
      retryLogic: jsonConfig.features?.retryLogic ?? true,
    },
    logging: {
      level:
        (process.env.LOG_LEVEL as any) || jsonConfig.logging?.level || "info",
      format: jsonConfig.logging?.format || "json",
    },
  };
}
