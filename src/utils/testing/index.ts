// State testing utilities
export {
  validateHistoryIntegrity,
  testUndoRedoOperation,
  validateStateChangeImpact,
  measureStateOperationPerformance,
  createTestHistoryState
} from './stateTestUtils';

// Performance measurement hooks
export {
  usePerformanceMetrics,
  useOperationTimer,
  type PerformanceMetrics,
  type UsePerformanceMetricsOptions
} from '../../hooks/testing/usePerformanceMetrics'; 