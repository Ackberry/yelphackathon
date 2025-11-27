export interface User {
  _id: string;
  clerkId: string;
  email: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultLocation?: {
    lat: number;
    lng: number;
    name: string;
  };
  favoriteCategories?: string[];
  dietaryRestrictions?: string[];
}
