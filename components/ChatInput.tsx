import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { SendIcon, PaperclipIcon, MicrophoneIcon } from './Icons';

// Type definitions for the Web Speech API to fix TypeScript errors.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  onend: (this: SpeechRecognition, ev: Event) => any;
  onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string, attachment?: File) => void;
  isLoading: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ onSendMessage, isLoading }, ref) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [placeholder, setPlaceholder] = useState({
    text: "Type a message, or hold the mic to speak.",
    isError: false,
  });
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const placeholderTimeoutRef = useRef<number | null>(null);

  const resetPlaceholder = useCallback(() => {
    if (placeholderTimeoutRef.current) {
      clearTimeout(placeholderTimeoutRef.current);
    }
    setPlaceholder({ text: "Type a message, or hold the mic to speak.", isError: false });
  }, []);

  const submitMessage = useCallback((message: string, file?: File) => {
    if ((message.trim() || file) && !isLoading) {
        onSendMessage(message, file || undefined);
        setInput('');
        setAttachment(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isLoading, onSendMessage]);


  useEffect(() => {
    return () => {
      if (placeholderTimeoutRef.current) {
        clearTimeout(placeholderTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const textarea = internalTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported by this browser.");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      resetPlaceholder();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech Recognition Error:", event.error);
      let message = "Sorry, a speech recognition error occurred.";
      if (event.error === 'no-speech') {
        message = "I didn't catch that. Please try again.";
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        message = "Microphone access denied. Please enable it in browser settings.";
      }
      
      setPlaceholder({ text: message, isError: true });

      if (placeholderTimeoutRef.current) clearTimeout(placeholderTimeoutRef.current);
      placeholderTimeoutRef.current = window.setTimeout(resetPlaceholder, 5000);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [resetPlaceholder]);

  const handleMicDown = () => {
    if (isLoading || isListening) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    resetPlaceholder();
    setInput('');
    setPlaceholder({ text: "Listening...", isError: false });
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("Error starting speech recognition:", e);
      setPlaceholder({text: "Could not start listening.", isError: true});
    }
  };

  const handleMicUp = () => {
    if (!isListening) return;
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input, attachment || undefined);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  return (
    <div>
        {attachment && (
            <div className="bg-gray-700/50 p-2 rounded-t-lg flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate px-2">{attachment.name}</span>
                <button 
                    onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-gray-400 hover:text-white font-bold text-lg leading-none p-1">&times;</button>
            </div>
        )}
        <form
            onSubmit={handleSubmit}
            className={`flex items-end space-x-2 bg-gray-800 border border-gray-700 p-2 ${attachment ? 'rounded-b-xl' : 'rounded-xl'}`}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,text/*,application/pdf,audio/*,video/*"
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isListening}
                className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors p-2"
                aria-label="Attach file"
            >
                <PaperclipIcon />
            </button>
            <button
                type="button"
                onMouseDown={handleMicDown}
                onMouseUp={handleMicUp}
                onTouchStart={handleMicDown}
                onTouchEnd={handleMicUp}
                onMouseLeave={handleMicUp}
                disabled={isLoading}
                className={`p-2 transition-colors disabled:opacity-50 select-none ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
                aria-label={isListening ? 'Release to stop' : 'Hold to speak'}
            >
                <MicrophoneIcon />
            </button>
            <textarea
                ref={(node) => {
                    // Assign to the internal ref used by the component's effects
                    (internalTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                    
                    // Assign to the forwarded ref passed from the parent
                    if (typeof ref === 'function') {
                        ref(node);
                    } else if (ref) {
                        ref.current = node;
                    }
                }}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder.text}
                disabled={isLoading}
                className={`flex-1 bg-transparent resize-none outline-none px-2 py-2 text-white disabled:opacity-50 max-h-48 ${placeholder.isError ? 'placeholder-red-400' : 'placeholder-gray-500'}`}
                style={{ scrollbarWidth: 'none' }}
            />
            <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachment)}
                className="bg-gray-700 text-white rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0 hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                aria-label="Send message"
            >
                <SendIcon />
            </button>
        </form>
    </div>
  );
});

export default ChatInput;