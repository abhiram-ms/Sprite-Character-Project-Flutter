import React from 'react';
import { AnimationRow, SpriteSheetConfig } from '../types';
import { DEFAULT_ROWS, ART_STYLES, FACING_DIRECTIONS } from '../constants';
import { Wand2, RefreshCw } from 'lucide-react';

interface InputPanelProps {
  config: SpriteSheetConfig;
  setConfig: React.Dispatch<React.SetStateAction<SpriteSheetConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ config, setConfig, onGenerate, isGenerating }) => {
  
  const handleRowChange = (id: number, newName: string) => {
    setConfig(prev => ({
      ...prev,
      rows: prev.rows.map(r => r.id === id ? { ...r, name: newName } : r)
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig(prev => ({ ...prev, characterDescription: e.target.value }));
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig(prev => ({ ...prev, style: e.target.value }));
  };
  
  const handleFacingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig(prev => ({ ...prev, facing: e.target.value }));
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-green-400" />
          MadFroggys Setup
        </h2>
        <p className="text-slate-400 text-sm">Design your character and animations.</p>
      </div>

      <div className="space-y-6 flex-grow">
        
        {/* Character Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Character Description</label>
          <textarea
            value={config.characterDescription}
            onChange={handleDescriptionChange}
            placeholder="e.g., A cybernetic ninja with a glowing blue katana, wearing a hood and metallic armor..."
            className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            {/* Art Style */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Art Style</label>
                <select 
                    value={config.style} 
                    onChange={handleStyleChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
                >
                    {ART_STYLES.map(style => (
                        <option key={style} value={style}>{style}</option>
                    ))}
                </select>
            </div>

            {/* Facing */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Facing Direction</label>
                <select 
                    value={config.facing} 
                    onChange={handleFacingChange}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-green-500 outline-none"
                >
                    {FACING_DIRECTIONS.map(face => (
                        <option key={face} value={face}>{face}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Animation Rows */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">Animation Sequences (8 Rows)</label>
          <div className="space-y-2">
            {config.rows.map((row, index) => (
              <div key={row.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-md border border-slate-700/50">
                <span className="text-xs font-mono text-slate-500 w-6 shrink-0">R{index + 1}</span>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => handleRowChange(row.id, e.target.value)}
                  className="bg-transparent border-none text-sm text-slate-200 w-full focus:ring-0 placeholder-slate-600"
                  placeholder={`Animation for row ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="pt-6 mt-6 border-t border-slate-700 sticky bottom-0 bg-slate-800">
        <button
          onClick={onGenerate}
          disabled={isGenerating || !config.characterDescription.trim()}
          className={`w-full py-4 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
            ${isGenerating || !config.characterDescription.trim()
              ? 'bg-slate-600 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 active:scale-[0.98] shadow-green-500/25'
            }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Forging Sprites...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate Spritesheet
            </>
          )}
        </button>
      </div>
    </div>
  );
};