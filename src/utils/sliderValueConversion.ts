/**
 * Utility functions for slider value conversions between actual and display values
 */

export interface ValueConfig {
  min: number;
  max: number;
  step: number;
  displayMin: number;
  displayMax: number;
  toDisplayValue: (value: number) => number;
  toActualValue: (display: number) => number;
}

/**
 * Configuration for OUTLINE control slider (Stamp effect)
 * Actual range: 25-200
 * Display range: 1-25
 */
export const outlineValueConfig: ValueConfig = {
  min: 25,
  max: 200,
  step: 1,
  displayMin: 1,
  displayMax: 25,
  toDisplayValue: (value: number) => Math.round(((value - 25) / (200 - 25)) * 24 + 1),
  toActualValue: (display: number) => Math.round(((display - 1) / 24) * (200 - 25) + 25)
};

/**
 * Configuration for FORCEFIELD control slider (Shield effect)
 * Actual range: 1-250
 * Display range: 1-50
 */
export const forcefieldValueConfig: ValueConfig = {
  min: 1,
  max: 250,
  step: 1,
  displayMin: 1,
  displayMax: 50,
  toDisplayValue: (value: number) => Math.round(((value - 1) / (250 - 1)) * 49 + 1),
  toActualValue: (display: number) => Math.round(((display - 1) / 49) * (250 - 1) + 1)
};

/**
 * Configuration for SHADOW control sliders
 * Actual range: -30 to 70
 * Display range: -25 to 25
 */
export const shadowValueConfig: ValueConfig = {
  min: -30,
  max: 70,
  step: 1,
  displayMin: -25,
  displayMax: 25,
  toDisplayValue: (value: number) => {
    // Map the actual range to display range
    if (value < 0) {
      return Math.round((value / 30) * 25);
    } else {
      return Math.round((value / 70) * 25);
    }
  },
  toActualValue: (display: number) => {
    // Map the display range back to actual range
    if (display < 0) {
      return Math.round((display / 25) * 30);
    } else {
      return Math.round((display / 25) * 70);
    }
  }
};

/**
 * Creates a linear value conversion configuration
 * For cases where the display range is the same as the actual range
 */
export const createLinearValueConfig = (min: number, max: number, step = 1): ValueConfig => ({
  min,
  max,
  step,
  displayMin: min,
  displayMax: max,
  toDisplayValue: (value: number) => value,
  toActualValue: (display: number) => display
}); 