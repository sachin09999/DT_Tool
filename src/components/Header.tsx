import React from 'react';
import {
  Upload,
  Download,
  Save,
  Trash2,
  Undo2,
  Redo2,
  ShieldCheck,
  AlertTriangle,
  Settings,
  MapPin,
  Sparkles,
} from 'lucide-react';
import type { ValidationError } from '../types/config';

interface HeaderProps {
  onOpenImport: () => void;
  onExport: () => void;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  validationIssues: ValidationError[];
  onOpenValidation: () => void;
  onOpenSettings: () => void;
  onLoadSampleJaipur: () => void;
  objectCount?: number;
  hasUnsavedChanges?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImport,
  onExport,
  onSaveDraft,
  onClearDraft,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  validationIssues,
  onOpenValidation,
  onOpenSettings,
  onLoadSampleJaipur,
  objectCount = 0,
  hasUnsavedChanges = false,
}) => {
  const errorCount = validationIssues.filter((i) => i.type === 'error').length;
  const warningCount = validationIssues.filter((i) => i.type === 'warning').length;

  return (
    <header className="h-16 px-4 bg-dark-800/90 border-b border-slate-800 flex items-center justify-between z-30 relative shadow-lg backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-md shadow-brand-500/20">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg text-white tracking-wide">DT Map Configuration Studio</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Command Center
            </span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes" />
            )}
          </div>
          <p className="text-xs text-slate-400">Visual Map Editor & JSON Layout Configurator ({objectCount} markers active)</p>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-2 bg-dark-900/60 p-1.5 rounded-lg border border-slate-800">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800 my-auto mx-1" />
        <button
          onClick={onLoadSampleJaipur}
          className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Jaipur Sample</span>
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenValidation}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            errorCount > 0
              ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
              : warningCount > 0
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
          }`}
        >
          {errorCount > 0 || warningCount > 0 ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>
            {errorCount > 0
              ? `${errorCount} Error${errorCount > 1 ? 's' : ''}`
              : warningCount > 0
              ? `${warningCount} Warning${warningCount > 1 ? 's' : ''}`
              : 'Valid Config'}
          </span>
        </button>

        <div className="flex items-center space-x-1 bg-dark-900/60 p-1 rounded-lg border border-slate-800">
          <button
            onClick={onSaveDraft}
            title="Save draft to browser storage"
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
          <button
            onClick={onClearDraft}
            title="Clear saved draft"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={onOpenImport}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
        >
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Import JSON</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 border border-brand-500 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export JSON</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Google Maps API Key Settings"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
