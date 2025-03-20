// @ts-check
const { generateThumbnails } = require('./generateThumbnails');

// Create a mock browser environment
global.document = {
  createElement: (tag) => {
    const element = {
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      dataset: {},
      attributes: [],
      children: [],
      innerHTML: '',
      outerHTML: '',
      id: '',
      className: '',
      tagName: tag.toUpperCase(),
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      getBoundingClientRect: () => ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };
    return element;
  },
  createElementNS: (ns, tag) => {
    const element = document.createElement(tag);
    element.namespaceURI = ns;
    return element;
  },
};

global.window = {
  getComputedStyle: () => {
    const style = {
      left: '0px',
      transform: '',
      getPropertyValue: (prop) => '',
      setProperty: () => {},
    };
    // Add all CSS properties
    const cssProps = ['accentColor', 'alignContent', 'alignItems', 'alignSelf'];
    cssProps.forEach(prop => style[prop] = '');
    return style;
  },
};

global.DOMParser = class {
  parseFromString(str) {
    return {
      documentElement: document.createElement('svg'),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementsByTagName: () => [],
      createElementNS: document.createElementNS,
      createElement: document.createElement,
    };
  }
};

global.XMLSerializer = class {
  serializeToString(doc) {
    return '';
  }
};

// Run the thumbnail generation
generateThumbnails().catch(console.error); 