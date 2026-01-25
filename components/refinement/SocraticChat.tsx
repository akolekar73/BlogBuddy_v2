'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefinementMessage } from '@/lib/types';

interface SocraticChatProps {
  initialTopic: string;
  messages: RefinementMessage[];
  onMessagesChange: (messages: RefinementMessage[]) => void;
  onReadyForFramework: () => void;
}

export function SocraticChat({
  initialTopic,
  messages,
  onMessagesChange,
  onReadyForFramework,
}: SocraticChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readyForNext, setReadyForNext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Start the conversation with the initial topic
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      // Start with the user's topic
      const initialMessage: RefinementMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: `I want to write about: ${initialTopic}`,
        timestamp: new Date().toISOString(),
      };
      handleSendMessage(initialMessage.content, [initialMessage]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  const handleSendMessage = async (content: string, currentMessages: RefinementMessage[]) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/refine/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: currentMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: RefinementMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...currentMessages, assistantMessage];
      onMessagesChange(updatedMessages);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          // Update the assistant message with streaming content
          const messagesWithContent = currentMessages.map((m) => m);
          messagesWithContent.push({
            ...assistantMessage,
            content: assistantContent,
          });
          onMessagesChange(messagesWithContent);
        }
      }

      // Check if AI indicates ready for framework selection
      if (assistantContent.includes('[READY_FOR_FRAMEWORK]')) {
        setReadyForNext(true);
        // Remove the marker from the displayed message
        const cleanedContent = assistantContent.replace('[READY_FOR_FRAMEWORK]', '').trim();
        const finalMessages = currentMessages.map((m) => m);
        finalMessages.push({
          ...assistantMessage,
          content: cleanedContent,
        });
        onMessagesChange(finalMessages);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: RefinementMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      onMessagesChange([...currentMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: RefinementMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    onMessagesChange(updatedMessages);
    setInput('');

    await handleSendMessage(userMessage.content, updatedMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Check if we have enough conversation (3+ exchanges) to allow manual progression
  const canProceedManually = messages.filter((m) => m.role === 'user').length >= 2;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Let&apos;s Refine Your Idea
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          I&apos;ll ask a few questions to understand what you want to explore.
        </p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            disabled={isLoading}
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {(readyForNext || canProceedManually) && (
          <Button
            onClick={onReadyForFramework}
            className="w-full"
            variant={readyForNext ? 'default' : 'outline'}
          >
            {readyForNext ? 'Continue to Framework Selection' : 'Skip to Framework Selection'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
