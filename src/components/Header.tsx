import React from 'react';
import { BeeLogo } from './BeeLogo';
import { VoiceSettings } from '../types';
import { Settings, PlusCircle, ArrowLeft, Volume2 } from 'lucide-react';

interface HeaderProps {
  isDrillMode: boolean;
  listTitle?: string;
  voiceSettings: VoiceSettings;
  onOpenSettings: () => void;
  onBackToCreator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDrillMode,
  listTitle,
  voiceSettings,
  onOpenSettings,
  onBackToCreator,
}) => {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCreator}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <BeeLogo className="w-9 h-9 shadow-md shadow-purple-600/30 group-hover:scale-105 transition duration-150" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-purple-300 transition">
                  Spelling Bee
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 tracking-wide uppercase">
                  TRAINER
                </span>
              </div>
              {isDrillMode && listTitle && (
                <div className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs font-medium">
                  {listTitle}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Right: Controls & Voice Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isDrillMode && (
            <button
              onClick={onBackToCreator}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Edit List</span>
            </button>
          )}

          {!isDrillMode && (
            <button
              onClick={() => {
                // Focus the title input if on creator view
                const el = document.querySelector('textarea');
                el?.focus();
              }}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>New List</span>
            </button>
          )}

          {/* Voice Settings Gear */}
          <button
            onClick={onOpenSettings}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white transition flex items-center gap-2 shadow-sm"
            title="Audio & Voice Settings"
          >
            <Settings className="w-4 h-4 text-purple-400 sm:text-inherit" />
            <span className="hidden sm:inline text-xs font-semibold">
              {voiceSettings.engine === 'gemini'
                ? `Gemini (${voiceSettings.geminiVoice})`
                : voiceSettings.engine === 'elevenlabs'
                ? 'ElevenLabs'
                : 'Web Speech'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
