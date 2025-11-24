import React, { useState, useCallback } from 'react';
import { X, Wand2, MapPin } from 'lucide-react';
import { Button } from './Button';
import { generateLocationNote } from '../services/geminiService';
import { Coordinates } from '../types';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (message: string) => void;
  coordinates: Coordinates | null;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSave, coordinates }) => {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!coordinates) return;
    setIsGenerating(true);
    try {
      const note = await generateLocationNote(coordinates.lat, coordinates.lng);
      setMessage(note);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }, [coordinates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSave(message);
      setMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Drop a Memory
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What's on your mind?
            </label>
            <textarea
              className="w-full h-32 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-slate-700 placeholder:text-slate-400"
              placeholder="Record a thought for this location..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerate}
              isLoading={isGenerating}
              icon={<Wand2 className="w-4 h-4 text-purple-500" />}
              className="text-xs"
            >
              AI Inspiration
            </Button>

            <Button type="submit" disabled={!message.trim()}>
              Pin It
            </Button>
          </div>
          
          {coordinates && (
            <p className="text-xs text-center text-slate-400 font-mono mt-4">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
