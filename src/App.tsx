import React, { useState, useEffect } from 'react';
import { ListPayload, VoiceSettings } from './types';
import { decodeListPayload, encodeListPayload } from './utils/urlPayload';
import { Header } from './components/Header';
import { CreatorView } from './components/CreatorView';
import { StudentDrill } from './components/StudentDrill';
import { SettingsModal } from './components/SettingsModal';

const FAVICON_SVG_DATA = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='24' fill='%239333ea'/%3E%3Cellipse cx='32' cy='44' rx='16' ry='10' transform='rotate(-25 32 44)' fill='white' fill-opacity='0.9'/%3E%3Cellipse cx='68' cy='44' rx='16' ry='10' transform='rotate(25 68 44)' fill='white' fill-opacity='0.9'/%3E%3Cpath d='M44 26 Q38 16 32 18' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round'/%3E%3Ccircle cx='32' cy='18' r='3' fill='white'/%3E%3Cpath d='M56 26 Q62 16 68 18' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round'/%3E%3Ccircle cx='68' cy='18' r='3' fill='white'/%3E%3Ccircle cx='50' cy='31' r='9' fill='white'/%3E%3Cellipse cx='50' cy='57' rx='17' ry='21' fill='white'/%3E%3Cpath d='M34 50 H66 M33 58 H67 M35 66 H65' stroke='%239333ea' stroke-width='4.5' stroke-linecap='round'/%3E%3Cpolygon points='46,77 54,77 50,86' fill='white'/%3E%3C/svg%3E`;

const DEFAULT_SETTINGS: VoiceSettings = {
  engine: 'gemini',
  geminiVoice: 'Kore',
  elevenLabsKey: '',
  elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
  elevenLabsModel: 'eleven_turbo_v2_5',
  volume: 1.0,
  speechRate: 0.95,
  soundFx: true,
};

export default function App() {
  const [drillPayload, setDrillPayload] = useState<ListPayload | null>(null);
  const [cachedPayload, setCachedPayload] = useState<ListPayload | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load persisted voice settings from localStorage
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('bee_voice_settings_v1');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  // Dynamically ensure favicon is set in document.head
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = FAVICON_SVG_DATA;
  }, []);

  // Parse URL query parameter `?list=`
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const encoded = params.get('list');
      if (encoded) {
        const decoded = decodeListPayload(encoded);
        if (decoded && decoded.words.length > 0) {
          setDrillPayload(decoded);
          setCachedPayload(decoded);
          return;
        }
      }
      setDrillPayload(null);
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Save voice settings
  const handleSaveSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    try {
      localStorage.setItem('bee_voice_settings_v1', JSON.stringify(newSettings));
    } catch (err) {
      console.warn('Could not save voice settings:', err);
    }
  };

  // Launch drill from creator view
  const handleStartDrill = (payload: ListPayload) => {
    setCachedPayload(payload);
    setDrillPayload(payload);
    const encoded = encodeListPayload(payload);
    const newUrl = `${window.location.pathname}?list=${encoded}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Exit drill back to list creator
  const handleBackToCreator = () => {
    setDrillPayload(null);
    const newUrl = window.location.pathname;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isDrillMode={drillPayload !== null}
        listTitle={drillPayload?.title}
        voiceSettings={voiceSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onBackToCreator={handleBackToCreator}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center">
        {drillPayload ? (
          <StudentDrill
            payload={drillPayload}
            voiceSettings={voiceSettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onBackToCreator={handleBackToCreator}
          />
        ) : (
          <CreatorView
            initialPayload={cachedPayload}
            onStartDrill={handleStartDrill}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Spelling Bee Trainer &bull; 100% Keyboard-Driven Audio Practice</span>
          </div>
          <div className="text-slate-500">
            Self-Contained State &bull; Powered by Gemini AI
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={voiceSettings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
