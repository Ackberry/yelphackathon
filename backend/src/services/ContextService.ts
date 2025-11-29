import axios, { AxiosInstance } from 'axios';
import { CurrentContext, TimeContext, WeatherContext, LocationContext } from '../../../shared/types/context';
import { ConversationContext } from '../../../shared/types/conversation';
import { SearchContext } from '../../../shared/types/place';
import { Message } from '../../../shared/types/conversation';
import { Place } from '../../../shared/types/place';

interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number;
  };
}

export class ContextService {
  private weatherClient: AxiosInstance | null = null;
  private weatherApiKey: string | null = null;

  constructor(weatherApiKey?: string) {
    this.weatherApiKey = weatherApiKey || process.env.OPENWEATHER_API_KEY || null;
    
    if (this.weatherApiKey) {
      this.weatherClient = axios.create({
        baseURL: 'https://api.openweathermap.org/data/2.5',
        timeout: 5000, // 5 second timeout
      });
    }
  }

  /**
   * Get current context including time, location, and weather
   */
  async getCurrentContext(location: LocationContext): Promise<CurrentContext> {
    const time = this.getTimeContext();
    const weather = await this.getWeatherWithFallback(location);

    return {
      time,
      weather,
      location,
    };
  }

  /**
   * Get time context from current date/time
   */
  private getTimeContext(): TimeContext {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    let timeOfDay: TimeContext['timeOfDay'];
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }

    return {
      timestamp: now,
      timeOfDay,
      dayOfWeek,
    };
  }

  /**
   * Get weather data from OpenWeatherMap API with fallback
   */
  private async getWeatherWithFallback(location: LocationContext): Promise<WeatherContext | undefined> {
    if (!this.weatherClient || !this.weatherApiKey) {
      return undefined;
    }

    try {
      const response = await this.weatherClient.get<OpenWeatherResponse>('/weather', {
        params: {
          lat: location.lat,
          lon: location.lng,
          appid: this.weatherApiKey,
          units: 'imperial', // Fahrenheit
        },
      });

      return {
        condition: response.data.weather[0].main,
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
      };
    } catch (error) {
      // Log warning but continue without weather data
      console.warn('Weather API failed, continuing without weather context:', error);
      return undefined;
    }
  }

  /**
   * Generate a contextual note for a saved place
   */
  generateContextNote(searchContext: SearchContext, place: Place): string {
    const parts: string[] = [];

    // Add mood/vibe
    if (searchContext.mood) {
      parts.push(`when looking for ${searchContext.mood} vibes`);
    }

    // Add occasion
    if (searchContext.occasion) {
      parts.push(`for ${searchContext.occasion}`);
    }

    // Add group size
    if (searchContext.groupSize) {
      if (searchContext.groupSize === 1) {
        parts.push('solo');
      } else if (searchContext.groupSize === 2) {
        parts.push('for two');
      } else {
        parts.push(`for a group of ${searchContext.groupSize}`);
      }
    }

    // Add weather context
    if (searchContext.weather) {
      parts.push(`on a ${searchContext.weather.toLowerCase()} day`);
    }

    // Add time of day
    if (searchContext.timeOfDay) {
      parts.push(`during ${searchContext.timeOfDay}`);
    }

    // Add search query if available
    if (searchContext.searchQuery) {
      parts.push(`while searching for "${searchContext.searchQuery}"`);
    }

    // Construct the note
    if (parts.length === 0) {
      return `Saved ${place.name}`;
    }

    return `Saved ${place.name} ${parts.join(', ')}`;
  }

  /**
   * Extract context from conversation messages
   */
  extractContextFromConversation(messages: Message[]): Partial<ConversationContext> {
    const context: Partial<ConversationContext> = {};

    // Keywords for mood detection
    const moodKeywords: Record<string, string[]> = {
      romantic: ['romantic', 'date', 'intimate', 'cozy', 'candlelit'],
      casual: ['casual', 'relaxed', 'laid-back', 'chill'],
      energetic: ['energetic', 'lively', 'vibrant', 'bustling', 'busy'],
      quiet: ['quiet', 'peaceful', 'calm', 'serene', 'tranquil'],
      upscale: ['upscale', 'fancy', 'elegant', 'sophisticated', 'fine dining'],
    };

    // Keywords for occasion detection
    const occasionKeywords: Record<string, string[]> = {
      'date night': ['date', 'romantic dinner', 'anniversary'],
      'business meeting': ['business', 'meeting', 'professional', 'client'],
      'group hangout': ['friends', 'group', 'hangout', 'gathering'],
      'family dinner': ['family', 'kids', 'children'],
      'celebration': ['celebration', 'birthday', 'party', 'special occasion'],
    };

    // Group size patterns
    const groupSizePatterns = [
      /\b(\d+)\s+people\b/i,
      /\bgroup\s+of\s+(\d+)\b/i,
      /\bparty\s+of\s+(\d+)\b/i,
      /\b(\d+)\s+of\s+us\b/i,
      /\bfor\s+(\d+)\b/i,
      /\bjust\s+for\s+(\d+)\b/i,
    ];

    // Analyze user messages
    const userMessages = messages.filter(msg => msg.role === 'user');
    const conversationText = userMessages.map(msg => msg.content.toLowerCase()).join(' ');

    // Extract mood
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some(keyword => conversationText.includes(keyword))) {
        context.mood = mood;
        break;
      }
    }

    // Extract occasion
    for (const [occasion, keywords] of Object.entries(occasionKeywords)) {
      if (keywords.some(keyword => conversationText.includes(keyword))) {
        context.occasion = occasion;
        break;
      }
    }

    // Check for solo indicators first
    if (conversationText.includes('just me') || 
        conversationText.includes('by myself') || 
        conversationText.includes('solo') ||
        conversationText.includes('just for me')) {
      context.groupSize = 1;
    } else {
      // Extract group size from patterns
      for (const pattern of groupSizePatterns) {
        const match = conversationText.match(pattern);
        if (match && match[1]) {
          const size = parseInt(match[1], 10);
          if (size > 0 && size <= 100) {
            context.groupSize = size;
            break;
          }
        }
      }
    }

    return context;
  }
}

export default ContextService;
