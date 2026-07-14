/**
 * ACTION VALIDATION LAYER
 * 
 * Validates proposed actions before execution.
 * This layer ensures:
 * - Business rules are enforced (max discount, valid dates)
 * - Referenced entities exist (offices, categories, customers)
 * - No conflicting actions (overlapping discounts)
 * 
 * IMPORTANT: This is a safety layer. Actions that fail validation
 * should be rejected with clear error messages.
 */

import connect from "@/lib/data";
import Category from "@/model/category";
import Office from "@/model/office";
import User from "@/model/user";
import type {
  ProposedAction,
  CreateDiscountAction,
  LaunchCampaignAction,
  SendOfferToCustomersAction,
  UpdateCategoryPricingAction,
} from "@/lib/business-analyst";

// ============================================================================
// VALIDATION RESULT TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: "INVALID_VALUE" | "OUT_OF_RANGE" | "NOT_FOUND" | "CONFLICT" | "MISSING_REQUIRED";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  /** Enriched action with resolved IDs (e.g., category names -> category IDs) */
  enrichedAction?: ProposedAction;
}

// ============================================================================
// CONFIGURATION - Business Rules
// ============================================================================

export const VALIDATION_CONFIG = {
  discount: {
    maxPercent: 50, // Maximum allowed discount percentage
    minPercent: 1,  // Minimum discount percentage
    maxDurationDays: 90, // Maximum discount validity period
    minFutureStartDays: 0, // Can start today (0) or must be future (1+)
  },
  campaign: {
    maxMessageLength: 500,
    minMessageLength: 10,
    maxCallToActionLength: 50,
  },
  offer: {
    maxExpiryDays: 90,
    minExpiryDays: 1,
    maxDiscountPercent: 30, // Direct offers have lower max than general discounts
  },
  pricing: {
    maxDiscountPercent: 30, // Maximum price reduction from showPrice
    minDiscountPercent: 5,  // Minimum meaningful discount
    maxSaleDurationDays: 60,
    minSaleDurationDays: 1,
    minSellPrice: 10, // Minimum sell price in pounds
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a date string is valid and parse it
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date is in the future (or today)
 */
function isDateValidForStart(dateStr: string, allowToday = true): boolean {
  const date = parseDate(dateStr);
  if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (allowToday) {
    return date >= today;
  }
  return date > today;
}

/**
 * Check if end date is after start date
 */
function isEndAfterStart(startStr: string, endStr: string): boolean {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end) return false;
  return end >= start;
}

/**
 * Calculate days between two dates
 */
function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  if (!start || !end) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// ENTITY EXISTENCE CHECKS
// ============================================================================

/**
 * Verify categories exist and return their IDs
 */
async function validateCategories(
  categoryNames: string[]
): Promise<{ valid: boolean; errors: ValidationError[]; categoryIds: string[] }> {
  await connect();
  
  const errors: ValidationError[] = [];
  const categoryIds: string[] = [];
  
  for (const name of categoryNames) {
    const category = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).lean();
    
    if (category) {
      categoryIds.push((category as any)._id.toString());
    } else {
      errors.push({
        field: "applicableCategories",
        message: `Category "${name}" not found in database`,
        code: "NOT_FOUND",
      });
    }
  }
  
  return { valid: errors.length === 0, errors, categoryIds };
}

/**
 * Verify offices exist and return their IDs
 */
async function validateOffices(
  officeNames: string[]
): Promise<{ valid: boolean; errors: ValidationError[]; officeIds: string[] }> {
  await connect();
  
  const errors: ValidationError[] = [];
  const officeIds: string[] = [];
  
  for (const name of officeNames) {
    const office = await Office.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).lean();
    
    if (office) {
      officeIds.push((office as any)._id.toString());
    } else {
      errors.push({
        field: "applicableOffices",
        message: `Office "${name}" not found in database`,
        code: "NOT_FOUND",
      });
    }
  }
  
  return { valid: errors.length === 0, errors, officeIds };
}

/**
 * Verify customers exist by segment or IDs
 */
async function validateCustomerSegment(
  segment: string
): Promise<{ valid: boolean; errors: ValidationError[]; customerCount: number }> {
  await connect();
  
  const validSegments = ["top_spenders", "frequent_bookers", "at_risk", "dormant", "new"];
  
  if (!validSegments.includes(segment)) {
    return {
      valid: false,
      errors: [{
        field: "customerSegment",
        message: `Invalid segment "${segment}". Must be one of: ${validSegments.join(", ")}`,
        code: "INVALID_VALUE",
      }],
      customerCount: 0,
    };
  }
  
  // Get approximate customer count for the segment
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  let count = 0;
  
  switch (segment) {
    case "new":
      count = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });
      break;
    case "dormant":
      // Users created more than 6 months ago (simplified - would need reservation check)
      count = await User.countDocuments({ createdAt: { $lt: sixMonthsAgo } });
      break;
    default:
      // For other segments, get total count as approximation
      count = await User.countDocuments({});
  }
  
  return { valid: true, errors: [], customerCount: count };
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Check for overlapping active discounts
 * Note: This is a placeholder - implement when Discount model exists
 */
async function checkDiscountConflicts(
  discountName: string,
  validFrom?: string,
  validUntil?: string,
  categories?: string[],
  offices?: string[]
): Promise<{ hasConflict: boolean; conflictDetails?: string }> {
  // TODO: Implement when Discount model is created
  // For now, just check name uniqueness
  
  // Placeholder: No conflicts detected
  console.log("⚠️ [Validation] Discount conflict check is placeholder - implement with Discount model");
  
  return { hasConflict: false };
}

// ============================================================================
// ACTION-SPECIFIC VALIDATORS
// ============================================================================

/**
 * Validate createDiscount action
 */
async function validateCreateDiscount(
  action: CreateDiscountAction
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const { params } = action;
  
  // 1. Validate discount percentage
  if (params.discountPercent < VALIDATION_CONFIG.discount.minPercent) {
    errors.push({
      field: "discountPercent",
      message: `Discount must be at least ${VALIDATION_CONFIG.discount.minPercent}%`,
      code: "OUT_OF_RANGE",
    });
  }
  if (params.discountPercent > VALIDATION_CONFIG.discount.maxPercent) {
    errors.push({
      field: "discountPercent",
      message: `Discount cannot exceed ${VALIDATION_CONFIG.discount.maxPercent}%`,
      code: "OUT_OF_RANGE",
    });
  }
  if (params.discountPercent > 25) {
    warnings.push(`High discount (${params.discountPercent}%) - ensure this is justified`);
  }
  
  // 2. Validate name
  if (!params.name || params.name.trim().length < 3) {
    errors.push({
      field: "name",
      message: "Discount name must be at least 3 characters",
      code: "INVALID_VALUE",
    });
  }
  
  // 3. Validate date range
  if (params.validFrom) {
    if (!isDateValidForStart(params.validFrom, true)) {
      errors.push({
        field: "validFrom",
        message: "Start date must be today or in the future",
        code: "OUT_OF_RANGE",
      });
    }
  }
  
  if (params.validFrom && params.validUntil) {
    if (!isEndAfterStart(params.validFrom, params.validUntil)) {
      errors.push({
        field: "validUntil",
        message: "End date must be after start date",
        code: "INVALID_VALUE",
      });
    }
    
    const duration = daysBetween(params.validFrom, params.validUntil);
    if (duration > VALIDATION_CONFIG.discount.maxDurationDays) {
      errors.push({
        field: "validUntil",
        message: `Discount duration cannot exceed ${VALIDATION_CONFIG.discount.maxDurationDays} days`,
        code: "OUT_OF_RANGE",
      });
    }
  }
  
  // 4. Validate categories exist
  let categoryIds: string[] = [];
  if (params.applicableCategories && params.applicableCategories.length > 0) {
    const catResult = await validateCategories(params.applicableCategories);
    errors.push(...catResult.errors);
    categoryIds = catResult.categoryIds;
  }
  
  // 5. Validate offices exist
  let officeIds: string[] = [];
  if (params.applicableOffices && params.applicableOffices.length > 0) {
    const officeResult = await validateOffices(params.applicableOffices);
    errors.push(...officeResult.errors);
    officeIds = officeResult.officeIds;
  }
  
  // 6. Check for conflicts
  const conflictCheck = await checkDiscountConflicts(
    params.name,
    params.validFrom,
    params.validUntil,
    params.applicableCategories,
    params.applicableOffices
  );
  if (conflictCheck.hasConflict) {
    errors.push({
      field: "name",
      message: conflictCheck.conflictDetails || "Conflicts with existing discount",
      code: "CONFLICT",
    });
  }
  
  // 7. Validate target audience
  const validAudiences = ["all", "new_customers", "returning_customers", "inactive_customers", "vip_customers"];
  if (!validAudiences.includes(params.targetAudience)) {
    errors.push({
      field: "targetAudience",
      message: `Invalid target audience. Must be one of: ${validAudiences.join(", ")}`,
      code: "INVALID_VALUE",
    });
  }
  
  // Build enriched action with resolved IDs
  const enrichedAction: CreateDiscountAction = {
    ...action,
    params: {
      ...params,
      // Add resolved IDs for later execution
      _resolvedCategoryIds: categoryIds,
      _resolvedOfficeIds: officeIds,
    } as any,
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    enrichedAction: errors.length === 0 ? enrichedAction : undefined,
  };
}

/**
 * Validate launchCampaign action
 */
async function validateLaunchCampaign(
  action: LaunchCampaignAction
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const { params } = action;
  
  // 1. Validate channel
  const validChannels = ["email", "sms", "both"];
  if (!validChannels.includes(params.channel)) {
    errors.push({
      field: "channel",
      message: `Invalid channel. Must be one of: ${validChannels.join(", ")}`,
      code: "INVALID_VALUE",
    });
  }
  
  // 2. Validate target segment
  const validSegments = ["all", "new_customers", "returning_customers", "inactive_customers", "high_value_customers"];
  if (!validSegments.includes(params.targetSegment)) {
    errors.push({
      field: "targetSegment",
      message: `Invalid segment. Must be one of: ${validSegments.join(", ")}`,
      code: "INVALID_VALUE",
    });
  }
  
  // 3. Validate message
  if (!params.message || params.message.length < VALIDATION_CONFIG.campaign.minMessageLength) {
    errors.push({
      field: "message",
      message: `Message must be at least ${VALIDATION_CONFIG.campaign.minMessageLength} characters`,
      code: "INVALID_VALUE",
    });
  }
  if (params.message && params.message.length > VALIDATION_CONFIG.campaign.maxMessageLength) {
    errors.push({
      field: "message",
      message: `Message cannot exceed ${VALIDATION_CONFIG.campaign.maxMessageLength} characters`,
      code: "OUT_OF_RANGE",
    });
  }
  
  // 4. Validate call to action
  if (!params.callToAction || params.callToAction.trim().length === 0) {
    errors.push({
      field: "callToAction",
      message: "Call to action is required",
      code: "MISSING_REQUIRED",
    });
  }
  if (params.callToAction && params.callToAction.length > VALIDATION_CONFIG.campaign.maxCallToActionLength) {
    errors.push({
      field: "callToAction",
      message: `Call to action cannot exceed ${VALIDATION_CONFIG.campaign.maxCallToActionLength} characters`,
      code: "OUT_OF_RANGE",
    });
  }
  
  // 5. Validate scheduled date
  if (params.scheduledDate && params.scheduledDate !== "immediate") {
    if (!isDateValidForStart(params.scheduledDate, true)) {
      errors.push({
        field: "scheduledDate",
        message: "Scheduled date must be today or in the future",
        code: "OUT_OF_RANGE",
      });
    }
  }
  
  // 6. Validate name
  if (!params.name || params.name.trim().length < 3) {
    errors.push({
      field: "name",
      message: "Campaign name must be at least 3 characters",
      code: "INVALID_VALUE",
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    enrichedAction: errors.length === 0 ? action : undefined,
  };
}

/**
 * Validate sendOfferToCustomers action
 */
async function validateSendOfferToCustomers(
  action: SendOfferToCustomersAction
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const { params } = action;
  
  // 1. Validate customer segment
  let customerCount = 0;
  if (params.customerSegment) {
    const segmentResult = await validateCustomerSegment(params.customerSegment);
    errors.push(...segmentResult.errors);
    customerCount = segmentResult.customerCount;
    
    if (customerCount === 0) {
      warnings.push(`No customers found in segment "${params.customerSegment}"`);
    } else if (customerCount > 100) {
      warnings.push(`Large audience: ${customerCount} customers will receive this offer`);
    }
  } else if (!params.customerIds || params.customerIds.length === 0) {
    errors.push({
      field: "customerSegment",
      message: "Either customerSegment or customerIds must be provided",
      code: "MISSING_REQUIRED",
    });
  }
  
  // 2. Validate offer type
  const validOfferTypes = ["percentage_discount", "fixed_amount", "free_addon", "loyalty_bonus"];
  if (!validOfferTypes.includes(params.offerType)) {
    errors.push({
      field: "offerType",
      message: `Invalid offer type. Must be one of: ${validOfferTypes.join(", ")}`,
      code: "INVALID_VALUE",
    });
  }
  
  // 3. Validate offer value based on type
  if (params.offerType === "percentage_discount") {
    const percent = typeof params.offerValue === "number" ? params.offerValue : parseInt(params.offerValue as string);
    if (isNaN(percent) || percent < 1 || percent > VALIDATION_CONFIG.offer.maxDiscountPercent) {
      errors.push({
        field: "offerValue",
        message: `Percentage discount must be between 1 and ${VALIDATION_CONFIG.offer.maxDiscountPercent}%`,
        code: "OUT_OF_RANGE",
      });
    }
  }
  
  // 4. Validate expiry days
  if (params.expiresInDays < VALIDATION_CONFIG.offer.minExpiryDays) {
    errors.push({
      field: "expiresInDays",
      message: `Offer must be valid for at least ${VALIDATION_CONFIG.offer.minExpiryDays} day(s)`,
      code: "OUT_OF_RANGE",
    });
  }
  if (params.expiresInDays > VALIDATION_CONFIG.offer.maxExpiryDays) {
    errors.push({
      field: "expiresInDays",
      message: `Offer cannot be valid for more than ${VALIDATION_CONFIG.offer.maxExpiryDays} days`,
      code: "OUT_OF_RANGE",
    });
  }
  
  // 5. Validate personalized message
  if (!params.personalizedMessage || params.personalizedMessage.trim().length < 10) {
    errors.push({
      field: "personalizedMessage",
      message: "Personalized message must be at least 10 characters",
      code: "INVALID_VALUE",
    });
  }
  
  // Build enriched action
  const enrichedAction: SendOfferToCustomersAction = {
    ...action,
    params: {
      ...params,
      _estimatedRecipients: customerCount,
    } as any,
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    enrichedAction: errors.length === 0 ? enrichedAction : undefined,
  };
}

/**
 * Validate updateCategoryPricing action
 * Checks categories exist, prices are valid, and campaign is properly formatted
 */
async function validateUpdateCategoryPricing(
  action: UpdateCategoryPricingAction
): Promise<ValidationResult> {
  await connect();
  
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const { params } = action;
  
  // 1. Validate pricingChanges array exists and has entries
  if (!params.pricingChanges || params.pricingChanges.length === 0) {
    errors.push({
      field: "pricingChanges",
      message: "At least one pricing change is required",
      code: "MISSING_REQUIRED",
    });
    return { valid: false, errors, warnings };
  }
  
  // 2. Validate each pricing change
  const resolvedCategories: Array<{
    categoryId: string;
    categoryName: string;
    currentShowPrice: number;
    suggestedSellPrice: number;
  }> = [];
  
  for (let i = 0; i < params.pricingChanges.length; i++) {
    const change = params.pricingChanges[i];
    const prefix = `pricingChanges[${i}]`;
    
    // Check category exists
    const category = await Category.findOne({
      name: { $regex: new RegExp(`^${change.categoryName}$`, 'i') }
    }).lean();
    
    if (!category) {
      errors.push({
        field: `${prefix}.categoryName`,
        message: `Category "${change.categoryName}" not found in database`,
        code: "NOT_FOUND",
      });
      continue;
    }
    
    const categoryData = category as any;
    
    // Verify currentShowPrice matches actual (or is close)
    if (Math.abs(categoryData.showPrice - change.currentShowPrice) > 1) {
      warnings.push(`${change.categoryName}: Stated showPrice (£${change.currentShowPrice}) differs from actual (£${categoryData.showPrice})`);
    }
    
    // Validate suggestedSellPrice
    if (change.suggestedSellPrice < VALIDATION_CONFIG.pricing.minSellPrice) {
      errors.push({
        field: `${prefix}.suggestedSellPrice`,
        message: `Sell price cannot be below £${VALIDATION_CONFIG.pricing.minSellPrice}`,
        code: "OUT_OF_RANGE",
      });
    }
    
    if (change.suggestedSellPrice >= categoryData.showPrice) {
      errors.push({
        field: `${prefix}.suggestedSellPrice`,
        message: `Sell price (£${change.suggestedSellPrice}) must be lower than show price (£${categoryData.showPrice})`,
        code: "INVALID_VALUE",
      });
    }
    
    // Validate discount percent
    const actualDiscountPercent = ((categoryData.showPrice - change.suggestedSellPrice) / categoryData.showPrice) * 100;
    
    if (actualDiscountPercent > VALIDATION_CONFIG.pricing.maxDiscountPercent) {
      errors.push({
        field: `${prefix}.discountPercent`,
        message: `Discount (${actualDiscountPercent.toFixed(1)}%) exceeds maximum allowed (${VALIDATION_CONFIG.pricing.maxDiscountPercent}%)`,
        code: "OUT_OF_RANGE",
      });
    }
    
    if (actualDiscountPercent < VALIDATION_CONFIG.pricing.minDiscountPercent) {
      warnings.push(`${change.categoryName}: Small discount (${actualDiscountPercent.toFixed(1)}%) may not be impactful enough`);
    }
    
    // Validate reason exists
    if (!change.reason || change.reason.trim().length < 10) {
      errors.push({
        field: `${prefix}.reason`,
        message: "Reason for price change must be at least 10 characters",
        code: "INVALID_VALUE",
      });
    }
    
    // Store resolved category
    resolvedCategories.push({
      categoryId: categoryData._id.toString(),
      categoryName: categoryData.name,
      currentShowPrice: categoryData.showPrice,
      suggestedSellPrice: change.suggestedSellPrice,
    });
  }
  
  // 3. Validate sale duration
  if (params.saleDurationDays < VALIDATION_CONFIG.pricing.minSaleDurationDays) {
    errors.push({
      field: "saleDurationDays",
      message: `Sale must last at least ${VALIDATION_CONFIG.pricing.minSaleDurationDays} day(s)`,
      code: "OUT_OF_RANGE",
    });
  }
  
  if (params.saleDurationDays > VALIDATION_CONFIG.pricing.maxSaleDurationDays) {
    errors.push({
      field: "saleDurationDays",
      message: `Sale cannot exceed ${VALIDATION_CONFIG.pricing.maxSaleDurationDays} days`,
      code: "OUT_OF_RANGE",
    });
  }
  
  // 4. Validate sale start date
  if (params.saleStartDate) {
    if (!isDateValidForStart(params.saleStartDate, true)) {
      errors.push({
        field: "saleStartDate",
        message: "Sale start date must be today or in the future",
        code: "OUT_OF_RANGE",
      });
    }
  }
  
  // 5. Validate linked campaign if provided
  if (params.linkedCampaign) {
    const campaign = params.linkedCampaign;
    
    if (!campaign.name || campaign.name.trim().length < 3) {
      errors.push({
        field: "linkedCampaign.name",
        message: "Campaign name must be at least 3 characters",
        code: "INVALID_VALUE",
      });
    }
    
    const validChannels = ["email", "sms", "both"];
    if (!validChannels.includes(campaign.channel)) {
      errors.push({
        field: "linkedCampaign.channel",
        message: `Channel must be one of: ${validChannels.join(", ")}`,
        code: "INVALID_VALUE",
      });
    }
    
    if (!campaign.message || campaign.message.length < VALIDATION_CONFIG.campaign.minMessageLength) {
      errors.push({
        field: "linkedCampaign.message",
        message: `Message must be at least ${VALIDATION_CONFIG.campaign.minMessageLength} characters`,
        code: "INVALID_VALUE",
      });
    }
    
    if (!campaign.callToAction || campaign.callToAction.trim().length === 0) {
      errors.push({
        field: "linkedCampaign.callToAction",
        message: "Call to action is required",
        code: "MISSING_REQUIRED",
      });
    }
    
    const validSegments = ["all", "new_customers", "returning_customers", "inactive_customers"];
    if (!validSegments.includes(campaign.targetSegment)) {
      errors.push({
        field: "linkedCampaign.targetSegment",
        message: `Target segment must be one of: ${validSegments.join(", ")}`,
        code: "INVALID_VALUE",
      });
    }
  } else {
    warnings.push("No linked campaign provided - price changes may go unnoticed by customers");
  }
  
  // Build enriched action with resolved category IDs
  const enrichedAction: UpdateCategoryPricingAction = {
    ...action,
    params: {
      ...params,
      _resolvedCategories: resolvedCategories,
    } as any,
  };
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    enrichedAction: errors.length === 0 ? enrichedAction : undefined,
  };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate a proposed action
 * @param action - The proposed action to validate
 * @returns Validation result with errors, warnings, and enriched action
 */
export async function validateProposedAction(
  action: ProposedAction
): Promise<ValidationResult> {
  console.log(`🔍 [Validation] Validating ${action.type} action...`);
  
  // Check confidence threshold
  if (action.confidence < 0.5) {
    return {
      valid: false,
      errors: [{
        field: "confidence",
        message: `Action confidence (${action.confidence}) is below minimum threshold (0.5)`,
        code: "OUT_OF_RANGE",
      }],
      warnings: [],
    };
  }
  
  // Check reasoning evidence
  if (!action.reasoningEvidence || action.reasoningEvidence.length === 0) {
    return {
      valid: false,
      errors: [{
        field: "reasoningEvidence",
        message: "Action must have at least one reasoning evidence entry",
        code: "MISSING_REQUIRED",
      }],
      warnings: [],
    };
  }
  
  // Dispatch to action-specific validator
  switch (action.type) {
    case "createDiscount":
      return validateCreateDiscount(action);
    case "launchCampaign":
      return validateLaunchCampaign(action);
    case "sendOfferToCustomers":
      return validateSendOfferToCustomers(action);
    case "updateCategoryPricing":
      return validateUpdateCategoryPricing(action);
    default:
      return {
        valid: false,
        errors: [{
          field: "type",
          message: `Unknown action type: ${(action as any).type}`,
          code: "INVALID_VALUE",
        }],
        warnings: [],
      };
  }
}

/**
 * Validate multiple proposed actions
 * @param actions - Array of proposed actions
 * @returns Map of action index to validation result
 */
export async function validateProposedActions(
  actions: ProposedAction[]
): Promise<Map<number, ValidationResult>> {
  console.log(`🔍 [Validation] Validating ${actions.length} actions...`);
  
  const results = new Map<number, ValidationResult>();
  
  for (let i = 0; i < actions.length; i++) {
    const result = await validateProposedAction(actions[i]);
    results.set(i, result);
    
    if (result.valid) {
      console.log(`✅ [Validation] Action ${i + 1} (${actions[i].type}) passed validation`);
    } else {
      console.log(`❌ [Validation] Action ${i + 1} (${actions[i].type}) failed:`, result.errors);
    }
  }
  
  return results;
}

/**
 * Filter actions to only those that passed validation
 */
export async function getValidActions(
  actions: ProposedAction[]
): Promise<ProposedAction[]> {
  const validationResults = await validateProposedActions(actions);
  
  return actions.filter((_, index) => {
    const result = validationResults.get(index);
    return result?.valid === true;
  }).map((action, originalIndex) => {
    // Return the enriched action if available
    const result = validationResults.get(originalIndex);
    return result?.enrichedAction || action;
  });
}
