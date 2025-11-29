import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextService } from '../services/ContextService';
import { Message } from '../../../shared/types/conversation';
import { Place } from '../../../shared/types/place';
import { SearchContext } from '../../../shared/types/place';

describe('ContextService', () => {
  let contextService: ContextService;

  beforeEach(() => {
    contextService = new ContextService();
  });

  describe('getCurrentContext', () => {
    it('should return context with time and location', async () => {
      const location = { lat: 37.7749, lng: -122.4194, name: 'San Francisco' };
      
      const context = await contextService.getCurrentContext(location);
      
      expect(context).toHaveProperty('time');
      expect(context).toHaveProperty('location');
      expect(context.time).toHaveProperty('timestamp');
      expect(context.time).toHaveProperty('timeOfDay');
      expect(context.time).toHaveProperty('dayOfWeek');
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(context.time.timeOfDay);
      expect(context.location).toEqual(location);
    });

    it('should handle missing weather API gracefully', async () => {
      const location = { lat: 37.7749, lng: -122.4194, name: 'San Francisco' };
      
      const context = await contextService.getCurrentContext(location);
      
      // Weather should be undefined when API key is not provided
      expect(context.weather).toBeUndefined();
    });
  });

  describe('generateContextNote', () => {
    const place: Place = {
      placeId: 'test-place',
      name: 'Test Restaurant',
      address: '123 Main St',
      rating: 4.5,
      categories: ['Restaurant'],
      photos: [],
      coordinates: { lat: 37.7749, lng: -122.4194 },
    };

    it('should generate note with mood', () => {
      const searchContext: SearchContext = {
        mood: 'romantic',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('romantic vibes');
      expect(note).toContain('Test Restaurant');
    });

    it('should generate note with occasion', () => {
      const searchContext: SearchContext = {
        occasion: 'date night',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('date night');
    });

    it('should generate note with group size', () => {
      const searchContext: SearchContext = {
        groupSize: 4,
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('group of 4');
    });

    it('should handle solo group size', () => {
      const searchContext: SearchContext = {
        groupSize: 1,
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('solo');
    });

    it('should handle group size of 2', () => {
      const searchContext: SearchContext = {
        groupSize: 2,
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('for two');
    });

    it('should generate note with weather', () => {
      const searchContext: SearchContext = {
        weather: 'Rainy',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('rainy day');
    });

    it('should generate note with time of day', () => {
      const searchContext: SearchContext = {
        timeOfDay: 'evening',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('during evening');
    });

    it('should generate note with search query', () => {
      const searchContext: SearchContext = {
        searchQuery: 'italian food',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('italian food');
    });

    it('should combine multiple context elements', () => {
      const searchContext: SearchContext = {
        mood: 'cozy',
        occasion: 'date night',
        groupSize: 2,
        weather: 'Rainy',
        timeOfDay: 'evening',
      };
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toContain('cozy vibes');
      expect(note).toContain('date night');
      expect(note).toContain('for two');
      expect(note).toContain('rainy day');
      expect(note).toContain('during evening');
    });

    it('should handle empty context', () => {
      const searchContext: SearchContext = {};
      
      const note = contextService.generateContextNote(searchContext, place);
      
      expect(note).toBe('Saved Test Restaurant');
    });
  });

  describe('extractContextFromConversation', () => {
    it('should extract mood from conversation', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Looking for a romantic dinner spot', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.mood).toBe('romantic');
    });

    it('should extract occasion from conversation', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Need a place for a business meeting', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.occasion).toBe('business meeting');
    });

    it('should extract group size from conversation', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Looking for a restaurant for 6 people', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.groupSize).toBe(6);
    });

    it('should extract group size from "group of" pattern', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Need a place for a group of 8', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.groupSize).toBe(8);
    });

    it('should extract group size from "party of" pattern', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Reservation for a party of 4', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.groupSize).toBe(4);
    });

    it('should detect solo dining', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Looking for a place just for me', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.groupSize).toBe(1);
    });

    it('should extract multiple context elements', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Looking for a romantic dinner for 2 people', timestamp: new Date() },
        { role: 'assistant', content: 'I can help with that!', timestamp: new Date() },
        { role: 'user', content: 'Something fancy for a date', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context.mood).toBe('romantic');
      expect(context.groupSize).toBe(2);
      expect(context.occasion).toBe('date night');
    });

    it('should only analyze user messages', () => {
      const messages: Message[] = [
        { role: 'assistant', content: 'Looking for a romantic dinner for 6 people', timestamp: new Date() },
        { role: 'user', content: 'Actually just for 2', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      // Should extract from user message, not assistant
      expect(context.groupSize).toBe(2);
    });

    it('should return empty context when no patterns match', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Hello', timestamp: new Date() },
      ];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context).toEqual({});
    });

    it('should handle empty message array', () => {
      const messages: Message[] = [];
      
      const context = contextService.extractContextFromConversation(messages);
      
      expect(context).toEqual({});
    });
  });
});
