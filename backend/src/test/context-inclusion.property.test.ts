import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import axios from 'axios';
import { YelpService } from '../services/YelpService';
import { ContextService } from '../services/ContextService';
import { ConversationContext } from '../../../shared/types/conversation';
import { LocationContext } from '../../../shared/types/context';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

/**
 * Feature: mood-based-discovery, Property 6: Context inclusion in API calls
 * Validates: Requirements 4.1, 6.1, 6.2
 * 
 * For any user message requesting recommendations, the API call to Yelp should 
 * include all available context data (time of day, weather, group size, occasion, location).
 */

describe('Context Inclusion Property Tests', () => {
  let yelpService: YelpService;
  let contextService: ContextService;
  let mockPost: any;
  let mockGet: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock axios instance for YelpService
    mockPost = vi.fn();
    mockGet = vi.fn();

    mockedAxios.create = vi.fn((config) => {
      // Return different mocks based on baseURL
      if (config?.baseURL?.includes('openweathermap')) {
        return {
          get: mockGet,
        };
      }
      return {
        post: mockPost,
        get: mockGet,
      };
    });

    // Create services
    yelpService = new YelpService('test-api-key');
    contextService = new ContextService('test-weather-key');
  });

  it('Property 6: API calls should include all available context fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }), // User message
        fc.record({
          location: fc.record({
            lat: fc.double({ min: -90, max: 90, noNaN: true }),
            lng: fc.double({ min: -180, max: 180, noNaN: true }),
            name: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          timeOfDay: fc.constantFrom('morning', 'afternoon', 'evening', 'night'),
          weather: fc.string({ minLength: 1, maxLength: 50 }),
          groupSize: fc.integer({ min: 1, max: 20 }),
          occasion: fc.string({ minLength: 1, maxLength: 100 }),
          mood: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (message, context) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          // Mock successful API response
          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          // Send message with full context
          await yelpService.sendChatMessage(message, [], context as ConversationContext);

          // Property: All context fields should be included in the API call
          expect(mockPost).toHaveBeenCalledTimes(1);
          const callArgs = mockPost.mock.calls[0];
          expect(callArgs[0]).toBe('/v2/ai/chat');
          
          const requestBody = callArgs[1];
          expect(requestBody).toHaveProperty('message', message);
          expect(requestBody).toHaveProperty('context');
          
          const sentContext = requestBody.context;
          
          // Verify all context fields are present
          if (context.location) {
            expect(sentContext).toHaveProperty('location');
            expect(sentContext.location).toHaveProperty('lat', context.location.lat);
            expect(sentContext.location).toHaveProperty('lng', context.location.lng);
          }
          
          if (context.timeOfDay) {
            expect(sentContext).toHaveProperty('time_of_day', context.timeOfDay);
          }
          
          if (context.weather) {
            expect(sentContext).toHaveProperty('weather', context.weather);
          }
          
          if (context.groupSize) {
            expect(sentContext).toHaveProperty('group_size', context.groupSize);
          }
          
          if (context.occasion) {
            expect(sentContext).toHaveProperty('occasion', context.occasion);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Time of day context should always be included when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.constantFrom('morning', 'afternoon', 'evening', 'night'),
        async (message, timeOfDay) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          const context: ConversationContext = { timeOfDay };
          await yelpService.sendChatMessage(message, [], context);

          // Property: Time of day should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody.context).toHaveProperty('time_of_day', timeOfDay);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Weather context should be included when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (message, weather) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          const context: ConversationContext = { weather };
          await yelpService.sendChatMessage(message, [], context);

          // Property: Weather should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody.context).toHaveProperty('weather', weather);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Group size context should be included when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.integer({ min: 1, max: 20 }),
        async (message, groupSize) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          const context: ConversationContext = { groupSize };
          await yelpService.sendChatMessage(message, [], context);

          // Property: Group size should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody.context).toHaveProperty('group_size', groupSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Occasion context should be included when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message, occasion) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          const context: ConversationContext = { occasion };
          await yelpService.sendChatMessage(message, [], context);

          // Property: Occasion should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody.context).toHaveProperty('occasion', occasion);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Location context should be included when available', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          lat: fc.double({ min: -90, max: 90, noNaN: true }),
          lng: fc.double({ min: -180, max: 180, noNaN: true }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (message, location) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          const context: ConversationContext = { location };
          await yelpService.sendChatMessage(message, [], context);

          // Property: Location should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody.context).toHaveProperty('location');
          expect(requestBody.context.location).toHaveProperty('lat', location.lat);
          expect(requestBody.context.location).toHaveProperty('lng', location.lng);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Partial context should include only available fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          timeOfDay: fc.option(fc.constantFrom('morning', 'afternoon', 'evening', 'night'), { nil: undefined }),
          weather: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          groupSize: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
          occasion: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (message, partialContext) => {
          // Reset mock and cache
          mockPost.mockClear();
          yelpService.clearCache();

          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          await yelpService.sendChatMessage(message, [], partialContext as ConversationContext);

          // Property: Only defined fields should be in the API call
          const requestBody = mockPost.mock.calls[0][1];
          
          if (partialContext.timeOfDay !== undefined) {
            expect(requestBody.context).toHaveProperty('time_of_day', partialContext.timeOfDay);
          }
          
          if (partialContext.weather !== undefined) {
            expect(requestBody.context).toHaveProperty('weather', partialContext.weather);
          }
          
          if (partialContext.groupSize !== undefined) {
            expect(requestBody.context).toHaveProperty('group_size', partialContext.groupSize);
          }
          
          if (partialContext.occasion !== undefined) {
            expect(requestBody.context).toHaveProperty('occasion', partialContext.occasion);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6: Context from getCurrentContext should be compatible with Yelp API', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.record({
          lat: fc.double({ min: -90, max: 90, noNaN: true }),
          lng: fc.double({ min: -180, max: 180, noNaN: true }),
          name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (message, location) => {
          // Reset mocks and cache
          mockPost.mockClear();
          mockGet.mockClear();
          yelpService.clearCache();

          // Mock weather API response (may or may not be called)
          mockGet.mockResolvedValueOnce({
            data: {
              weather: [{ main: 'Clear', description: 'clear sky' }],
              main: { temp: 72 },
            },
          });

          // Mock Yelp API response
          mockPost.mockResolvedValueOnce({
            data: {
              response: 'AI response',
              recommendations: [],
            },
          });

          // Get current context
          const currentContext = await contextService.getCurrentContext(location as LocationContext);

          // Build conversation context from current context
          const conversationContext: ConversationContext = {
            location: {
              lat: currentContext.location.lat,
              lng: currentContext.location.lng,
              name: currentContext.location.name || 'Unknown',
            },
            timeOfDay: currentContext.time.timeOfDay,
            weather: currentContext.weather?.description,
          };

          // Send message with context
          await yelpService.sendChatMessage(message, [], conversationContext);

          // Property: Context should be properly formatted for Yelp API
          expect(mockPost).toHaveBeenCalledTimes(1);
          const requestBody = mockPost.mock.calls[0][1];
          expect(requestBody).toHaveProperty('context');
          
          // Verify time of day is included
          expect(requestBody.context).toHaveProperty('time_of_day');
          expect(['morning', 'afternoon', 'evening', 'night']).toContain(requestBody.context.time_of_day);
          
          // Verify location is included
          expect(requestBody.context).toHaveProperty('location');
          expect(requestBody.context.location).toHaveProperty('lat', location.lat);
          expect(requestBody.context.location).toHaveProperty('lng', location.lng);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6 (edge case): Empty context object should not prevent API call', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        response: 'AI response',
        recommendations: [],
      },
    });

    await yelpService.sendChatMessage('test message', [], {});

    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('Property 6 (edge case): Context with only location should be valid', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        response: 'AI response',
        recommendations: [],
      },
    });

    const context: ConversationContext = {
      location: { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
    };

    await yelpService.sendChatMessage('test message', [], context);

    const requestBody = mockPost.mock.calls[0][1];
    expect(requestBody.context).toHaveProperty('location');
    expect(requestBody.context.location.lat).toBe(37.7749);
    expect(requestBody.context.location.lng).toBe(-122.4194);
  });

  it('Property 6 (edge case): Multiple context fields should all be preserved', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        response: 'AI response',
        recommendations: [],
      },
    });

    const context: ConversationContext = {
      location: { lat: 40.7128, lng: -74.0060, name: 'New York' },
      timeOfDay: 'evening',
      weather: 'Rainy',
      groupSize: 4,
      occasion: 'birthday celebration',
      mood: 'festive',
    };

    await yelpService.sendChatMessage('test message', [], context);

    const requestBody = mockPost.mock.calls[0][1];
    expect(requestBody.context.location.lat).toBe(40.7128);
    expect(requestBody.context.location.lng).toBe(-74.0060);
    expect(requestBody.context.time_of_day).toBe('evening');
    expect(requestBody.context.weather).toBe('Rainy');
    expect(requestBody.context.group_size).toBe(4);
    expect(requestBody.context.occasion).toBe('birthday celebration');
  });
});
