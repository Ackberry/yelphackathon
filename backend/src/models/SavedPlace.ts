import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPlaceData {
  name: string;
  address: string;
  rating: number;
  categories: string[];
  photos: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ISearchContext {
  mood?: string;
  weather?: string;
  timeOfDay?: string;
  groupSize?: number;
  occasion?: string;
  searchQuery?: string;
}

export interface ISavedPlace extends Document {
  userId: Types.ObjectId;
  placeId: string;
  placeName: string;
  placeData: IPlaceData;
  contextNote: string;
  searchContext: ISearchContext;
  savedAt: Date;
  tags: string[];
}

const PlaceDataSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    rating: { type: Number, required: true },
    categories: [{ type: String }],
    photos: [{ type: String }],
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { _id: false }
);

const SearchContextSchema = new Schema(
  {
    mood: { type: String },
    weather: { type: String },
    timeOfDay: { type: String },
    groupSize: { type: Number },
    occasion: { type: String },
    searchQuery: { type: String },
  },
  { _id: false }
);

const SavedPlaceSchema = new Schema<ISavedPlace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    placeId: {
      type: String,
      required: true,
    },
    placeName: {
      type: String,
      required: true,
    },
    placeData: {
      type: PlaceDataSchema,
      required: true,
    },
    contextNote: {
      type: String,
      required: true,
    },
    searchContext: {
      type: SearchContextSchema,
      default: {},
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    tags: [{ type: String }],
  },
  {
    timestamps: false,
  }
);

// Indexes
SavedPlaceSchema.index({ userId: 1, savedAt: -1 });
SavedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });
SavedPlaceSchema.index({ 'searchContext.mood': 1 });
SavedPlaceSchema.index({ 'searchContext.occasion': 1 });

export const SavedPlace = mongoose.model<ISavedPlace>('SavedPlace', SavedPlaceSchema);
