# Moltbot with Lark

一个 TypeScript Node.js 项目，用于将飞书（Lark）WebSocket 连接桥接到 Moltbot 的 AI 智能体，支持流式响应。

## 功能特性

- ✅ **WebSocket 长连接**: 与飞书进行实时双向通信
- ✅ **流式响应**: 在 Moltbot 响应时向飞书发送部分更新
- ✅ **消息转换**: 在飞书和 Moltbot 格式之间转换
- ✅ **消息卡片**: 支持交互式卡片和富文本
- ✅ **文件附件**: 处理图片和文件
- ✅ **对话上下文**: 维护对话历史记录并自动清理
- ✅ **错误处理**: 完善的错误处理和重试逻辑
- ✅ **配置管理**: 环境变量 + JSON 文件，使用 Zod 验证
- ✅ **优雅关闭**: 在 SIGTERM/SIGINT 时正确清理资源

## 架构

```
飞书平台 → 飞书 WebSocket 客户端 → 消息处理器 → 转换器 → Moltbot 客户端 → Moltbot 智能体
                      ↑                                          ↓
                      └─────── 流处理器 ←────────────────────┘
                                   ↓
                           飞书消息发送器 → 飞书平台
```

## 安装

### 前置要求

- Node.js 18 或更高版本
- npm 或 yarn 或 pnpm
- 飞书应用凭证
- Moltbot API 凭证

### 设置

1. 安装依赖：

```bash
npm install
```

2. 复制配置模板：

```bash
cp config/config.example.json config/config.json
cp config/.env.example config/.env
```

3. 编辑 `config/.env` 填入您的凭证：

```bash
# 飞书配置
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
LARK_ENCRYPT_KEY=your_encrypt_key

# Moltbot 配置
MOLTBOT_API_ENDPOINT=https://api.moltbot.com/v1
MOLTBOT_API_KEY=your_api_key
MOLTBOT_MODEL_NAME=gpt-4

# 应用配置
NODE_ENV=production
LOG_LEVEL=info
```

4. （可选）编辑 `config/config.json` 进行高级设置：

```json
{
  "lark": {
    "appId": "${LARK_APP_ID}",
    "appSecret": "${LARK_APP_SECRET}",
    "encryptKey": "${LARK_ENCRYPT_KEY}"
  },
  "moltbot": {
    "apiEndpoint": "${MOLTBOT_API_ENDPOINT}",
    "apiKey": "${MOLTBOT_API_KEY}",
    "modelName": "${MOLTBOT_MODEL_NAME}",
    "temperature": 0.7,
    "maxTokens": 2000,
    "streaming": true
  },
  "features": {
    "messageCards": true,
    "fileAttachments": false
  },
  "conversation": {
    "maxHistorySize": 10,
    "expiryHours": 24
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": {
      "enabled": true,
      "path": "./logs/app.log"
    }
  }
}
```

5. 启动应用：

```bash
# 开发模式（使用 ts-node）
npm run dev

# 构建生产版本
npm run build

# 生产模式
npm start
```

## 配置

### 环境变量

| 变量名                 | 描述                                 | 必填 | 默认值      |
| ---------------------- | ------------------------------------ | ---- | ----------- |
| `LARK_APP_ID`          | 飞书应用 ID                          | 是   | -           |
| `LARK_APP_SECRET`      | 飞书应用密钥                         | 是   | -           |
| `LARK_ENCRYPT_KEY`     | 飞书加密密钥                         | 否   | -           |
| `MOLTBOT_API_ENDPOINT` | Moltbot API 端点                     | 是   | -           |
| `MOLTBOT_API_KEY`      | Moltbot API 密钥                     | 是   | -           |
| `MOLTBOT_MODEL_NAME`   | Moltbot 模型名称                     | 是   | -           |
| `NODE_ENV`             | 环境（development/production）       | 否   | development |
| `LOG_LEVEL`            | 日志级别（error, warn, info, debug） | 否   | info        |

### JSON 配置选项

#### 飞书配置

- `appId`: 飞书应用 ID
- `appSecret`: 飞书应用密钥
- `encryptKey`: 飞书事件验证加密密钥

#### Moltbot 配置

- `apiEndpoint`: Moltbot API 端点 URL
- `apiKey`: Moltbot API 密钥
- `modelName`: 使用的模型名称（如 gpt-4、gpt-3.5-turbo）
- `temperature`: 采样温度（0.0 - 2.0）
- `maxTokens`: 响应的最大 token 数
- `streaming`: 启用流式响应

#### 功能配置

- `messageCards`: 启用交互式消息卡片
- `fileAttachments`: 启用文件附件处理

#### 对话配置

- `maxHistorySize`: 保留在历史记录中的最大消息数
- `expiryHours`: 对话过期前的时长（小时）

#### 日志配置

- `level`: 日志级别（error、warn、info、debug）
- `format`: 日志格式（json、text）
- `file.enabled`: 启用文件日志
- `file.path`: 日志文件路径

## 使用方法

### 开发

```bash
# 使用 ts-node 运行开发模式
npm run dev

# 以监视模式运行 TypeScript 编译器
npm run dev:watch

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

### 生产

```bash
# 将 TypeScript 编译为 JavaScript
npm run build

# 启动生产服务器
npm start
```

### 测试

```bash
# 运行所有测试
npm test

# 以监视模式运行测试
npm run test:watch

# 运行测试并生成覆盖率报告
npm test -- --coverage
```

## 项目结构

```
moltbot-with-lark/
├── config/                    # 配置文件
│   ├── config.example.json    # 配置模板
│   └── .env.example          # 环境变量模板
├── dist/                     # 编译后的 JavaScript 输出
├── src/
│   ├── config/               # 配置管理
│   │   ├── index.ts         # 配置导出
│   │   ├── loader.ts        # 配置加载器
│   │   └── schema.ts       # Zod 验证模式
│   ├── lark/                # 飞书集成
│   │   ├── client.ts        # 飞书 API 客户端
│   │   ├── handlers.ts      # 消息解析和过滤
│   │   ├── sender.ts        # 带重试逻辑的消息发送器
│   │   ├── types.ts         # TypeScript 类型定义
│   │   └── websocket.ts     # WebSocket 客户端
│   ├── moltbot/             # Moltbot 集成
│   │   ├── client.ts        # Moltbot API 客户端
│   │   └── types.ts        # TypeScript 类型定义
│   ├── bridge/              # 桥接逻辑
│   │   ├── context.ts       # 对话上下文管理器
│   │   ├── processor.ts     # 流处理器
│   │   └── transformer.ts   # 消息转换器
│   ├── utils/               # 工具函数
│   │   ├── errors.ts        # 自定义错误类
│   │   ├── logger.ts        # Winston 日志记录器
│   │   └── retry.ts        # 重试逻辑
│   └── index.ts            # 主应用入口点
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
└── README.md
```

## 功能详解

### WebSocket 连接

- 与飞书进行实时双向通信
- 指数退避自动重连
- 事件分发器处理传入消息
- 连接状态管理
- 优雅关闭处理

### 流式响应

- 处理来自 Moltbot 的流式响应
- 向飞书发送部分更新（每 100 个字符或 1 秒）
- 支持流式和非流式模式
- 可配置的部分更新阈值
- 实时反馈的流畅用户体验

### 消息转换

- 将飞书消息转换为 Moltbot 格式
- 将 Moltbot 响应转换为飞书格式
- 支持文本、Markdown 和卡片格式
- 处理提及、附件和富文本
- 保留消息上下文和元数据

### 对话上下文

- 每个对话维护历史记录
- 可配置的历史记录长度（默认：10 条消息）
- 自动清理过期对话（默认：24 小时）
- 支持多个同时进行的对话
- 定期清理以防止内存泄漏

### 错误处理

- 不同组件的自定义错误类型
- 用于重试逻辑的瞬态错误检测
- 重试的指数退避
- 用户友好的错误消息
- 带堆栈跟踪的全面日志记录

### 重试逻辑

- 可配置的重试次数（默认：3 次）
- 带抖动的指数退避
- 瞬态错误检测
- 每个操作的重试配置
- 熔断器模式支持

## 工作原理

1. **初始化**: 应用从环境变量和 JSON 文件加载配置
2. **WebSocket 连接**: 连接到飞书 WebSocket 服务器以获取实时消息事件
3. **消息接收**: 通过 WebSocket 从飞书接收消息
4. **消息解析**: 解析飞书消息内容（文本、Markdown、卡片等）
5. **消息过滤**: 跳过来自机器人的消息和没有内容的消息
6. **上下文管理**: 将消息添加到对话历史记录
7. **Moltbot 请求**: 向 Moltbot 发送包含对话历史的请求
8. **流处理**: 处理流式响应（如果启用）
9. **部分更新**: 在流式传输期间向飞书发送部分更新
10. **最终响应**: 向飞书发送最终响应
11. **上下文更新**: 将助手响应添加到对话历史记录

## 依赖

### 生产依赖

- `@larksuiteoapi/node-sdk` - 飞书 Node.js SDK
- `@ai-sdk/openai-compatible` - AI SDK 的 OpenAI 兼容提供程序
- `ai` - 用于流式响应的 Vercel AI SDK
- `zod` - 模式验证
- `winston` - 日志记录
- `dotenv` - 环境变量管理

### 开发依赖

- `typescript` - TypeScript 编译器
- `@types/node` - Node.js 类型定义
- `ts-node` - 开发环境中的 TypeScript 执行
- `jest` - 测试框架
- `@types/jest` - Jest 类型定义
- `ts-jest` - Jest 的 TypeScript 预处理器
- `eslint` - 代码检查
- `@typescript-eslint/parser` - ESLint 的 TypeScript 解析器
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint 插件

## 故障排除

### 构建错误

如果遇到构建错误，请运行：

```bash
npm run type-check
```

这将显示详细的 TypeScript 编译错误。

### 连接问题

检查您的环境变量并确保：

- 飞书凭证正确
- Moltbot API 端点可访问
- 网络连接稳定
- 防火墙规则允许 WebSocket 连接

### 日志记录

日志写入到：

- 控制台（stdout/stderr）
- 文件：`./logs/app.log`（如果在配置中启用）

日志级别：

- `error`: 仅错误消息
- `warn`: 警告和错误
- `info`: 信息性消息（默认）
- `debug`: 详细的调试信息

### 性能问题

- 减少对话配置中的 `maxHistorySize`
- 如果不需要，禁用 `streaming`
- 增加流处理器中的 `chunkThreshold` 和 `timeThreshold`
- 调整 Moltbot 配置中的 `temperature` 和 `maxTokens`

## 开发

### 添加新功能

1. 创建功能分支
2. 在适当的模块中实现功能
3. 为新功能添加测试
4. 更新文档
5. 提交拉取请求

### 代码风格

- 所有新代码使用 TypeScript
- 遵循现有代码结构
- 为公共 API 添加 JSDoc 注释
- 使用 Winston 日志记录器进行日志记录
- 适当处理错误

## API 兼容性

### 飞书 SDK

- 版本：最新
- 使用：`@larksuiteoapi/node-sdk`
- 功能：WebSocket 客户端、事件分发器、消息客户端

### Moltbot SDK

- 版本：最新
- 使用：`@ai-sdk/openai-compatible`
- 功能：OpenAI 兼容提供程序、流式支持

## 许可证

MIT

## 贡献

欢迎贡献！请随时提交拉取请求。

## 支持

如有问题或疑问，请参考项目文档或联系开发团队。

## 更新日志

### 版本 1.0.0

- 初始版本发布
- 飞书 WebSocket 连接
- Moltbot 流式响应
- 格式之间的消息转换
- 对话上下文管理
- 错误处理和重试逻辑
- 全面的日志记录
- 优雅关闭
