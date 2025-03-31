# GBot v0.1

A modern web application for creating customizable vector-based graffiti artwork with advanced security features.

## Features

- Vector-based artwork processing with comprehensive security measures
- Extensive customization options with real-time preview
- Secure SVG processing pipeline with validation and sanitization
- Advanced effects including fill, outline, shadow, and shine
- Intelligent letter positioning system
- Style presets with save/load functionality
- Comprehensive error handling and logging
- Modern, responsive UI built with React and TypeScript

## Security Features

- Multi-layer SVG security system
- Content validation and sanitization
- XSS prevention
- Secure error handling
- Comprehensive logging

For detailed security information, see [Security Documentation](docs/SECURITY.md).

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gbot_v01.git
cd gbot_v01
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Security Documentation](docs/SECURITY.md)
- [Component Standards](docs/COMPONENT_STANDARDS.md)
- [Component Structure](docs/COMPONENT_STRUCTURE.md)

## Development

### Key Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint
```

### Development Guidelines

1. Follow the security best practices outlined in the security documentation
2. Use the secure SVG processing utilities for all SVG operations
3. Implement proper error boundaries and logging
4. Follow component standards and structure guidelines
5. Write comprehensive tests for new features

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

If you discover a security vulnerability, please follow our [security policy](SECURITY.md) for reporting.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React team for the amazing framework
- Zustand for efficient state management
- Tailwind CSS for the styling system
- All contributors who have helped shape this project