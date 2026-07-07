'use client';

/**
 * Messenger.tsx
 *
 * Main component module in features path: components/Messenger.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/components/Messenger.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { createConversation } from '@/app/lib/messages/createConversation';
import { getMessages } from '@/app/lib/messages/getMessages';
import { sendMessage } from '@/app/lib/messages/sendMessage';
import { subscribeMessages } from '@/app/lib/messages/subscribeMessages';
import { markAsRead } from '@/app/lib/messages/markAsRead';
import type { Message } from '@/app/lib/messages/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessengerProps {
  currentUserId: string;
  currentUserRole: 'admin' | 'user';
  targetUserId?: string; // required for admin
  targetUserName?: string; // optional display name
}

/**
 * Messenger
 *
 * Renders the Messenger interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for Messenger.
 *
 * @param {
  currentUserId,
  currentUserRole,
  targetUserId,
  targetUserName = 'User'
}: MessengerProps
 * @returns State operations sequence.
 */
export default function Messenger({
  currentUserId,
  currentUserRole,
  targetUserId,
  targetUserName = 'User'
}: MessengerProps) {
  const { containerRef, scrollToBottom } = useChatScroll();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Initialize/retrieve conversation and fetch messages
  useEffect(() => {
    let active = true;
    /**
 * Executes operations logic for initConversation.
 *
 * 
 * @returns State operations sequence.
 */
const initConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        const conversation = await createConversation(targetUserId);
        if (!active) return;
        setConversationId(conversation.id);

        const initialMessages = await getMessages(conversation.id);
        if (!active) return;
        setMessages(initialMessages as unknown as Message[]);

        // Mark incoming messages as read
        const unreadIds = (initialMessages as unknown as Message[])
          .filter(m => m.sender_id !== currentUserId)
          .map(m => m.id);

        for (const msgId of unreadIds) {
          await markAsRead(msgId);
        }
      } catch (err) {
        console.error('Error initializing conversation:', err);
        setError('Failed to load conversation history.');
      } finally {
        if (active) setLoading(false);
      }
    };

    initConversation();

    return () => {
      active = false;
    };
  }, [targetUserId, currentUserId, retryTrigger]);

  // Subscribe to realtime updates when conversationId is resolved
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeMessages(
      conversationId,
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.newRecord) {
          const newMsg = payload.newRecord;
          setMessages((current) => {
            if (current.some((m) => m.id === newMsg.id)) return current;
            return [...current, newMsg];
          });

          if (newMsg.sender_id !== currentUserId) {
            markAsRead(newMsg.id).catch((err: any) => {
              console.error('Error marking message as read:', err);
            });
          }
        } else if (payload.eventType === 'UPDATE' && payload.newRecord) {
          const updatedMsg = payload.newRecord;
          setMessages((current) =>
            current.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
          );
        } else if (payload.eventType === 'DELETE' && payload.oldRecord) {
          const deletedId = payload.oldRecord.id;
          setMessages((current) => current.filter((m) => m.id !== deletedId));
        }
      },
      (status) => {
        setConnected(status === 'SUBSCRIBED');
      }
    );

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle message sending
  /**
 * Executes operations logic for handleSendMessage.
 *
 * @param e: React.FormEvent
 * @returns State operations sequence.
 */
const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !conversationId || sending) return;

    const messageContent = newMessageText.trim();
    setSending(true);
    setNewMessageText('');

    // Create an optimistic message object
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      message: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString(),
      topic: null,
      extension: null,
      payload: null,
      event: null,
      edited: false,
      private: false
    };

    // Append optimistic message immediately and scroll
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const sentMessage = await sendMessage({
        conversationId,
        message: messageContent,
        messageType: 'text'
      });

      // Replace the optimistic message with the actual saved message from DB
      setMessages((current) =>
        current.map((m) => m.id === optimisticMessage.id ? (sentMessage as unknown as Message) : m)
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Message failed to send. Please try again.');
      // Remove optimistic message if sending failed
      setMessages((current) => current.filter((m) => m.id !== optimisticMessage.id));
      // Restore text to input if failed
      setNewMessageText(messageContent);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.card_0}>
        <Loader2 className={styles.text_1} />
        <p className={styles.table_2}>Syncing Secure Pipeline...</p>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className={styles.card_3}>
        <p className={styles.text_4}>{error}</p>
        <Button
          onClick={() => {
            setError(null);
            setRetryTrigger((prev) => prev + 1);
          }}
          className={styles.table_5}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.text_6}>
      {/* Network Status Header (Mini) */}
      <div className={styles.container_7}>
        <div className={styles.container_8}>
          {connected ? (
            <span className={styles.table_9}>
              <span className={styles.div_10} />
              Live Gateway Active
            </span>
          ) : (
            <span className={styles.table_11}>
              <span className={styles.div_12} />
              Offline / Reconnecting
            </span>
          )}
        </div>
        <span className={styles.text_13}>
          Ref: {conversationId?.slice(0, 8)}...
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div ref={containerRef} className={styles.container_14}>
        {messages.length === 0 ? (
          <div className={styles.text_15}>
            <div className={styles.container_16}>
              💬
            </div>
            <p className={styles.table_17}>No history logged</p>
            <p className={styles.text_18}>Type below to initialize dialog.</p>
          </div>
        ) : (
          <div className={styles.div_19}>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === currentUserId;
              const prevMessage = index > 0 ? messages[index - 1] : null;

              // Only show header (sender name + timestamp) if sender changes or time elapsed is > 2 mins
              const timeDiff = prevMessage
                ? new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime()
                : 0;
              const showHeader = !prevMessage || prevMessage.sender_id !== message.sender_id || timeDiff > 120000;

              // Determine display name
              let displayName = 'User';
              const msgWithProfile = message as Message & { profiles?: { full_name: string } | null };
              if (isOwnMessage) {
                displayName = 'You';
              } else if (msgWithProfile.profiles?.full_name) {
                displayName = msgWithProfile.profiles.full_name;
              } else if (currentUserRole === 'admin') {
                displayName = targetUserName;
              } else {
                displayName = 'Admin Office';
              }

              return (
                <div key={message.id} className={styles.div_20}>
                  <div className={cn('flex w-full', isOwnMessage ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[70%] flex flex-col gap-1', isOwnMessage ? 'items-end' : 'items-start')}>
                      {showHeader && (
                        <div className={cn('flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground font-bold tracking-wide uppercase', isOwnMessage && 'flex-row-reverse')}>
                          <span>{displayName}</span>
                          <span className={styles.text_21}>
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      <div className={cn(
                        'py-2 px-3.5 rounded-2xl text-xs leading-relaxed font-medium',
                        isOwnMessage
                          ? 'bg-[#FFF7D6] dark:bg-[#2E2818] border border-[#F4C542]/30 text-black dark:text-[#F4C542]'
                          : 'bg-card border border-border text-foreground'
                      )}>
                        {message.message}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className={styles.card_22}>
        <Input
          className={styles.table_23}
          type="text"
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          placeholder={sending ? 'Relaying transmission...' : 'Type a message...'}
          disabled={sending}
          autoComplete="off"
        />
        <Button
          className={styles.table_24}
          type="submit"
          disabled={!newMessageText.trim() || sending}
        >
          {sending ? (
            <Loader2 className={styles.div_25} />
          ) : (
            <Send className={styles.div_26} />
          )}
        </Button>
      </form>
    </div>
  );
}
