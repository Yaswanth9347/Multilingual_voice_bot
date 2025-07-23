import React, { useState } from 'react';
import { Message as MessageType } from '../types';
import { UserIcon, CopilotIcon, LinkIcon, DownloadIcon, CopyIcon, BrokenImageIcon, FileIcon } from './Icons';

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
    // Regex to split by ``` but keep the delimiters
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      // Check if the part is a code block
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
  const [isImgCopied, setIsImgCopied] = useState(false);

  const handleCopyImage = async (imageUrl: string) => {
    if (!navigator.clipboard) {
      alert("Your browser doesn't support copying images to the clipboard.");
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setIsImgCopied(true);
      setTimeout(() => setIsImgCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Could not copy image to clipboard.');
    }
  };

  const hasImage = message.type === 'image' && !message.isLoading && !message.isError && message.imageUrl;
  const hasImageError = message.type === 'image' && message.isError;
  const hasSources = message.groundingChunks && message.groundingChunks.length > 0;
  const hasAttachment = isUser && message.attachment;

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
              
              {message.isError && message.type !== 'image' && (
                  <p className="text-red-400 whitespace-pre-wrap text-left">{message.text || message.error}</p>
              )}

              {hasAttachment && (
                  <div className="border border-gray-700 rounded-lg p-2 max-w-xs bg-gray-800/50">
                      {message.attachment!.type.startsWith('image/') ? (
                          <img src={message.attachment!.url} alt={message.attachment!.name} className="rounded-md max-h-48 w-auto" />
                      ) : (
                          <div className="flex items-center gap-3 text-gray-400 p-2 text-left">
                              <FileIcon />
                              <span className="truncate text-sm">{message.attachment!.name}</span>
                          </div>
                      )}
                  </div>
              )}

              {hasImage && (
                <div className="group relative max-w-sm">
                  <img src={message.imageUrl!} alt="Generated content" className="rounded-lg bg-gray-800" />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a href={message.imageUrl!} download={`gemini-generated-image-${message.id}.jpeg`} className="bg-gray-900/70 p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors" aria-label="Download image">
                      <DownloadIcon />
                    </a>
                    <button onClick={() => handleCopyImage(message.imageUrl!)} disabled={isImgCopied} className="bg-gray-900/70 p-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50" aria-label="Copy image">
                      <CopyIcon />
                    </button>
                  </div>
                   {isImgCopied && <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md transition-opacity">Copied!</div>}
                </div>
              )}

              {hasImageError && (
                <div className="flex items-center gap-3 text-red-400 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <BrokenImageIcon />
                  <p className="whitespace-pre-wrap text-left">{message.error}</p>
                </div>
              )}

              {hasSources && (
                <div className={`w-full ${isUser ? 'text-right' : 'text-left'}`}>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources</h4>
                  <div className={`flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {message.groundingChunks?.map((chunk, index) => (
                      <a key={index} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline ${isUser ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-shrink-0"><LinkIcon /></div>
                        <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;