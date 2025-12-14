import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SliceSettings, AnimationRow } from '../types';
import { PREVIEW_SPEEDS } from '../constants';
import { Play, Pause, Download, Settings2, Grid, Layers, Eraser, RotateCcw, FileArchive, FileImage } from 'lucide-react';
import JSZip from 'jszip';

interface PreviewPanelProps {
  imageData: string | null;
  rows: AnimationRow[];
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ imageData, rows }) => {
  // State
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(12);
  const [showGrid, setShowGrid] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Used to force update
  
  // Canvas Refs
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation State
  const requestRef = useRef<number>(0);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Slicing Settings
  const [sliceSettings, setSliceSettings] = useState<SliceSettings>({
    rows: 8,
    cols: 8,
    paddingX: 0,
    paddingY: 0,
    offsetX: 0,
    offsetY: 0,
    removeBackground: true,
    backgroundColorToRemove: '#00ff00',
    tolerance: 30,
  });

  // Load and Draw Image to Source Canvas
  useEffect(() => {
    if (!imageData || !sourceCanvasRef.current) return;
    
    const canvas = sourceCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageData;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply background removal if requested
      if (sliceSettings.removeBackground) {
        removeBackground(ctx, canvas.width, canvas.height);
      }
    };
  }, [imageData, sliceSettings.removeBackground, sliceSettings.backgroundColorToRemove, sliceSettings.tolerance, updateTrigger]);


  // Background Removal Logic
  const removeBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const hex = sliceSettings.backgroundColorToRemove.replace('#', '');
    const rT = parseInt(hex.substring(0, 2), 16);
    const gT = parseInt(hex.substring(2, 4), 16);
    const bT = parseInt(hex.substring(4, 6), 16);
    const tol = sliceSettings.tolerance;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Calculate distance roughly
      if (
        Math.abs(r - rT) <= tol &&
        Math.abs(g - gT) <= tol &&
        Math.abs(b - bT) <= tol
      ) {
        data[i + 3] = 0; // Set alpha to 0
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // Animation Loop
  const animate = useCallback((time: number) => {
    if (!isPlaying || !imageData || !sourceCanvasRef.current || !previewCanvasRef.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const interval = 1000 / fps;
    const delta = time - lastFrameTimeRef.current;

    if (delta > interval) {
      const srcCanvas = sourceCanvasRef.current;
      const prevCanvas = previewCanvasRef.current;
      const prevCtx = prevCanvas.getContext('2d');
      
      if (prevCtx) {
        const totalCols = sliceSettings.cols;
        const totalRows = sliceSettings.rows;
        
        const cellWidth = srcCanvas.width / totalCols;
        const cellHeight = srcCanvas.height / totalRows;
        
        // Calculate source coordinates
        // Apply offsets/padding to fine tune
        const frameWidth = cellWidth - (sliceSettings.paddingX * 2);
        const frameHeight = cellHeight - (sliceSettings.paddingY * 2);
        
        const sx = (frameIndexRef.current * cellWidth) + sliceSettings.paddingX + sliceSettings.offsetX;
        const sy = (selectedRowIndex * cellHeight) + sliceSettings.paddingY + sliceSettings.offsetY;

        // Clear and Draw
        prevCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
        
        // Use nearest neighbor for crisp pixel art look if scaled up
        prevCtx.imageSmoothingEnabled = false;

        prevCtx.drawImage(
          srcCanvas,
          Math.max(0, sx), Math.max(0, sy), // Source position
          Math.min(srcCanvas.width - sx, frameWidth), Math.min(srcCanvas.height - sy, frameHeight), // Source dimensions
          0, 0, // Dest position
          prevCanvas.width, prevCanvas.height // Dest dimensions
        );
      }

      frameIndexRef.current = (frameIndexRef.current + 1) % sliceSettings.cols;
      lastFrameTimeRef.current = time;
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [isPlaying, fps, imageData, selectedRowIndex, sliceSettings, updateTrigger]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Force Update
  const handleUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  // Download Handlers
  const handleDownloadPNG = () => {
    if (!sourceCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'MadFroggys_spritesheet.png';
    link.href = sourceCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleDownloadJPG = () => {
    if (!sourceCanvasRef.current) return;
    // JPG does not support transparency, draw to white background first
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvasRef.current.width;
    canvas.height = sourceCanvasRef.current.height;
    const ctx = canvas.getContext('2d');
    if(ctx) {
        ctx.fillStyle = '#000000'; // Black background for sprites usually better than white if artifacts
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.drawImage(sourceCanvasRef.current, 0, 0);
        const link = document.createElement('a');
        link.download = 'MadFroggys_spritesheet.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    }
  };

  const handleDownloadZIP = async () => {
    if (!sourceCanvasRef.current) return;
    const zip = new JSZip();
    const srcCanvas = sourceCanvasRef.current;
    
    const totalCols = sliceSettings.cols;
    const totalRows = sliceSettings.rows;
    const cellWidth = srcCanvas.width / totalCols;
    const cellHeight = srcCanvas.height / totalRows;
    const frameWidth = cellWidth - (sliceSettings.paddingX * 2);
    const frameHeight = cellHeight - (sliceSettings.paddingY * 2);

    // Create a temp canvas for slicing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if(!tempCtx) return;

    for (let r = 0; r < totalRows; r++) {
        const rowName = rows[r]?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || `row_${r}`;
        const rowFolder = zip.folder(rowName);
        
        for (let c = 0; c < totalCols; c++) {
            const sx = (c * cellWidth) + sliceSettings.paddingX + sliceSettings.offsetX;
            const sy = (r * cellHeight) + sliceSettings.paddingY + sliceSettings.offsetY;
            
            tempCtx.clearRect(0, 0, frameWidth, frameHeight);
            tempCtx.drawImage(
                srcCanvas, 
                sx, sy, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
            );
            
            const blob = await new Promise<Blob | null>(resolve => tempCanvas.toBlob(resolve, 'image/png'));
            if (blob && rowFolder) {
                rowFolder.file(`${rowName}_frame_${c}.png`, blob);
            }
        }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "MadFroggys_Sprites_Separate.zip";
    link.click();
  };

  if (!imageData) {
    return (
      <div className="h-full bg-slate-800 rounded-xl shadow-lg border border-slate-700 flex items-center justify-center p-12">
        <div className="text-center text-slate-500">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No Sprite Sheet Generated</h3>
          <p>Configure your character and click "Generate" to start.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
        {/* Main Preview Area */}
        <div className="flex gap-6 h-[400px]">
            {/* Left: Full Sheet View */}
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col min-w-0">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Grid className="w-4 h-4" /> Full Sheet
                    </h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => setShowGrid(!showGrid)}
                            className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                            title="Toggle Grid Overlay"
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <div className="relative flex-1 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center checkerboard border border-slate-700">
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                        <canvas 
                            ref={sourceCanvasRef} 
                            className="max-w-full max-h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                        />
                        {/* CSS Grid Overlay */}
                        {showGrid && (
                            <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-8 w-full h-full" style={{
                                width: sourceCanvasRef.current ? Math.min(sourceCanvasRef.current.offsetWidth, (sourceCanvasRef.current.offsetHeight * (sourceCanvasRef.current.width/sourceCanvasRef.current.height))) : '100%',
                                aspectRatio: '1/1',
                            }}>
                                {Array.from({ length: 64 }).map((_, i) => (
                                    <div key={i} className="border border-white/20"></div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Live Animation Preview */}
            <div className="w-[300px] bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col shrink-0">
                <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4" /> Live Preview
                </h3>
                
                {/* Animation Canvas */}
                <div className="aspect-square bg-slate-900 rounded-lg mb-4 checkerboard border border-slate-700 flex items-center justify-center overflow-hidden relative">
                    <canvas 
                        ref={previewCanvasRef} 
                        width={128} 
                        height={128} 
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                    />
                     <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white font-mono">
                        {rows[selectedRowIndex]?.name}
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-4">
                     {/* Row Selector */}
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Select Animation</label>
                        <select 
                            value={selectedRowIndex} 
                            onChange={(e) => {
                                setSelectedRowIndex(Number(e.target.value));
                                frameIndexRef.current = 0;
                            }}
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded p-2"
                        >
                            {rows.map((row, i) => (
                                <option key={row.id} value={i}>Row {i+1}: {row.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-2 justify-between">
                         <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        
                        <div className="flex bg-slate-900 rounded-md p-0.5 border border-slate-700">
                             {PREVIEW_SPEEDS.map((s) => (
                                 <button
                                    key={s.label}
                                    onClick={() => setFps(s.fps)}
                                    className={`px-2 py-1.5 text-xs rounded-sm transition-colors ${fps === s.fps ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                    title={`${s.fps} FPS`}
                                 >
                                     {s.label}
                                 </button>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom: Settings & Tools */}
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Fine Tuning
                </h3>
                <button 
                    onClick={handleUpdate}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" />
                    Update Preview
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Slicing Adjustments */}
                 <div className="space-y-3">
                     <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grid Alignment</h4>
                     <div className="grid grid-cols-2 gap-2">
                         <div>
                             <label className="text-xs text-slate-400">Offset X</label>
                             <input type="number" value={sliceSettings.offsetX} onChange={e => setSliceSettings({...sliceSettings, offsetX: Number(e.target.value)})} className="w-full bg-slate-900 border-slate-700 rounded text-sm p-1 text-slate-200" />
                         </div>
                         <div>
                             <label className="text-xs text-slate-400">Offset Y</label>
                             <input type="number" value={sliceSettings.offsetY} onChange={e => setSliceSettings({...sliceSettings, offsetY: Number(e.target.value)})} className="w-full bg-slate-900 border-slate-700 rounded text-sm p-1 text-slate-200" />
                         </div>
                         <div>
                             <label className="text-xs text-slate-400">Padding X</label>
                             <input type="number" value={sliceSettings.paddingX} onChange={e => setSliceSettings({...sliceSettings, paddingX: Number(e.target.value)})} className="w-full bg-slate-900 border-slate-700 rounded text-sm p-1 text-slate-200" />
                         </div>
                         <div>
                             <label className="text-xs text-slate-400">Padding Y</label>
                             <input type="number" value={sliceSettings.paddingY} onChange={e => setSliceSettings({...sliceSettings, paddingY: Number(e.target.value)})} className="w-full bg-slate-900 border-slate-700 rounded text-sm p-1 text-slate-200" />
                         </div>
                     </div>
                 </div>

                 {/* Transparency Tools */}
                 <div className="space-y-3">
                     <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                         <Eraser className="w-3 h-3" /> Transparency
                    </h4>
                     <div className="flex items-center gap-2 mb-2">
                         <input 
                            type="checkbox" 
                            id="removeBg"
                            checked={sliceSettings.removeBackground} 
                            onChange={e => setSliceSettings({...sliceSettings, removeBackground: e.target.checked})}
                            className="rounded bg-slate-900 border-slate-700 text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="removeBg" className="text-sm text-slate-300">Remove Background</label>
                     </div>
                     <div className="flex gap-2 items-center">
                         <input 
                            type="color" 
                            value={sliceSettings.backgroundColorToRemove}
                            onChange={e => setSliceSettings({...sliceSettings, backgroundColorToRemove: e.target.value})}
                            className="h-8 w-8 rounded cursor-pointer bg-transparent border-none p-0"
                            title="Pick color to remove"
                        />
                        <div className="flex-1">
                             <label className="text-xs text-slate-400 block">Tolerance ({sliceSettings.tolerance})</label>
                             <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={sliceSettings.tolerance}
                                onChange={e => setSliceSettings({...sliceSettings, tolerance: Number(e.target.value)})}
                                className="w-full accent-green-500"
                             />
                        </div>
                     </div>
                     <p className="text-xs text-slate-500 italic">
                        Tip: Select "Remove Background" to make the sprite background transparent.
                     </p>
                 </div>

                 {/* Action Area */}
                 <div className="flex flex-col gap-2 justify-end">
                     <button 
                        onClick={handleDownloadPNG}
                        className="w-full bg-white text-slate-900 font-bold py-2.5 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                     >
                         <Download className="w-4 h-4" />
                         Download PNG
                     </button>
                     <div className="flex gap-2">
                         <button 
                            onClick={handleDownloadJPG}
                            className="flex-1 bg-slate-700 text-slate-200 font-medium py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm"
                         >
                             <FileImage className="w-3 h-3" />
                             JPG
                         </button>
                         <button 
                            onClick={handleDownloadZIP}
                            className="flex-1 bg-slate-700 text-slate-200 font-medium py-2 rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 text-sm"
                         >
                             <FileArchive className="w-3 h-3" />
                             ZIP
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    </div>
  );
};