export type Sender = 'user' | 'bot';
export type MessageType = 'text' | 'image';

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface Message {
  id: string;
  sender: Sender;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  isLoading: boolean;
  isError?: boolean;
  error?: string;
  groundingChunks?: GroundingChunk[];
  attachment?: {
    name: string;
    type: string;
    url: string;
  };
}