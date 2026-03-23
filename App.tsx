
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message } from './types';
import { generateTextStream } from './services/krutrimService';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { CopilotIcon, SpeakerOnIcon, SpeakerOffIcon } from './components/Icons';

// Type definition for SpeechSynthesisErrorEvent to satisfy TypeScript
interface SpeechSynthesisErrorEvent extends Event {
  error: string;
}

// --- Sequential Speech Synthesis ---
let speechUtteranceQueue: SpeechSynthesisUtterance[] = [];
let isSpeechActive = false;

const processSpeechQueue = () => {
  if (isSpeechActive || speechUtteranceQueue.length === 0) return;
  isSpeechActive = true;
  const utterance = speechUtteranceQueue.shift()!;
  utterance.onend = () => { isSpeechActive = false; setTimeout(processSpeechQueue, 100); };
  utterance.onerror = (e) => {
    const err = e as SpeechSynthesisErrorEvent;
    console.error(`Speech error: ${err.error}`);
    isSpeechActive = false;
    processSpeechQueue();
  };
  window.speechSynthesis.speak(utterance);
};

const speakText = (text: string) => {
  if (!text?.trim() || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  isSpeechActive = false;
  speechUtteranceQueue = [];
  const chunks = text.match(/[^.!?]+[.!?]+|[^.!?\s]+(?:\s+[^.!?\s]+)*/g) || [];
  chunks.forEach(chunk => {
    const trimmed = chunk.trim();
    if (trimmed) {
    const utterance = new SpeechSynthesisUtterance(trimmed);
      speechUtteranceQueue.push(utterance);
    }
  });
  processSpeechQueue();
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial-message',
      sender: 'bot',
      type: 'text',
      text: "Hello! I'm your multilingual AI Assistant. Select your language from the dropdown, click the 🎤 mic to speak, and I'll respond in the same language.",
      isLoading: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadAloudEnabled, setIsReadAloudEnabled] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!isReadAloudEnabled) {
      window.speechSynthesis?.cancel();
      return;
    }
    if (!window.speechSynthesis) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'bot' && !lastMessage.isLoading && lastMessage.id !== lastSpokenMessageId.current) {
      let textToSpeak = '';
      if (lastMessage.isError) {
        textToSpeak = lastMessage.error || "An error occurred.";
      } else if (lastMessage.text) {
        textToSpeak = lastMessage.text.replace(/```[\s\S]*?```/g, 'A code block is displayed.');
      }
      if (textToSpeak.trim()) {
        speakText(textToSpeak);
        lastSpokenMessageId.current = lastMessage.id;
      }
    }
  }, [messages, isReadAloudEnabled]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length > 1 && event.key !== 'Backspace' && event.key !== 'Delete') return;
      textareaRef.current?.focus();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    window.speechSynthesis?.cancel();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      type: 'text',
      text: prompt,
      isLoading: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: botMessageId, sender: 'bot', type: 'text', text: '', isLoading: true }]);

    try {
      const stream = generateTextStream(prompt);
      for await (const chunk of stream) {
        setMessages(prev =>
          prev.map(msg => msg.id === botMessageId ? { ...msg, text: (msg.text || '') + chunk.text } : msg)
        );
      }
      setMessages(prev =>
        prev.map(msg => msg.id === botMessageId ? { ...msg, isLoading: false } : msg)
      );
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessages(prev =>
        prev.map(msg => msg.id !== botMessageId ? msg : {
          ...msg,
          type: 'text' as const,
          text: `Sorry, I ran into an error: ${errorMessage}`,
          isLoading: false,
          isError: true,
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col h-screen text-gray-300 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center">
          <CopilotIcon />
          <h1 className="text-md font-semibold text-gray-300 ml-2">AI Assistant</h1>
        </div>
        <button
          onClick={() => setIsReadAloudEnabled(prev => !prev)}
          className="text-gray-400 hover:text-white transition-colors p-1"
          aria-label={isReadAloudEnabled ? "Disable read aloud" : "Enable read aloud"}
        >
          {isReadAloudEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
        </button>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <MessageList messages={messages} />
        </div>
      </main>
      <footer className="bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-700/50">
          <ChatInput
            ref={textareaRef}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;
