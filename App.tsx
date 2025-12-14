import React, { useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { SpriteSheetConfig } from './types';
import { DEFAULT_ROWS, ART_STYLES, FACING_DIRECTIONS } from './constants';
import { generateSpriteSheet } from './services/geminiService';
import { Info } from 'lucide-react';

const App: React.FC = () => {
  // Application State
  const [config, setConfig] = useState<SpriteSheetConfig>({
    characterDescription: '',
    rows: DEFAULT_ROWS,
    style: ART_STYLES[0],
    facing: FACING_DIRECTIONS[0],
  });

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const base64Image = await generateSpriteSheet(config);
      setGeneratedImage(base64Image);
    } catch (err: any) {
      const message = err.message || "Failed to generate sprite sheet.";
      console.error(err);
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
               <span className="font-bold text-white text-lg">M</span>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              MadFroggys Sprite Creator
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4" />
                <span>How it works</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-64px)] overflow-hidden">
        
        {/* Left Column: Controls (4/12) */}
        <div className="lg:col-span-4 h-full min-h-0">
          <InputPanel 
            config={config} 
            setConfig={setConfig} 
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Column: Preview (8/12) */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col gap-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg text-sm flex items-center justify-between">
                    <div><strong>Error:</strong> {error}</div>
                </div>
            )}
            
            <PreviewPanel 
                imageData={generatedImage} 
                rows={config.rows}
            />
        </div>
      </main>
    </div>
  );
};

export default App;