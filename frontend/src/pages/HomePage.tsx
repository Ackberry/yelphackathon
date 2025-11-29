import { useUser, UserButton } from '@clerk/clerk-react';
import { useState } from 'react';
import Map from '../components/map/Map';
import ChatInterface from '../components/chat/ChatInterface';
import { MarkerData } from '../types/map';
import { Coordinates } from '@shared/types/place';
import { Message } from '@shared/types/conversation';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkerClick = (markerId: string) => {
    console.log('Marker clicked:', markerId);
  };

  const handleMapClick = (location: Coordinates) => {
    console.log('Map clicked at:', location);
  };

  const handleMapPan = (center: Coordinates) => {
    console.log('Map panned to:', center);
  };

  const handleMapZoom = (zoom: number) => {
    console.log('Map zoom changed to:', zoom);
  };

  const handleSendMessage = (messageText: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response (in real implementation, this would call the backend API)
    setTimeout(() => {
      const aiMessage: Message = {
        role: 'assistant',
        content: `I understand you're looking for: ${messageText}. Here are some recommendations based on your preferences.`,
        timestamp: new Date(),
        recommendations: [
          {
            placeId: 'demo-1',
            placeName: 'Sample Restaurant',
            relevanceScore: 0.95,
            reasoning: 'Great atmosphere and matches your mood',
          },
          {
            placeId: 'demo-2',
            placeName: 'Cozy Cafe',
            relevanceScore: 0.88,
            reasoning: 'Perfect for a relaxed vibe',
          },
        ],
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="header" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0 }}>Mood-Based Discovery</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            onMapPan={handleMapPan}
            onMapZoom={handleMapZoom}
          />
        </div>
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
