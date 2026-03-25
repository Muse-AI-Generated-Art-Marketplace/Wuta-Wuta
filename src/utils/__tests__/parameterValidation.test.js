import {
  validateParameter,
  validateParameters,
  getParameterRecommendations,
  optimizeParametersForPerformance,
  compareParameters,
  generateParameterHash,
  sanitizeParameters
} from '../parameterValidation';

describe('Parameter Validation Utils', () => {
  describe('validateParameter', () => {
    const rules = {
      temperature: { type: 'number', min: 0.1, max: 2.0 },
      name: { type: 'string' },
      enabled: { type: 'boolean' },
      tags: { type: 'array' }
    };

    test('validates valid number parameters', () => {
      const result = validateParameter('temperature', 1.0, rules);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects invalid number types', () => {
      const result = validateParameter('temperature', 'not-a-number', rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('temperature must be a valid number');
    });

    test('rejects numbers below minimum', () => {
      const result = validateParameter('temperature', 0.05, rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('temperature must be at least 0.1');
    });

    test('rejects numbers above maximum', () => {
      const result = validateParameter('temperature', 2.5, rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('temperature must be at most 2.0');
    });

    test('validates string parameters', () => {
      const result = validateParameter('name', 'test', rules);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects invalid string types', () => {
      const result = validateParameter('name', 123, rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('name must be a string');
    });

    test('validates boolean parameters', () => {
      const result = validateParameter('enabled', true, rules);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects invalid boolean types', () => {
      const result = validateParameter('enabled', 'true', rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('enabled must be true or false');
    });

    test('validates array parameters', () => {
      const result = validateParameter('tags', ['tag1', 'tag2'], rules);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('rejects invalid array types', () => {
      const result = validateParameter('tags', 'not-an-array', rules);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('tags must be an array');
    });

    test('handles unknown parameters', () => {
      const result = validateParameter('unknown', 'value', rules);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('supports custom validators', () => {
      const customRules = {
        email: {
          type: 'string',
          validator: (value) => ({
            isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            error: 'Invalid email format'
          })
        }
      };

      const validResult = validateParameter('email', 'test@example.com', customRules);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateParameter('email', 'invalid-email', customRules);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Invalid email format');
    });
  });

  describe('validateParameters', () => {
    const validationRules = {
      temperature: { type: 'number', min: 0.1, max: 2.0 },
      guidanceScale: { 
        type: 'number', 
        min: 1.0, 
        max: 20.0,
        warningThreshold: { min: 5.0, max: 12.0 }
      }
    };

    test('validates all parameters successfully', () => {
      const params = { temperature: 0.8, guidanceScale: 7.5 };
      const result = validateParameters(params, validationRules);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.hasWarnings).toBe(false);
    });

    test('collects validation errors', () => {
      const params = { temperature: 3.0, guidanceScale: 0.5 };
      const result = validateParameters(params, validationRules);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('temperature must be at most 2.0');
      expect(result.errors).toContain('guidanceScale must be at least 1.0');
    });

    test('generates warnings for threshold violations', () => {
      const params = { temperature: 0.8, guidanceScale: 15.0 };
      const result = validateParameters(params, validationRules);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings).toContain('guidanceScale is above recommended maximum of 12.0');
      expect(result.hasWarnings).toBe(true);
    });

    test('handles empty parameters', () => {
      const result = validateParameters({}, validationRules);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getParameterRecommendations', () => {
    test('provides recommendations for high guidance scale', () => {
      const params = { guidanceScale: 15.0 };
      const recommendations = getParameterRecommendations(params, 'image');
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('warning');
      expect(recommendations[0].parameter).toBe('guidanceScale');
      expect(recommendations[0].suggestedValue).toBe(7.5);
    });

    test('provides recommendations for high step count', () => {
      const params = { numInferenceSteps: 120 };
      const recommendations = getParameterRecommendations(params, 'image');
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('info');
      expect(recommendations[0].parameter).toBe('numInferenceSteps');
      expect(recommendations[0].suggestedValue).toBe(50);
    });

    test('provides recommendations for low quality', () => {
      const params = { quality: 0.3 };
      const recommendations = getParameterRecommendations(params, 'image');
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('warning');
      expect(recommendations[0].parameter).toBe('quality');
      expect(recommendations[0].suggestedValue).toBe(0.9);
    });

    test('provides performance recommendations', () => {
      const params = { 
        enableCpuOffload: true, 
        batchSize: 3 
      };
      const recommendations = getParameterRecommendations(params, 'image');
      
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].type).toBe('warning');
      expect(recommendations[0].parameter).toBe('batchSize');
      expect(recommendations[0].suggestedValue).toBe(1);
    });

    test('returns no recommendations for optimal parameters', () => {
      const params = { 
        guidanceScale: 7.5,
        numInferenceSteps: 50,
        quality: 0.9,
        enableCpuOffload: false,
        batchSize: 1
      };
      const recommendations = getParameterRecommendations(params, 'image');
      
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('optimizeParametersForPerformance', () => {
    const baseParams = {
      numInferenceSteps: 100,
      enableAttentionSlicing: false,
      batchsize: 2,
      width: 768,
      height: 768,
      quality: 0.9
    };

    test('optimizes for fast generation', () => {
      const constraints = { maxGenerationTime: 30 };
      const optimized = optimizeParametersForPerformance(baseParams, constraints);
      
      expect(optimized.numInferenceSteps).toBeLessThanOrEqual(20);
      expect(optimized.enableAttentionSlicing).toBe(true);
      expect(optimized.batchSize).toBe(1);
    });

    test('optimizes for low memory', () => {
      const constraints = { memoryLimit: 'low' };
      const optimized = optimizeParametersForPerformance(baseParams, constraints);
      
      expect(optimized.enableAttentionSlicing).toBe(true);
      expect(optimized.enableCpuOffload).toBe(true);
      expect(optimized.width).toBeLessThanOrEqual(512);
      expect(optimized.height).toBeLessThanOrEqual(512);
    });

    test('optimizes for high memory', () => {
      const constraints = { memoryLimit: 'high' };
      const optimized = optimizeParametersForPerformance(baseParams, constraints);
      
      expect(optimized.enableAttentionSlicing).toBe(false);
      expect(optimized.enableCpuOffload).toBe(false);
      expect(optimized.enableModelCaching).toBe(true);
    });

    test('optimizes for quality preference', () => {
      const constraints = { preferQuality: true };
      const optimized = optimizeParametersForPerformance(baseParams, constraints);
      
      expect(optimized.numInferenceSteps).toBeGreaterThanOrEqual(50);
      expect(optimized.quality).toBeGreaterThanOrEqual(0.9);
    });

    test('optimizes for speed preference', () => {
      const constraints = { preferQuality: false };
      const optimized = optimizeParametersForPerformance(baseParams, constraints);
      
      expect(optimized.numInferenceSteps).toBeLessThanOrEqual(30);
      expect(optimized.quality).toBeLessThanOrEqual(0.8);
    });
  });

  describe('compareParameters', () => {
    test('detects no changes', () => {
      const params1 = { temperature: 0.8, guidanceScale: 7.5 };
      const params2 = { temperature: 0.8, guidanceScale: 7.5 };
      
      const result = compareParameters(params1, params2);
      
      expect(result.hasChanges).toBe(false);
      expect(result.changeCount).toBe(0);
      expect(result.differences).toEqual({});
    });

    test('detects modified parameters', () => {
      const params1 = { temperature: 0.8, guidanceScale: 7.5 };
      const params2 = { temperature: 1.0, guidanceScale: 7.5 };
      
      const result = compareParameters(params1, params2);
      
      expect(result.hasChanges).toBe(true);
      expect(result.changeCount).toBe(1);
      expect(result.differences.temperature).toEqual({
        original: 0.8,
        modified: 1.0,
        change: 'modified'
      });
    });

    test('detects added parameters', () => {
      const params1 = { temperature: 0.8 };
      const params2 = { temperature: 0.8, guidanceScale: 7.5 };
      
      const result = compareParameters(params1, params2);
      
      expect(result.hasChanges).toBe(true);
      expect(result.changeCount).toBe(1);
      expect(result.differences.guidanceScale).toEqual({
        original: undefined,
        modified: 7.5,
        change: 'added'
      });
    });

    test('detects removed parameters', () => {
      const params1 = { temperature: 0.8, guidanceScale: 7.5 };
      const params2 = { temperature: 0.8 };
      
      const result = compareParameters(params1, params2);
      
      expect(result.hasChanges).toBe(true);
      expect(result.changeCount).toBe(1);
      expect(result.differences.guidanceScale).toEqual({
        original: 7.5,
        modified: undefined,
        change: 'removed'
      });
    });
  });

  describe('generateParameterHash', () => {
    test('generates consistent hash for same parameters', () => {
      const params = { temperature: 0.8, guidanceScale: 7.5 };
      
      const hash1 = generateParameterHash(params);
      const hash2 = generateParameterHash(params);
      
      expect(hash1).toBe(hash2);
    });

    test('generates different hash for different parameters', () => {
      const params1 = { temperature: 0.8, guidanceScale: 7.5 };
      const params2 = { temperature: 1.0, guidanceScale: 7.5 };
      
      const hash1 = generateParameterHash(params1);
      const hash2 = generateParameterHash(params2);
      
      expect(hash1).not.toBe(hash2);
    });

    test('generates same hash regardless of parameter order', () => {
      const params1 = { temperature: 0.8, guidanceScale: 7.5 };
      const params2 = { guidanceScale: 7.5, temperature: 0.8 };
      
      const hash1 = generateParameterHash(params1);
      const hash2 = generateParameterHash(params2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe('sanitizeParameters', () => {
    test('removes undefined and null values', () => {
      const params = {
        temperature: 0.8,
        undefined: undefined,
        null: null,
        guidanceScale: 7.5
      };
      
      const sanitized = sanitizeParameters(params);
      
      expect(sanitized).toEqual({
        temperature: 0.8,
        guidanceScale: 7.5
      });
    });

    test('trims string values', () => {
      const params = {
        name: '  test name  ',
        description: 'test description'
      };
      
      const sanitized = sanitizeParameters(params);
      
      expect(sanitized.name).toBe('test name');
      expect(sanitized.description).toBe('test description');
    });

    test('escapes HTML-sensitive characters in strings', () => {
      const params = {
        name: 'test <script>alert("xss")</script> name',
        safe: 'safe name'
      };
      
      const sanitized = sanitizeParameters(params);
      
      expect(sanitized.name).toBe('test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; name');
      expect(sanitized.safe).toBe('safe name');
    });

    test('preserves non-string values', () => {
      const params = {
        temperature: 0.8,
        enabled: true,
        count: 42
      };
      
      const sanitized = sanitizeParameters(params);
      
      expect(sanitized).toEqual(params);
    });
  });
});
