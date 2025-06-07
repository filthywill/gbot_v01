import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useGraffitiStore } from '../store/useGraffitiStore';
import { useGraffitiDisplay } from './useGraffitiDisplay';
import { useGraffitiGeneratorWithZustand } from './useGraffitiGeneratorWithZustand';
import { 
  saveProject, 
  getUserProjects, 
  deleteProject, 
  updateProjectName,
  checkProjectLimit,
  type SavedProject
} from '../services/projectService';
import { showToast } from '../lib/toast';

export const useProjectActions = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated()
  }));
  
  const {
    selectedStyle,       // Current selected style from store
    setInputText,
    setDisplayInputText,
    setSelectedStyle,
    setCustomizationOptions
  } = useGraffitiStore();
  
  // Get display data including the text used for generation and generated graffiti
  const {
    displayInputText,    // Text that was used to generate current graffiti
    processedSvgs,       // The actual generated graffiti
    customizationOptions
  } = useGraffitiDisplay();
  
  const { generateGraffiti } = useGraffitiGeneratorWithZustand();
  
  // Computed property to check if saving is possible
  const canSave = isAuthenticated && 
                  user && 
                  processedSvgs.length > 0 && 
                  displayInputText.trim().length > 0;
  
  const saveCurrentProject = async (thumbnailOptions?: any) => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to save projects', { type: 'error' });
      return false;
    }
    
    // Note: We no longer check for graffiti/text here since the button will be disabled
    // if these conditions aren't met
    
    setIsSaving(true);
    try {
      // Use displayInputText (text used for generation) not current input field
      await saveProject(user.id, displayInputText, selectedStyle, customizationOptions, thumbnailOptions);
      showToast('Project saved!', { type: 'success' });
      return true;
    } catch (error: any) {
      console.error('Save failed:', error);
      showToast(error.message || 'Failed to save project', { type: 'error' });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const loadUserProjectsList = async () => {
    if (!isAuthenticated || !user) return [];
    
    setIsLoading(true);
    try {
      return await getUserProjects(user.id);
    } catch (error) {
      console.error('Load failed:', error);
      showToast('Failed to load projects', { type: 'error' });
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadProject = async (project: SavedProject) => {
    // Set both input field and display text to the project's text
    setInputText(project.inputText);
    setDisplayInputText(project.inputText);
    setSelectedStyle(project.styleId);
    setCustomizationOptions(project.customizationOptions);
    // Generate graffiti using the project's text
    await generateGraffiti(project.inputText);
    showToast('Project loaded!', { type: 'success' });
  };
  
  const deleteProjectById = async (projectId: string) => {
    if (!user) return false;
    
    try {
      await deleteProject(projectId, user.id);
      showToast('Project deleted!', { type: 'success' });
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete project', { type: 'error' });
      return false;
    }
  };

  const updateProjectNameById = async (projectId: string, newName: string) => {
    if (!user) return null;
    
    try {
      const updatedProject = await updateProjectName(projectId, user.id, newName);
      showToast('Project name updated!', { type: 'success' });
      return updatedProject;
    } catch (error: any) {
      console.error('Update failed:', error);
      showToast(error.message || 'Failed to update project name', { type: 'error' });
      return null;
    }
  };
  
  const getProjectLimitInfo = async () => {
    if (!user) return null;
    
    try {
      return await checkProjectLimit(user.id);
    } catch (error) {
      console.error('Limit check failed:', error);
      return null;
    }
  };
  
  return {
    isSaving,
    isLoading,
    canSave,              // Export the computed property
    loadUserProjectsList,
    saveCurrentProject,
    loadProject,
    deleteProjectById,
    updateProjectNameById,
    getProjectLimitInfo
  };
}; 