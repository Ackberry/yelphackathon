import { Message } from '@shared/types/conversation';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`message-bubble ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-content">
        <p>{message.content}</p>
        
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="recommendations">
            <div className="recommendations-header">Recommendations:</div>
            {message.recommendations.map((rec, index) => (
              <div key={`${rec.placeId}-${index}`} className="recommendation-item">
                <span className="recommendation-name">{rec.placeName}</span>
                {rec.reasoning && (
                  <span className="recommendation-reasoning">{rec.reasoning}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="message-timestamp">{timeString}</div>
    </div>
  );
}
