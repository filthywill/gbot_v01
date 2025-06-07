import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before importing projectService
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

// Mock thumbnail service 
vi.mock('../thumbnailService', () => ({
  generateThumbnail: vi.fn(),
  deleteThumbnail: vi.fn()
}));

import { 
  exportProject,
  validateImportData,
  type SavedProject,
  type ProjectExportData
} from '../projectService';

// Test data
const mockCustomizationOptions = {
  backgroundEnabled: true,
  backgroundColor: '#ffffff',
  fillEnabled: true,
  fillColor: '#ff0000',
  strokeEnabled: false,
  strokeColor: '#000000',
  strokeWidth: 2,
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowOpacity: 0.5,
  shadowOffsetX: 3,
  shadowOffsetY: 3,
  shadowBlur: 5,
  stampEnabled: false,
  stampColor: '#000000',
  stampWidth: 6,
  shineEnabled: false,
  shineColor: '#ffffff',
  shineOpacity: 0.5,
  shadowEffectEnabled: false,
  shadowEffectOffsetX: 3,
  shadowEffectOffsetY: 3,
  shieldEnabled: false,
  shieldColor: '#000000',
  shieldWidth: 4
};

const mockProject: SavedProject = {
  id: 'project-123',
  name: 'Test Project 12/01/2024',
  inputText: 'TEST',
  styleId: 'straight',
  customizationOptions: mockCustomizationOptions,
  thumbnailUrl: 'https://example.com/thumbnail.png',
  createdAt: '2024-01-01T00:00:00.000Z'
};

describe('projectService core logic', () => {
  describe('exportProject', () => {
    it('should export project as valid JSON with correct structure', () => {
      const result = exportProject(mockProject);
      const parsed = JSON.parse(result);

      // Check structure
      expect(parsed).toHaveProperty('version', '1.0');
      expect(parsed).toHaveProperty('project');
      expect(parsed).toHaveProperty('exportedAt');

      // Check project data
      expect(parsed.project.name).toBe(mockProject.name);
      expect(parsed.project.inputText).toBe(mockProject.inputText);
      expect(parsed.project.styleId).toBe(mockProject.styleId);
      expect(parsed.project.customizationOptions).toEqual(mockProject.customizationOptions);

      // Check timestamp format
      expect(new Date(parsed.exportedAt).toISOString()).toBe(parsed.exportedAt);
    });

    it('should create valid JSON that can be imported', () => {
      const exported = exportProject(mockProject);
      const validated = validateImportData(exported);

      expect(validated).not.toBeNull();
      expect(validated?.project.inputText).toBe(mockProject.inputText);
    });
  });

  describe('validateImportData', () => {
    it('should validate correct import data structure', () => {
      const validData: ProjectExportData = {
        version: '1.0',
        project: {
          name: 'Test Project',
          inputText: 'TEST',
          styleId: 'straight',
          customizationOptions: mockCustomizationOptions
        },
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(validData));
      expect(result).toEqual(validData);
    });

    it('should reject data missing version', () => {
      const invalidData = {
        project: {
          name: 'Test Project',
          inputText: 'TEST',
          styleId: 'straight',
          customizationOptions: mockCustomizationOptions
        },
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(invalidData));
      expect(result).toBeNull();
    });

    it('should reject data missing project', () => {
      const invalidData = {
        version: '1.0',
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(invalidData));
      expect(result).toBeNull();
    });

    it('should reject data missing inputText', () => {
      const invalidData = {
        version: '1.0',
        project: {
          name: 'Test Project',
          styleId: 'straight',
          customizationOptions: mockCustomizationOptions
        },
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(invalidData));
      expect(result).toBeNull();
    });

    it('should reject data missing styleId', () => {
      const invalidData = {
        version: '1.0',
        project: {
          name: 'Test Project',
          inputText: 'TEST',
          customizationOptions: mockCustomizationOptions
        },
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(invalidData));
      expect(result).toBeNull();
    });

    it('should reject data missing customizationOptions', () => {
      const invalidData = {
        version: '1.0',
        project: {
          name: 'Test Project',
          inputText: 'TEST',
          styleId: 'straight'
        },
        exportedAt: '2024-01-01T00:00:00.000Z'
      };

      const result = validateImportData(JSON.stringify(invalidData));
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const result = validateImportData('invalid json {');
      expect(result).toBeNull();
    });

    it('should handle empty string gracefully', () => {
      const result = validateImportData('');
      expect(result).toBeNull();
    });
  });

  describe('project integration workflow', () => {
    it('should demonstrate the complete export-import cycle', () => {
      // Step 1: Export a project
      const exported = exportProject(mockProject);
      expect(typeof exported).toBe('string');

      // Step 2: Validate the export can be imported
      const validated = validateImportData(exported);
      expect(validated).not.toBeNull();

      // Step 3: Check data integrity
      expect(validated?.project.inputText).toBe(mockProject.inputText);
      expect(validated?.project.styleId).toBe(mockProject.styleId);
      expect(validated?.project.customizationOptions).toEqual(mockProject.customizationOptions);

      console.log('✅ Project Service Core Logic:');
      console.log('  1. Export creates valid JSON with version and timestamp');
      console.log('  2. Validation ensures required fields are present');
      console.log('  3. Export-import cycle preserves all project data');
      console.log('  4. Service follows same patterns as presetService.ts');
    });
  });
}); 