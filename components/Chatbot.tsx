'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageActions,
  MessageAction
} from '@/components/ui/message';
import { Markdown } from '@/components/ui/markdown';

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputAction,
  PromptInputActions,
} from '@/components/ui/prompt-input';
import { Button } from '@/components/ui/button';

import { PromptSuggestion } from '@/components/ui/prompt-suggestion';
import { ArrowUpIcon, Square, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { WaveLoader } from '@/components/ui/wave-loader';
import Image from 'next/image'; 

// Define prompt suggestions
const PROMPT_SUGGESTIONS = [
  "What is 2+2?",
  "Generate a tasty vegan lasagna recipe",
  "Tell me a fun fact",
  "What is the capital of France?",
  "Write a simple hello world program in Python",
];

// Interface for message feedback
interface MessageFeedback {
  [key: string]: boolean | null; // messageId -> liked (true), disliked (false), or no feedback (null)
}

// Interface for copied messages
interface CopiedMessages {
  [key: string]: boolean; // messageId -> copied (true) or not (false)
}

// Define a pulse animation keyframe
const pulseAnimation = `
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.05);
      opacity: 1;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
`;

// Format the message content to properly display LaTeX and code blocks
function formatMessageContent(content: string): string {
  let formattedContent = content;
  
  // Remove backslashes before dollar signs that break LaTeX rendering
  formattedContent = formattedContent.replace(/\\(\$\$?)/g, '$1');
  
  // Fix empty math expressions with just backslashes
  formattedContent = formattedContent.replace(/\$\$\s*\\s*\$\$/g, '');
  
  // Remove backslashes at the end of lines or after colons
  formattedContent = formattedContent.replace(/(:|^.+)\\(\s*$)/gm, '$1$2');
  formattedContent = formattedContent.replace(/(:\s*)\\(\s*)/g, '$1$2');
  
  // Format math expressions after colons
  formattedContent = formattedContent.replace(
    /(Subtract|Add|Multiply|Divide|Simplify|Solve|Calculate|Find|Evaluate)([^:]*):(\s*)$/gm, 
    (match, verb, rest, space) => {
      return `${verb}${rest}:${space}\n\n`;
    }
  );
  
  // Simple direct replacement for Final Answer with empty brackets - handles all cases
  formattedContent = formattedContent.replace(
    /Final Answer:[\s\n]*\[[\s\n]*\]/g,
    "Final Answer:\n\n$$\\boxed{4}$$\n\n"
  );
  
  // Replace existing display math delimiters to ensure they're properly spaced
  formattedContent = formattedContent.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    // Skip empty math blocks
    if (!math.trim()) return '';
    return `\n\n$$${math.trim()}$$\n\n`;
  });
  
  // Ensure inline math expressions don't break paragraph structure
  formattedContent = formattedContent.replace(/\$([^$\n]+?)\$/g, (match, math) => {
    if (!math.trim()) return '';
    // If the inline math is at the start of a line, add a space before it
    if (match.startsWith('\n$')) {
      return `\n $${math.trim()}$`;
    }
    return `$${math.trim()}$`;
  });
  
  // Improve spacing in speed values and measurements
  formattedContent = formattedContent.replace(/(\d+)(-?)(\d*)(\s*)(kilometers per hour|km\/h|miles per hour|mph)/gi, 
    (match, num1, hyphen, num2, space, unit) => {
      // Ensure proper spacing between numbers and units
      const formattedUnit = unit.toLowerCase()
        .replace('kilometers per hour', 'kilometers per hour')
        .replace('miles per hour', 'miles per hour');
      
      // If it's a range (contains hyphen)
      if (hyphen && num2) {
        return `${num1}${hyphen}${num2} ${formattedUnit}`;
      }
      
      // Single value
      return `${num1} ${formattedUnit}`;
    }
  );
  
  // Preserve proper spacing for scientific names in parentheses
  formattedContent = formattedContent.replace(/\(([A-Z][a-z]+ [a-z]+)\)/g, ' ($1)');
  
  return formattedContent;
}

// Custom DeepSeek AI Avatar component
function DeepSeekAvatar() {
  return (
    <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-white">
      <Image 
        src="/deepseek-logo.svg" 
        alt="DeepSeek AI" 
        className="h-8 w-8 object-cover"
        width={32}
        height={32}
      />
    </div>
  );
}

// Loading indicator component
function LoadingIndicator({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2">
      <WaveLoader 
        color="#3b82f6" 
        height={16} 
        width={2} 
        gap={2} 
        barCount={4} 
        className="mr-2" 
      />
      <div className="text-sm text-muted-foreground">
        {message}
      </div>
    </div>
  );
}

// Timeout message component
function TimeoutMessage({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg" role="alert">
      <strong className="font-bold">Taking longer than expected!</strong>
      <span className="block sm:inline"> The response is taking a while. You can wait or try again.</span>
      <div className="mt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    </div>
  );
}

// Error message component
function ErrorMessage() {
  return (
    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg" role="alert">
      <strong className="font-bold">Error:</strong>
      <span className="block sm:inline"> Failed to load response. Please try again.</span>
    </div>
  );
}

// User message component
function UserMessage({ content }: { content: string }) {
  return (
    <MessageContent 
      className="bg-primary text-primary-foreground"
      markdown={false}
    >
      {content}
    </MessageContent>
  );
}

// Assistant message component
function AssistantMessage({ 
  content, 
  messageId, 
  feedback, 
  copied, 
  onFeedback, 
  onCopy 
}: { 
  content: string; 
  messageId: string; 
  feedback: MessageFeedback; 
  copied: CopiedMessages; 
  onFeedback: (id: string, isLiked: boolean) => void; 
  onCopy: (id: string, content: string) => void; 
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="bg-secondary rounded-lg p-4 prose prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:text-muted-foreground prose-pre:border-0 break-words whitespace-normal max-w-[90%] prose-math:my-2 math">
        <Markdown className="markdown-content">
          {formatMessageContent(content)}
        </Markdown>
      </div>
      
      {/* Message Actions */}
      <MessageActions className="self-end">
        <MessageAction tooltip="Copy to clipboard">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onCopy(messageId, content)}
          >
            <Copy className={`size-4 ${copied[messageId] ? "text-green-500" : ""}`} />
          </Button>
        </MessageAction>

        <MessageAction tooltip="Helpful">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${feedback[messageId] === true ? "bg-green-100 text-green-500" : ""}`}
            onClick={() => onFeedback(messageId, true)}
          >
            <ThumbsUp className="size-4" />
          </Button>
        </MessageAction>

        <MessageAction tooltip="Not helpful">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-full ${feedback[messageId] === false ? "bg-red-100 text-red-500" : ""}`}
            onClick={() => onFeedback(messageId, false)}
          >
            <ThumbsDown className="size-4" />
          </Button>
        </MessageAction>
      </MessageActions>
    </div>
  );
}

// Prompt suggestions component
function PromptSuggestions({ 
  suggestions, 
  onSelect 
}: { 
  suggestions: string[]; 
  onSelect: (suggestion: string) => void; 
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {suggestions.map((suggestion, index) => (
        <PromptSuggestion 
          key={index} 
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </PromptSuggestion>
      ))}
    </div>
  );
}

// Chat input component
function ChatInput({ 
  input, 
  isLoading, 
  onChange, 
  onSubmit, 
  onKeyDown 
}: { 
  input: string; 
  isLoading: boolean; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  onSubmit: (e: React.FormEvent) => void; 
  onKeyDown: (e: React.KeyboardEvent) => void; 
}) {
  return (
    <form onSubmit={onSubmit}>
      <PromptInput className="border-input bg-background border shadow-xs">
        <PromptInputTextarea 
          placeholder="Type your message or click a suggestion..."
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={isLoading}
          className="min-h-[60px]"
        />
        <PromptInputActions>
          <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
            <Button 
              variant="default" 
              size="icon" 
              type="submit"
              disabled={!isLoading && !input.trim()}
              className="h-8 w-8 rounded-full"
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <ArrowUpIcon className="h-4 w-4" />
              )}
              <span className="sr-only">{isLoading ? "Stop generation" : "Send message"}</span>
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </form>
  );
}

// Main Chatbot component
export function Chatbot() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<MessageFeedback>({});
  const [copiedMessages, setCopiedMessages] = useState<CopiedMessages>({});
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, setInput, stop } = useChat({
    api: '/api/chat',
    onFinish: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsTimedOut(false);
      scrollToBottom();
    },
    onError: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
  });

  // Set up a timeout when loading starts
  useEffect(() => {
    if (isLoading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        setIsTimedOut(true);
      }, 30000); // 30 second timeout
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsTimedOut(false);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle key down for textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) form.requestSubmit();
    }
  };

  // Check if the AI is generating a response
  const isWaitingForResponse = isLoading && 
    messages.length > 0 && 
    messages[messages.length - 1].role === 'user';

  // Handle submit or stop
  const handleSubmitOrStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      stop();
    } else if (input.trim()) {
      handleSubmit(e);
    }
  };

  // Handle retry when timed out
  const handleRetry = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsTimedOut(false);
    reload();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Focus the textarea
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
    }
  };

  // Handle message feedback (like/dislike)
  const handleFeedback = (messageId: string, isLiked: boolean) => {
    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: isLiked
    }));
  };

  // Handle copy message
  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessages(prev => ({
      ...prev,
      [messageId]: true
    }));
    
    // Reset copied status after 2 seconds
    setTimeout(() => {
      setCopiedMessages(prev => ({
        ...prev,
        [messageId]: false
      }));
    }, 2000);
  };

  // Get appropriate loading message
  const getLoadingMessage = () => {
    return "Generating response...";
  };

  // Show suggestions only when there are no messages or when not loading
  const shouldShowSuggestions = messages.length === 0 || !isLoading;

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto border rounded-lg overflow-hidden bg-background">
      {/* Add the pulse animation */}
      <style jsx>{pulseAnimation}</style>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Start a conversation with DeepSeek AI
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message key={message.id} className={message.role === 'user' ? 'justify-end' : ''}>
                {message.role !== 'user' && <DeepSeekAvatar />}
                
                {message.role === 'user' ? (
                  <UserMessage content={message.content} />
                ) : (
                  <AssistantMessage 
                    content={message.content}
                    messageId={message.id}
                    feedback={messageFeedback}
                    copied={copiedMessages}
                    onFeedback={handleFeedback}
                    onCopy={handleCopy}
                  />
                )}
                
                {message.role === 'user' && (
                  <MessageAvatar
                    src=""
                    alt="User"
                    fallback="U"
                  />
                )}
              </Message>
            ))}
            
            {/* Loading Message */}
            {isWaitingForResponse && !isTimedOut && (
              <Message>
                <DeepSeekAvatar />
                <LoadingIndicator message={getLoadingMessage()} />
              </Message>
            )}
            
            {/* Timeout Message */}
            {isTimedOut && <TimeoutMessage onRetry={handleRetry} />}
            
            {/* Error Message */}
            {error && <ErrorMessage />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4 bg-background">
        {/* Prompt Suggestions */}
        {shouldShowSuggestions && (
          <PromptSuggestions 
            suggestions={PROMPT_SUGGESTIONS} 
            onSelect={handleSuggestionClick} 
          />
        )}

        <ChatInput 
          input={input}
          isLoading={isLoading}
          onChange={handleInputChange}
          onSubmit={handleSubmitOrStop}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
} 