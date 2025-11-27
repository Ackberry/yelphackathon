import { useEffect, useRef, useState, useCallback } from 'react';
import { Coordinates } from '@shared/types/place';
import { MapConfig, MapEventHandlers } from '../../types/map';

interface MapContainerProps {
  config?: MapConfig;
  onMapReady?: (map: google.maps.Map) => void;
  eventHandlers?: MapEventHandlers;
  className?: string;
}

const DEFAULT_CENTER: Coordinates = { lat: 37.7749, lng: -122.4194 }; // San Francisco
const DEFAULT_ZOOM = 13;

export default function MapContainer({
  config,
  onMapReady,
  eventHandlers,
  className = 'map-container',
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Detect user location
  const detectUserLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          
          // Center map on user location if map is already initialized
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(location);
          }
        },
        (error) => {
          console.warn('Error getting user location:', error.message);
          // Continue with default location
        }
      );
    }
  }, []);

  // Initialize map
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    if (!mapRef.current) return;

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initializeMap();
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    function initializeMap() {
      if (!mapRef.current) return;

      const center = config?.center || userLocation || DEFAULT_CENTER;
      const zoom = config?.zoom || DEFAULT_ZOOM;

      const map = new google.maps.Map(mapRef.current as HTMLElement, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Add event listeners
      if (eventHandlers?.onMapClick) {
        map.addListener('click', eventHandlers.onMapClick);
      }

      if (eventHandlers?.onMapPan) {
        map.addListener('center_changed', () => {
          const center = map.getCenter();
          if (center) {
            eventHandlers.onMapPan?.({
              lat: center.lat(),
              lng: center.lng(),
            });
          }
        });
      }

      if (eventHandlers?.onMapZoom) {
        map.addListener('zoom_changed', () => {
          const zoom = map.getZoom();
          if (zoom !== undefined) {
            eventHandlers.onMapZoom?.(zoom);
          }
        });
      }

      setIsLoading(false);
      onMapReady?.(map);
    }
  }, [config, userLocation, onMapReady, eventHandlers]);

  // Detect user location on mount
  useEffect(() => {
    detectUserLocation();
  }, [detectUserLocation]);

  // Public method to center map on location
  const centerOnLocation = useCallback((location: Coordinates) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(location);
    }
  }, []);

  // Public method to set zoom
  const setZoom = useCallback((zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(zoom);
    }
  }, []);

  // Public method to get current center
  const getCenter = useCallback((): Coordinates | null => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      if (center) {
        return { lat: center.lat(), lng: center.lng() };
      }
    }
    return null;
  }, []);

  // Expose methods via ref (if needed in parent)
  useEffect(() => {
    if (mapInstanceRef.current) {
      (mapInstanceRef.current as any).centerOnLocation = centerOnLocation;
      (mapInstanceRef.current as any).setZoom = setZoom;
      (mapInstanceRef.current as any).getCenter = getCenter;
    }
  }, [centerOnLocation, setZoom, getCenter]);

  if (error) {
    return (
      <div className={`${className} error`} style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Please configure VITE_GOOGLE_MAPS_API_KEY in your .env file
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          Loading map...
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} data-testid="map-container" />
    </div>
  );
}
