import React, { createContext, useContext, useState, useEffect } from 'react';
import { IndianRupee, DollarSign, Euro, PoundSterling } from 'lucide-react';
import { settingsService } from '../services/api';

// Color themes
export const COLOR_SCHEMES = {
  blue: {
    id: 'blue',
    name: 'Royal Blue',
    primary: '#2563eb',
    hover: '#1d4ed8',
    light: '#eff6ff',
    border: '#bfdbfe',
    previewBg: '#2563eb'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    primary: '#059669',
    hover: '#047857',
    light: '#ecfdf5',
    border: '#a7f3d0',
    previewBg: '#059669'
  },
  purple: {
    id: 'purple',
    name: 'Deep Purple',
    primary: '#7c3aed',
    hover: '#6d28d9',
    light: '#f5f3ff',
    border: '#ddd6fe',
    previewBg: '#7c3aed'
  },
  indigo: {
    id: 'indigo',
    name: 'Indigo',
    primary: '#4f46e5',
    hover: '#4338ca',
    light: '#eef2ff',
    border: '#c7d2fe',
    previewBg: '#4f46e5'
  },
  amber: {
    id: 'amber',
    name: 'Amber Bronze',
    primary: '#d97706',
    hover: '#b45309',
    light: '#fffbeb',
    border: '#fde68a',
    previewBg: '#d97706'
  },
  slate: {
    id: 'slate',
    name: 'Charcoal Slate',
    primary: '#334155',
    hover: '#1e293b',
    light: '#f1f5f9',
    border: '#cbd5e1',
    previewBg: '#334155'
  }
};

//currencies list
export const CURRENCIES = [
  { value: 'INR (₹)', code: 'INR', symbol: '₹', label: 'INR - Indian Rupee (₹)', locale: 'en-IN' },
  { value: 'USD ($)', code: 'USD', symbol: '$', label: 'USD - United States Dollar ($)', locale: 'en-US' },
  { value: 'EUR (€)', code: 'EUR', symbol: '€', label: 'EUR - Euro (€)', locale: 'de-DE' },
  { value: 'GBP (£)', code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)', locale: 'en-GB' }
];

// parse currency obj even if str/encoding is weird
export const getCurrencyObject = (currVal) => {
  if (!currVal) return CURRENCIES[0]; //def inr
  const str = String(currVal).toUpperCase();
  if (str.includes('INR') || str.includes('RUPEE') || str.includes('₹') || str.includes('?')) {
    return CURRENCIES[0]; //inr
  }
  if (str.includes('EUR') || str.includes('EURO') || str.includes('€')) {
    return CURRENCIES[2]; // eur
  }
  if (str.includes('GBP') || str.includes('POUND') || str.includes('£')) {
    return CURRENCIES[3]; //gbp
  }
  if (str.includes('USD') || str.includes('DOLLAR') || str.includes('$')) {
    return CURRENCIES[1]; // usd
  }
  return CURRENCIES[0]; // fallback inr
};

// tz list (india first)
export const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata - Indian Standard Time (IST, UTC+05:30)', short: 'IST' },
  { value: 'UTC', label: 'UTC - Universal Coordinated Time (UTC+00:00)', short: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York - Eastern Time (US & Canada, UTC-05:00)', short: 'EST/EDT' },
  { value: 'America/Chicago', label: 'America/Chicago - Central Time (US & Canada, UTC-06:00)', short: 'CST/CDT' },
  { value: 'America/Denver', label: 'America/Denver - Mountain Time (US & Canada, UTC-07:00)', short: 'MST/MDT' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles - Pacific Time (US & Canada, UTC-08:00)', short: 'PST/PDT' },
  { value: 'Europe/London', label: 'Europe/London - GMT / BST (London, UTC+00:00)', short: 'GMT' },
  { value: 'Europe/Paris', label: 'Europe/Paris - Central European Time (Paris, Berlin, UTC+01:00)', short: 'CET' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai - Gulf Standard Time (Dubai, UTC+04:00)', short: 'GST' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore - Singapore Time (Singapore, UTC+08:00)', short: 'SGT' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo - Japan Standard Time (Tokyo, UTC+09:00)', short: 'JST' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney - Australian Eastern Time (Sydney, UTC+10:00)', short: 'AEST' }
];

const DEFAULT_SETTINGS = {
  crmName: 'BASIC CRM',
  currency: 'INR (₹)',
  timezone: 'Asia/Kolkata',
  colorScheme: 'blue',
  dateFormat: 'DD/MM/YYYY'
};

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  //load cached settings from localStorage first
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('crm_settings');
      if (cached) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Failed to parse cached settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // set theme css vars on root
  const applyColorScheme = (schemeKey) => {
    const scheme = COLOR_SCHEMES[schemeKey] || COLOR_SCHEMES.blue;
    const root = document.documentElement;
    root.style.setProperty('--primary', scheme.primary);
    root.style.setProperty('--primary-hover', scheme.hover);
    root.style.setProperty('--primary-light', scheme.light);
    root.style.setProperty('--primary-border', scheme.border);
    root.setAttribute('data-color-scheme', schemeKey);
  };

  // Update doc title & colors when settings change
  useEffect(() => {
    applyColorScheme(settings.colorScheme);
    if (settings.crmName) {
      document.title = `${settings.crmName} - Management System`;
    }
  }, [settings.colorScheme, settings.crmName]);

  // grab latest prefs from api on load
  useEffect(() => {
    const fetchRemoteSettings = async () => {
      try {
        const res = await settingsService.getPreferences();
        if (res.data?.data) {
          const remote = res.data.data;
          setSettings((prev) => {
            const merged = {
              ...prev,
              crmName: remote.crmName || prev.crmName,
              currency: remote.currency || prev.currency,
              timezone: remote.timezone || prev.timezone,
              colorScheme: remote.colorScheme || prev.colorScheme,
              dateFormat: remote.dateFormat || prev.dateFormat
            };
            localStorage.setItem('crm_settings', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        // api might be down, stick w/ local cache
        console.warn('Preferences load from server warning (using cached settings):', err.message);
      }
    };

    fetchRemoteSettings();
  }, []);

  // save prefs locally + push to api
  const saveSettings = async (newSettings) => {
    const updated = {
      ...settings,
      ...newSettings
    };

    //1 update state & localStorage right away
    setSettings(updated);
    localStorage.setItem('crm_settings', JSON.stringify(updated));
    applyColorScheme(updated.colorScheme);
    document.title = `${updated.crmName} - Management System`;

    // 2 save to db
    await settingsService.update(updated);
    return updated;
  };

  // fmt currency based on curr setting
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    const currObj = getCurrencyObject(settings?.currency);
    try {
      return new Intl.NumberFormat(currObj.locale, {
        style: 'currency',
        currency: currObj.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return `${currObj.symbol} ${num.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    }
  };

  //active curr symbol
  const getCurrencySymbol = () => {
    const currObj = getCurrencyObject(settings?.currency);
    return currObj.symbol;
  };

  // lucide icon for selected curr
  const getCurrencyIcon = () => {
    const currObj = getCurrencyObject(settings?.currency);
    if (currObj.code === 'INR') return IndianRupee;
    if (currObj.code === 'EUR') return Euro;
    if (currObj.code === 'GBP') return PoundSterling;
    return DollarSign;
  };

  // format date w/ selected tz
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone || 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return new Date(dateString).toLocaleDateString();
    }
  };

  // fmt date + time w/ tz
  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone || 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return new Date(dateString).toLocaleString();
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        formatCurrency,
        getCurrencySymbol,
        getCurrencyIcon,
        getCurrencyObject,
        formatDate,
        formatDateTime
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
