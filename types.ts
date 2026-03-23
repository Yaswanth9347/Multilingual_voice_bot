export type Sender = 'user' | 'bot';

export interface Message {
  id: string;
  sender: Sender;
  type: 'text';
  text?: string;
  isLoading: boolean;
  isError?: boolean;
  error?: string;
  attachment?: {
    name: string;
    type: string;
    url: string;
  };
}