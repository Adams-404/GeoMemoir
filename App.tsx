import React, { useState, useEffect, useMemo } from 'react';
import { MapView } from './components/MapView';
import { PinModal } from './components/PinModal';
import { Button } from './components/Button';
import { Pin, UserLocation, Coordinates, AppView } from './types';
import { searchPlaces } from './services/locationService';
import { Locate, List, Map as MapIcon, Plus, Trash2, AlertTriangle, X, Search, Navigation, MapPin, Layers } from 'lucide-react';

const STORAGE_KEY = 'geo_memoir_pins';

const App: React.FC = () => {
  // --- State ---
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [placeResults, setPlaceResults] = useState<{name: string, coords: Coordinates}[]>([]);
  const [searchResultPin, setSearchResultPin] = useState<Coordinates | null>(null);

  // Map State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingPinCoords, setPendingPinCoords] = useState<Coordinates | null>(null);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  
  // Focus State: Includes mode to differentiate between "flying" to a result and "following" a car
  const [focusCoords, setFocusCoords] = useState<{ coords: Coordinates; mode: 'fly' | 'follow' } | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  
  const [view, setView] = useState<AppView>(AppView.MAP);
  const [locationError, setLocationError] = useState<string | null>(null);

  // --- Derived State ---
  const filteredPins = useMemo(() => {
    if (!searchQuery.trim()) return pins;
    const lowerQuery = searchQuery.toLowerCase();
    return pins.filter(pin => 
      pin.message.toLowerCase().includes(lowerQuery)
    );
  }, [pins, searchQuery]);

  // --- Effects ---

  // Load pins
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPins(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load pins", e);
      }
    }
  }, []);

  // Save pins
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  }, [pins]);

  // Track Location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        setLocationError(null);
        
        const newLocation = {
          lat: latitude,
          lng: longitude,
          accuracy,
          heading,
          speed,
        };

        setUserLocation(newLocation);
        
        // Auto-follow logic for driving mode
        if (isFollowingUser) {
           setFocusCoords({ coords: newLocation, mode: 'follow' });
        }
      },
      (error) => {
        if (error.code === 1) {
            setLocationError("Location access denied.");
        } else if (error.code !== 3) { // Ignore timeouts to prevent UI flicker
            console.warn("Location update failed:", error.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, 
        maximumAge: 0, // Force fresh data for realtime speed/heading
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isFollowingUser]); // Re-bind if follow state changes? No, just closure access. Actually simpler to not dep array it.

  // Debounced Search for Places
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2 && filteredPins.length === 0) {
        setIsSearching(true);
        const results = await searchPlaces(searchQuery);
        setPlaceResults(results);
        setIsSearching(false);
      } else {
        setPlaceResults([]);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredPins.length]);


  // --- Handlers ---

  const handleMapClick = (coords: Coordinates) => {
    // If clicking map, we stop following user automatically to let them browse
    setIsFollowingUser(false);
    setPendingPinCoords(coords);
    setIsModalOpen(true);
  };

  const handleCurrentLocationPin = () => {
    if (userLocation) {
      handleMapClick({ lat: userLocation.lat, lng: userLocation.lng });
    } else {
      alert(locationError || "Waiting for location signal...");
    }
  };

  const handleSavePin = (message: string) => {
    if (pendingPinCoords) {
      const newPin: Pin = {
        id: crypto.randomUUID(),
        lat: pendingPinCoords.lat,
        lng: pendingPinCoords.lng,
        message,
        timestamp: Date.now(),
      };
      setPins((prev) => [...prev, newPin]);
      setSearchResultPin(null); // Clear search result pin if we pinned over it
    }
  };

  const deletePin = (id: string) => {
    setPins(prev => prev.filter(p => p.id !== id));
  };

  const toggleFollowUser = () => {
    if (!userLocation) {
       alert(locationError || "Location not yet found.");
       return;
    }
    
    const newFollowState = !isFollowingUser;
    setIsFollowingUser(newFollowState);
    
    if (newFollowState) {
      setFocusCoords({ coords: userLocation, mode: 'fly' }); // Initial fly to user
    }
  };

  const goToLocation = (coords: Coordinates, isSearchResult = false) => {
    setFocusCoords({ coords, mode: 'fly' });
    setIsFollowingUser(false); // Stop following user
    setView(AppView.MAP);
    
    if (isSearchResult) {
      setSearchResultPin(coords);
      setSearchQuery(''); // Clear search
      setPlaceResults([]);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative bg-slate-50">
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[400] p-4 pointer-events-none flex flex-col gap-2">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-2">
          
          <div className="flex justify-between items-center w-full">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg pointer-events-auto flex items-center gap-2">
              <h1 className="font-bold text-slate-800 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${userLocation ? 'bg-primary animate-pulse' : 'bg-slate-300'}`}></span>
                GeoMemoir
              </h1>
            </div>

            <div className="pointer-events-auto flex gap-2">
              <Button 
                variant="secondary" 
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                onClick={() => setMapStyle(prev => prev === 'street' ? 'satellite' : 'street')}
                title={mapStyle === 'street' ? "Switch to Satellite" : "Switch to Street View"}
              >
                <Layers className="w-5 h-5 text-slate-600"/>
              </Button>
              <Button 
                variant="secondary" 
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                onClick={() => setView(view === AppView.MAP ? AppView.LIST : AppView.MAP)}
                title={view === AppView.MAP ? "List View" : "Map View"}
              >
                {view === AppView.MAP ? <List className="w-5 h-5 text-slate-600"/> : <MapIcon className="w-5 h-5 text-slate-600"/>}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="w-full pointer-events-auto relative">
            <div className="bg-white/90 backdrop-blur-md p-1 pl-3 pr-1 rounded-xl shadow-lg flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search memories or places..." 
                className="bg-transparent border-none outline-none text-sm w-full h-8 text-slate-700 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setPlaceResults([]); }} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* External Search Results Dropdown */}
            {(placeResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 max-h-60 overflow-y-auto">
                 <div className="p-2 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                   Map Locations
                 </div>
                 {placeResults.map((place, i) => (
                   <button 
                    key={i}
                    onClick={() => goToLocation(place.coords, true)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                   >
                     <MapPin className="w-4 h-4 text-slate-400" />
                     <span className="text-sm text-slate-700 truncate">{place.name}</span>
                   </button>
                 ))}
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Error Toast */}
      {locationError && (
        <div className="absolute top-36 left-4 right-4 z-[400] max-w-md mx-auto animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none">
            <div className="bg-rose-50/95 backdrop-blur border border-rose-200 text-rose-800 px-4 py-3 rounded-xl shadow-lg flex justify-between items-start gap-3 pointer-events-auto">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1 text-sm">{locationError}</div>
                <button onClick={() => setLocationError(null)} className="text-rose-400 hover:text-rose-600">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        
        {/* Map Layer */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${view === AppView.MAP ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <MapView 
            userLocation={userLocation}
            pins={filteredPins}
            focusCoords={focusCoords}
            onAddPinRequest={handleMapClick}
            onUserMapInteraction={() => setIsFollowingUser(false)}
            searchResultPin={searchResultPin}
            onPinClick={(pin) => goToLocation(pin)}
            mapStyle={mapStyle}
          />
        </div>

        {/* List Layer */}
        <div className={`absolute inset-0 bg-slate-50 overflow-y-auto transition-opacity duration-300 p-4 pt-36 ${view === AppView.LIST ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {searchQuery ? `Search Results` : `Your Memories (${pins.length})`}
            </h2>

            {filteredPins.length === 0 && placeResults.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>{isSearching ? "Searching map..." : (searchQuery ? "No memories found. Try selecting a map location above." : "No pins dropped yet.")}</p>
              </div>
            ) : (
              <>
                {/* List Local Pins */}
                {filteredPins.sort((a,b) => b.timestamp - a.timestamp).map(pin => (
                  <div key={pin.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start gap-4">
                    <div className="cursor-pointer flex-1" onClick={() => goToLocation(pin)}>
                      <p className="text-slate-800 font-medium mb-1">{pin.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span>{new Date(pin.timestamp).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deletePin(pin.id); }} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className={`absolute bottom-8 right-4 z-[400] flex flex-col gap-3 transition-transform duration-300 ${view === AppView.MAP ? 'translate-y-0' : 'translate-y-32'}`}>
           <Button 
            variant={isFollowingUser ? 'primary' : 'secondary'}
            className={`rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-xl border-0 transition-colors ${isFollowingUser ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
            onClick={toggleFollowUser}
            title={isFollowingUser ? "Following You" : "Locate Me"}
            disabled={!userLocation}
          >
            {isFollowingUser ? <Navigation className="w-6 h-6 animate-pulse" /> : <Locate className="w-6 h-6" />}
          </Button>

          <Button 
            variant="primary"
            className="rounded-full w-14 h-14 p-0 flex items-center justify-center shadow-xl shadow-indigo-500/30"
            onClick={handleCurrentLocationPin}
            title="Pin Here"
          >
            <Plus className="w-8 h-8" />
          </Button>
        </div>

      </main>

      <PinModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingPinCoords(null);
        }}
        onSave={handleSavePin}
        coordinates={pendingPinCoords}
      />
    </div>
  );
};

export default App;