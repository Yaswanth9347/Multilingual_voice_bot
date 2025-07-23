
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, GroundingChunk } from './types';
import { 
  generateTextStream, 
  generateImage, 
  generateTextWithSearchStream,
  generateImagePromptWithSearch,
} from './services/geminiService';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { CopilotIcon, SpeakerOnIcon, SpeakerOffIcon } from './components/Icons';

// Type definition for SpeechSynthesisErrorEvent to satisfy TypeScript
interface SpeechSynthesisErrorEvent extends Event {
  error: string;
}

// --- Robust Sequential Speech Synthesis ---

// Module-level state to manage the speech queue. This prevents race conditions
// and interruptions caused by React re-renders or quick-firing events.
let speechUtteranceQueue: SpeechSynthesisUtterance[] = [];
let isSpeechActive = false;

// Processes the next utterance in the queue sequentially.
const processSpeechQueue = () => {
  if (isSpeechActive || speechUtteranceQueue.length === 0) {
    return;
  }
  isSpeechActive = true;
  
  const utterance = speechUtteranceQueue.shift()!;
  
  utterance.onend = () => {
    isSpeechActive = false;
    // Process the next item in the queue after a brief, natural pause.
    setTimeout(processSpeechQueue, 100); 
  };
  
  utterance.onerror = (e) => {
    const errorEvent = e as SpeechSynthesisErrorEvent;
    console.error(`SpeechSynthesis Error: ${errorEvent.error}.`, "Chunk:", utterance.text);
    isSpeechActive = false;
    // Continue with the queue even if one chunk fails
    processSpeechQueue(); 
  };
  
  window.speechSynthesis.speak(utterance);
};

// Main function to initiate speech. It clears any ongoing speech and builds a new queue.
const speakText = (text: string) => {
  if (!text || !text.trim() || !window.speechSynthesis) {
    return;
  }

  // Stop any currently speaking utterance and clear the old queue.
  window.speechSynthesis.cancel();
  isSpeechActive = false;
  speechUtteranceQueue = [];

  // Split text into sentences for more reliable playback.
  const chunks = text.match(/[^.!?]+[.!?]+|[^.!?\s]+(?:\s+[^.!?\s]+)*/g) || [];

  chunks.forEach(chunk => {
    const trimmedChunk = chunk.trim();
    if (trimmedChunk) {
      const utterance = new SpeechSynthesisUtterance(trimmedChunk);
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
      text: "Hello! I'm your AI Assistant. You can ask me anything, use `/search` for web queries, `/imagine` to generate an image, or `/fetch` to create an image based on web results.",
      isLoading: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadAloudEnabled, setIsReadAloudEnabled] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenMessageId = useRef<string | null>(null);

  useEffect(() => {
    // If read-aloud is disabled, cancel any ongoing speech and do nothing else.
    if (!isReadAloudEnabled) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }
    
    // If speech is not supported, do nothing.
    if (!window.speechSynthesis) return;

    const lastMessage = messages[messages.length - 1];

    // Only speak for final bot messages that haven't been spoken yet.
    // This check prevents re-speaking on re-renders and fixes bugs in React's StrictMode.
    if (lastMessage?.sender === 'bot' && !lastMessage.isLoading && lastMessage.id !== lastSpokenMessageId.current) {
      let textToSpeak: string = '';
      
      if (lastMessage.isError) {
        textToSpeak = lastMessage.error || "An error occurred.";
      } else if (lastMessage.type === 'image' && !lastMessage.text) {
        textToSpeak = "Here is the image you requested.";
      } else if (lastMessage.text) {
        // Announce code blocks instead of reading them
        textToSpeak = lastMessage.text.replace(/```[\s\S]*?```/g, 'A code block is displayed.');
      }

      if (textToSpeak.trim()) {
        speakText(textToSpeak);
        lastSpokenMessageId.current = lastMessage.id; // Mark as spoken
      }
    }
  }, [messages, isReadAloudEnabled]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }
      
      // Ignore if modifier keys are pressed
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      // Ignore non-character keys (e.g., function keys, navigation keys)
      if (event.key.length > 1 && event.key !== 'Backspace' && event.key !== 'Delete') {
          return;
      }

      // If a "typable" key is pressed, focus the textarea
      textareaRef.current?.focus();
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []); // Empty dependency array to run only once on mount

  const handleSendMessage = useCallback(async (prompt: string, attachmentFile?: File) => {
    if ((!prompt.trim() && !attachmentFile) || isLoading) return;
    
    window.speechSynthesis.cancel();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      type: 'text',
      text: prompt,
      isLoading: false,
    };

    if (attachmentFile) {
        userMessage.attachment = {
            name: attachmentFile.name,
            type: attachmentFile.type,
            url: URL.createObjectURL(attachmentFile),
        };
    }
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const botMessageId = crypto.randomUUID();
    const lowerCasePrompt = prompt.trim().toLowerCase();
    
    let command = 'text';
    let commandArg = prompt;

    if (!attachmentFile) {
        if (lowerCasePrompt.startsWith('/imagine ')) {
            command = 'image';
            commandArg = prompt.substring(8).trim();
        } else if (lowerCasePrompt.startsWith('/search ')) {
            command = 'search';
            commandArg = prompt.substring(8).trim();
        } else if (lowerCasePrompt.startsWith('/fetch ')) {
            command = 'fetch';
            commandArg = prompt.substring(7).trim();
        }
    }
    
    const placeholderType = (command === 'image' || command === 'fetch') ? 'image' : 'text';
    
    setMessages(prev => [
      ...prev,
      {
        id: botMessageId,
        sender: 'bot',
        type: placeholderType,
        text: '',
        isLoading: true,
      },
    ]);

    try {
        switch (command) {
            case 'image': {
                const imageUrl = await generateImage(commandArg);
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId
                            ? { ...msg, type: 'image', imageUrl, isLoading: false }
                            : msg
                    )
                );
                break;
            }
            case 'fetch': {
                const { imagePrompt, sources } = await generateImagePromptWithSearch(commandArg);
                const imageUrl = await generateImage(imagePrompt);
                const fetchText = "I've generated this image for you based on my web search:";
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId
                            ? { ...msg, type: 'image', text: fetchText, imageUrl, groundingChunks: sources, isLoading: false }
                            : msg
                    )
                );
                break;
            }
            case 'search': {
                const stream = await generateTextWithSearchStream(commandArg);
                let allChunks: GroundingChunk[] = [];
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    const groundingChunks = (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || []) as GroundingChunk[];
                    allChunks = [...allChunks, ...groundingChunks];
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === botMessageId
                                ? { ...msg, text: (msg.text || '') + chunkText }
                                : msg
                        )
                    );
                }
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId
                            ? { ...msg, isLoading: false, groundingChunks: allChunks }
                            : msg
                    )
                );
                break;
            }
            default: { // text
                const stream = await generateTextStream(commandArg, attachmentFile);
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === botMessageId
                                ? { ...msg, text: (msg.text || '') + chunkText }
                                : msg
                        )
                    );
                }
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === botMessageId ? { ...msg, isLoading: false } : msg
                    )
                );
                break;
            }
        }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id !== botMessageId) return msg;
          
          if (placeholderType === 'image') {
            return {
              ...msg,
              isLoading: false,
              isError: true,
              error: `Sorry, I couldn't create that image. ${errorMessage}`,
            };
          }
          
          return {
            ...msg,
            type: 'text',
            text: `Sorry, I ran into an error: ${errorMessage}`,
            isLoading: false,
            isError: true,
          };
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
            <ChatInput ref={textareaRef} onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
