import React, { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { SendIcon, MicrophoneIcon } from './Icons';

// --- Web Speech API type declarations ---
interface SpeechRecognitionErrorEvent extends Event { readonly error: string; }
interface SpeechRecognitionAlternative { readonly transcript: string; }
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
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
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => any) | null;
  onend: ((ev: Event) => any) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => any) | null;
  onstart: ((ev: Event) => any) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ onSendMessage, isLoading }, ref) => {
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [statusError, setStatusError] = useState(false);

    const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const shouldRestartRef = useRef(false);
    const statusTimeoutRef = useRef<number | null>(null);

    const clearStatus = useCallback(() => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      setStatusMsg('');
      setStatusError(false);
    }, []);

    const setTempError = useCallback((msg: string) => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      setStatusMsg(msg);
      setStatusError(true);
      statusTimeoutRef.current = window.setTimeout(clearStatus, 5000);
    }, [clearStatus]);

    // Auto-resize textarea
    useEffect(() => {
      const ta = internalTextareaRef.current;
      if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
    }, [input]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        shouldRestartRef.current = false;
        recognitionRef.current?.abort();
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      };
    }, []);

    const startListening = useCallback(() => {
      const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechAPI) {
        setTempError('Speech recognition not supported. Please use Chrome or Edge.');
        return;
      }

      // Null FIRST before aborting, so the old instance's onend doesn't trigger a restart
      if (recognitionRef.current) {
        const old = recognitionRef.current;
        recognitionRef.current = null;
        old.abort();
      }

      const rec = new SpeechAPI();
      // Empty lang = browser auto-detect (works best in Chrome)
      rec.lang = '';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let finalTranscript = '';

      rec.onstart = () => {
        console.log('[ASR] Started (auto-detect language)');
        finalTranscript = '';
        setInput('');
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interim += res[0].transcript;
          }
        }
        setInput(finalTranscript + interim);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted') return; // Intentional stop — ignore
        console.error('[ASR] Error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setTempError('Microphone access denied. Please allow it in browser settings.');
          shouldRestartRef.current = false;
          setIsListening(false);
        } else if (event.error === 'network') {
          setTempError('Network error in speech recognition.');
          shouldRestartRef.current = false;
          setIsListening(false);
        }
        // For 'no-speech' and others: let onend handle the restart
      };

      rec.onend = () => {
        // CRITICAL: null BEFORE scheduling restart to prevent abort-loop
        recognitionRef.current = null;
        if (shouldRestartRef.current) {
          setTimeout(() => {
            if (shouldRestartRef.current) startListening();
          }, 300);
        } else {
          setIsListening(false);
          clearStatus();
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (e) {
        console.error('[ASR] start() failed:', e);
        recognitionRef.current = null;
        setTempError('Could not start microphone. Try again.');
        shouldRestartRef.current = false;
        setIsListening(false);
      }
    }, [setTempError, clearStatus]);

    const stopListening = useCallback(() => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        const old = recognitionRef.current;
        recognitionRef.current = null;
        old.stop();
      }
      setIsListening(false);
      clearStatus();
    }, [clearStatus]);

    const handleMicToggle = () => {
      if (isLoading) return;
      if (isListening) {
        stopListening();
      } else {
        shouldRestartRef.current = true;
        setIsListening(true);
        clearStatus();
        startListening();
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isListening) stopListening();
      if (input.trim() && !isLoading) {
        onSendMessage(input);
        setInput('');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    const placeholder = isListening
      ? '🎤 Listening… speak in any language'
      : (statusMsg || 'Type or speak in any language…');

    return (
      <div>
        <form
          onSubmit={handleSubmit}
          className="flex items-end space-x-2 bg-gray-800 border border-gray-700 p-2 rounded-xl"
        >
          {/* Mic button */}
          <button
            type="button"
            onClick={handleMicToggle}
            disabled={isLoading}
            title={isListening ? 'Click to stop' : 'Click to speak (auto-detects language)'}
            className={`flex-shrink-0 p-2 rounded-lg transition-all select-none disabled:opacity-50 ${
              isListening
                ? 'text-red-400 bg-red-500/20 animate-pulse ring-1 ring-red-500/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <MicrophoneIcon />
          </button>

          {/* Text input */}
          <textarea
            ref={(node) => {
              (internalTextareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={`flex-1 bg-transparent resize-none outline-none px-2 py-2 text-white disabled:opacity-50 max-h-48 ${
              statusError ? 'placeholder-red-400' : 'placeholder-gray-500'
            }`}
            style={{ scrollbarWidth: 'none' }}
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 bg-gray-700 text-white rounded-lg w-9 h-9 flex items-center justify-center hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    );
  }
);

export default ChatInput;