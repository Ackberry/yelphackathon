import { useState, useCallback } from 'react';
import MapContainer from './MapContainer';
import PlaceMarker from './PlaceMarker';
import { MapConfig, MapEventHandlers, MarkerData } from '../../types/map';
import { Coordinates } from '@shared/types/place';

interface MapProps {
  config?: MapConfig;
  markers?: MarkerData[];
  onMarkerClick?: (markerId: string) => void;
  onMapClick?: (location: Coordinates) => void;
  onMapPan?: (center: Coordinates) => void;
  onMapZoom?: (zoom: number) => void;
  className?: string;
}

export default function Map({
  config,
  markers = [],
  onMarkerClick,
  onMapClick,
  onMapPan,
  onMapZoom,
  className,
}: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const handleMapReady = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleMapClickEvent = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng && onMapClick) {
        onMapClick({
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        });
      }
    },
    [onMapClick]
  );

  const eventHandlers: MapEventHandlers = {
    onMapClick: handleMapClickEvent,
    onMapPan,
    onMapZoom,
  };

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <MapContainer
        config={config}
        onMapReady={handleMapReady}
        eventHandlers={eventHandlers}
        className="map-wrapper"
      />
      {map &&
        markers.map((marker) => (
          <PlaceMarker
            key={marker.id}
            map={map}
            data={marker}
            onClick={onMarkerClick}
          />
        ))}
    </div>
  );
}
