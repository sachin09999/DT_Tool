import React, { useState } from 'react';
import { Key, Check, X, ShieldAlert } from 'lucide-react';
import { getStoredApiKey, saveCustomApiKey } from '../utils/storage';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaveKey }) => {
  const [apiKeyInput, setApiKeyInput] = useState(getStoredApiKey());

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomApiKey(apiKeyInput);
    onSaveKey(apiKeyInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Google Maps API Key Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Google Maps JavaScript API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-dark-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1 text-slate-400">
            <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Offline / Mock Fallback Enabled</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              If no API key is provided or offline, DT Map Configuration Studio automatically defaults to the high-fidelity interactive Canvas Map mode. All drag-and-drop, layout engine, and JSON features remain 100% functional.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Reload</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
