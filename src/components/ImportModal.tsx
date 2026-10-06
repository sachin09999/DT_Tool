import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import type { ImportSummary } from '../types/config';
import { parseDTJson } from '../utils/jsonConverter';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirmed: (
    objects: any[],
    buildings: any[],
    rawJson: unknown,
    summary: ImportSummary
  ) => void;
  onLoadSampleJaipur: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportConfirmed,
  onLoadSampleJaipur,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [jsonInputText, setJsonInputText] = useState('');
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processJsonContent(content);
    };
    reader.readAsText(file);
  };

  const handleTextProcess = () => {
    processJsonContent(jsonInputText);
  };

  const processJsonContent = (text: string) => {
    const result = parseDTJson(text);
    setSummary(result.summary);
    setErrors(result.errors);
    setParsedData(result);
  };

  const handleConfirm = () => {
    if (parsedData && parsedData.objects.length > 0) {
      onImportConfirmed(
        parsedData.objects,
        parsedData.buildings,
        parsedData.rawJson,
        parsedData.summary
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Import DT Configuration JSON</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'file'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .JSON File</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'text'
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Raw JSON</span>
          </button>

          <button
            onClick={() => {
              onLoadSampleJaipur();
              onClose();
            }}
            className="ml-auto flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Jaipur Sample</span>
          </button>
        </div>

        {activeTab === 'file' ? (
          <div className="border-2 border-dashed border-slate-700 hover:border-brand-500 rounded-xl p-8 text-center transition-all bg-dark-900/50">
            <Upload className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              Drag & Drop your JSON configuration here
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports standard DT Command Center JSON format</p>
            <label className="mt-4 inline-block px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-brand-600/30 transition-all">
              <span>Browse File</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={6}
              value={jsonInputText}
              onChange={(e) => setJsonInputText(e.target.value)}
              placeholder="Paste DT Command Center JSON content here..."
              className="w-full bg-dark-900 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={handleTextProcess}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              Parse JSON Content
            </button>
          </div>
        )}

        {summary && (
          <div className="bg-dark-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Import Summary Parsed</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 font-medium">
              <div className="p-2 rounded bg-slate-800/60 flex justify-between">
                <span>📍 Places:</span>
                <span className="font-bold text-emerald-400">{summary.placesCount}</span>
              </div>
              <div className="p-2 rounded bg-slate-800/60 flex justify-between">
                <span>📷 CCTV Cameras:</span>
                <span className="font-bold text-blue-400">{summary.cctvCount}</span>
              </div>
              <div className="p-2 rounded bg-slate-800/60 flex justify-between">
                <span>🎥 360 Cameras:</span>
                <span className="font-bold text-purple-400">{summary.camera360Count}</span>
              </div>
              <div className="p-2 rounded bg-slate-800/60 flex justify-between">
                <span>🔄 PAT Cameras:</span>
                <span className="font-bold text-amber-400">{summary.patCount}</span>
              </div>
            </div>

            {summary.invalidCount > 0 && (
              <div className="text-xs text-red-400 flex items-center space-x-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Invalid records detected: {summary.invalidCount}</span>
              </div>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-300 max-h-24 overflow-y-auto space-y-1">
            {errors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-700 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={!summary || summary.totalCount === 0}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all"
          >
            Confirm & Render Map ({summary?.totalCount || 0} items)
          </button>
        </div>
      </div>
    </div>
  );
};
