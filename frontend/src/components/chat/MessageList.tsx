import { Message } from '@shared/types/conversation';
import MessageBubble from './MessageBubble';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <p>Start a conversation to discover places!</p>
          <p className="empty-hint">Try asking about restaurants, cafes, or describe your mood.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.timestamp}-${index}`}
          message={message}
        />
      ))}
    </div>
  );
}
