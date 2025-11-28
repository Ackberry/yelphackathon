import axios, { AxiosInstance, AxiosError } from 'axios';
import { Message, Recommendation } from '../../../shared/types/conversation';
import { Place, Coordinates } from '../../../shared/types/place';
import { ConversationContext } from '../../../shared/types/conversation';

interface YelpChatRequest {
  message: string;
  context?: {
    location?: { lat: number; lng: number };
    time_of_day?: string;
    weather?: string;
    group_size?: number;
    occasion?: string;
  };
  conversation_history?: Array<{ role: string; content: string }>;
}

interface YelpChatResponse {
  response: string;
  recommendations?: Array<{
    place_id: string;
    name: string;
    rating: number;
    coordinates: { lat: number; lng: number };
    relevance_score: number;
    reasoning?: string;
    address?: string;
    categories?: string[];
    photos?: string[];
    phone?: string;
    hours?: string;
    price_range?: string;
  }>;
}

interface YelpPlaceDetailsResponse {
  id: string;
  name: string;
  rating: number;
  coordinates: { latitude: number; longitude: number };
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  categories: Array<{ title: string }>;
  photos: string[];
  phone?: string;
  hours?: Array<{ open: Array<{ start: string; end: string; day: number }> }>;
  price?: string;
}

interface YelpSearchResponse {
  businesses: Array<{
    id: string;
    name: string;
    rating: number;
    coordinates: { latitude: number; longitude: number };
    location: {
      address1: string;
      city: string;
      state: string;
      zip_code: string;
    };
    categories: Array<{ title: string }>;
    image_url: string;
    phone?: string;
    price?: string;
  }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class YelpService {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry<any>>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(apiKey?: string) {
    const key = apiKey || process.env.YELP_API_KEY;
    
    if (!key) {
      throw new Error('Yelp API key is required');
    }

    this.client = axios.create({
      baseURL: 'https://api.yelp.com',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    this.cache = new Map();
  }

  /**
   * Send a chat message to Yelp AI Chat API with retry logic
   */
  async sendChatMessage(
    message: string,
    conversationHistory: Message[] = [],
    context?: ConversationContext
  ): Promise<{ response: string; recommendations: Recommendation[] }> {
    const cacheKey = this.generateCacheKey('chat', { message, context });
    const cached = this.getFromCache<{ response: string; recommendations: Recommendation[] }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const request: YelpChatRequest = {
      message,
      context: context ? this.formatContext(context) : undefined,
      conversation_history: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    };

    try {
      const response = await this.retryRequest<YelpChatResponse>(
        () => this.client.post('/v2/ai/chat', request),
        3
      );

      const result = {
        response: response.response,
        recommendations: this.parseRecommendations(response.recommendations || []),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      throw this.handleError(error, 'Failed to send chat message');
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<Place> {
    const cacheKey = this.generateCacheKey('place', { placeId });
    const cached = this.getFromCache<Place>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.retryRequest<YelpPlaceDetailsResponse>(
        () => this.client.get(`/v3/businesses/${placeId}`),
        3
      );

      const place = this.formatPlaceDetails(response);
      this.setCache(cacheKey, place);
      return place;
    } catch (error) {
      throw this.handleError(error, `Failed to get place details for ${placeId}`);
    }
  }

  /**
   * Search for places based on query and location
   */
  async searchPlaces(
    query: string,
    location: Coordinates,
    filters?: {
      categories?: string[];
      price?: string[];
      radius?: number;
      limit?: number;
    }
  ): Promise<Place[]> {
    const cacheKey = this.generateCacheKey('search', { query, location, filters });
    const cached = this.getFromCache<Place[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const params: any = {
        term: query,
        latitude: location.lat,
        longitude: location.lng,
        limit: filters?.limit || 20,
      };

      if (filters?.categories && filters.categories.length > 0) {
        params.categories = filters.categories.join(',');
      }

      if (filters?.price && filters.price.length > 0) {
        params.price = filters.price.join(',');
      }

      if (filters?.radius) {
        params.radius = filters.radius;
      }

      const response = await this.retryRequest<YelpSearchResponse>(
        () => this.client.get('/v3/businesses/search', { params }),
        3
      );

      const places = response.businesses.map(business => this.formatSearchResult(business));
      this.setCache(cacheKey, places);
      return places;
    } catch (error) {
      throw this.handleError(error, 'Failed to search places');
    }
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<{ data: T }>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await requestFn();
        return response.data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Format conversation context for Yelp API
   */
  private formatContext(context: ConversationContext): YelpChatRequest['context'] {
    return {
      location: context.location ? {
        lat: context.location.lat,
        lng: context.location.lng,
      } : undefined,
      time_of_day: context.timeOfDay,
      weather: context.weather,
      group_size: context.groupSize,
      occasion: context.occasion,
    };
  }

  /**
   * Parse recommendations from Yelp response
   */
  private parseRecommendations(
    recommendations: YelpChatResponse['recommendations']
  ): Recommendation[] {
    if (!recommendations) {
      return [];
    }

    return recommendations.map(rec => ({
      placeId: rec.place_id,
      placeName: rec.name,
      relevanceScore: rec.relevance_score,
      reasoning: rec.reasoning,
    }));
  }

  /**
   * Format place details from Yelp API response
   */
  private formatPlaceDetails(response: YelpPlaceDetailsResponse): Place {
    return {
      placeId: response.id,
      name: response.name,
      address: this.formatAddress(response.location),
      rating: response.rating,
      categories: response.categories.map(cat => cat.title),
      photos: response.photos || [],
      coordinates: {
        lat: response.coordinates.latitude,
        lng: response.coordinates.longitude,
      },
      phone: response.phone,
      hours: this.formatHours(response.hours),
      priceRange: response.price,
    };
  }

  /**
   * Format search result from Yelp API response
   */
  private formatSearchResult(business: YelpSearchResponse['businesses'][0]): Place {
    return {
      placeId: business.id,
      name: business.name,
      address: this.formatAddress(business.location),
      rating: business.rating,
      categories: business.categories.map(cat => cat.title),
      photos: business.image_url ? [business.image_url] : [],
      coordinates: {
        lat: business.coordinates.latitude,
        lng: business.coordinates.longitude,
      },
      phone: business.phone,
      priceRange: business.price,
    };
  }

  /**
   * Format address from Yelp location object
   */
  private formatAddress(location: { address1: string; city: string; state: string; zip_code: string }): string {
    return `${location.address1}, ${location.city}, ${location.state} ${location.zip_code}`;
  }

  /**
   * Format hours from Yelp hours array
   */
  private formatHours(hours?: YelpPlaceDetailsResponse['hours']): string | undefined {
    if (!hours || hours.length === 0) {
      return undefined;
    }

    // Simplified hours formatting - can be enhanced later
    return 'See Yelp for hours';
  }

  /**
   * Handle errors from Yelp API
   */
  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as any;

      if (status === 401) {
        return new Error('Yelp API authentication failed');
      } else if (status === 429) {
        return new Error('Yelp API rate limit exceeded');
      } else if (status && status >= 500) {
        return new Error(`Yelp API server error: ${message}`);
      } else if (data?.error) {
        return new Error(`Yelp API error: ${data.error.description || message}`);
      }
    }

    return new Error(message);
  }

  /**
   * Generate cache key from request parameters
   */
  private generateCacheKey(type: string, params: any): string {
    return `${type}:${JSON.stringify(params)}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache with timestamp
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export default YelpService;
