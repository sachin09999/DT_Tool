import { useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { getStoredApiKey } from '../utils/storage';

export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const customKey = getStoredApiKey();
    const activeKey = customKey || envKey;

    setApiKey(activeKey);

    // Register global Google Maps Auth Failure listener
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps API Key Authentication Failure detected. Falling back to Interactive Canvas.');
      setLoadError('Google Maps API Key Authentication Failed (ApiNotActivatedMapError / Key restricted).');
      setIsLoaded(false);
    };

    if (!activeKey || activeKey.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
      setLoadError('No valid Google Maps API Key found.');
      setIsLoaded(false);
      return;
    }

    try {
      setOptions({
        key: activeKey,
        v: 'weekly',
      });

      Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
        importLibrary('geometry'),
      ])
        .then(() => {
          setIsLoaded(true);
          setLoadError(null);
        })
        .catch((err: any) => {
          console.error('Google Maps Loader error:', err);
          setLoadError(err?.message || 'Failed to load Google Maps JS API');
          setIsLoaded(false);
        });
    } catch (err: any) {
      console.error('Google Maps setOptions error:', err);
      setLoadError(err?.message || 'Failed to configure Google Maps');
      setIsLoaded(false);
    }
  }, []);

  const updateApiKey = (newKey: string) => {
    setApiKey(newKey);
    window.location.reload();
  };

  return { isLoaded, loadError, apiKey, updateApiKey };
}
