export interface Place {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  categories: string[];
  photos: string[];
  coordinates: Coordinates;
  phone?: string;
  hours?: string;
  priceRange?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SavedPlace {
  _id: string;
  userId: string;
  placeId: string;
  placeName: string;
  placeData: Place;
  contextNote: string;
  searchContext: SearchContext;
  savedAt: Date;
  tags?: string[];
}

export interface SearchContext {
  mood?: string;
  weather?: string;
  timeOfDay?: string;
  groupSize?: number;
  occasion?: string;
  searchQuery?: string;
}
