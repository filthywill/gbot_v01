# Password Security Enhancement - Implementation Plan

This document outlines the implementation plan for enhancing password security in our application based on the security review recommendations, leveraging the Supabase MCP (Management Console Plugin) for streamlined implementation.

## Overview

Our current password management implementation, while solid, has several areas for improvement to enhance security and user experience. This plan addresses the following:

1. Enhancing password validation
2. Implementing current password verification
3. Improving password change feedback
4. Separation of concerns for password management
5. Enhanced session security for sensitive operations
6. Supabase security configuration using MCP

## Implementation Plan

### Phase 1: Enhance Password Validation (Estimated time: 2-3 hours)

**Objective:** Replace the basic length check with our comprehensive password validator

#### Steps:

1. Import the `validatePassword` utility from `utils/passwordUtils.ts` in `AccountSettings.tsx`:

```typescript
import { validatePassword } from '../utils/passwordUtils';
```

2. Replace the current basic password validation:

```typescript
// Replace this
if (newPassword.length < 8) {
  setPasswordError('Password must be at least 8 characters long');
  return;
}

// With the comprehensive validator
const validation = validatePassword(newPassword);
if (!validation.isValid) {
  setPasswordError(validation.message || 'Password is not strong enough');
  return;
}
```

3. Update the unit tests to cover the enhanced validation (if applicable)

4. Use Supabase MCP to check current Auth settings:

```typescript
// Check current password policies via MCP
const checkAuthSettings = async () => {
  // List all projects to identify our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;  // Assuming the first project is ours
  
  // Get project details
  const { data: project } = await mcp_supabase_get_project({ id: projectId });
  
  console.log('Current auth settings:', project.auth_settings);
  
  // Verify these settings match our application requirements
}
```

#### Expected Outcome:
- Password validation will enforce uppercase, lowercase, number, and special character requirements
- Users will receive clearer feedback on password requirements
- Security posture will be improved by enforcing stronger passwords
- Validation in our app will match Supabase Auth settings

---

### Phase 2: Current Password Verification (Estimated time: 3-4 hours)

**Objective:** Implement verification of current password before allowing password changes

#### Steps:

1. Create a Supabase Edge Function for password verification using MCP:

```typescript
// First, create the Edge Function file content
const edgeFunctionCode = `import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Create a Supabase client with the Admin key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { email, password } = await req.json()
  
  try {
    // Attempt to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ verified: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        verified: false, 
        message: 'Current password is incorrect'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
})`;

// Use MCP to deploy the Edge Function
const deployEdgeFunction = async () => {
  // List projects to get our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;  // Assume first project
  
  // Deploy the edge function using MCP
  await mcp_supabase_deploy_edge_function({
    project_id: projectId,
    name: 'verify-password',
    files: [
      {
        name: 'index.ts',
        content: edgeFunctionCode
      }
    ]
  });
  
  console.log('Edge function deployed successfully');
}
```

2. Create a client-side utility to call this function:

```typescript
// src/utils/passwordUtils.ts (add to existing file)
import { supabase } from '../lib/supabase';

export const verifyCurrentPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-password', {
      body: { email, password }
    });
    
    if (error) throw error;
    
    return data.verified;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}
```

3. Update the `handlePasswordChange` function in `AccountSettings.tsx`:

```typescript
const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Reset messages
  setPasswordError('');
  setPasswordChangeMessage('');
  
  // Validate passwords
  if (newPassword !== confirmPassword) {
    setPasswordError('New passwords do not match');
    return;
  }
  
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    setPasswordError(validation.message || 'Password is not strong enough');
    return;
  }
  
  setIsChangingPassword(true);
  
  try {
    // Verify current password first
    const isCurrentPasswordValid = await verifyCurrentPassword(user?.email || '', currentPassword);
    
    if (!isCurrentPasswordValid) {
      setPasswordError('Current password is incorrect');
      setIsChangingPassword(false);
      return;
    }
    
    // Proceed with password change
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    
    // Clear form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    setPasswordChangeMessage('Password updated successfully!');
  } catch (error: any) {
    console.error('Error changing password:', error);
    setPasswordError(error.message || 'Error changing password');
  } finally {
    setIsChangingPassword(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      if (passwordChangeMessage) setPasswordChangeMessage('');
    }, 3000);
  }
};
```

4. Use MCP to monitor function logs during testing:

```typescript
// Check Edge Function logs during testing
const checkFunctionLogs = async () => {
  // List projects to get our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;
  
  // Get logs for the edge function
  const logs = await mcp_supabase_get_logs({
    project_id: projectId,
    service: 'edge-function'
  });
  
  console.log('Edge function logs:', logs);
}
```

#### Expected Outcome:
- Users must verify their current password before changing to a new one
- Enhanced security by preventing unauthorized password changes even with a valid session
- Better UX by providing clear feedback on password verification failures
- Direct deployment and monitoring of the Edge Function using MCP

---

### Phase 3: Improve Password Change Feedback (Estimated time: 2-3 hours)

**Objective:** Add real-time password strength visualization and requirements feedback

#### Steps:

1. Import the PasswordStrengthMeter component and required utilities:

```typescript
import PasswordStrengthMeter from '../components/Auth/PasswordStrengthMeter';
import { checkPasswordStrength } from '../utils/passwordUtils';
```

2. Add state for password strength:

```typescript
const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
```

3. Update the password input to display strength and requirements in real-time:

```typescript
useEffect(() => {
  if (newPassword) {
    setPasswordStrength(checkPasswordStrength(newPassword));
  }
}, [newPassword]);
```

4. Add the strength meter to the form:

```jsx
<div className="mb-4">
  <label htmlFor="newPassword" className="block text-sm font-medium text-secondary mb-1">
    New Password
  </label>
  <input
    id="newPassword"
    type="password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    className="w-full px-3 py-2 bg-app border border-app rounded-md text-primary 
    focus:ring-1 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none"
    required
    minLength={8}
  />
  
  {/* Add the password strength meter */}
  {newPassword && (
    <div className="mt-2">
      <PasswordStrengthMeter strength={passwordStrength} />
    </div>
  )}
  
  {/* Add password requirements feedback */}
  {newPassword && passwordStrength.feedback.length > 0 && (
    <div className="mt-2 text-xs text-secondary">
      <p className="font-medium mb-1">Password requirements:</p>
      <ul className="list-disc pl-4 space-y-1">
        {passwordStrength.feedback.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )}
</div>
```

#### Expected Outcome:
- Users receive immediate visual feedback on password strength
- Requirements are clearly displayed as user types
- Higher likelihood of users creating strong, secure passwords

---

### Phase 4: Separation of Concerns (Estimated time: 3-4 hours)

**Objective:** Create a dedicated hook for password management to improve code organization and reusability

#### Steps:

1. Create a new hook file `src/hooks/auth/usePasswordManagement.ts`:

```typescript
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { validatePassword, verifyCurrentPassword } from '../../utils/passwordUtils';

export const usePasswordManagement = (userEmail: string | undefined) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  
  const updatePasswordStrength = (password: string) => {
    if (password) {
      const { checkPasswordStrength } = require('../../utils/passwordUtils');
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [] });
    }
  };
  
  const validateForm = () => {
    // Reset messages
    setPasswordError('');
    setPasswordChangeMessage('');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }
    
    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.message || 'Password is not strong enough');
      return false;
    }
    
    return true;
  };
  
  const changePassword = async () => {
    if (!validateForm()) {
      return false;
    }
    
    setIsChangingPassword(true);
    
    try {
      // Verify current password
      if (!userEmail) {
        throw new Error('User email not available');
      }
      
      const isCurrentPasswordValid = await verifyCurrentPassword(userEmail, currentPassword);
      
      if (!isCurrentPasswordValid) {
        setPasswordError('Current password is incorrect');
        return false;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setPasswordChangeMessage('Password updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordChangeMessage('');
      }, 3000);
      
      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Error changing password');
      return false;
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordChangeMessage('');
    setPasswordStrength({ score: 0, feedback: [] });
  };
  
  return {
    // State
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordChangeMessage,
    isChangingPassword,
    passwordStrength,
    
    // Methods
    updatePasswordStrength,
    changePassword,
    resetForm
  };
};
```

2. Update `AccountSettings.tsx` to use the new hook:

```typescript
import { usePasswordManagement } from '../hooks/auth/usePasswordManagement';

const AccountSettings = () => {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Use the password management hook
  const {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    passwordError, passwordChangeMessage, isChangingPassword,
    passwordStrength, updatePasswordStrength,
    changePassword
  } = usePasswordManagement(user?.email);
  
  useEffect(() => {
    if (newPassword) {
      updatePasswordStrength(newPassword);
    }
  }, [newPassword, updatePasswordStrength]);
  
  // ... rest of your component code
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePassword();
  };
  
  // ... rest of your component
};
```

#### Expected Outcome:
- Clean separation of password management logic
- Improved maintainability and testability
- Reusable password management logic that can be used in other components
- More focused components with single responsibilities

---

### Phase 5: Enhanced Session Security (Estimated time: 2-3 hours)

**Objective:** Implement token rotation for sensitive operations like password changes

#### Steps:

1. Update `usePasswordManagement` to refresh the session after password change:

```typescript
const changePassword = async () => {
  // ... existing code
  
  try {
    // ... password verification
    
    // Update password
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    
    // Refresh session/token after password change
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Failed to refresh session after password change:', refreshError);
    }
    
    // ... rest of the function
  }
};
```

2. Add a session refresh utility to be used after sensitive operations:

```typescript
// src/lib/auth/sessionUtils.ts
import { supabase } from '../supabase';
import useAuthStore from '../../store/useAuthStore';
import logger from '../logger';

export const refreshSessionAfterSensitiveOperation = async (): Promise<boolean> => {
  try {
    logger.info('Refreshing session after sensitive operation');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('Failed to refresh session:', error);
      return false;
    }
    
    if (data.session) {
      // Update auth store with new session
      const authStore = useAuthStore.getState();
      authStore.setSession(data.session);
      logger.info('Session successfully refreshed after sensitive operation');
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Exception refreshing session:', error);
    return false;
  }
};
```

3. Update sensitive operations to call this utility:

```typescript
// In usePasswordManagement.ts
import { refreshSessionAfterSensitiveOperation } from '../../lib/auth/sessionUtils';

// ... in the changePassword function
const { error } = await supabase.auth.updateUser({ 
  password: newPassword 
});

if (error) throw error;

// Refresh session after password change
await refreshSessionAfterSensitiveOperation();
```

#### Expected Outcome:
- Enhanced security with fresh tokens after password changes
- Reduced risk of session hijacking or token replay attacks
- More secure handling of sensitive operations

---

### Phase 6: Supabase Security Configuration with MCP (Estimated time: 2-3 hours)

**Objective:** Ensure Supabase server-side security settings are properly configured

#### Steps:

1. Check and configure Row Level Security (RLS) policies:

```typescript
// Use MCP to check and update RLS policies
const configureRLS = async () => {
  // List projects to get our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;
  
  // List all tables to identify those needing RLS
  const tables = await mcp_supabase_list_tables({
    project_id: projectId,
    schemas: ['public']
  });
  
  console.log('Tables:', tables);
  
  // Check for any tables without RLS
  const tablesWithoutRLS = tables.filter(table => !table.rls_enabled);
  
  if (tablesWithoutRLS.length > 0) {
    console.warn('WARNING: The following tables do not have RLS enabled:', 
      tablesWithoutRLS.map(t => t.name).join(', '));
    
    // Enable RLS on these tables
    for (const table of tablesWithoutRLS) {
      await mcp_supabase_apply_migration({
        project_id: projectId,
        name: `enable_rls_on_${table.name}`,
        query: `ALTER TABLE "${table.name}" ENABLE ROW LEVEL SECURITY;`
      });
      
      // Add default policy if needed
      await mcp_supabase_apply_migration({
        project_id: projectId,
        name: `add_default_policy_on_${table.name}`,
        query: `
          CREATE POLICY "Users can view their own data" 
          ON "${table.name}" 
          FOR SELECT USING (auth.uid() = user_id);
        `
      });
    }
  }
}
```

2. Update auth configuration for improved security:

```typescript
// Configure auth settings for enhanced security
const configureAuthSettings = async () => {
  // List projects to get our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;
  
  // Get current auth settings
  const { data: project } = await mcp_supabase_get_project({ id: projectId });
  const currentSettings = project.auth_settings;
  
  // Apply recommended security settings using SQL
  // Note: This is a simplified example - in reality you'd use the Supabase Dashboard UI
  // to configure these settings as they're not directly accessible via SQL
  
  // Instead, we'll write a SQL migration to update user management procedures
  await mcp_supabase_apply_migration({
    project_id: projectId,
    name: 'enhance_security_settings',
    query: `
      -- Set up additional security logging
      CREATE TABLE IF NOT EXISTS "security_audit_log" (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES auth.users(id),
        action TEXT NOT NULL,
        ip_address TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        details JSONB
      );
      
      -- Create function to log sensitive operations
      CREATE OR REPLACE FUNCTION log_security_event(
        p_user_id UUID,
        p_action TEXT,
        p_ip_address TEXT DEFAULT NULL,
        p_details JSONB DEFAULT '{}'::JSONB
      ) RETURNS UUID AS $$
      DECLARE
        v_id UUID;
      BEGIN
        INSERT INTO security_audit_log (user_id, action, ip_address, details)
        VALUES (p_user_id, p_action, p_ip_address, p_details)
        RETURNING id INTO v_id;
        
        RETURN v_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      -- Grant appropriate permissions
      GRANT EXECUTE ON FUNCTION log_security_event TO authenticated;
      GRANT EXECUTE ON FUNCTION log_security_event TO service_role;
    `
  });
  
  console.log('Enhanced security settings configured');
}
```

3. Configure SMTP server for better email delivery and security:

```typescript
// Note: This would be configured through the Supabase Dashboard UI
// We're documenting what needs to be set up:

/*
1. Navigate to Authentication > Email Templates in the Supabase Dashboard
2. Configure a custom SMTP server with:
   - SMTP Host: your-smtp-server.com
   - SMTP Port: 587 (or as appropriate)
   - SMTP Username: your-smtp-username
   - SMTP Password: your-smtp-password
   - Sender Email: noreply@yourdomain.com
3. Ensure that link tracking is disabled in your SMTP provider
4. Set "Site URL" to your production domain
5. Customize email templates to:
   - Use your brand styling
   - Include clear instructions
   - For password reset emails, consider the email scanner issue mentioned in docs
*/
```

#### Expected Outcome:
- Properly configured Row Level Security (RLS) on all tables
- Enhanced security monitoring through audit logging
- Proper configuration of auth settings
- Improved email delivery and security
- Better session management

---

## Testing Plan

For each phase of implementation, the following tests should be conducted, leveraging MCP where applicable:

### Unit Tests:
- Test password validation functions
- Test password strength checking
- Test the password management hook with mocked Supabase responses

### Integration Tests:
- Test the password change flow with valid inputs
- Test current password verification
- Test error handling for various failure scenarios
- Use MCP to verify Edge Function execution and logs

### Manual Tests:
- Verify password strength meter visuals
- Test the entire password change flow
- Verify session refresh after password change
- Test with various password combinations
- Use MCP to check authentication logs

### Security Tests using MCP:
- Verify RLS policies are working correctly
- Check auth configuration settings
- Validate Edge Function security
- Test token refresh functionality
- Verify SQL injection protection

## Security Dashboard Configuration Using MCP

After implementing all phases, use MCP to set up a security monitoring dashboard:

```typescript
// Create a security dashboard migration
const createSecurityDashboard = async () => {
  // List projects to get our project ID
  const { data: projects } = await mcp_supabase_list_projects();
  const projectId = projects[0].id;
  
  // Apply migration for security views
  await mcp_supabase_apply_migration({
    project_id: projectId,
    name: 'create_security_dashboard_views',
    query: `
      -- Create view for password change events
      CREATE OR REPLACE VIEW password_change_events AS
      SELECT 
        user_id,
        timestamp,
        ip_address,
        details->>'success' as success
      FROM security_audit_log
      WHERE action = 'password_change'
      ORDER BY timestamp DESC;
      
      -- Create view for failed login attempts
      CREATE OR REPLACE VIEW failed_login_attempts AS
      SELECT 
        details->>'email' as email,
        COUNT(*) as attempt_count,
        MIN(timestamp) as first_attempt,
        MAX(timestamp) as last_attempt,
        array_agg(DISTINCT ip_address) as ip_addresses
      FROM security_audit_log
      WHERE action = 'login' AND details->>'success' = 'false'
      GROUP BY details->>'email'
      HAVING COUNT(*) > 3
      ORDER BY attempt_count DESC;
      
      -- Grant access to the security team role
      GRANT SELECT ON password_change_events TO authenticated;
      GRANT SELECT ON failed_login_attempts TO authenticated;
    `
  });
  
  console.log('Security dashboard views created');
}
```

## Timeline with MCP Integration

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| 1: Enhance Validation | 2-3 hours | None |
| 2: Current Password Verification (with MCP) | 3-4 hours | Supabase MCP setup |
| 3: Password Change Feedback | 2-3 hours | Phase 1 |
| 4: Separation of Concerns | 3-4 hours | Phases 1-3 |
| 5: Enhanced Session Security | 2-3 hours | Phase 4 |
| 6: Supabase Security Configuration (with MCP) | 2-3 hours | Phases 1-5 |

**Total Estimated Time:** 14-20 hours

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Password Security Best Practices](https://supabase.com/docs/guides/auth/password-security)
- [React Hooks Best Practices](https://reactjs.org/docs/hooks-best-practices.html)
- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [MCP Functions Documentation](https://supabase.com/docs/reference/javascript/mcp) 