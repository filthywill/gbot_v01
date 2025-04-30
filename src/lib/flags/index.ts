// Feature flags for gradual implementation and rollback capability
// Initialize flags from localStorage if available, otherwise use defaults
let initialFlags = {
  // Controls whether to use new auth hook implementation
  USE_NEW_AUTH_HOOKS: process.env.NODE_ENV === 'development',
  
  // Controls debugging of auth state transitions
  DEBUG_AUTH_STATE: false
};

// Try to load saved flags from localStorage
if (typeof window !== 'undefined') {
  try {
    const savedFlags = localStorage.getItem('APP_FLAGS');
    if (savedFlags) {
      const parsedFlags = JSON.parse(savedFlags);
      // Merge saved flags with defaults
      initialFlags = { ...initialFlags, ...parsedFlags };
    }
  } catch (error) {
    console.error('Error loading feature flags from localStorage:', error);
  }
}

export const FLAGS = initialFlags;

// Helper function to dynamically update flags
export function updateFlag(flagName: keyof typeof FLAGS, value: boolean): void {
  if (flagName in FLAGS) {
    FLAGS[flagName] = value;
    // Store in localStorage for persistence during development
    if (typeof window !== 'undefined') {
      localStorage.setItem('APP_FLAGS', JSON.stringify(FLAGS));
    }
  }
} 