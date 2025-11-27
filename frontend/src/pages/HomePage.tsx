import { useUser, UserButton } from '@clerk/clerk-react';
import { useState } from 'react';
import Map from '../components/map/Map';
import { MarkerData } from '../types/map';
import { Coordinates } from '@shared/types/place';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  const handleMarkerClick = (markerId: string) => {
    console.log('Marker clicked:', markerId);
  };

  const handleMapClick = (location: Coordinates) => {
    console.log('Map clicked at:', location);
  };

  const handleMapPan = (center: Coordinates) => {
    console.log('Map panned to:', center);
  };

  const handleMapZoom = (zoom: number) => {
    console.log('Map zoom changed to:', zoom);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header className="header" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: 0 }}>Mood-Based Discovery</h1>
        <UserButton afterSignOutUrl="/sign-in" />
      </header>
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Map
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            onMapPan={handleMapPan}
            onMapZoom={handleMapZoom}
          />
        </div>
      </main>
    </div>
  );
}
