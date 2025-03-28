# gbot_v01

A modern graffiti generation web application built with React, TypeScript, and Zustand.

## Project Overview

This application allows users to generate custom graffiti text with various styles, colors, and customization options. It uses SVG-based rendering for high-quality output.

## Key Features

- Text to graffiti conversion
- Multiple preset styles with thumbnail previews
- Advanced customization options
- Responsive design
- Undo/redo functionality for customizations
- Modern UI with animations

## Technology Stack

- **Frontend**: React, TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tools**: Vite
- **SVG Processing**: Custom algorithms for letter positioning and rendering

## Development Guide

### Setup

1. Clone the repository
```bash
git clone https://github.com/filthywill/gbot_v01.git
cd gbot_v01
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

### Project Structure

- `/src` - Application source code
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/store` - Zustand store configurations
  - `/data` - Static data and configurations
  - `/utils` - Utility functions
  - `/assets` - Static assets

## GitHub Workflow

### Pushing Changes to GitHub

There are multiple ways to push changes to the GitHub repository:

1. **Using GitHub MCP Tools (Recommended)**
   - When asked to push changes to GitHub, use the GitHub MCP tools directly
   - This method allows pushing specific files or multiple files in a single commit

2. **Using Provided Scripts**
   - Run `push_to_github.bat` or `push_to_github_fixed.bat` for Windows
   - These scripts automate the git add, commit, and push process

3. **Manual Git Commands**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

### Best Practices

- Always add a descriptive commit message
- Update RECENT_UPDATES.md with significant changes
- Push changes regularly to avoid large, complex merges

## Maintenance

Remember to keep documentation updated when making significant changes to the application architecture or feature set.

## License

This project is proprietary and confidential.