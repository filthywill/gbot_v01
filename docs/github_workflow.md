# GitHub Workflow Guide

This document outlines the procedures for managing the GitHub repository for gbot_v01.

## Pushing Changes to GitHub

When you need to push changes to the GitHub repository, follow these steps:

### Method 1: Using GitHub MCP Tools (Recommended)

The most reliable way to push changes is using the MCP GitHub tools directly through Claude:

1. Simply ask Claude to "push the latest changes to GitHub"
2. Claude will:
   - Check which files have been modified
   - Use the MCP GitHub tools to push those changes
   - Create appropriate commit messages
   - Update documentation as needed

Example request:
```
We need to push the latest version of our project to the github repo.
```

#### Handling Large Files or Multiple Files

For large files or when pushing many files at once:
- Claude will prioritize key files like components and data models
- Use descriptive commit messages for each file or group of files
- Update RECENT_UPDATES.md with information about what was pushed and what remains

### Method 2: Using Provided Scripts

Several batch scripts are available for pushing changes:

- `push_to_github.bat` - Basic script that adds all changes and pushes to main
- `push_to_github_fixed.bat` - Enhanced script with more verbose output

To use:
1. Open a terminal
2. Navigate to the project directory
3. Run the desired script:
   ```
   .\push_to_github_fixed.bat
   ```

### Method 3: Manual Git Commands

If more fine-grained control is needed:

```bash
# Check status of changes
git status

# Add specific files
git add <file1> <file2>

# Add all changes
git add .

# Commit with message
git commit -m "Descriptive commit message"

# Push to GitHub
git push origin main
```

## Documentation Updates

When pushing significant changes, make sure to:

1. Update the RECENT_UPDATES.md file with a summary of changes
2. Keep the README.md file current with any new features or usage instructions
3. Document any API changes or new components

## Best Practices

- Use descriptive commit messages that clearly explain what changed
- Group related changes into a single commit
- Push changes regularly to avoid complex merges
- When working on major features, consider using feature branches

## Troubleshooting

If you encounter issues with pushing:

1. Try using GitHub MCP tools directly through Claude
2. Check for any authentication issues
3. If terminal commands are interrupted, use the GitHub MCP tools instead
4. For very large files, consider pushing them individually or using documentation to track what still needs to be pushed