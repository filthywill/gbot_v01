import React from 'react';
import { FaSprayCan } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';

interface ModernInputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  isGenerating: boolean;
  onGenerate: (text: string) => Promise<void>;
}

export const ModernInputForm: React.FC<ModernInputFormProps> = ({ 
  inputText, 
  setInputText, 
  isGenerating, 
  onGenerate 
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onGenerate(inputText);
  };

  return (
    <div className="mb-1">
      <div className="flex items-stretch gap-1">
        <div className="relative flex-1">
          <input
            id="graffiti-input"
            name="graffitiText"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write your word (a-z, 0-9, spaces allowed)..."
            className="w-full px-3 py-2 text-base rounded-md border-0 bg-zinc-200 focus:bg-zinc-100 focus:border-0 focus:ring-1 focus:ring-purple-400 outline-none transition-all text-zinc-800"
            style={{ fontSize: '16px' }}
            maxLength={18}
          />
          {inputText && (
            <>
              <div 
                className="absolute right-8 top-[50%] -translate-y-[50%] text-xs text-zinc-400 sm:mt-[-2px] mt-0" 
                style={{ lineHeight: '16px', height: '16px' }}
              >
                {inputText.length}/18
              </div>
              <button
                onClick={() => setInputText('')}
                className="absolute right-2 top-[50%] -translate-y-[50%] text-zinc-400 hover:text-zinc-600 transition-colors sm:mt-[-1px] mt-15"
                style={{ lineHeight: '16px', height: '16px' }}
                type="button"
                title="Clear text"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <button
          onClick={() => onGenerate(inputText)}
          disabled={!inputText.trim() || isGenerating}
          className={`px-2 py-2 rounded-md font-medium text-white transition-all flex items-center justify-center ${
            isGenerating || !inputText.trim()
              ? 'bg-zinc-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800'
          }`}
          title="Generate"
        >
          <FaSprayCan className="w-6 h-4" />
          <span className="ml-1 hidden sm:inline-block">{isGenerating ? 'Creating...' : 'Create'}</span>
        </button>
      </div>
    </div>
  );
};