import React, { useState } from 'react';
import { VoiceSettings } from '../types';
import { speakSpeech, playSuccessChime } from '../utils/audio';
import { Volume2, X, Sparkles, Sliders, Key, Play } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSave: (newSettings: VoiceSettings) => void;
}

const GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore (Default)', desc: 'Warm, natural & articulate' },
  { id: 'Puck', label: 'Puck', desc: 'Energetic, crisp & youthful' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Calm, patient & gentle' },
  { id: 'Charon', label: 'Charon', desc: 'Deep, resonant & clear' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Distinguished & authoritative' },
];

const ELEVEN_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Calm & Professional)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Soft & Expressive)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Clear & Narrative)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Deep & Natural)' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte (Friendly & Bright)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<VoiceSettings>(settings);
  const [testingAudio, setTestingAudio] = useState(false);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleTestVoice = async () => {
    setTestingAudio(true);
    try {
      if (localSettings.soundFx) {
        await playSuccessChime();
      }
      await speakSpeech(
        'Welcome to the spelling bee! Practicing every day leads to mastery.',
        localSettings
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTestingAudio(false);
    }
  };

  const handleSaveAndClose = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Voice & Audio Settings</h3>
              <p className="text-xs text-slate-400">Configure announcer voice, TTS engine, and speech speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Engine Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
              Text-to-Speech Engine
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, engine: 'gemini' })}
                className={`px-3 py-2.5 rounded-xl border font-semibold text-center transition flex flex-col items-center justify-center gap-1 ${
                  localSettings.engine === 'gemini'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Gemini TTS</span>
                <span className="text-[10px] text-purple-300 font-normal">Default</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, engine: 'elevenlabs' })}
                className={`px-3 py-2.5 rounded-xl border font-semibold text-center transition flex flex-col items-center justify-center gap-1 ${
                  localSettings.engine === 'elevenlabs'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Key className="w-4 h-4 text-purple-400" />
                <span>ElevenLabs</span>
                <span className="text-[10px] text-slate-400 font-normal">Custom Key</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, engine: 'webspeech' })}
                className={`px-3 py-2.5 rounded-xl border font-semibold text-center transition flex flex-col items-center justify-center gap-1 ${
                  localSettings.engine === 'webspeech'
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Web Speech</span>
                <span className="text-[10px] text-slate-400 font-normal">Offline</span>
              </button>
            </div>
          </div>

          {/* Gemini Voice Settings */}
          {localSettings.engine === 'gemini' && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Announcer Voice
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GEMINI_VOICES.map(voice => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        geminiVoice: voice.id as any,
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition ${
                      localSettings.geminiVoice === voice.id
                        ? 'bg-purple-900/40 border-purple-500 text-white ring-1 ring-purple-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{voice.label}</div>
                    <div className="text-[11px] text-slate-400">{voice.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ElevenLabs Settings */}
          {localSettings.engine === 'elevenlabs' && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ElevenLabs API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={localSettings.elevenLabsKey}
                    onChange={e =>
                      setLocalSettings({ ...localSettings, elevenLabsKey: e.target.value })
                    }
                    placeholder="sk_..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-2 text-[11px] text-purple-400 hover:text-purple-300 font-medium px-1"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Saved securely in your browser's local storage.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Voice Model
                </label>
                <select
                  value={localSettings.elevenLabsVoiceId}
                  onChange={e =>
                    setLocalSettings({ ...localSettings, elevenLabsVoiceId: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {ELEVEN_VOICES.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Volume and Speed */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-300">Volume</span>
                <span className="text-xs font-mono text-purple-400">
                  {Math.round(localSettings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={localSettings.volume}
                onChange={e =>
                  setLocalSettings({ ...localSettings, volume: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-300">Speech Rate</span>
                <span className="text-xs font-mono text-purple-400">
                  {localSettings.speechRate.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.25"
                step="0.05"
                value={localSettings.speechRate}
                onChange={e =>
                  setLocalSettings({ ...localSettings, speechRate: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-semibold text-slate-200">Success Chime Sound</div>
                <div className="text-[11px] text-slate-400">Play pleasant Web Audio tone on correct spellings</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.soundFx}
                  onChange={e =>
                    setLocalSettings({ ...localSettings, soundFx: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Server Cache & 2-Year Retention Info */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 mt-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Server Audio Cache Active</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                  2-Yr Retention
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Word pronunciations and corrections are synthesized once and cached on the server for all students. Unused audio is automatically pruned after 2 years.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={handleTestVoice}
            disabled={testingAudio}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-purple-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${testingAudio ? 'animate-spin' : ''}`} />
            {testingAudio ? 'Speaking...' : 'Test Announcer'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
