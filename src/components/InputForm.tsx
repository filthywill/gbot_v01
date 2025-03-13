// src/components/InputForm.tsx
import React from 'react';
import { Wand2 } from 'lucide-react';

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
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onGenerate(inputText);
  };

  return (
    <div className="mb-4">
      <div className="flex items-stretch gap-2">
        <input
            id="graffiti-input"
            name="graffitiText"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Write your word (a-z, spaces allowed)..."
          className="flex-1 px-3 py-2 text-base rounded-lg border-2 border-purple-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
          maxLength={18}
        />
        <button
          onClick={() => onGenerate(inputText)}
          disabled={!inputText.trim() || isGenerating}
          className={`min-w-10 px-2 sm:px-3 rounded-lg font-bold text-white transition-all flex items-center justify-center ${
            isGenerating || !inputText.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600'
          }`}
          title="Generate"
        >
          <Wand2 className="w-5 h-5" />
          <span className="hidden sm:inline-block ml-2">{isGenerating ? 'Generating...' : 'Generate'}</span>
        </button>
      </div>
    </div>
  );
};