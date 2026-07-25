// Components
export { default as Messenger } from './components/Messenger';
export { ChatMessageItem } from './components/ChatMessage';
export { RealtimeChat } from './components/RealtimeChat';
export { default as AdminMessagesClient } from './components/AdminMessagesClient';
export { default as MessagesClient } from './components/MessagesClient';

// Hooks
export { useChatScroll } from './hooks/useChatScroll';
export { useRealtimeChat } from './hooks/useRealtimeChat';

// Services
export { createConversation } from './services/createConversation';
export { getAdminConversationDetails } from './services/getAdminConversationDetails';
export { getConversation } from './services/getConversation';
export { getConversationDetails } from './services/getConversationDetails';
export { getMessages } from './services/getMessages';
export { markAsRead } from './services/markAsRead';
export { sendMessage } from './services/sendMessage';
export { subscribeMessages } from './services/subscribeMessages';
export type { Message, Conversation, ConversationParticipant, CreateConversationResult, SendMessageInput, SendMessageResult } from './services/types';

