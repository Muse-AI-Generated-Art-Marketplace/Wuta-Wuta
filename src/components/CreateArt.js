import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Sparkles, 
  Upload, 
  Settings, 
  Zap,
  Image as ImageIcon,
  Type,
  Sliders
} from 'lucide-react';
import { useMuseStore } from '../store/museStore';
import { useWalletStore } from '../store/walletStore';
import AdvancedSettings from './AdvancedSettings';
import Loading from './ui/Loading';
import toast from 'react-hot-toast';

const CreateArt = ({ currentPrompt, setCurrentPrompt }) => {
  const { 
    createCollaborativeArtwork, 
    aiModels, 
    isLoading, 
    advancedParameters, 
    updateAdvancedParameters,
    parameterPresets,
    applyParameterPreset 
  } = useMuseStore();
  const { address } = useWalletStore();
  
  // Form state
  const [formData, setFormData] = useState({
    prompt: currentPrompt || '',
    aiModel: 'stable-diffusion',
    humanContribution: 60,
    aiContribution: 40,
    canEvolve: true,
    style: 'realistic',
    aspectRatio: '1:1',
    quality: 'high',
  });
  
  // Advanced settings state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [humanInput, setHumanInput] = useState(null);

  // Sync currentPrompt with formData
  useEffect(() => {
    if (currentPrompt !== formData.prompt) {
      setFormData(prev => ({
        ...prev,
        prompt: currentPrompt || ''
      }));
    }
  }, [currentPrompt]);

  // Update setCurrentPrompt when formData.prompt changes
  useEffect(() => {
    if (setCurrentPrompt) {
      setCurrentPrompt(formData.prompt);
    }
  }, [formData.prompt, setCurrentPrompt]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleContributionChange = (type, value) => {
    const otherType = type === 'human' ? 'ai' : 'human';
    const otherValue = 100 - value;
    
    setFormData(prev => ({
      ...prev,
      [`${type}Contribution`]: value,
      [`${otherType}Contribution`]: otherValue
    }));
  };
  
  const handleCanvasDraw = (e) => {
    if (!canvasRef.current || !isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support touch and mouse events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#8b5cf6';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const startDrawing = (e) => {
    // Prevent scrolling when touching canvas
    if (e.type.startsWith('touch')) {
        e.preventDefault();
    }
    setIsDrawing(true);
    handleCanvasDraw(e);
  };
  
  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      setIsDrawing(false);
      
      // Save canvas as image
      const imageData = canvasRef.current.toDataURL();
      setHumanInput(imageData);
    }
  };
  
  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHumanInput(null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!formData.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    try {
      const artwork = await createCollaborativeArtwork({
        ...formData,
        humanInput,
        contentHash: humanInput ? '0x' + btoa(humanInput).slice(0, 40) : '0x0000000000000000000000000000000000000000',
        advancedParameters: advancedParameters, // Include advanced parameters
      });
      
      toast.success('Artwork created successfully!');
      clearCanvas();
      setFormData({
        prompt: '',
        aiModel: 'stable-diffusion',
        humanContribution: 60,
        aiContribution: 40,
        canEvolve: true,
        style: 'realistic',
        aspectRatio: '1:1',
        quality: 'high',
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to create artwork');
    }
  };
  
  const handleAdvancedParametersChange = (newParameters) => {
    updateAdvancedParameters(newParameters);
  };
  
  const handlePresetApply = (presetParameters) => {
    updateAdvancedParameters(presetParameters);
    toast.success('Preset applied successfully!');
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">Create AI-Human Art</h1>
          <p className="text-sm sm:text-base text-gray-600">Collaborate with AI to create unique digital artwork</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column - Input */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Model Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
          >
            <div className="flex items-center mb-4 sm:mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mr-3">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">AI Model</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleInputChange('aiModel', model.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col ${
                    formData.aiModel === model.id
                      ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 w-full">
                    {model.type === 'image' ? (
                      <ImageIcon className={`w-5 h-5 ${formData.aiModel === model.id ? 'text-purple-600' : 'text-gray-400'}`} />
                    ) : (
                      <Type className={`w-5 h-5 ${formData.aiModel === model.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    )}
                    {formData.aiModel === model.id && (
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    )}
                  </div>
                  <div className={`text-sm font-bold ${formData.aiModel === model.id ? 'text-purple-900' : 'text-gray-700'}`}>{model.name}</div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{model.description || 'Advanced generation model'}</div>
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
          >
            <div className="flex items-center mb-4 sm:mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                <Type className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Art Prompt</h3>
            </div>
            
            <textarea
              value={formData.prompt}
              onChange={(e) => handleInputChange('prompt', e.target.value)}
              placeholder="Describe your artwork in detail... (e.g., 'A futuristic cyberpunk city with neon lights and flying cars at night')"
              className="w-full p-4 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all resize-none text-sm sm:text-base min-h-[120px]"
            />
            
            <div className="mt-4 flex flex-wrap gap-2">
              {['Cyberpunk', 'Watercolor', 'Photorealistic', 'Anime', 'Oil Painting', '3D Render'].map((style) => (
                <button
                  key={style}
                  onClick={() => handleInputChange('prompt', 
                    formData.prompt ? `${formData.prompt}, ${style.toLowerCase()} style` : `${style.toLowerCase()} style`
                  )}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg text-xs font-semibold transition-colors"
                >
                  +{style}
                </button>
              ))}
            </div>
          </motion.div>
          
          {/* Collaboration Split */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mr-3">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Collaboration Split</h3>
              </div>
              <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {formData.humanContribution}% / {formData.aiContribution}%
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="relative pt-1">
                {/* Custom track showing both colors */}
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex absolute top-[50%] -translate-y-1/2 pointer-events-none">
                  <div className="h-full bg-purple-500" style={{ width: `${formData.humanContribution}%` }}></div>
                  <div className="h-full bg-blue-500" style={{ width: `${formData.aiContribution}%` }}></div>
                </div>
                
                {/* The actual slider (invisible track, visible thumb) */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.humanContribution}
                  onChange={(e) => handleContributionChange('human', parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-transparent relative z-10 slider-thumb"
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="font-semibold text-gray-700">Human Control</span>
                </div>
                <div className="flex items-center">
                  <span className="font-semibold text-gray-700 mr-2">AI Freedom</span>
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                  <Settings className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Advanced Settings</h3>
              </div>
              <button
                onClick={() => setShowAdvancedSettings(true)}
                className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center space-x-1"
              >
                <Sliders className="w-3 h-3" />
                <span>AI Parameters</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Art Style</label>
                <select
                  value={formData.style}
                  onChange={(e) => handleInputChange('style', e.target.value)}
                  className="w-full p-3 bg-gray-50 border-transparent rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="realistic">Realistic</option>
                  <option value="abstract">Abstract</option>
                  <option value="surreal">Surreal</option>
                  <option value="cartoon">Cartoon</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => handleInputChange('aspectRatio', e.target.value)}
                  className="w-full p-3 bg-gray-50 border-transparent rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:3">Standard (4:3)</option>
                </select>
              </div>
              
              <div className="sm:col-span-2 mt-2">
                <label className="flex items-center p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.canEvolve}
                    onChange={(e) => handleInputChange('canEvolve', e.target.checked)}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 bg-white"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-gray-900">Allow Evolution</span>
                    <span className="block text-xs text-gray-500">Let other users build upon your artwork</span>
                  </div>
                </label>
              </div>
            </div>
            
            {/* Advanced Parameters Status */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-medium text-purple-700">Advanced AI Parameters</span>
                </div>
                <span className="text-xs text-purple-600">
                  {Object.keys(advancedParameters).length} parameters configured
                </span>
              </div>
              <div className="mt-2 text-xs text-purple-600">
                Guidance: {advancedParameters.guidanceScale.toFixed(1)} | 
                Steps: {advancedParameters.numInferenceSteps} | 
                Quality: {(advancedParameters.quality * 100).toFixed(0)}%
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Right Column - Canvas */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 sticky top-24"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center mr-3">
                  <Palette className="w-4 h-4 text-pink-600" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Sketch Pad</h3>
              </div>
              {humanInput && (
                <button
                  onClick={clearCanvas}
                  className="text-xs font-bold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="w-full h-full cursor-crosshair touch-none bg-white"
                onMouseDown={startDrawing}
                onMouseMove={handleCanvasDraw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={handleCanvasDraw}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                style={{ touchAction: 'none' }}
              />
              
              {!humanInput && !isDrawing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-400">
                  <Palette className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">Draw your base concept here</p>
                  <p className="text-xs mt-1">Optional, but improves results</p>
                </div>
              )}
            </div>
            
            {/* Create Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !address}
                className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center text-base sm:text-lg transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loading size="sm" />
                    Generating Magic...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Masterpiece
                  </>
                )}
              </button>
              
              {!address && (
                <p className="text-center text-xs font-bold text-red-500 mt-3 bg-red-50 py-2 rounded-lg">
                  Connect wallet to create
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Advanced Settings Modal */}
      <AdvancedSettings
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
        parameters={advancedParameters}
        onParametersChange={handleAdvancedParametersChange}
        presets={parameterPresets}
        onPresetApply={handlePresetApply}
      />
      
      {/* Styles for range slider thumb */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #8b5cf6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #8b5cf6;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
        }
      `}} />
    </div>
  );
};

export default CreateArt;
