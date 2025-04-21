import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auth pages configuration
const authPages = [
  { source: 'callback.html', dest: 'auth/callback/index.html' },
  { source: 'reset-password.html', dest: 'auth/reset-password/index.html' },
  { source: 'error.html', dest: 'auth/error/index.html' }
];

// Directories to check in dist
const sourceDirectories = [
  'dist',
  'dist/src/auth-pages'
];

function setupAuthRoutes() {
  console.log('Setting up auth routes...');
  
  try {
    // Ensure auth directory structure exists
    const authDir = path.resolve(__dirname, 'dist/auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Process each auth page
    for (const page of authPages) {
      // Check both possible source locations
      let sourceFile = null;
      
      for (const sourceDir of sourceDirectories) {
        const sourcePath = path.resolve(__dirname, sourceDir, page.source);
        if (fs.existsSync(sourcePath)) {
          sourceFile = sourcePath;
          break;
        }
      }
      
      if (sourceFile) {
        // Create destination directory
        const destPath = path.resolve(__dirname, 'dist', page.dest);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Read the content of the HTML file
        const content = fs.readFileSync(sourceFile, 'utf8');
        
        // Write the content to the destination
        fs.writeFileSync(destPath, content);
        
        console.log(`Created: ${page.dest}`);
      } else {
        console.warn(`Warning: Source file for ${page.source} not found`);
      }
    }
    
    console.log('Auth routes set up successfully!');
  } catch (error) {
    console.error('Error setting up auth routes:', error);
    process.exit(1);
  }
}

setupAuthRoutes(); 