export interface Conversation {
  _id: string;
  userId: string;
  sessionId: string;
  messages: Message[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: Recommendation[];
}

export interface Recommendation {
  placeId: string;
  placeName: string;
  relevanceScore: number;
  reasoning?: string;
}

export interface ConversationContext {
  location?: {
    lat: number;
    lng: number;
    name: string;
  };
  timeOfDay?: string;
  weather?: string;
  groupSize?: number;
  occasion?: string;
  mood?: string;
}

export interface Session {
  _id: string;
  userId: string;
  sessionId: string;
  conversationId: string;
  lastActivity: Date;
  expiresAt: Date;
}
