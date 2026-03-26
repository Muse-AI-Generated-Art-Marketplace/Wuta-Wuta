// Parameter validation utilities for advanced AI settings

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);

export const validateParameter = (key, value, rules) => {
  const rule = rules[key];
  if (!rule) return { isValid: true, error: null };

  const formatNumber = (number) => (Number.isInteger(number) ? number.toFixed(1) : String(number));
  
  // Type validation
  if (rule.type === 'number') {
    if (typeof value !== 'number' || isNaN(value)) {
      return { isValid: false, error: `${key} must be a valid number` };
    }
    
    // Range validation
    if (rule.min !== undefined && value < rule.min) {
      return { isValid: false, error: `${key} must be at least ${formatNumber(rule.min)}` };
    }
    
    if (rule.max !== undefined && value > rule.max) {
      return { isValid: false, error: `${key} must be at most ${formatNumber(rule.max)}` };
    }
  }
  
  if (rule.type === 'string' && typeof value !== 'string') {
    return { isValid: false, error: `${key} must be a string` };
  }
  
  if (rule.type === 'boolean' && typeof value !== 'boolean') {
    return { isValid: false, error: `${key} must be true or false` };
  }
  
  if (rule.type === 'array' && !Array.isArray(value)) {
    return { isValid: false, error: `${key} must be an array` };
  }
  
  // Custom validation
  if (rule.validator && typeof rule.validator === 'function') {
    const customResult = rule.validator(value);
    if (!customResult.isValid) {
      return customResult;
    }
  }
  
  return { isValid: true, error: null };
};

export const validateParameters = (parameters, validationRules) => {
  const errors = [];
  const warnings = [];
  const formatNumber = (number) => (Number.isInteger(number) ? number.toFixed(1) : String(number));
  
  Object.keys(parameters).forEach(key => {
    const value = parameters[key];
    const rule = validationRules[key];
    
    if (rule) {
      const result = validateParameter(key, value, { [key]: rule });
      
      if (!result.isValid) {
        errors.push(result.error);
      }
      
      // Check for warnings
      if (rule.warningThreshold) {
        if (rule.warningThreshold.min !== undefined && value < rule.warningThreshold.min) {
          warnings.push(`${key} is below recommended minimum of ${formatNumber(rule.warningThreshold.min)}`);
        }
        if (rule.warningThreshold.max !== undefined && value > rule.warningThreshold.max) {
          warnings.push(`${key} is above recommended maximum of ${formatNumber(rule.warningThreshold.max)}`);
        }
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

export const getParameterRecommendations = (parameters, modelType = 'image') => {
  const recommendations = [];
  
  // Model-specific recommendations
  if (modelType === 'image') {
    if (parameters.guidanceScale > 12) {
      recommendations.push({
        type: 'warning',
        message: 'High guidance scale may produce overly saturated results',
        parameter: 'guidanceScale',
        suggestedValue: 7.5
      });
    }
    
    if (parameters.numInferenceSteps > 100) {
      recommendations.push({
        type: 'info',
        message: 'High step count will significantly increase generation time',
        parameter: 'numInferenceSteps',
        suggestedValue: 50
      });
    }
    
    if (parameters.quality < 0.5) {
      recommendations.push({
        type: 'warning',
        message: 'Low quality settings may produce poor results',
        parameter: 'quality',
        suggestedValue: 0.9
      });
    }
  }
  
  // Performance recommendations
  if (parameters.enableCpuOffload && parameters.batchSize > 2) {
    recommendations.push({
      type: 'warning',
      message: 'CPU offload with large batch size may be very slow',
      parameter: 'batchSize',
      suggestedValue: 1
    });
  }
  
  return recommendations;
};

export const optimizeParametersForPerformance = (parameters, constraints = {}) => {
  const optimized = { ...parameters };
  const { 
    maxGenerationTime = 120, 
    preferQuality = false, 
    memoryLimit = 'medium' 
  } = constraints;
  
  // Time-based optimization
  if (maxGenerationTime < 60) {
    optimized.numInferenceSteps = Math.min(optimized.numInferenceSteps, 20);
    optimized.enableAttentionSlicing = true;
    optimized.batchSize = 1;
  } else if (maxGenerationTime < 120) {
    optimized.numInferenceSteps = Math.min(optimized.numInferenceSteps, 50);
  }
  
  // Memory-based optimization
  if (memoryLimit === 'low') {
    optimized.enableAttentionSlicing = true;
    optimized.enableCpuOffload = true;
    optimized.batchSize = 1;
    optimized.width = Math.min(optimized.width, 512);
    optimized.height = Math.min(optimized.height, 512);
  } else if (memoryLimit === 'high') {
    optimized.enableAttentionSlicing = false;
    optimized.enableCpuOffload = false;
    optimized.enableModelCaching = true;
  }
  
  // Quality vs speed preference
  if (!preferQuality) {
    optimized.numInferenceSteps = Math.min(optimized.numInferenceSteps, 30);
    optimized.quality = Math.min(optimized.quality, 0.8);
  } else {
    optimized.numInferenceSteps = Math.max(optimized.numInferenceSteps, 50);
    optimized.quality = Math.max(optimized.quality, 0.9);
  }
  
  return optimized;
};

export const compareParameters = (params1, params2) => {
  const differences = {};
  const allKeys = new Set([...Object.keys(params1), ...Object.keys(params2)]);
  
  allKeys.forEach(key => {
    const val1 = params1[key];
    const val2 = params2[key];
    
    if (val1 !== val2) {
      differences[key] = {
        original: val1,
        modified: val2,
        change: val1 === undefined ? 'added' : 
                val2 === undefined ? 'removed' : 'modified'
      };
    }
  });
  
  return {
    hasChanges: Object.keys(differences).length > 0,
    differences,
    changeCount: Object.keys(differences).length
  };
};

export const generateParameterHash = (parameters) => {
  // Create a deterministic hash of parameter values for caching/comparison
  const sortedKeys = Object.keys(parameters).sort();
  const paramString = sortedKeys.map(key => `${key}:${parameters[key]}`).join('|');
  
  // Simple hash function (for production, consider using crypto)
  let hash = 0;
  for (let i = 0; i < paramString.length; i++) {
    const char = paramString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return hash.toString(36);
};

export const sanitizeParameters = (parameters) => {
  const sanitized = {};
  
  Object.keys(parameters).forEach(key => {
    const value = parameters[key];
    
    // Remove undefined/null values
    if (value === undefined || value === null) {
      return;
    }
    
    // Sanitize strings
    if (typeof value === 'string') {
      sanitized[key] = escapeHtml(value.trim());
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};
