import React, { useState, useEffect } from 'react';
import { useDevStore } from '../../store/useDevStore';
import { hexToHSL, hslToHex } from '../../utils/colorUtils';

interface ColorTheme {
  name: string;
  colors: {
    primary600: string; // Base color in hex
    hue: number;
    saturation: number;
    lightness: number;
  };
}

const defaultTheme: ColorTheme = {
  name: 'Default',
  colors: {
    primary600: '#0092cc', // Your current base color
    hue: 198,         // Corresponding HSL values
    saturation: 100,
    lightness: 40,
  }
};

export const DevColorPanel: React.FC = () => {
  const isDev = import.meta.env.DEV || import.meta.env.VITE_APP_ENV !== 'production';
  const { showColorPanel, toggleColorPanel } = useDevStore();
  
  const [isOpen, setIsOpen] = useState(true);
  const [theme, setTheme] = useState(defaultTheme);
  const [appliedTheme, setAppliedTheme] = useState(defaultTheme);
  const [savedThemes, setSavedThemes] = useState<ColorTheme[]>([]);
  const [themeName, setThemeName] = useState('');
  const [hexInput, setHexInput] = useState(defaultTheme.colors.primary600);
  
  // Load saved themes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedThemesStr = localStorage.getItem('devColorThemes');
      const lastAppliedStr = localStorage.getItem('lastAppliedTheme');
      
      if (savedThemesStr) {
        try {
          const parsed = JSON.parse(savedThemesStr);
          setSavedThemes(parsed);
        } catch (e) {
          console.error('Error parsing saved themes', e);
        }
      }
      
      if (lastAppliedStr) {
        try {
          const parsed = JSON.parse(lastAppliedStr);
          setTheme(parsed);
          setAppliedTheme(parsed);
          setHexInput(parsed.colors.primary600);
          applyThemeToDOM(parsed);
        } catch (e) {
          console.error('Error parsing last applied theme', e);
        }
      }
    }
  }, []);
  
  // Apply a theme to DOM by updating CSS variables
  const applyThemeToDOM = (theme: ColorTheme) => {
    const hsl = theme.colors;
    const root = document.documentElement;
    
    // Calculate and set all primary color variants based on the base hue
    const variants = [
      { name: '--brand-primary-50', s: hsl.saturation, l: 97 },
      { name: '--brand-primary-100', s: hsl.saturation, l: 95 },
      { name: '--brand-primary-200', s: hsl.saturation, l: 87 },
      { name: '--brand-primary-300', s: hsl.saturation, l: 74 },
      { name: '--brand-primary-400', s: hsl.saturation, l: 60 },
      { name: '--brand-primary-500', s: hsl.saturation, l: 50 },
      { name: '--brand-primary-600', s: hsl.saturation, l: 40 }, // Base color
      { name: '--brand-primary-700', s: hsl.saturation, l: 32 },
      { name: '--brand-primary-800', s: hsl.saturation, l: 25 },
      { name: '--brand-primary-900', s: hsl.saturation, l: 18 },
      { name: '--brand-primary-950', s: hsl.saturation, l: 12 },
    ];
    
    variants.forEach(variant => {
      const hex = hslToHex(hsl.hue, variant.s, variant.l);
      root.style.setProperty(variant.name, hex);
    });
  };
  
  // Update the UI preview based on current HSL values
  const updatePreview = () => {
    const hsl = theme.colors;
    const hex = hslToHex(hsl.hue, hsl.saturation, hsl.lightness);
    setHexInput(hex);
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        primary600: hex
      }
    }));
  };
  
  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setHexInput(hex);
    
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      const hsl = hexToHSL(hex);
      setTheme(prev => ({
        ...prev,
        colors: {
          primary600: hex,
          hue: hsl.h,
          saturation: hsl.s,
          lightness: hsl.l
        }
      }));
    }
  };
  
  // Handle HSL slider changes
  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        hue: value
      }
    }));
    updatePreview();
  };
  
  const handleSaturationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        saturation: value
      }
    }));
    updatePreview();
  };
  
  const handleLightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        lightness: value
      }
    }));
    updatePreview();
  };
  
  // Apply current theme to DOM
  const applyTheme = () => {
    applyThemeToDOM(theme);
    setAppliedTheme(theme);
    localStorage.setItem('lastAppliedTheme', JSON.stringify(theme));
  };
  
  // Undo changes
  const undoChanges = () => {
    setTheme(appliedTheme);
    setHexInput(appliedTheme.colors.primary600);
  };
  
  // Reset to default theme
  const resetToDefault = () => {
    setTheme(defaultTheme);
    setHexInput(defaultTheme.colors.primary600);
    applyThemeToDOM(defaultTheme);
    setAppliedTheme(defaultTheme);
    localStorage.setItem('lastAppliedTheme', JSON.stringify(defaultTheme));
  };
  
  // Save current theme
  const saveTheme = () => {
    if (!themeName.trim()) return;
    
    const newTheme = {
      ...theme,
      name: themeName
    };
    
    const updated = [...savedThemes, newTheme];
    setSavedThemes(updated);
    localStorage.setItem('devColorThemes', JSON.stringify(updated));
    setThemeName('');
  };
  
  // Load a saved theme
  const loadTheme = (theme: ColorTheme) => {
    setTheme(theme);
    setHexInput(theme.colors.primary600);
  };
  
  // Generate CSS code for copying
  const generateCSSCode = () => {
    const hsl = theme.colors;
    let cssCode = '/* Brand primary colors */\n';
    
    const variants = [
      { name: '--brand-primary-50', s: hsl.saturation, l: 97 },
      { name: '--brand-primary-100', s: hsl.saturation, l: 95 },
      { name: '--brand-primary-200', s: hsl.saturation, l: 87 },
      { name: '--brand-primary-300', s: hsl.saturation, l: 74 },
      { name: '--brand-primary-400', s: hsl.saturation, l: 60 },
      { name: '--brand-primary-500', s: hsl.saturation, l: 50 },
      { name: '--brand-primary-600', s: hsl.saturation, l: 40 }, // Base color
      { name: '--brand-primary-700', s: hsl.saturation, l: 32 },
      { name: '--brand-primary-800', s: hsl.saturation, l: 25 },
      { name: '--brand-primary-900', s: hsl.saturation, l: 18 },
      { name: '--brand-primary-950', s: hsl.saturation, l: 12 },
    ];
    
    variants.forEach(variant => {
      const hex = hslToHex(hsl.hue, variant.s, variant.l);
      cssCode += `${variant.name}: ${hex};\n`;
    });
    
    return cssCode;
  };
  
  if (!isDev || !showColorPanel) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 w-64 rounded-md shadow-lg">
      <div className="bg-zinc-800 text-white p-2 rounded-t-md flex justify-between items-center">
        <h3 className="text-sm font-semibold">Theme Editor</h3>
        <div className="space-x-2">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-xs bg-zinc-700 hover:bg-zinc-600 px-1 py-0.5 rounded"
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
          <button 
            onClick={() => toggleColorPanel()} 
            className="text-xs bg-zinc-700 hover:bg-zinc-600 px-1 py-0.5 rounded"
          >
            Close
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="bg-zinc-900 p-3 rounded-b-md">
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-zinc-300">Base Color (600)</label>
              <input 
                type="text" 
                value={hexInput}
                onChange={handleHexChange}
                className="bg-zinc-800 text-xs p-1 rounded w-20 text-white"
              />
            </div>
            <div 
              className="h-8 w-full rounded-md mb-2"
              style={{ backgroundColor: theme.colors.primary600 }}
            />
            
            <div className="space-y-2">
              <div>
                <label className="text-xs text-zinc-300 flex justify-between">
                  <span>Hue: {theme.colors.hue}°</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={theme.colors.hue}
                  onChange={handleHueChange}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-xs text-zinc-300 flex justify-between">
                  <span>Saturation: {theme.colors.saturation}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={theme.colors.saturation}
                  onChange={handleSaturationChange}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-xs text-zinc-300 flex justify-between">
                  <span>Lightness: {theme.colors.lightness}%</span>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={theme.colors.lightness}
                  onChange={handleLightnessChange}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2 mb-3">
            <button 
              onClick={applyTheme}
              className="bg-brand-primary-600 hover:bg-brand-primary-700 text-white text-xs px-2 py-1 rounded flex-1"
            >
              Apply
            </button>
            <button 
              onClick={undoChanges}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex-1"
            >
              Undo
            </button>
            <button 
              onClick={resetToDefault}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded flex-1"
            >
              Reset
            </button>
          </div>
          
          <div className="mb-3">
            <div className="flex space-x-2">
              <input 
                type="text"
                placeholder="Theme name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="bg-zinc-800 text-white text-xs p-1 rounded flex-1"
              />
              <button 
                onClick={saveTheme}
                disabled={!themeName.trim()}
                className={`text-white text-xs px-2 py-1 rounded ${
                  themeName.trim() ? 'bg-brand-primary-600 hover:bg-brand-primary-700' : 'bg-zinc-700 cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
          
          {savedThemes.length > 0 && (
            <div className="mb-3">
              <label className="text-xs text-zinc-300 block mb-1">Saved Themes</label>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {savedThemes.map((saved, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 bg-zinc-800 p-1 rounded"
                  >
                    <div 
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: saved.colors.primary600 }}
                    />
                    <button 
                      onClick={() => loadTheme(saved)}
                      className="text-xs text-zinc-300 hover:text-white flex-1 text-left"
                    >
                      {saved.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateCSSCode());
                alert('CSS code copied to clipboard!');
              }}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-2 py-1 rounded w-full"
            >
              Copy CSS to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 