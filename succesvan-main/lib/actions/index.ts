/**
 * Actions Module - Barrel Export
 * 
 * This module provides validation and execution for AI-proposed actions.
 * 
 * Usage:
 * ```typescript
 * import { validateProposedAction, executeAction, dryRunActions } from '@/lib/actions';
 * 
 * // Validate a single action
 * const result = await validateProposedAction(action);
 * 
 * // Execute if valid
 * if (result.valid) {
 *   const execResult = await executeAction(action, 'admin_user_id');
 * }
 * 
 * // Or do a dry run first
 * const preview = await dryRunActions(actions);
 * ```
 */

// Validation exports
export {
  validateProposedAction,
  validateProposedActions,
  getValidActions,
  VALIDATION_CONFIG,
  type ValidationResult,
  type ValidationError,
} from "./validateProposedActions";

// Execution exports
export {
  executeAction,
  executeActions,
  dryRunActions,
  type ExecutionResult,
  type BatchExecutionResult,
} from "./executeActions";
