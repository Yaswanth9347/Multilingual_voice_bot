import React, { useState } from 'react';
import { Message as MessageType } from '../types';
import { UserIcon, CopilotIcon, CopyIcon } from './Icons';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg w-full text-left">
      <div className="flex justify-between items-center px-4 py-1.5 text-xs text-gray-400 border-b border-gray-700/80">
        <span>{language || 'code'}</span>
        <button onClick={handleCopyCode} className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-50" disabled={isCopied}>
          <CopyIcon />
          {isCopied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto bg-black/30 rounded-b-lg">
        <code className={`language-${language} whitespace-pre-wrap`}>{code}</code>
      </pre>
    </div>
  );
};


const renderContent = (text: string, isUser: boolean) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      const codeBlockMatch = part.match(/^```(\w*)\n([\s\S]*?)```$/);
      if (codeBlockMatch) {
        const language = codeBlockMatch[1] || undefined;
        const code = codeBlockMatch[2].trim();
        return <CodeBlock key={index} language={language} code={code} />;
      } else if (part.trim()) {
        return <p key={index} className={`whitespace-pre-wrap leading-relaxed ${isUser ? 'text-right' : 'text-left'}`}>{part}</p>;
      }
      return null;
    });
};

interface MessageProps {
  message: MessageType;
}

const LoadingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
  </div>
);

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-4 max-w-2xl ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600/30' : 'bg-gray-700'}`}>
        {isUser ? <UserIcon /> : <CopilotIcon />}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-gray-200 mb-2 ${isUser ? 'text-right' : 'text-left'}`}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>
        <div className={`flex flex-col space-y-4 ${isUser ? 'items-end' : 'items-start'}`}>
          {message.isLoading ? (
            <LoadingIndicator />
          ) : (
            <>
              {message.text && renderContent(message.text, isUser)}
              
              {message.isError && (
                  <p className="text-red-400 whitespace-pre-wrap text-left">{message.text || message.error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;