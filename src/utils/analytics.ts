import { supabase } from '../lib/supabase';
import useAuthStore from '../store/useAuthStore';

export type ActionType = 
  | 'submit'
  | 'create_preset'
  | 'export_png'
  | 'export_svg'
  | 'preset_click';

export interface TrackingPayload {
  action_type: ActionType;
  metadata?: Record<string, any>;
}

/**
 * Track a user action in Supabase
 * 
 * @param payload The tracking payload containing action type and optional metadata
 * @returns Promise that resolves when tracking is complete
 */
export const trackUserAction = async (payload: TrackingPayload): Promise<void> => {
  try {
    const user = useAuthStore.getState().user;
    
    // If no user is logged in, we don't track
    if (!user) return;
    
    const { error } = await supabase
      .from('user_actions')
      .insert({
        user_id: user.id,
        action_type: payload.action_type,
        metadata: payload.metadata || null,
      });
      
    if (error) {
      console.error('Error tracking user action:', error);
    }
  } catch (error) {
    console.error('Failed to track user action:', error);
  }
};

/**
 * Track when a user submits text for graffiti generation
 */
export const trackSubmit = (text: string) => {
  return trackUserAction({
    action_type: 'submit',
    metadata: { text }
  });
};

/**
 * Track when a user creates a preset
 */
export const trackCreatePreset = (presetName: string, presetId: string) => {
  return trackUserAction({
    action_type: 'create_preset',
    metadata: { presetName, presetId }
  });
};

/**
 * Track when a user clicks a preset
 */
export const trackPresetClick = (presetId: string, presetName: string) => {
  return trackUserAction({
    action_type: 'preset_click',
    metadata: { presetId, presetName }
  });
};

/**
 * Track when a user exports as PNG
 */
export const trackExportPng = (text: string) => {
  return trackUserAction({
    action_type: 'export_png',
    metadata: { text }
  });
};

/**
 * Track when a user exports as SVG
 */
export const trackExportSvg = (text: string) => {
  return trackUserAction({
    action_type: 'export_svg',
    metadata: { text }
  });
}; 