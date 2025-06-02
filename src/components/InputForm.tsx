import React, { useState, useEffect } from 'react';
import { Paintbrush2, X } from 'lucide-react';
import { validateAndSanitizeInput, ValidationError } from '../lib/validation';
import logger from '../lib/logger';

interface InputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  onGenerate: (text: string) => Promise<void>;
}

export const InputForm: React.FC<InputFormProps> = ({
  inputText,
  setInputText,
  isGenerating,
  onGenerate
}) => {
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Reset validation state when input changes
  useEffect(() => {
    if (isDirty && inputText.trim()) {  // Only validate if there's non-empty input
      const { isValid, sanitizedValue, error } = validateAndSanitizeInput(inputText);
      if (!isValid && error) {
        setValidationError(error);
        // Only update the input if it's been sanitized
        if (sanitizedValue !== inputText) {
          setInputText(sanitizedValue);
        }
      } else {
        setValidationError(null);
      }
    } else {
      setValidationError(null);  // Clear validation error if input is empty
    }
  }, [inputText, isDirty, setInputText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDirty(true);
    setInputText(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDirty(true);

    // Show error for empty input on submit
    if (!inputText.trim()) {
      setValidationError({
        code: 'EMPTY',
        message: 'Please enter some text'
      });
      return;
    }

    try {
      const { isValid, sanitizedValue, error } = validateAndSanitizeInput(inputText);
      
      if (!isValid) {
        if (error) {
          setValidationError(error);
        }
        setInputText(sanitizedValue);
        return;
      }

      setValidationError(null);
      await onGenerate(sanitizedValue);
    } catch (error) {
      logger.error('Error in form submission:', error);
      setValidationError({
        code: 'INVALID_CHARS',
        message: 'An error occurred while processing your input'
      });
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSubmit} className="flex items-stretch gap-1" role="form" aria-label="Graffiti text generator">
        <div className="relative flex-1">
          <label htmlFor="graffiti-input" className="sr-only">
            Enter text to generate graffiti (a-z, 0-9, spaces allowed, maximum 18 characters)
          </label>
          <input
            id="graffiti-input"
            name="graffitiText"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Write your word (a-z, 0-9, spaces allowed)..."
            className={`w-full px-3 py-2 text-base rounded-md border-[1px] ${
              validationError ? 'border-red-500' : 'border-zinc-700'
            } bg-control ring-offset-0 focus:ring-1 focus:ring-brand-primary-400 focus:border-transparent outline-none transition-colors text-control placeholder-zinc-400`}
            style={{ fontSize: '16px' }}
            maxLength={18}
            disabled={isGenerating}
            aria-describedby={`${validationError ? 'validation-error ' : ''}${inputText ? 'char-count ' : ''}input-help`}
            aria-invalid={validationError ? 'true' : 'false'}
            aria-required="true"
          />
          <div id="input-help" className="sr-only">
            Text input for graffiti generation. Accepts letters, numbers, and spaces. Maximum 18 characters.
          </div>
          {inputText && (
            <>
              <div 
                id="char-count"
                className="absolute right-8 top-[50%] -translate-y-[50%] text-xs text-control-secondary sm:mt-[-2px] mt-" 
                style={{ lineHeight: '16px', height: '16px' }}
                aria-live="polite"
                role="status"
              >
                {inputText.length}/18
              </div>
              <button
                onClick={() => {
                  setInputText('');
                  setValidationError(null);
                  setIsDirty(false);
                }}
                className="absolute right-2 top-[50%] -translate-y-[50%] text-control-secondary hover:text-control transition-colors sm:mt-[-1px] mt-15"
                style={{ lineHeight: '16px', height: '16px' }}
                type="button"
                title="Clear text"
                aria-label="Clear input text"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}
          {validationError && (
            <p 
              id="validation-error"
              className="absolute -bottom-3 left-0 text-red-400 text-[7px]"
              role="alert"
              aria-live="assertive"
            >
              {validationError.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isGenerating || !!validationError}
          className={`px-2 py-1 rounded-md font-medium text-control transition-all flex items-center justify-center ${
            isGenerating || !!validationError
              ? 'bg-zinc-600 cursor-not-allowed'
              : 'bg-brand-primary-600 hover:brightness-110'
          }`}
          title="Generate"
          aria-label={isGenerating ? 'Generating graffiti, please wait' : 'Generate graffiti from input text'}
          aria-describedby="button-help"
        >
          <Paintbrush2 className="w-6 h-5" aria-hidden="true" />
          <span className="ml-1 hidden sm:inline-block">{isGenerating ? 'Creating...' : 'Create'}</span>
          {/* Screen reader only status for generating state */}
          {isGenerating && <span className="sr-only">Generation in progress</span>}
        </button>
        <div id="button-help" className="sr-only">
          {isGenerating || !!validationError 
            ? 'Button disabled: ' + (isGenerating ? 'Currently generating graffiti' : 'Please fix input errors first')
            : 'Click to generate graffiti art from your text input'
          }
        </div>
      </form>
    </div>
  );
};