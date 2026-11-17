import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Palette,
  Clock,
  Coins,
  Building,
  Check
} from 'lucide-react';
import { checkApiHealth, authService, settingsService } from '../services/api';
import { useSettings, COLOR_SCHEMES, CURRENCIES, TIMEZONES } from '../context/SettingsContext';
import Unauthorized from './Unauthorized';

const Settings = () => {
  const currentUser = authService.getUser();
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const { settings, saveSettings } = useSettings();

  //state
  const [healthStatus, setHealthStatus] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [serverSettings, setServerSettings] = useState(null);

  // form vals
  const [crmName, setCrmName] = useState(settings?.crmName || 'BASIC CRM');
  const [currency, setCurrency] = useState(settings?.currency || 'USD ($)');
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Kolkata');
  const [colorScheme, setColorScheme] = useState(settings?.colorScheme || 'blue');

  // ui feedback
  const [savedMessage, setSavedMessage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentTimeInTz, setCurrentTimeInTz] = useState('');

  // Sync form when settings load
  useEffect(() => {
    if (settings) {
      if (settings.crmName) setCrmName(settings.crmName);
      if (settings.currency) setCurrency(settings.currency);
      if (settings.timezone) setTimezone(settings.timezone);
      if (settings.colorScheme) setColorScheme(settings.colorScheme);
    }
  }, [settings]);

  //live clock for chosen tz
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now);
        setCurrentTimeInTz(formatted);
      } catch (err) {
        setCurrentTimeInTz(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  // block non super admin w/ 403
  if (!isSuperAdmin) {
    return (
      <Unauthorized
        statusCode={403}
        title="403 - Unauthorized Access"
        message="Setting is accessible only for Super Admin. Other users are not authorized to view or configure system settings."
        requiredRole="Super Admin"
        resourceName="System Settings"
      />
    );
  }

  const testConnection = async () => {
    try {
      setTestingHealth(true);
      const res = await checkApiHealth();
      setHealthStatus({
        ok: true,
        data: res.data
      });
    } catch (err) {
      setHealthStatus({
        ok: false,
        error: err.message
      });
    } finally {
      setTestingHealth(false);
    }
  };

  const loadServerInfo = async () => {
    try {
      const res = await settingsService.get();
      if (res.data?.data) {
        setServerSettings(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load server configuration:', err.message);
    }
  };

  useEffect(() => {
    testConnection();
    loadServerInfo();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      await saveSettings({
        crmName,
        currency,
        timezone,
        colorScheme
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 4500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const activeSchemeObj = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue;
  const activeCurrObj = CURRENCIES.find((c) => c.value === currency) || CURRENCIES[0];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>System Settings & Configuration</h1>
            <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Super Admin Only
            </span>
          </div>
          <p>Manage organization identity, color scheme, timezone, currency, and database parameters</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={testConnection} disabled={testingHealth}>
            <RefreshCw size={16} className={testingHealth ? 'spinner' : ''} />
            Check Connection
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="alert-banner alert-success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            <span>
              <strong>Settings saved successfully!</strong> Organization name, color scheme, timezone, and currency are now permanently active across the entire system.
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* CRM Preferences Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">General CRM Preferences</h2>
              <p className="card-subtitle">Organization profile, color scheme & default formats</p>
            </div>
            <Sliders size={20} color="var(--primary)" />
          </div>

          <form onSubmit={handleSaveSettings}>
            {/* 1. Organization / CRM Name */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={14} color="var(--primary)" />
                Organization / CRM Name
              </label>
              <input
                type="text"
                className="form-input"
                value={crmName}
                onChange={(e) => setCrmName(e.target.value)}
                placeholder="e.g. BASIC CRM"
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Updates sidebar brand title, window header, and login branding.
              </span>
            </div>

            {/* 2. Color Scheme Selector */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={14} color="var(--primary)" />
                System Color Scheme
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '8px',
                  marginTop: '6px'
                }}
              >
                {Object.values(COLOR_SCHEMES).map((scheme) => {
                  const isSelected = colorScheme === scheme.id;
                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setColorScheme(scheme.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 8px',
                        background: isSelected ? scheme.light : 'var(--bg-hover)',
                        border: isSelected ? `2px solid ${scheme.primary}` : '1px solid var(--border-light)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: scheme.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? scheme.primary : 'var(--text-main)',
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}
                      >
                        {scheme.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Timezone Selector (with Indian Standard Time) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--primary)" />
                System Timezone
              </label>
              <select
                className="form-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {/* Live Time in Selected Timezone */}
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'var(--bg-hover)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Live Timezone Clock:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentTimeInTz}</span>
              </div>
            </div>

            {/* 4. Default Currency */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} color="var(--primary)" />
                Default Currency
              </label>
              <select
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Preference Summary Card */}
            <div
              style={{
                padding: '14px',
                background: 'var(--bg-hover)',
                borderRadius: '4px',
                marginBottom: '18px',
                fontSize: '12px',
                lineHeight: 1.6
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
                Live System Configuration Preview:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Branding: </span>
                  <strong>{crmName || 'BASIC CRM'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Palette: </span>
                  <span style={{ color: activeSchemeObj.primary, fontWeight: 700 }}>
                    {activeSchemeObj.name}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Sample Currency: </span>
                  <strong>{activeCurrObj.symbol} 1,50,000.00</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Active Zone: </span>
                  <strong>{timezone}</strong>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
              disabled={saveLoading}
            >
              {saveLoading ? 'Saving Preferences to Database...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Database & API Configuration Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Database & Backend Server</h2>
              <p className="card-subtitle">MySQL 8.0 & Express connection status</p>
            </div>
            <Database size={20} color="var(--primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Backend API Health:</span>
                {healthStatus?.ok && healthStatus?.data?.database === 'connected' ? (
                  <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Connected & Online
                  </span>
                ) : (
                  <span className="badge badge-lost" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Disconnected
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target URL: <code>http://localhost:5009/api</code>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Database Name</label>
              <input
                type="text"
                className="form-input"
                value={serverSettings?.dbName || 'simple_crm_v2'}
                readOnly
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">DB Host</label>
                <input
                  type="text"
                  className="form-input"
                  value={serverSettings?.dbHost || 'localhost'}
                  readOnly
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Port</label>
                <input
                  type="text"
                  className="form-input"
                  value={serverSettings?.dbPort || '3306'}
                  readOnly
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Storage Table for Settings</label>
              <input
                type="text"
                className="form-input"
                value="app_settings (id=1, persisted in MySQL)"
                readOnly
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Database parameters loaded dynamically from <code>backend/.env</code>. Preferences are stored in the active MySQL database and cached locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
