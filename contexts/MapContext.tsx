import React, { createContext, useState, useContext, useEffect } from 'react';
import { Key } from 'lucide-react';

interface MapContextType {
  apiKey: string | null;
  isScriptLoaded: boolean;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const SCRIPT_ID = 'google-maps-script';

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(() => sessionStorage.getItem('googleMapsApiKey'));
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Check if API key exists. If not, prompt the user.
    if (!apiKey) {
      setShowModal(true);
    } else if (!isScriptLoaded && !document.getElementById(SCRIPT_ID)) {
      // If key exists but script isn't loaded, load it.
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => {
        console.error("Google Maps script failed to load. Check API key and network.");
        sessionStorage.removeItem('googleMapsApiKey'); // Clear bad key
        setApiKey(null); // This will re-trigger the modal
      };
      document.head.appendChild(script);
    } else if (document.getElementById(SCRIPT_ID)) {
        // Script might already be there from a previous session
        setIsScriptLoaded(true);
    }
  }, [apiKey, isScriptLoaded]);
  
  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sessionStorage.setItem('googleMapsApiKey', inputValue.trim());
      setApiKey(inputValue.trim());
      setShowModal(false);
    }
  };

  const ApiKeyModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
      <div className="bg-lightcard dark:bg-darkcard p-8 rounded-2xl shadow-dark w-full max-w-md text-center">
        <Key className="mx-auto w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Google Maps API Key Required</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          To use the map features, please enter your Google Maps JavaScript API key.
          Ensure it has the "Maps JavaScript API" and "Directions API" enabled.
        </p>
        <form onSubmit={handleKeySubmit} className="mt-6">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter your API key here"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="w-full mt-4 py-3 px-4 font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
            Save and Load Map
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <MapContext.Provider value={{ apiKey, isScriptLoaded }}>
      {showModal && <ApiKeyModal />}
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = (): MapContextType => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};