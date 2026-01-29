import { z } from "zod";

// Lark configuration schema
const LarkConfigSchema = z.object({
  appId: z.string().min(1, "LARK_APP_ID is required"),
  appSecret: z.string().min(1, "LARK_APP_SECRET is required"),
  encryptKey: z.string().optional(),
  verificationToken: z.string().optional(),
  connectionMode: z.literal("websocket"),
});

// Moltbot configuration schema
const MoltbotConfigSchema = z.object({
  apiEndpoint: z.string().url("MOLTBOT_API_ENDPOINT must be a valid URL"),
  apiKey: z.string().min(1, "MOLTBOT_API_KEY is required"),
  modelName: z.string().min(1, "Model name is required"),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  streaming: z.literal(true),
});

// Server configuration schema
const ServerConfigSchema = z.object({
  port: z.number().int().positive().default(3000),
  host: z.string().default("0.0.0.0"),
});

// Features configuration schema
const FeaturesConfigSchema = z.object({
  messageCards: z.boolean().default(true),
  fileAttachments: z.boolean().default(true),
  errorHandling: z.boolean().default(true),
  retryLogic: z.boolean().default(true),
});

// Logging configuration schema
const LoggingConfigSchema = z.object({
  level: z.enum(["error", "warn", "info", "debug"]).default("info"),
  format: z.enum(["json", "text"]).default("json"),
});

// JSON configuration schema (from config.json)
const JsonConfigSchema = z.object({
  lark: z.object({
    connectionMode: z.literal("websocket"),
  }),
  moltbot: z.object({
    modelName: z.string().min(1),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    streaming: z.literal(true),
  }),
  server: z.object({
    port: z.number().int().positive().optional(),
    host: z.string().optional(),
  }),
  features: z.object({
    messageCards: z.boolean().optional(),
    fileAttachments: z.boolean().optional(),
    errorHandling: z.boolean().optional(),
    retryLogic: z.boolean().optional(),
  }),
  logging: z.object({
    level: z.enum(["error", "warn", "info", "debug"]).optional(),
    format: z.enum(["json", "text"]).optional(),
  }),
});

// Complete configuration schema
export const ConfigSchema = z.object({
  lark: LarkConfigSchema,
  moltbot: MoltbotConfigSchema,
  server: ServerConfigSchema,
  features: FeaturesConfigSchema,
  logging: LoggingConfigSchema,
});

// Type exports
export type LarkConfig = z.infer<typeof LarkConfigSchema>;
export type MoltbotConfig = z.infer<typeof MoltbotConfigSchema>;
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;
export type LoggingConfig = z.infer<typeof LoggingConfigSchema>;
export type JsonConfig = z.infer<typeof JsonConfigSchema>;
export type Config = z.infer<typeof ConfigSchema>;
