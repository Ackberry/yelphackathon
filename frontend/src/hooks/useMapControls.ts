import { useCallback, useRef } from 'react';
import { Coordinates } from '@shared/types/place';

export interface MapControls {
  centerOnLocation: (location: Coordinates) => void;
  setZoom: (zoom: number) => void;
  getCenter: () => Coordinates | null;
  getZoom: () => number | null;
  panTo: (location: Coordinates) => void;
  fitBounds: (bounds: google.maps.LatLngBounds) => void;
}

export function useMapControls(map: google.maps.Map | null): MapControls {
  const mapRef = useRef(map);
  
  // Update ref when map changes
  if (map !== mapRef.current) {
    mapRef.current = map;
  }

  const centerOnLocation = useCallback((location: Coordinates) => {
    if (mapRef.current) {
      mapRef.current.setCenter(location);
    }
  }, []);

  const setZoom = useCallback((zoom: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(zoom);
    }
  }, []);

  const getCenter = useCallback((): Coordinates | null => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        return { lat: center.lat(), lng: center.lng() };
      }
    }
    return null;
  }, []);

  const getZoom = useCallback((): number | null => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      return zoom !== undefined ? zoom : null;
    }
    return null;
  }, []);

  const panTo = useCallback((location: Coordinates) => {
    if (mapRef.current) {
      mapRef.current.panTo(location);
    }
  }, []);

  const fitBounds = useCallback((bounds: google.maps.LatLngBounds) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds);
    }
  }, []);

  return {
    centerOnLocation,
    setZoom,
    getCenter,
    getZoom,
    panTo,
    fitBounds,
  };
}
