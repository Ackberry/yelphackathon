import { Message, Recommendation, ConversationContext } from './conversation';
import { Place, SavedPlace } from './place';
import { User, UserPreferences } from './user';
import { CurrentContext } from './context';

// Chat API types
export interface ChatMessageRequest {
  message: string;
  sessionId?: string;
  context?: Partial<ConversationContext>;
}

export interface ChatMessageResponse {
  response: string;
  recommendations: Recommendation[];
  sessionId: string;
}

export interface ChatHistoryResponse {
  messages: Message[];
  context: ConversationContext;
}

// Place API types
export interface PlaceSearchRequest {
  location: { lat: number; lng: number };
  query: string;
  filters?: PlaceFilters;
}

export interface PlaceFilters {
  priceRange?: string;
  categories?: string[];
  radius?: number;
}

export interface PlaceSearchResponse {
  places: Place[];
}

export interface SavePlaceRequest {
  placeId: string;
  context: Partial<ConversationContext>;
  note?: string;
}

export interface SavedPlacesResponse {
  savedPlaces: SavedPlace[];
}

// User API types
export interface UserProfileResponse {
  user: User;
}

export interface UpdatePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

// Context API types
export interface ContextRequest {
  lat: number;
  lng: number;
}

export interface ContextResponse {
  context: CurrentContext;
}

// Error response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
