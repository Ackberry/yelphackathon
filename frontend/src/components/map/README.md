# Google Maps Integration

This directory contains the Google Maps integration components for the mood-based discovery application.

## Components

### MapContainer
The core map component that handles Google Maps API initialization, user location detection, and map event handling.

**Features:**
- Automatic Google Maps API loading
- User location detection via browser geolocation
- Map event handlers (click, pan, zoom)
- Error handling for missing API keys
- Loading states

**Props:**
- `config`: Optional map configuration (center, zoom)
- `onMapReady`: Callback when map is initialized
- `eventHandlers`: Map event handlers
- `className`: Custom CSS class

### PlaceMarker
Component for rendering place markers on the map with custom styling.

**Features:**
- Custom marker icons based on recommendation status
- Visual distinction for recommended places
- Relevance-based marker scaling
- Hover animations for recommended markers
- Click event handling

**Props:**
- `map`: Google Maps instance
- `data`: Marker data (id, position, title, isRecommended, relevanceScore)
- `onClick`: Click handler

### Map
High-level component that combines MapContainer and PlaceMarker components.

**Features:**
- Manages map instance state
- Renders multiple markers
- Handles all map events
- Simplified API for parent components

**Props:**
- `config`: Map configuration
- `markers`: Array of marker data
- `onMarkerClick`: Marker click handler
- `onMapClick`: Map click handler
- `onMapPan`: Map pan handler
- `onMapZoom`: Map zoom handler

## Hooks

### useMapControls
Custom hook for programmatic map control.

**Methods:**
- `centerOnLocation(location)`: Center map on coordinates
- `setZoom(zoom)`: Set map zoom level
- `getCenter()`: Get current map center
- `getZoom()`: Get current zoom level
- `panTo(location)`: Smoothly pan to location
- `fitBounds(bounds)`: Fit map to bounds

## Setup

1. Add Google Maps API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Import and use the Map component:
   ```tsx
   import Map from './components/map/Map';
   
   function MyComponent() {
     const [markers, setMarkers] = useState([]);
     
     return (
       <Map
         markers={markers}
         onMarkerClick={(id) => console.log('Clicked:', id)}
       />
     );
   }
   ```

## Testing

Property-based tests are located in `src/test/map.property.test.ts`:

- **Property 5**: Location search centering - Validates that the map centers on any valid location coordinates
- **Property 3**: Recommendation visualization - Validates that exactly one marker is displayed for each recommendation with distinctive styling

Run tests with:
```bash
npm test
```
