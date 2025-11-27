import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRecommendation {
  placeId: string;
  placeName: string;
  relevanceScore: number;
}

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendations?: IRecommendation[];
}

export interface IConversationContext {
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

export interface IConversation extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  messages: IMessage[];
  context: IConversationContext;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema(
  {
    placeId: { type: String, required: true },
    placeName: { type: String, required: true },
    relevanceScore: { type: Number, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    recommendations: [RecommendationSchema],
  },
  { _id: false }
);

const ConversationContextSchema = new Schema(
  {
    location: {
      lat: { type: Number },
      lng: { type: Number },
      name: { type: String },
    },
    timeOfDay: { type: String },
    weather: { type: String },
    groupSize: { type: Number },
    occasion: { type: String },
    mood: { type: String },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    messages: [MessageSchema],
    context: {
      type: ConversationContextSchema,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ConversationSchema.index({ userId: 1, active: 1 });
ConversationSchema.index({ sessionId: 1 });
ConversationSchema.index({ updatedAt: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
