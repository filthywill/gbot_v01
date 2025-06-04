# Accessibility Guidelines for Graffiti Generator

## Overview

This document outlines the accessibility standards and guidelines that all developers must follow when working on the graffiti generator application. These standards ensure the app is usable by people with disabilities and meets WCAG 2.1 AA compliance.

## Core Accessibility Principles

### 1. Perceivable
- All content must be perceivable to users with different abilities
- Provide text alternatives for non-text content
- Use sufficient color contrast ratios (minimum 4.5:1 for normal text)
- Ensure content is structured and readable by screen readers

### 2. Operable  
- All interactive elements must be keyboard accessible
- Provide sufficient time for users to read and use content
- Avoid content that causes seizures or vestibular disorders
- Help users navigate and find content

### 3. Understandable
- Make text content readable and understandable
- Make web pages appear and operate in predictable ways
- Help users avoid and correct mistakes

### 4. Robust
- Content must be robust enough to be interpreted by assistive technologies
- Use semantic HTML and proper ARIA attributes

## Implementation Standards

### HTML Structure

#### Required Elements
```html
<!-- Always include semantic landmarks -->
<main role="main" aria-label="Main content">
  <section role="region" aria-labelledby="section-heading">
    <h2 id="section-heading">Section Title</h2>
  </section>
</main>

<!-- Form elements must have proper labels -->
<label for="input-id">Input Description</label>
<input id="input-id" type="text" aria-describedby="help-text" />
<div id="help-text">Additional help information</div>

<!-- Interactive controls need ARIA attributes -->
<button 
  aria-label="Clear input text" 
  aria-describedby="button-help"
  type="button"
>
  <Icon aria-hidden="true" />
</button>
```

#### Screen Reader Support
```html
<!-- Use screen reader only content for context -->
<div className="sr-only">
  Additional context for screen readers
</div>

<!-- Live regions for dynamic content -->
<div aria-live="polite" role="status">
  Status updates
</div>

<div aria-live="assertive" role="alert">
  Error messages
</div>
```

### Component Accessibility Patterns

#### Form Controls
```typescript
// Input components must include:
<input
  id="unique-id"
  aria-describedby="help-text error-text"
  aria-invalid={hasError ? 'true' : 'false'}
  aria-required="true"
  aria-label="Descriptive label"
/>

// Character counters should be announced
<div 
  aria-live="polite"
  role="status"
  id="char-count"
>
  {count}/{maxLength} characters
</div>
```

#### Button Groups
```typescript
// Radio button groups
<div role="radiogroup" aria-label="Group description">
  <button
    role="radio"
    aria-checked={isSelected}
    tabIndex={isSelected ? 0 : -1}
    aria-label="Option description"
  >
    Option Text
  </button>
</div>

// Toolbars
<div role="toolbar" aria-label="Toolbar description">
  <button aria-label="Action description">
    <Icon aria-hidden="true" />
  </button>
</div>
```

#### Complex UI Components
```typescript
// Collapsible sections
<button
  aria-expanded={isOpen}
  aria-controls="panel-id"
  aria-label={`${isOpen ? 'Collapse' : 'Expand'} section name`}
>
  Section Title
  <Icon aria-hidden="true" />
</button>

<div
  id="panel-id"
  role="group"
  aria-label="Panel content description"
>
  Panel content
</div>
```

### Keyboard Navigation

#### Focus Management
- All interactive elements must be reachable via keyboard
- Tab order should follow logical reading order
- Provide visible focus indicators
- Implement arrow key navigation for related controls

#### Required Keyboard Patterns
```typescript
// Arrow key navigation for option lists
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    // Navigate to next/previous option
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    // Activate current option
  }
  if (e.key === 'Escape') {
    // Close modal/dropdown
  }
};

// Focus management for dynamic content
useEffect(() => {
  if (shouldFocus) {
    elementRef.current?.focus();
  }
}, [shouldFocus]);
```

### Color and Contrast

#### Color Contrast Requirements
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 for non-text elements

#### Color Usage Rules
- Never rely solely on color to convey information
- Provide additional visual cues (icons, text, patterns)
- Ensure interactive states are distinguishable

### Icons and Images

#### Decorative Icons
```typescript
// Icons that don't convey meaning
<Icon aria-hidden="true" />
```

#### Functional Icons  
```typescript
// Icons that convey meaning
<button aria-label="Delete item">
  <TrashIcon aria-hidden="true" />
</button>
```

#### Complex Graphics
```typescript
// Generated graffiti content
<div
  role="img"
  aria-label="Generated graffiti displaying: HELLO"
  aria-describedby="graffiti-description"
>
  <div id="graffiti-description" className="sr-only">
    Graffiti art with custom styling including colors and effects
  </div>
  {/* SVG content */}
</div>
```

## Testing Requirements

### Manual Testing Checklist
- [ ] All functionality works with keyboard only
- [ ] Screen reader announces all important content changes
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets minimum requirements
- [ ] Text is readable when zoomed to 200%
- [ ] Forms provide clear error messages

### Automated Testing
```typescript
// Include accessibility tests in component tests - React 19 compatible
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component should not have accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Screen Reader Testing
- Test with NVDA (Windows) or VoiceOver (Mac)
- Verify all interactive elements are announced correctly
- Check that dynamic content changes are announced
- Ensure navigation is logical and efficient

## Component-Specific Guidelines

### Input Forms
- Always provide labels (visible or screen reader only)
- Include helpful descriptions with `aria-describedby`
- Announce validation errors immediately with `aria-live="assertive"`
- Show character counts with live regions

### Style Selectors
- Use `role="radiogroup"` for mutually exclusive options
- Implement arrow key navigation between options
- Provide descriptive labels for each option
- Announce selection changes

### Graffiti Display
- Use `role="img"` for generated artwork
- Provide meaningful alt text describing the content
- Announce generation progress with live regions
- Include description of applied styling

### History Controls
- Use `role="toolbar"` for undo/redo buttons
- Provide clear labels for current state
- Disable buttons appropriately and explain why
- Support keyboard activation (Enter and Space)

### Customization Controls
- Group related controls with `role="group"`
- Provide clear labels for all sliders and toggles
- Use live regions for value announcements during interaction
- Include help text for complex controls

## Development Workflow

### Code Review Requirements
- All PRs must pass automated accessibility tests
- Manual accessibility review for new interactive components
- Verify keyboard navigation works correctly
- Check ARIA attributes are used appropriately

### Design Review Requirements
- Color combinations must meet contrast requirements
- Interactive elements must have clear focus states
- Text must be readable at 200% zoom
- No information conveyed by color alone

### QA Testing Requirements
- Test with keyboard navigation only
- Use screen reader for critical user flows
- Verify with browser accessibility audits
- Test with users with disabilities when possible

## Resources and Tools

### Testing Tools
- **axe-core**: Automated accessibility testing
- **WAVE**: Web accessibility evaluation
- **Lighthouse**: Accessibility audit in Chrome DevTools
- **Screen readers**: NVDA (free), VoiceOver (Mac), JAWS

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Browser Extensions
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation extension
- **Color Oracle**: Color blindness simulator

## Maintenance and Updates

### Regular Audits
- Run accessibility audits monthly
- Test with real users quarterly
- Update guidelines as standards evolve
- Train team on new accessibility features

### Performance Considerations
- Accessibility features should not impact performance
- Use semantic HTML for better performance and accessibility
- Optimize screen reader announcements to avoid verbosity
- Test with slow screen readers and assistive technologies

## Emergency Accessibility Fixes

### Critical Issues (Fix Immediately)
- Completely inaccessible core functionality
- Keyboard traps that prevent navigation
- Missing labels on form controls
- Seizure-inducing animations

### High Priority Issues (Fix Within 1 Week)
- Poor color contrast on important elements
- Missing ARIA labels on complex components
- Logical tab order problems
- Missing error announcements

### Medium Priority Issues (Fix Within 2 Weeks)
- Inconsistent focus indicators
- Missing descriptions on complex content
- Suboptimal screen reader announcements
- Missing keyboard shortcuts for power users

---

## Contact and Support

For accessibility questions or concerns:
- Review this document first
- Check WCAG 2.1 guidelines
- Test with screen readers when possible
- Create GitHub issues for accessibility bugs
- Include accessibility considerations in all feature planning

**Remember**: Accessibility is not optional. It's a requirement for building inclusive software that works for everyone. 