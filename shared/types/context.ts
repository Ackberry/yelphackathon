export interface CurrentContext {
  time: TimeContext;
  weather?: WeatherContext;
  location: LocationContext;
}

export interface TimeContext {
  timestamp: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
}

export interface WeatherContext {
  condition: string;
  temperature: number;
  description: string;
}

export interface LocationContext {
  lat: number;
  lng: number;
  name?: string;
}
