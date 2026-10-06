import React from 'react';
import { ShieldCheck, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import type { ValidationError } from '../types/config';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationError[];
  onSelectObject: (id: number | string) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  issues,
  onSelectObject,
}) => {
  if (!isOpen) return null;

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-base text-white">Configuration Validation Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {issues.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="font-bold text-slate-200 text-sm">All Checks Passed Cleanly!</p>
            <p className="text-xs text-slate-400">
              No schema errors, duplicate IDs, out-of-bounds cameras, or coordinate violations detected.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {errors.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase text-red-400 tracking-wide flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Errors ({errors.length})</span>
                </div>
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (err.objectId) onSelectObject(err.objectId);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-colors"
                  >
                    <span>{err.message}</span>
                    {err.objectId && (
                      <span className="text-[10px] bg-red-950 px-1.5 py-0.5 rounded font-mono">
                        Jump to #{err.objectId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-bold uppercase text-amber-400 tracking-wide flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Warnings ({warnings.length})</span>
                </div>
                {warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (warn.objectId) onSelectObject(warn.objectId);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors"
                  >
                    <span>{warn.message}</span>
                    {warn.objectId && (
                      <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded font-mono">
                        Jump to #{warn.objectId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
