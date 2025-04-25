# Stizack Documentation Reference

This document serves as the central hub for all Stizack documentation, providing a comprehensive index of available resources, guides, and technical information.

## Quick Links

- [Architecture Overview](./ARCHITECTURE.md) - System architecture and design
- [Authentication System](./AUTHENTICATION.md) - Authentication implementation
- [Component Structure](./COMPONENT_STRUCTURE.md) - Component organization
- [Color System](./COLOR_SYSTEM.md) - Color system implementation
- [Security Features](./SECURITY.md) - Security implementation details
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues and solutions

## System Architecture

| Document | Description |
|----------|-------------|
| [Architecture Overview](./ARCHITECTURE.md) | Comprehensive documentation of the application's architecture, including the tech stack, project structure, core features, and component architecture. |
| [Component Structure](./COMPONENT_STRUCTURE.md) | Details the organization and relationships between components, explaining the component hierarchy and responsibilities. |
| [API Reference](./API_REFERENCE.md) | Complete reference for hooks, stores, utilities, and APIs used throughout the application. |

## Frontend Components

| Document | Description |
|----------|-------------|
| [Component Standards](./COMPONENT_STANDARDS.md) | Standards and best practices for creating and maintaining components, including naming conventions, history management patterns, and value conversion methods. |
| [Control Components](./features/CONTROL_COMPONENTS.md) | Architecture of the control component system, based on the `BaseControlItem` foundation. |
| [Color System](./COLOR_SYSTEM.md) | Comprehensive documentation of the color system architecture, implementation, variables, themes, and best practices. |

## Authentication & Security

| Document | Description |
|----------|-------------|
| [Authentication System](./AUTHENTICATION.md) | Comprehensive documentation of the authentication system using Supabase, including OTP verification, password reset, and security considerations. |
| [Security Features](./SECURITY.md) | Comprehensive documentation of security features and implementations. |
| [Verification Email Template](./VERIFICATION_EMAIL_TEMPLATE.html) | HTML template for verification emails. |

## Development & Optimization

| Document | Description |
|----------|-------------|
| [Environment Configuration](./ENVIRONMENT.md) | Guide for setting up and configuring different environments (development, production). |
| [GitHub Workflow](./github_workflow.md) | Process for contributing to the repository, including branching strategy and PR workflow. |
| [Code Optimization](./CODE_OPTIMIZATION.md) | Techniques and best practices for optimizing code performance and maintainability. |
| [Debug Workflow](./overlap-debug-workflow.txt) | Workflow for debugging letter overlap issues in the graffiti generation process. |

## Troubleshooting

| Document | Description |
|----------|-------------|
| [Troubleshooting Guide](./TROUBLESHOOTING.md) | Solutions for common issues encountered during development and usage. |

## Current File Structure

The documentation is organized as follows:

```
docs/
├── ARCHITECTURE.md                  # System architecture documentation
├── API_REFERENCE.md                 # API reference documentation
├── AUTHENTICATION.md                # Authentication documentation
├── CODE_OPTIMIZATION.md             # Code optimization techniques
├── COLOR_SYSTEM.md                  # Color system documentation
├── COMPONENT_STANDARDS.md           # Component standards and naming conventions
├── COMPONENT_STRUCTURE.md           # Component organization documentation
├── DOCUMENTATION.md                 # This documentation reference
├── ENVIRONMENT.md                   # Environment configuration guide
├── PASSWORD_RESET_SETUP.md          # Password reset implementation details
├── SECURITY.md                      # Security features documentation
├── TROUBLESHOOTING.md               # Troubleshooting guide
├── features/                        # Feature-specific documentation
│   ├── CONTROL_COMPONENTS.md        # Control components documentation
│   └── SECURITY_ENHANCEMENTS.md     # Security enhancements documentation
├── github_workflow.md               # GitHub workflow documentation
├── overlap-debug-workflow.txt       # Debug workflow for letter overlap
└── VERIFICATION_EMAIL_TEMPLATE.html # Email verification template
```

## Document Naming Conventions

Documentation files follow these naming conventions:

1. All documentation filenames are in UPPERCASE with underscores separating words (e.g., `COMPONENT_STANDARDS.md`)
2. Technical guides use a descriptive name followed by the word "Guide" (e.g., `DEPLOYMENT_GUIDE.md`)
3. Reference documents use a descriptive name followed by "Reference" (e.g., `API_REFERENCE.md`)
4. Documentation for specific features is placed in the `features/` directory

## Contribution Guidelines

When adding new documentation:

1. Follow the established naming conventions
2. Update this index document to include your new documentation
3. Ensure your documentation includes:
   - A clear title and description
   - A table of contents for longer documents
   - Code examples where appropriate
   - Links to related documentation
4. For comprehensive topics, consider creating consolidated documents that combine related information

## Feedback and Improvements

If you find areas of the documentation that need improvement or have suggestions for new documentation, please:

1. Open an issue in the GitHub repository with the "documentation" label
2. Include specific details about what needs to be improved or added
3. If possible, suggest changes or provide draft content

## Future Documentation Plans

The following documentation improvements are planned:

1. Expanded testing documentation
2. User-facing documentation and guides
3. Deployment process documentation
4. Performance optimization guides
5. Accessibility implementation guidelines 