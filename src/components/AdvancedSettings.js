import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Zap, 
  Brain, 
  Image as ImageIcon,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Cpu,
  Palette
} from 'lucide-react';

const DEFAULT_PARAMETERS = {
  temperature: 0.8,
  topK: 50,
  topP: 0.9,
  guidanceScale: 7.5,
  numInferenceSteps: 50,
  seed: -1,
  width: 512,
  height: 512,
  quality: 0.9,
  sharpness: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  strength: 0.8,
  noiseLevel: 0.1,
  detailEnhancement: 0.5,
  colorHarmony: 0.7,
  compositionBalance: 0.6,
  batchSize: 1,
  enableAttentionSlicing: true,
  enableCpuOffload: false,
  enableModelCaching: true,
  maxGenerationTime: 120,
  negativePrompt: '',
  promptWeighting: true,
  crossAttentionControl: 0.5,
  selfAttentionControl: 0.3,
  temporalConsistency: 0.8,
  modelVersion: 'latest',
  customModelPath: '',
  loraStrength: 0.7,
  controlNetStrength: 0.8,
  embeddingStrength: 0.6
};

const AdvancedSettings = ({ 
  isOpen, 
  onClose, 
  parameters, 
  onParametersChange,
  presets = [],
  onPresetApply
}) => {
  const [activeTab, setActiveTab] = useState('generation');
  const [showPresets, setShowPresets] = useState(false);
  const [localParameters, setLocalParameters] = useState({ ...DEFAULT_PARAMETERS, ...parameters });

  useEffect(() => {
    setLocalParameters({ ...DEFAULT_PARAMETERS, ...parameters });
  }, [parameters]);

  const handleParameterChange = (key, value) => {
    const newParams = { ...localParameters, [key]: value };
    setLocalParameters(newParams);
    onParametersChange(newParams);
  };

  const resetToDefaults = () => {
    setLocalParameters(DEFAULT_PARAMETERS);
    onParametersChange(DEFAULT_PARAMETERS);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(localParameters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'muse-advanced-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setLocalParameters({ ...DEFAULT_PARAMETERS, ...imported });
          onParametersChange({ ...DEFAULT_PARAMETERS, ...imported });
        } catch (error) {
          console.error('Failed to import settings:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'generation', label: 'Generation', icon: Sparkles },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'advanced', label: 'Advanced AI', icon: Brain }
  ];

  const renderParameterControl = (key, config) => {
    const value = localParameters[key];
    
    switch (config.type) {
      case 'slider':
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                {config.label}
                {config.description && (
                  <div className="group relative ml-2">
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {config.description}
                    </div>
                  </div>
                )}
              </label>
              <span className="text-sm font-mono text-gray-600">
                {typeof value === 'number' ? value.toFixed(2) : value}
              </span>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step || 0.01}
              value={value}
              onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        );
        
      case 'select':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              {config.label}
              {config.description && (
                <div className="group relative ml-2">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {config.description}
                  </div>
                </div>
              )}
            </label>
            <select
              value={value}
              onChange={(e) => handleParameterChange(key, config.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {config.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'text':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              {config.label}
              {config.description && (
                <div className="group relative ml-2">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {config.description}
                  </div>
                </div>
              )}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              placeholder={config.placeholder}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        );
        
      case 'textarea':
        return (
          <div key={key} className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              {config.label}
              {config.description && (
                <div className="group relative ml-2">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {config.description}
                  </div>
                </div>
              )}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              placeholder={config.placeholder}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={key} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleParameterChange(key, e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label className="text-sm font-medium text-gray-700 flex items-center">
              {config.label}
              {config.description && (
                <div className="group relative ml-2">
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {config.description}
                  </div>
                </div>
              )}
            </label>
          </div>
        );
        
      default:
        return null;
    }
  };

  const parameterConfigs = {
    generation: [
      {
        key: 'temperature',
        type: 'slider',
        label: 'Temperature',
        description: 'Controls randomness in generation. Higher values create more diverse outputs.',
        min: 0.1,
        max: 2.0,
        step: 0.1
      },
      {
        key: 'topK',
        type: 'slider',
        label: 'Top K',
        description: 'Limits vocabulary to top K tokens. Lower values create more focused outputs.',
        min: 1,
        max: 100,
        step: 1
      },
      {
        key: 'topP',
        type: 'slider',
        label: 'Top P',
        description: 'Nucleus sampling. Controls cumulative probability threshold.',
        min: 0.1,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'guidanceScale',
        type: 'slider',
        label: 'Guidance Scale',
        description: 'How strongly to follow the prompt. Higher values stick closer to the prompt.',
        min: 1.0,
        max: 20.0,
        step: 0.5
      },
      {
        key: 'numInferenceSteps',
        type: 'slider',
        label: 'Inference Steps',
        description: 'Number of denoising steps. More steps can improve quality but take longer.',
        min: 10,
        max: 150,
        step: 5
      },
      {
        key: 'seed',
        type: 'text',
        label: 'Seed',
        description: 'Random seed for reproducible results. Use -1 for random.',
        placeholder: 'Enter seed number or -1 for random'
      }
    ],
    image: [
      {
        key: 'width',
        type: 'select',
        label: 'Width',
        description: 'Image width in pixels.',
        options: [
          { value: 256, label: '256px' },
          { value: 512, label: '512px' },
          { value: 768, label: '768px' },
          { value: 1024, label: '1024px' }
        ]
      },
      {
        key: 'height',
        type: 'select',
        label: 'Height',
        description: 'Image height in pixels.',
        options: [
          { value: 256, label: '256px' },
          { value: 512, label: '512px' },
          { value: 768, label: '768px' },
          { value: 1024, label: '1024px' }
        ]
      },
      {
        key: 'quality',
        type: 'slider',
        label: 'Quality',
        description: 'Overall image quality and detail level.',
        min: 0.1,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'sharpness',
        type: 'slider',
        label: 'Sharpness',
        description: 'Image sharpness and clarity.',
        min: 0.0,
        max: 2.0,
        step: 0.1
      },
      {
        key: 'contrast',
        type: 'slider',
        label: 'Contrast',
        description: 'Image contrast and dynamic range.',
        min: 0.0,
        max: 2.0,
        step: 0.1
      },
      {
        key: 'saturation',
        type: 'slider',
        label: 'Saturation',
        description: 'Color intensity and vibrancy.',
        min: 0.0,
        max: 2.0,
        step: 0.1
      }
    ],
    style: [
      {
        key: 'strength',
        type: 'slider',
        label: 'Generation Strength',
        description: 'How much to transform the input. Lower values preserve more of the original.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'noiseLevel',
        type: 'slider',
        label: 'Noise Level',
        description: 'Amount of noise to add for variation.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'detailEnhancement',
        type: 'slider',
        label: 'Detail Enhancement',
        description: 'Enhance fine details and textures.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'colorHarmony',
        type: 'slider',
        label: 'Color Harmony',
        description: 'Balance and coordination of colors.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'compositionBalance',
        type: 'slider',
        label: 'Composition Balance',
        description: 'Overall composition and visual balance.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      }
    ],
    performance: [
      {
        key: 'batchSize',
        type: 'slider',
        label: 'Batch Size',
        description: 'Number of images to generate at once.',
        min: 1,
        max: 4,
        step: 1
      },
      {
        key: 'enableAttentionSlicing',
        type: 'checkbox',
        label: 'Attention Slicing',
        description: 'Reduce memory usage by slicing attention computations.'
      },
      {
        key: 'enableCpuOffload',
        type: 'checkbox',
        label: 'CPU Offload',
        description: 'Offload some computations to CPU to save GPU memory.'
      },
      {
        key: 'enableModelCaching',
        type: 'checkbox',
        label: 'Model Caching',
        description: 'Keep models in memory for faster subsequent generations.'
      },
      {
        key: 'maxGenerationTime',
        type: 'slider',
        label: 'Max Generation Time (seconds)',
        description: 'Maximum time to wait for generation before timeout.',
        min: 30,
        max: 300,
        step: 10
      }
    ],
    advanced: [
      {
        key: 'negativePrompt',
        type: 'textarea',
        label: 'Negative Prompt',
        description: 'Describe what you want to avoid in the generation.',
        placeholder: 'e.g., blurry, low quality, distorted, ugly'
      },
      {
        key: 'promptWeighting',
        type: 'checkbox',
        label: 'Prompt Weighting',
        description: 'Enable weighted prompts using parentheses and numbers.'
      },
      {
        key: 'crossAttentionControl',
        type: 'slider',
        label: 'Cross Attention Control',
        description: 'Control how the model attends to different parts of the prompt.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'selfAttentionControl',
        type: 'slider',
        label: 'Self Attention Control',
        description: 'Control internal attention mechanisms.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'temporalConsistency',
        type: 'slider',
        label: 'Temporal Consistency',
        description: 'Maintain consistency across frames or generations.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'modelVersion',
        type: 'select',
        label: 'Model Version',
        description: 'Choose which version of the model to use.',
        options: [
          { value: 'latest', label: 'Latest' },
          { value: 'stable', label: 'Stable' },
          { value: 'experimental', label: 'Experimental' }
        ]
      },
      {
        key: 'loraStrength',
        type: 'slider',
        label: 'LoRA Strength',
        description: 'Strength of LoRA adaptations if applied.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      },
      {
        key: 'controlNetStrength',
        type: 'slider',
        label: 'ControlNet Strength',
        description: 'Strength of ControlNet guidance if used.',
        min: 0.0,
        max: 1.0,
        step: 0.05
      }
    ]
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Advanced AI Settings</h2>
                  <p className="text-purple-100 text-sm">Fine-tune AI parameters for power users</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parameterConfigs[activeTab]?.map((config) => 
                renderParameterControl(config.key, config)
              )}
            </div>
          </div>

          {/* Presets Section */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <Zap className="w-4 h-4" />
                <span>Presets</span>
                {showPresets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="hidden"
                  id="import-settings"
                />
                <label
                  htmlFor="import-settings"
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Import
                </label>
                <button
                  onClick={exportSettings}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Export
                </button>
                <button
                  onClick={resetToDefaults}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showPresets && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2"
                >
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => onPresetApply && onPresetApply(preset.parameters)}
                      className="p-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Apply Settings</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedSettings;
