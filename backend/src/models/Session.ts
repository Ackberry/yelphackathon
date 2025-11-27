import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  conversationId: Types.ObjectId;
  lastActivity: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
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
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
SessionSchema.index({ userId: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const Session = mongoose.model<ISession>('Session', SessionSchema);
