# Profile Picture Upload Implementation Plan

## 📋 **Overview**

This plan details the implementation of profile picture upload functionality for the Account Settings page in our React + Vite + TypeScript + Supabase application.

### **🎯 Goals:**
- Add profile picture upload to the Profile Information section
- Integrate seamlessly with existing Avatar component
- Maintain high performance and user experience
- Follow current codebase patterns and best practices
- Implement secure file handling with Supabase Storage

### **🔧 Tech Stack Integration:**
- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Database + Storage)
- **State:** Zustand (existing patterns)
- **UI:** Custom components + Lucide React icons
- **Styling:** Tailwind CSS (following app design system)

---

## 📚 **Prerequisites Checklist**

### **✅ Already Completed:**
- [x] Database `profiles` table with `avatar_url` field
- [x] RLS policies for profiles table
- [x] Avatar component for displaying profile pictures
- [x] Account Settings page structure
- [x] Custom Button and UI components
- [x] Authentication system

### **🔍 Need to Verify:**
- [ ] Supabase Storage bucket setup
- [ ] Storage bucket policies
- [ ] File size limits and allowed types
- [ ] CDN configuration for image delivery

---

## 🚀 **Implementation Steps**

### **Step 1: Supabase Storage Setup (10 minutes)**

#### **1.1 Create/Verify Storage Bucket**
```sql
-- Check if avatars bucket exists
SELECT name, public FROM storage.buckets WHERE name = 'avatars';

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

#### **1.2 Set Up Storage Policies**
```sql
-- Policy: Users can upload their own avatar
CREATE POLICY "Users can upload avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar  
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects  
FOR DELETE USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Everyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

#### **1.3 Configure Bucket Settings**
- **Max file size:** 5MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`
- **File naming:** `{user_id}/avatar.{extension}`

---

### **Step 2: Create Profile Picture Upload Component (30 minutes)**

#### **2.1 Create `ProfilePictureUpload.tsx`**

**Location:** `src/components/Auth/ProfilePictureUpload.tsx`

**Key Features:**
- Drag & drop interface
- Click to upload fallback
- Image preview
- Loading states
- Error handling
- File validation
- Progress indicator
- Automatic resizing/compression

**Component Structure:**
```typescript
interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onUploadSuccess: (avatarUrl: string) => void;
  onUploadError: (error: string) => void;
  userId: string;
  disabled?: boolean;
}
```

**Core Functionality:**
- File validation (size, type, dimensions)
- Image compression (using Canvas API)
- Upload to Supabase Storage
- Progress tracking
- Error handling
- Integration with existing Avatar component

#### **2.2 Create Upload Hook**

**Location:** `src/hooks/useProfilePictureUpload.ts`

**Responsibilities:**
- File upload logic
- Progress tracking
- Error handling
- Integration with Supabase Storage API
- Cache invalidation

---

### **Step 3: Update Existing Components (20 minutes)**

#### **3.1 Enhance Avatar Component**
- Add upload state support
- Handle loading states during upload
- Add click-to-upload functionality
- Maintain backward compatibility

#### **3.2 Update AccountSettings.tsx**
- Add ProfilePictureUpload component to Profile Information section
- Integrate with existing profile update flow
- Handle avatar_url updates in database
- Add proper loading states

#### **3.3 Update Profile Update Logic**
- Extend `updateProfile` function to handle avatar_url
- Add avatar deletion functionality
- Integrate with notification system

---

### **Step 4: Image Processing & Optimization (15 minutes)**

#### **4.1 Client-side Image Processing**
```typescript
// Image compression utility
const compressImage = async (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<File>

// Image validation utility  
const validateImage = (file: File): { valid: boolean; error?: string }
```

**Processing Pipeline:**
1. **Validation:** File type, size, dimensions
2. **Resize:** Max 400x400px for avatars
3. **Compress:** Reduce file size (target: <200KB)
4. **Format:** Convert to WebP when supported, fallback to JPEG

#### **4.2 Error Handling**
- File too large
- Invalid file type
- Upload failures
- Network errors
- Storage quota exceeded

---

### **Step 5: Integration & Testing (25 minutes)**

#### **5.1 Component Integration**
```tsx
// In AccountSettings.tsx - Profile Information section
<div className="mb-6">
  <label className="block text-sm font-medium text-secondary mb-3">
    Profile Picture
  </label>
  <div className="flex items-start space-x-4">
    <Avatar user={user} size="lg" className="flex-shrink-0" />
    <ProfilePictureUpload
      currentAvatarUrl={user?.user_metadata?.avatar_url}
      onUploadSuccess={handleAvatarUploadSuccess}
      onUploadError={handleAvatarUploadError}
      userId={user?.id}
      disabled={isSaving}
    />
  </div>
</div>
```

#### **5.2 State Management Integration**
- Update profile state on successful upload
- Trigger Avatar component re-render
- Update notification system
- Handle optimistic updates

#### **5.3 Error Boundary Integration**
- Wrap upload component in error boundary
- Graceful degradation on upload failures
- Retry mechanisms

---

### **Step 6: Performance Optimizations (15 minutes)**

#### **6.1 Image Delivery Optimization**
- Use Supabase CDN for image delivery
- Implement image caching strategies
- Add lazy loading for avatar images
- Generate responsive image URLs

#### **6.2 Upload Performance**
- Implement upload progress tracking
- Add upload cancellation
- Queue multiple uploads
- Optimize chunk size for large files

#### **6.3 Memory Management**
- Clean up object URLs
- Dispose of canvas elements
- Implement proper cleanup in useEffect

---

### **Step 7: User Experience Enhancements (20 minutes)**

#### **7.1 Upload Interface**
```tsx
// Drag & drop area with visual feedback
<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-primary-300 transition-colors">
  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
  <p className="text-sm text-gray-600">
    Drag & drop your photo here, or <button className="text-brand-primary-500 underline">click to browse</button>
  </p>
  <p className="text-xs text-gray-500 mt-1">
    PNG, JPG, or WebP up to 5MB
  </p>
</div>
```

#### **7.2 Upload Progress UI**
- Progress bar during upload
- Success/error states
- File size and type display
- Upload speed indicator

#### **7.3 Image Preview**
- Show preview before upload
- Crop/edit interface (future enhancement)
- Zoom and pan functionality
- Before/after comparison

---

## 🔧 **Technical Implementation Details**

### **File Structure:**
```
src/
├── components/
│   └── Auth/
│       ├── Avatar.tsx (update)
│       ├── ProfilePictureUpload.tsx (new)
│       └── index.ts (update exports)
├── hooks/
│   └── useProfilePictureUpload.ts (new)
├── utils/
│   ├── imageProcessing.ts (new)
│   └── fileValidation.ts (new)
├── types/
│   └── upload.ts (new)
└── pages/
    └── AccountSettings.tsx (update)
```

### **Key Utilities:**

#### **Image Processing (`src/utils/imageProcessing.ts`):**
```typescript
export const compressImage = async (file: File, options: CompressionOptions): Promise<File>
export const validateImageFile = (file: File): ValidationResult
export const generateThumbnail = (file: File, size: number): Promise<string>
export const calculateImageDimensions = (file: File): Promise<{ width: number; height: number }>
```

#### **Upload Hook (`src/hooks/useProfilePictureUpload.ts`):**
```typescript
export const useProfilePictureUpload = () => {
  // State management for upload process
  // File validation and processing
  // Supabase Storage integration
  // Progress tracking
  // Error handling
  return {
    uploadFile,
    isUploading,
    progress,
    error,
    cancelUpload
  }
}
```

### **Error Handling Strategy:**
1. **Client-side validation:** File type, size, dimensions
2. **Network error handling:** Retry with exponential backoff
3. **Storage errors:** Quota exceeded, permissions, etc.
4. **User feedback:** Clear error messages and recovery options
5. **Fallback behavior:** Graceful degradation to existing social avatars

### **Security Considerations:**
1. **File validation:** MIME type checking, file signature validation
2. **Size limits:** Prevent abuse with reasonable file size limits
3. **RLS policies:** Ensure users can only manage their own avatars
4. **Sanitization:** Clean file names and prevent path traversal
5. **Rate limiting:** Prevent rapid successive uploads

---

## 🧪 **Testing Plan**

### **Unit Tests:**
- [ ] Image compression utilities
- [ ] File validation functions
- [ ] Upload hook functionality
- [ ] Error handling scenarios

### **Integration Tests:**
- [ ] ProfilePictureUpload component
- [ ] AccountSettings integration
- [ ] Avatar component updates
- [ ] Database profile updates

### **E2E Tests:**
- [ ] Complete upload flow
- [ ] Error scenarios
- [ ] Different file types and sizes
- [ ] Mobile responsiveness

### **Manual Testing Scenarios:**
1. **Happy path:** Upload valid image, see it appear immediately
2. **File validation:** Try invalid files (wrong type, too large)
3. **Network issues:** Test with slow/interrupted connections
4. **Mobile experience:** Test touch interactions and file picker
5. **Error recovery:** Test error states and retry functionality

---

## 📊 **Performance Metrics**

### **Target Metrics:**
- **Upload time:** <3 seconds for 1MB image
- **Compression ratio:** >50% size reduction
- **Time to interactive:** <100ms for upload UI
- **Error rate:** <1% for valid uploads
- **Mobile performance:** Same targets on 3G connection

### **Monitoring:**
- Upload success/failure rates
- Average upload times
- File size distributions
- Error categorization
- User engagement metrics

---

## 🚀 **Deployment & Rollout**

### **Phase 1: Development (This implementation)**
- Core upload functionality
- Basic error handling
- Integration with existing components

### **Phase 2: Enhancement (Future)**
- Advanced image editing (crop, rotate, filters)
- Multiple file support
- Batch operations
- Advanced progress indicators

### **Phase 3: Optimization (Future)**
- Server-side image processing
- Advanced caching strategies
- CDN optimizations
- Performance monitoring

---

## 📝 **Code Quality Standards**

### **TypeScript:**
- Strict type checking enabled
- Proper interface definitions
- Generic types where appropriate
- No `any` types without justification

### **React Best Practices:**
- Functional components with hooks
- Proper dependency arrays
- Memory leak prevention
- Performance optimizations (useMemo, useCallback)

### **Accessibility:**
- ARIA labels for upload areas
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### **Code Organization:**
- Single responsibility principle
- Reusable utility functions
- Consistent naming conventions
- Comprehensive documentation

---

## ✅ **Definition of Done**

- [ ] Storage bucket and policies configured
- [ ] ProfilePictureUpload component implemented
- [ ] Avatar component updated with upload support
- [ ] AccountSettings integration complete
- [ ] Image processing and optimization working
- [ ] Error handling implemented
- [ ] Performance optimizations applied
- [ ] Accessibility requirements met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Code review completed

---

## 🔗 **Resources & References**

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [React File Upload Best Practices](https://web.dev/file-handling/)
- [Image Compression Techniques](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Accessibility Guidelines for File Uploads](https://webaim.org/techniques/forms/controls#file)

---

**Estimated Total Implementation Time: 2-3 hours**

This plan provides a comprehensive roadmap for implementing profile picture upload functionality while maintaining code quality, performance, and user experience standards. 