import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
export async function connectDatabase(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(mongoUri);

    console.log('✓ Connected to MongoDB');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
}
