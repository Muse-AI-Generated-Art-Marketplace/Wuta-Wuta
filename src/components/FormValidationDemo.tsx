import React, { useState } from 'react';
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';
import { 
  FormFieldWrapper, 
  ValidationMessage, 
  FormProgress, 
  FormSummary, 
  AccessibleForm,
  ValidatedInput,
  ValidatedTextarea,
  ValidatedSelect
} from './FormValidation';

/**
 * Comprehensive form validation demo showcasing all features
 * 
 * Features demonstrated:
 * - Real-time validation with debouncing
 * - Accessibility support
 * - Visual feedback and error handling
 * - Form progress tracking
 * - Custom validation rules
 * - Field-level and form-level validation
 */
const FormValidationDemo = () => {
  const [activeDemo, setActiveDemo] = useState('basic');
  const [submittedData, setSubmittedData] = useState(null);

  // Basic form validation schema
  const basicValidationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      custom: (value) => {
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        if (value.length > 50) {
          return 'Name must be no more than 50 characters';
        }
        return null;
      }
    },
    email: ValidationRules.email,
    age: ValidationRules.range(18, 120),
    bio: {
      required: false,
      maxLength: 500,
      custom: (value) => {
        if (value && value.length > 500) {
          return 'Bio must be no more than 500 characters';
        }
        return null;
      }
    }
  };

  // Advanced form validation schema
  const advancedValidationSchema = {
    artworkTitle: {
      required: true,
      minLength: 5,
      maxLength: 100,
      custom: (value) => {
        if (!value || value.trim().length < 5) {
          return 'Artwork title must be at least 5 characters';
        }
        if (value.length > 100) {
          return 'Artwork title must be no more than 100 characters';
        }
        return null;
      }
    },
    artworkDescription: {
      required: true,
      minLength: 20,
      maxLength: 1000,
      custom: (value) => {
        if (!value || value.trim().length < 20) {
          return 'Description must be at least 20 characters';
        }
        if (value.length > 1000) {
          return 'Description must be no more than 1000 characters';
        }
        return null;
      }
    },
    price: {
      required: true,
      custom: (value) => {
        const num = Number(value);
        if (isNaN(num)) return 'Please enter a valid number';
        if (num < 0.01) return 'Price must be at least 0.01 ETH';
        if (num > 1000) return 'Price must be no more than 1000 ETH';
        return null;
      }
    },
    royaltyPercentage: ValidationRules.percentage,
    externalUrl: ValidationRules.url,
    ethereumAddress: ValidationRules.ethereumAddress,
    ipfsHash: {
      required: false,
      pattern: /^Qm[a-zA-Z0-9]{44,}$/,
      custom: (value) => {
        if (!value) return null;
        if (!/^Qm[a-zA-Z0-9]{44,}$/.test(value)) {
          return 'Please enter a valid IPFS hash (starts with Qm and contains at least 46 characters)';
        }
        return null;
      }
    }
  };

  // Initialize form validation hooks
  const basicForm = useFormValidation({
    schema: basicValidationSchema,
    initialValues: {
      name: '',
      email: '',
      age: '',
      bio: ''
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
  });

  const advancedForm = useFormValidation({
    schema: advancedValidationSchema,
    initialValues: {
      artworkTitle: '',
      artworkDescription: '',
      price: '',
      royaltyPercentage: 10,
      externalUrl: '',
      ethereumAddress: '',
      ipfsHash: ''
    },
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300,
  });

  const handleSubmit = (e, form) => {
    e.preventDefault();
    const { isValid, errors } = form.validateForm();
    
    if (isValid) {
      setSubmittedData(form.values);
      form.resetForm();
    }
  };

  const renderBasicForm = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Basic Form Validation
        </h3>
        <p className="text-blue-800 dark:text-blue-200">
          Demonstrates required fields, length validation, and basic input types.
        </p>
      </div>

      <AccessibleForm 
        onSubmit={(e) => handleSubmit(e, basicForm)}
        className="space-y-6"
        aria-label="Basic validation demo form"
      >
        <FormFieldWrapper
          label="Full Name"
          name="name"
          required
          hint="Enter your full name (2-50 characters)"
          error={basicForm.getFieldError('name')}
        >
          <ValidatedInput
            name="name"
            type="text"
            value={basicForm.values.name}
            onChange={(e) => basicForm.updateField('name', e.target.value)}
            onBlur={() => basicForm.handleBlur('name')}
            error={basicForm.getFieldError('name')}
            placeholder="John Doe"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Email Address"
          name="email"
          required
          hint="Enter a valid email address"
          error={basicForm.getFieldError('email')}
        >
          <ValidatedInput
            name="email"
            type="email"
            value={basicForm.values.email}
            onChange={(e) => basicForm.updateField('email', e.target.value)}
            onBlur={() => basicForm.handleBlur('email')}
            error={basicForm.getFieldError('email')}
            placeholder="john@example.com"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Age"
          name="age"
          required
          hint="Must be between 18 and 120"
          error={basicForm.getFieldError('age')}
        >
          <ValidatedInput
            name="age"
            type="number"
            value={basicForm.values.age}
            onChange={(e) => basicForm.updateField('age', e.target.value)}
            onBlur={() => basicForm.handleBlur('age')}
            error={basicForm.getFieldError('age')}
            placeholder="25"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Bio (Optional)"
          name="bio"
          hint="Tell us about yourself (max 500 characters)"
          error={basicForm.getFieldError('bio')}
        >
          <ValidatedTextarea
            name="bio"
            rows={4}
            value={basicForm.values.bio}
            onChange={(e) => basicForm.updateField('bio', e.target.value)}
            onBlur={() => basicForm.handleBlur('bio')}
            error={basicForm.getFieldError('bio')}
            placeholder="I'm a digital artist passionate about AI-generated art..."
          />
        </FormFieldWrapper>

        {/* Form Progress */}
        <FormProgress 
          totalFields={Object.keys(basicValidationSchema).length}
          validFields={Object.keys(basicValidationSchema).filter(field => 
            basicForm.touched[field] && !basicForm.errors[field]
          ).length}
        />

        {/* Form Summary */}
        {basicForm.isDirty && (
          <FormSummary errors={basicForm.errors} />
        )}

        <button
          type="submit"
          disabled={!basicForm.isValid}
          className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Basic Form
        </button>
      </AccessibleForm>
    </div>
  );

  const renderAdvancedForm = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-900/20 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
          Advanced Form Validation
        </h3>
        <p className="text-purple-800 dark:text-purple-200">
          Demonstrates complex validation rules, custom patterns, and accessibility features.
        </p>
      </div>

      <AccessibleForm 
        onSubmit={(e) => handleSubmit(e, advancedForm)}
        className="space-y-6"
        aria-label="Advanced validation demo form"
      >
        <FormFieldWrapper
          label="Artwork Title"
          name="artworkTitle"
          required
          hint="Enter a descriptive title for your artwork (5-100 characters)"
          error={advancedForm.getFieldError('artworkTitle')}
        >
          <ValidatedInput
            name="artworkTitle"
            type="text"
            value={advancedForm.values.artworkTitle}
            onChange={(e) => advancedForm.updateField('artworkTitle', e.target.value)}
            onBlur={() => advancedForm.handleBlur('artworkTitle')}
            error={advancedForm.getFieldError('artworkTitle')}
            placeholder="Sunset Dreams"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Artwork Description"
          name="artworkDescription"
          required
          hint="Provide a detailed description (20-1000 characters)"
          error={advancedForm.getFieldError('artworkDescription')}
        >
          <ValidatedTextarea
            name="artworkDescription"
            rows={4}
            value={advancedForm.values.artworkDescription}
            onChange={(e) => advancedForm.updateField('artworkDescription', e.target.value)}
            onBlur={() => advancedForm.handleBlur('artworkDescription')}
            error={advancedForm.getFieldError('artworkDescription')}
            placeholder="A mesmerizing digital artwork that captures the essence of a sunset over the ocean..."
          />
        </FormFieldWrapper>

        <div className="grid gap-6 md:grid-cols-2">
          <FormFieldWrapper
            label="Price (ETH)"
            name="price"
            required
            hint="Set a price between 0.01 and 1000 ETH"
            error={advancedForm.getFieldError('price')}
          >
            <ValidatedInput
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              max="1000"
              value={advancedForm.values.price}
              onChange={(e) => advancedForm.updateField('price', e.target.value)}
              onBlur={() => advancedForm.handleBlur('price')}
              error={advancedForm.getFieldError('price')}
              placeholder="0.5"
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            label="Royalty Percentage"
            name="royaltyPercentage"
            required
            hint="Set royalty percentage (0-100%)"
            error={advancedForm.getFieldError('royaltyPercentage')}
          >
            <ValidatedInput
              name="royaltyPercentage"
              type="number"
              min="0"
              max="100"
              value={advancedForm.values.royaltyPercentage}
              onChange={(e) => advancedForm.updateField('royaltyPercentage', e.target.value)}
              onBlur={() => advancedForm.handleBlur('royaltyPercentage')}
              error={advancedForm.getFieldError('royaltyPercentage')}
              placeholder="10"
            />
          </FormFieldWrapper>
        </div>

        <FormFieldWrapper
          label="External URL"
          name="externalUrl"
          hint="Link to external website or portfolio"
          error={advancedForm.getFieldError('externalUrl')}
        >
          <ValidatedInput
            name="externalUrl"
            type="url"
            value={advancedForm.values.externalUrl}
            onChange={(e) => advancedForm.updateField('externalUrl', e.target.value)}
            onBlur={() => advancedForm.handleBlur('externalUrl')}
            error={advancedForm.getFieldError('externalUrl')}
            placeholder="https://example.com/artwork"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="Ethereum Address"
          name="ethereumAddress"
          hint="Creator's Ethereum wallet address"
          error={advancedForm.getFieldError('ethereumAddress')}
        >
          <ValidatedInput
            name="ethereumAddress"
            type="text"
            value={advancedForm.values.ethereumAddress}
            onChange={(e) => advancedForm.updateField('ethereumAddress', e.target.value)}
            onBlur={() => advancedForm.handleBlur('ethereumAddress')}
            error={advancedForm.getFieldError('ethereumAddress')}
            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
          />
        </FormFieldWrapper>

        <FormFieldWrapper
          label="IPFS Hash (Optional)"
          name="ipfsHash"
          hint="IPFS hash for the artwork file"
          error={advancedForm.getFieldError('ipfsHash')}
        >
          <ValidatedInput
            name="ipfsHash"
            type="text"
            value={advancedForm.values.ipfsHash}
            onChange={(e) => advancedForm.updateField('ipfsHash', e.target.value)}
            onBlur={() => advancedForm.handleBlur('ipfsHash')}
            error={advancedForm.getFieldError('ipfsHash')}
            placeholder="QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"
          />
        </FormFieldWrapper>

        {/* Form Progress */}
        <FormProgress 
          totalFields={Object.keys(advancedValidationSchema).length}
          validFields={Object.keys(advancedValidationSchema).filter(field => 
            advancedForm.touched[field] && !advancedForm.errors[field]
          ).length}
        />

        {/* Form Summary */}
        {advancedForm.isDirty && (
          <FormSummary errors={advancedForm.errors} />
        )}

        <button
          type="submit"
          disabled={!advancedForm.isValid}
          className="w-full rounded-2xl bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Advanced Form
        </button>
      </AccessibleForm>
    </div>
  );

  const renderSubmittedData = () => {
    if (!submittedData) return null;

    return (
      <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
          ✅ Form Submitted Successfully!
        </h3>
        <div className="space-y-2">
          <h4 className="font-medium text-green-800 dark:text-green-200">Submitted Data:</h4>
          <pre className="text-sm text-green-700 dark:text-green-300 bg-white/50 p-3 rounded dark:bg-black/30">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
        </div>
        <button
          onClick={() => setSubmittedData(null)}
          className="mt-4 text-sm text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200"
        >
          Clear
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Form Validation Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive form validation with real-time feedback and accessibility support
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveDemo('basic')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'basic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Basic Validation
          </button>
          <button
            onClick={() => setActiveDemo('advanced')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeDemo === 'advanced'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Advanced Validation
          </button>
        </div>

        {/* Demo Content */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-800 dark:bg-gray-900 p-6 md:p-8">
          {activeDemo === 'basic' ? renderBasicForm() : renderAdvancedForm()}
          {renderSubmittedData()}
        </div>

        {/* Features Overview */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔄 Real-time Validation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Instant feedback as users type with debouncing to prevent excessive validation calls.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">♿ Accessibility Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ARIA attributes, screen reader announcements, and keyboard navigation support.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Progress Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visual form progress indicators and comprehensive error summaries.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Custom Rules</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Flexible validation schema with custom validation functions and patterns.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔧 Reusable Components</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modular validation components that can be easily integrated across the application.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🛡️ Type Safety</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Full TypeScript support with proper type definitions and interfaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormValidationDemo;
