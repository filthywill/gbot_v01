import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { SavedProjectCard } from './SavedProjectCard';
import { SavedProject } from '../services/projectService';
import { useProjectActions } from '../hooks/useProjectActions';
import useAuthStore from '../store/useAuthStore';
import { useGraffitiDisplay } from '../hooks/useGraffitiDisplay';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Button } from './ui/button';
import { AUTH_VIEWS } from '../lib/auth/constants';
import { DeleteProjectModal } from './modals/DeleteProjectModal';

export const SavedProjectsPanel: React.FC = () => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [limitInfo, setLimitInfo] = useState<{ count: number; limit: number } | null>(null);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; projectId: string; projectName: string }>({
    isOpen: false,
    projectId: '',
    projectName: ''
  });
  
  const { user, isAuthenticated } = useAuthStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated()
  }));
  
  const {
    isSaving,
    isLoading,
    saveCurrentProject,
    loadUserProjectsList,
    loadProject,
    deleteProjectById,
    updateProjectNameById,
    getProjectLimitInfo,
  } = useProjectActions();
  
  const {
    displayInputText,
    processedSvgs,
    customizationOptions,
    contentWidth,
    contentHeight,
    containerScale
  } = useGraffitiDisplay();
  
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
      checkLimits();
    } else {
      setProjects([]);
      setLimitInfo(null);
    }
  }, [isAuthenticated]);
  
  const loadProjects = async () => {
    const userProjects = await loadUserProjectsList();
    setProjects(userProjects);
  };
  
  const checkLimits = async () => {
    const info = await getProjectLimitInfo();
    if (info) {
      setLimitInfo(info);
    }
  };
  
  const openAuthModal = () => {
    window.dispatchEvent(new CustomEvent('auth:trigger-modal', {
      detail: { view: AUTH_VIEWS.SIGN_IN, reason: 'save_project' }
    }));
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const thumbnailOptions = processedSvgs.length > 0 ? {
      processedSvgs,
      customizationOptions,
      contentWidth,
      contentHeight,
      scaleFactor: containerScale,
      additionalScaleFactor: 1.0,
      contentRef: { current: document.querySelector('.graffiti-content') as HTMLDivElement },
      containerRef: { current: document.querySelector('.graffiti-container') as HTMLDivElement },
    } : undefined;
    
    const success = await saveCurrentProject(thumbnailOptions);
    if (success) {
      await loadProjects();
      await checkLimits();
    }
  };
  
  const handleLoad = async (project: SavedProject) => {
    await loadProject(project);
  };
  
  const handleUpdateName = async (projectId: string, newName: string) => {
    const updatedProject = await updateProjectNameById(projectId, newName);
    if (updatedProject) {
      // Update the local projects state
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
    }
    return updatedProject;
  };
  
  const handleDelete = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Check if user has opted to skip confirmation
    const skipConfirmation = localStorage.getItem('skipProjectDeleteConfirmation') === 'true';
    
    if (skipConfirmation) {
      // Delete immediately without showing modal
      const success = await deleteProjectById(projectId);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        await checkLimits();
      }
    } else {
      // Show confirmation modal
      setDeleteModal({
        isOpen: true,
        projectId,
        projectName: project.name
      });
    }
  };

  const confirmDelete = async () => {
    const success = await deleteProjectById(deleteModal.projectId);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== deleteModal.projectId));
      await checkLimits();
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      projectId: '',
      projectName: ''
    });
  };
  
  const isAtLimit = limitInfo ? limitInfo.count >= limitInfo.limit : false;
  const isReadyToSave = processedSvgs.length > 0 && displayInputText.trim().length > 0;

  const getSaveButtonTitle = () => {
    if (!isAuthenticated && isReadyToSave) return 'Sign in to save project';
    if (isAtLimit) return `Project limit reached (${limitInfo?.count}/${limitInfo?.limit})`;
    if (!isReadyToSave) return 'Generate graffiti first to save a project';
    return 'Save current project';
  };
  
  const sectionHeaderClass = "flex items-center justify-between w-full py-0.5 px-1.5 rounded-md transition-colors";

  return (
    <Collapsible 
      open={isProjectsOpen} 
      onOpenChange={setIsProjectsOpen}
      className="animate-none"
    >
      <CollapsibleTrigger className={`${sectionHeaderClass} bg-brand-gradient`}>
        <div className="flex items-center gap-2">
          <h3 className="ui-heading ui-heading-panel text-control">SAVED PROJECTS</h3>
        </div>
        {isProjectsOpen ? 
          <ChevronUp className="w-3 h-3 text-control" /> : 
          <ChevronDown className="w-3 h-3 text-control" />
        }
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-1.5 pb-0.5">
        <div className="p-2 bg-control rounded-lg">
          <div className="flex justify-start mb-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !isReadyToSave || (isAuthenticated && isAtLimit)}
              className="flex items-center gap-2 text-xs bg-brand-neutral-600 text-white hover:bg-brand-neutral-500 disabled:opacity-50 transition-colors"
              size="sm"
              title={getSaveButtonTitle()}
            >
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <Plus className="w-2.5 h-2.5 text-brand-neutral-600" />
              </div>
              {isSaving ? 'SAVING...' : 'SAVE CURRENT'}
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-secondary">
              Loading projects...
            </div>
          ) : isAuthenticated && projects.length > 0 ? (
            <div className="flex flex-col gap-1">
              {projects.map((project) => (
                <SavedProjectCard
                  key={project.id}
                  project={project}
                  onLoad={handleLoad}
                  onDelete={handleDelete}
                  onUpdateName={handleUpdateName}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 px-4 border border-app rounded-lg bg-panel">
              <Plus className="w-8 h-8 text-brand-neutral-400 mx-auto mb-3" />
              <p className="text-secondary text-sm">{!isAuthenticated ? 'Sign in to save your projects' : 'No saved projects yet'}</p>
              <p className="text-tertiary text-xs mt-1">Save your current graffiti to get started</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
      
      <DeleteProjectModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        projectName={deleteModal.projectName}
      />
    </Collapsible>
  );
}; 