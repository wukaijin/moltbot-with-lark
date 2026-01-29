/**
 * Lark message types and interfaces
 */

// Lark message content types
export enum LarkMessageType {
  TEXT = "text",
  POST = "post",
  IMAGE = "image",
  FILE = "file",
  AUDIO = "audio",
  MEDIA = "media",
  STICKER = "sticker",
  INTERACTIVE = "interactive",
}

// Lark message content structure
export interface LarkMessageContent {
  text?: string;
  post?: LarkPostContent;
  image_key?: string;
  file_key?: string;
}

export interface LarkPostContent {
  zh_cn?: LarkPostElement[];
  en_us?: LarkPostElement[];
}

export interface LarkPostElement {
  tag: string;
  text?: string;
  href?: string;
  [key: string]: any;
}

// Lark message structure
export interface LarkMessage {
  message_id: string;
  chat_id: string;
  chat_type: string;
  content: string; // JSON string
  create_time: string;
  update_time: string;
  sender: LarkSender;
  msg_type: LarkMessageType;
  parent_id?: string;
  thread_id?: string;
  reply_to?: LarkReplyTo;
  mentions?: LarkMention[];
}

export interface LarkSender {
  sender_id: LarkSenderId;
  sender_type: string;
  tenant_key: string;
}

export interface LarkSenderId {
  open_id: string;
  union_id?: string;
  user_id?: string;
}

export interface LarkReplyTo {
  message_id: string;
}

export interface LarkMention {
  id: string;
  id_type: string;
  name: string;
  tenant_key: string;
}

// Lark event data
export interface LarkMessageReceiveEvent {
  schema: string;
  header: LarkEventHeader;
  event: LarkMessageReceiveEventData;
}

export interface LarkEventHeader {
  event_id: string;
  event_type: string;
  create_time: string;
  tenant_key: string;
  app_type: string;
}

export interface LarkMessageReceiveEventData {
  sender: LarkSender;
  message: LarkMessage;
}

// Lark message card structure
export interface LarkMessageCard {
  config?: LarkCardConfig;
  header?: LarkCardHeader;
  elements: LarkCardElement[];
}

export interface LarkCardConfig {
  wide_screen_mode?: boolean;
}

export interface LarkCardHeader {
  title?: LarkCardPlainText;
  subtitle?: LarkCardPlainText;
  template?: string;
}

export interface LarkCardPlainText {
  tag: "plain_text";
  content: string;
}

export interface LarkCardMarkdown {
  tag: "lark_md";
  content: string;
}

export interface LarkCardElement {
  tag: string;
  [key: string]: any;
}

// Lark interactive card action
export interface LarkCardActionEvent {
  schema: string;
  header: LarkEventHeader;
  action: LarkCardAction;
}

export interface LarkCardAction {
  value: any;
  action_value?: any;
  token: string;
  action_tag: string;
  trigger_id: string;
  operator_id: LarkSenderId;
}

// Parsed message for internal use
export interface ParsedLarkMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  senderType: string;
  messageType: LarkMessageType;
  textContent?: string;
  postContent?: LarkPostContent;
  imageKey?: string;
  fileKey?: string;
  mentions?: LarkMention[];
  timestamp: number;
}

// Message to send to Lark
export interface LarkSendMessage {
  receive_id: string;
  receive_id_type: "open_id" | "user_id" | "union_id" | "chat_id" | "email";
  content: string; // JSON string
  msg_type: LarkMessageType;
  reply_in_message_id?: string;
}

// Streaming update message
export interface LarkStreamUpdate {
  chatId: string;
  messageId?: string;
  content: string;
  isComplete: boolean;
}
