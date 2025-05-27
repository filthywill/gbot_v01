# Protected Routes

This document explains how to use the `ProtectedRoute` component to secure routes that require authentication.

## Overview

The `ProtectedRoute` component is designed to protect routes that should only be accessible to authenticated users. It will:

1. Check if the user is currently authenticated
2. Show a loading state while authentication is being checked
3. Redirect to the login page if the user is not authenticated
4. Render the protected content only when the user is authenticated

## Usage

To protect a route, wrap its content with the `ProtectedRoute` component:

```jsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/Auth';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PublicPage from './pages/PublicPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicPage />} />
      <Route path="/about" element={<PublicPage />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

## Props

The `ProtectedRoute` component accepts these props:

- `children`: React nodes to render when authenticated
- `redirectTo`: Where to redirect unauthenticated users (default: '/auth/login')
- `fallback`: What to show while checking authentication (default: loading spinner)

Example with custom props:

```jsx
<ProtectedRoute 
  redirectTo="/auth/login?source=account"
  fallback={<CustomLoadingComponent />}
>
  <AccountSettings />
</ProtectedRoute>
```

## Return-To Functionality

When a user is redirected to login, the current path is included as a `returnTo` parameter. Your login component can use this parameter to redirect the user back to the originally requested page after successful authentication:

```jsx
// In your login success handler
const login = async (credentials) => {
  // ... authenticate user
  
  // After successful login, check for return path
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get('returnTo');
  
  if (returnTo) {
    navigate(decodeURIComponent(returnTo));
  } else {
    navigate('/dashboard'); // Default redirect
  }
};
```

## Error Handling

The component logs authentication failures to help with debugging. Check the browser console for detailed information on why a route access was denied. 