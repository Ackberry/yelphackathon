import { Coordinates } from '@shared/types/place';

export interface MapConfig {
  center: Coordinates;
  zoom: number;
}

export interface MarkerData {
  id: string;
  position: Coordinates;
  title: string;
  isRecommended?: boolean;
  relevanceScore?: number;
  icon?: string;
}

export interface MapEventHandlers {
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  onMapPan?: (center: Coordinates) => void;
  onMapZoom?: (zoom: number) => void;
  onMarkerClick?: (markerId: string) => void;
}
