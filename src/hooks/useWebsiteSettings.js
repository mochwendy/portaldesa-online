import { useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  fetchSettings,
  getSettingsCache,
  subscribeSettings,
} from '@/lib/websiteSettings';

export default function useWebsiteSettings() {
  const [settings, setSettings] = useState(getSettingsCache() || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!getSettingsCache());

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSettings((next) => {
      if (active) setSettings(next);
    });
    fetchSettings().then((next) => {
      if (!active) return;
      setSettings(next || DEFAULT_SETTINGS);
      setLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { settings, loading };
}