import { useEffect, useRef } from 'react';
import { MarkerData } from '../../types/map';

interface PlaceMarkerProps {
  map: google.maps.Map;
  data: MarkerData;
  onClick?: (markerId: string) => void;
}

// Custom marker icons based on recommendation status and relevance
const getMarkerIcon = (
  isRecommended: boolean = false,
  relevanceScore: number = 0
): google.maps.Icon | google.maps.Symbol => {
  if (isRecommended) {
    // Recommended places get a custom styled marker
    const scale = 1 + (relevanceScore || 0) * 0.5; // Scale based on relevance (1.0 to 1.5)
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#FF6B6B', // Distinctive red color for recommendations
      fillOpacity: 0.8 + (relevanceScore || 0) * 0.2, // More opaque for higher relevance
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8 * scale,
    };
  }

  // Default marker for non-recommended places
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#4A90E2',
    fillOpacity: 0.6,
    strokeColor: '#FFFFFF',
    strokeWeight: 1,
    scale: 6,
  };
};

export default function PlaceMarker({ map, data, onClick }: PlaceMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create marker
    const marker = new google.maps.Marker({
      position: data.position,
      map,
      title: data.title,
      icon: data.icon ? data.icon : getMarkerIcon(data.isRecommended, data.relevanceScore),
      animation: data.isRecommended ? google.maps.Animation.DROP : undefined,
      zIndex: data.isRecommended ? 1000 : 100, // Recommended markers appear on top
    });

    markerRef.current = marker;

    // Add click listener
    if (onClick) {
      marker.addListener('click', () => {
        onClick(data.id);
      });
    }

    // Add hover effect for recommended markers
    if (data.isRecommended) {
      marker.addListener('mouseover', () => {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 750);
      });
    }

    // Cleanup
    return () => {
      marker.setMap(null);
    };
  }, [map, data, onClick]);

  // Update marker position if data changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition(data.position);
    }
  }, [data.position]);

  // Update marker icon if recommendation status changes
  useEffect(() => {
    if (markerRef.current) {
      const icon = data.icon ? data.icon : getMarkerIcon(data.isRecommended, data.relevanceScore);
      markerRef.current.setIcon(icon);
      markerRef.current.setZIndex(data.isRecommended ? 1000 : 100);
    }
  }, [data.isRecommended, data.relevanceScore, data.icon]);

  return null; // This component doesn't render anything in React
}
