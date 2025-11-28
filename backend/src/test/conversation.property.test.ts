import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { User } from '../models/User';
import { Conversation } from '../models/Conversation';

/**
 * Feature: mood-based-discovery, Property 24: Conversation persistence on logout
 * Validates: Requirements 11.1, 11.2
 * 
 * For any active conversation, logging out should save the conversation, 
 * and logging back in should restore it with all messages intact.
 */

// Arbitraries for generating test data
const messageArbitrary = fc.record({
  role: fc.constantFrom('user' as const, 'assistant' as const),
  content: fc.string({ minLength: 1, maxLength: 200 }),
  timestamp: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
  recommendations: fc.option(
    fc.array(
      fc.record({
        placeId: fc.string({ minLength: 1, maxLength: 20 }),
        placeName: fc.string({ minLength: 1, maxLength: 50 }),
        relevanceScore: fc.double({ min: 0, max: 1, noNaN: true }),
      }),
      { maxLength: 5 }
    ),
    { nil: undefined }
  ),
});

const contextArbitrary = fc.record({
  location: fc.option(
    fc.record({
      lat: fc.double({ min: -90, max: 90, noNaN: true }),
      lng: fc.double({ min: -180, max: 180, noNaN: true }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { nil: undefined }
  ),
  timeOfDay: fc.option(fc.constantFrom('morning', 'afternoon', 'evening', 'night'), { nil: undefined }),
  weather: fc.option(fc.constantFrom('sunny', 'rainy', 'cloudy', 'snowy'), { nil: undefined }),
  groupSize: fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }),
  occasion: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  mood: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
});

describe('Conversation Property Tests', () => {
  it('Property 24: Conversation persistence on logout - messages should persist across sessions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // clerkId
        fc.emailAddress(), // email
        fc.array(messageArbitrary, { minLength: 1, maxLength: 10 }), // messages
        contextArbitrary, // context
        async (clerkId, email, messages, context) => {
          // Make clerkId unique for this iteration
          const uniqueClerkId = `${clerkId}_${Date.now()}_${Math.random()}`;
          const uniqueEmail = `${Date.now()}_${Math.random()}_${email}`;
          
          // Create a user
          const user = await User.create({
            clerkId: uniqueClerkId,
            email: uniqueEmail,
            preferences: {},
          });

          // Session 1: User creates a conversation
          const sessionId1 = `session_${Date.now()}_${Math.random()}`;
          const conversation = await Conversation.create({
            userId: user._id,
            sessionId: sessionId1,
            messages,
            context,
            active: true,
          });

          // Simulate logout - conversation should be saved
          const savedConversation = await Conversation.findById(conversation._id);
          expect(savedConversation).toBeTruthy();
          expect(savedConversation?.messages).toHaveLength(messages.length);

          // Session 2: User logs back in and retrieves conversation
          const restoredConversation = await Conversation.findOne({
            userId: user._id,
            _id: conversation._id,
          });

          // Property: Conversation should be restored with all messages intact
          expect(restoredConversation).toBeTruthy();
          expect(restoredConversation?.messages).toHaveLength(messages.length);
          expect(restoredConversation?.sessionId).toBe(sessionId1);
          expect(restoredConversation?.active).toBe(true);

          // Verify each message is preserved
          messages.forEach((msg, index) => {
            expect(restoredConversation?.messages[index].role).toBe(msg.role);
            expect(restoredConversation?.messages[index].content).toBe(msg.content);
            
            if (msg.recommendations) {
              expect(restoredConversation?.messages[index].recommendations).toHaveLength(msg.recommendations.length);
            }
          });

          // Verify context is preserved
          if (context.location) {
            expect(restoredConversation?.context.location?.lat).toBe(context.location.lat);
            expect(restoredConversation?.context.location?.lng).toBe(context.location.lng);
          }
          if (context.timeOfDay) {
            expect(restoredConversation?.context.timeOfDay).toBe(context.timeOfDay);
          }
          if (context.groupSize) {
            expect(restoredConversation?.context.groupSize).toBe(context.groupSize);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 24 (edge case): Empty conversation should persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // clerkId
        fc.emailAddress(), // email
        async (clerkId, email) => {
          // Make clerkId unique for this iteration
          const uniqueClerkId = `${clerkId}_${Date.now()}_${Math.random()}`;
          const uniqueEmail = `${Date.now()}_${Math.random()}_${email}`;
          
          // Create a user
          const user = await User.create({
            clerkId: uniqueClerkId,
            email: uniqueEmail,
            preferences: {},
          });

          // Create conversation with no messages
          const sessionId = `session_${Date.now()}_${Math.random()}`;
          const conversation = await Conversation.create({
            userId: user._id,
            sessionId,
            messages: [],
            context: {},
            active: true,
          });

          // Retrieve conversation
          const restoredConversation = await Conversation.findById(conversation._id);

          // Property: Empty conversation should persist
          expect(restoredConversation).toBeTruthy();
          expect(restoredConversation?.messages).toHaveLength(0);
          expect(restoredConversation?.sessionId).toBe(sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 24 (isolation): Different users should have isolated conversations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }), // clerkId1
        fc.string({ minLength: 1, maxLength: 20 }), // clerkId2
        fc.emailAddress(), // email1
        fc.emailAddress(), // email2
        fc.array(messageArbitrary, { minLength: 1, maxLength: 5 }), // user1 messages
        fc.array(messageArbitrary, { minLength: 1, maxLength: 5 }), // user2 messages
        async (clerkId1, clerkId2, email1, email2, user1Messages, user2Messages) => {
          // Make clerkIds unique for this iteration
          const timestamp = Date.now();
          const random = Math.random();
          const uniqueClerkId1 = `${clerkId1}_${timestamp}_${random}_1`;
          const uniqueClerkId2 = `${clerkId2}_${timestamp}_${random}_2`;
          const uniqueEmail1 = `${timestamp}_${random}_1_${email1}`;
          const uniqueEmail2 = `${timestamp}_${random}_2_${email2}`;

          // Create two users
          const user1 = await User.create({
            clerkId: uniqueClerkId1,
            email: uniqueEmail1,
            preferences: {},
          });

          const user2 = await User.create({
            clerkId: uniqueClerkId2,
            email: uniqueEmail2,
            preferences: {},
          });

          // User 1 creates a conversation
          const session1 = `session_${Date.now()}_1_${Math.random()}`;
          await Conversation.create({
            userId: user1._id,
            sessionId: session1,
            messages: user1Messages,
            context: {},
            active: true,
          });

          // User 2 creates a conversation
          const session2 = `session_${Date.now()}_2_${Math.random()}`;
          await Conversation.create({
            userId: user2._id,
            sessionId: session2,
            messages: user2Messages,
            context: {},
            active: true,
          });

          // Retrieve conversations for each user
          const user1Conversations = await Conversation.find({ userId: user1._id });
          const user2Conversations = await Conversation.find({ userId: user2._id });

          // Property: Each user should only see their own conversations
          expect(user1Conversations).toHaveLength(1);
          expect(user2Conversations).toHaveLength(1);
          expect(user1Conversations[0].messages).toHaveLength(user1Messages.length);
          expect(user2Conversations[0].messages).toHaveLength(user2Messages.length);
          expect(user1Conversations[0].sessionId).toBe(session1);
          expect(user2Conversations[0].sessionId).toBe(session2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
