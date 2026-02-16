import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  allocation_end_date: string;
  allocation_open: string;
  hero_heading: string;
  hero_subheading: string;
  hero_description: string;
  allocation_notice: string;
  min_order_label: string;
}

const DEFAULTS: SiteSettings = {
  allocation_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  allocation_open: 'true',
  hero_heading: 'Miami Grande Bianco',
  hero_subheading: '120×120cm — Made in Italy',
  hero_description: 'This allocation has been secured directly from production and is available in confirmed bulk quantities (over 57 sq.m only). Suitable for walls and floors, with matching 20mm outdoor option.',
  allocation_notice: 'Limited Factory Allocation',
  min_order_label: 'Min. order 57 sq.m',
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');

    if (data) {
      const mapped = { ...DEFAULTS };
      data.forEach((row: any) => {
        if (row.setting_key in mapped) {
          (mapped as any)[row.setting_key] = row.setting_value;
        }
      });
      setSettings(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: keyof SiteSettings, value: string) => {
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);

    if (!error) {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
    return !error;
  };

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
