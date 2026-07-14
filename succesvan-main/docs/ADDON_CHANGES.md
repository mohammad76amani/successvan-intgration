# Add-on Model Changes Summary

## Overview
Updated the add-on system to handle the new model structure with nested pricing objects and per-day calculations.

## New Add-on Model Structure

```typescript
interface AddOn {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount: number;
    isPerDay: boolean;  // NEW: Multiply by rental days if true
  };
  tieredPrice?: {
    isPerDay: boolean;  // NEW: Multiply by rental days if true
    tiers: { minDays: number; maxDays: number; price: number }[];
  };
}
```

## Changes Made

### 1. ReservationModal.tsx
- **Interface Update**: Changed AddOn interface to match new model
- **Price Calculation**: Updated `addOnsCost` calculation to:
  - Access `flatPrice.amount` instead of `flatPrice`
  - Access `tieredPrice.tiers` instead of `tiers`
  - Multiply by `rentalDays` when `isPerDay` is true
- **UI Updates**:
  - Show per-day breakdown for flat prices
  - Show per-day breakdown for tiered prices
  - Highlight tiers that match current rental duration (green background with ✓)
  - Display total price calculation when isPerDay is true

### 2. AddOnsModal.tsx
- **Interface Update**: Changed AddOn interface to match new model
- **getAddOnPrice Function**: Updated to:
  - Handle `flatPrice.amount` and `flatPrice.isPerDay`
  - Handle `tieredPrice.tiers` and `tieredPrice.isPerDay`
  - Calculate total price based on rental days when applicable
- **UI Updates**:
  - Show per-day calculation for flat prices
  - Show per-day calculation for tiered prices
  - Highlight matching tier range with green styling
  - Display "(per day × X days)" label for tiered pricing

### 3. usePriceCalculation.ts
- No changes needed - already working correctly

## Features Added

### Visual Indicators
1. **Per-Day Pricing Display**: Shows base price and calculated total
   - Example: "£50 /day × 3 days = £150"

2. **Tier Range Highlighting**: 
   - Selected tier: Orange background
   - Matching tier (in range): Green background with ✓
   - Other tiers: Gray background

3. **Smart Tier Selection**:
   - Automatically highlights which tier applies to current rental duration
   - Shows total price calculation for each tier

### Price Calculation Logic
```typescript
// Flat pricing
const amount = addon.flatPrice?.amount || 0;
const isPerDay = addon.flatPrice?.isPerDay || false;
const totalPrice = isPerDay ? amount * rentalDays : amount;

// Tiered pricing
const price = addon.tieredPrice?.tiers[tierIndex]?.price || 0;
const isPerDay = addon.tieredPrice?.isPerDay || false;
const totalPrice = isPerDay ? price * rentalDays : price;
```

## Testing Checklist
- [ ] Flat price add-ons display correctly
- [ ] Flat price per-day calculation works
- [ ] Tiered add-ons show all tiers
- [ ] Tiered per-day calculation works
- [ ] Matching tier is highlighted in green
- [ ] Selected tier shows in orange
- [ ] Quantity controls work correctly
- [ ] Total cost calculation is accurate
- [ ] Reservation submission includes correct add-on prices

## Example Add-on Data

### Flat Price (One-time)
```json
{
  "name": "GPS Navigation",
  "pricingType": "flat",
  "flatPrice": {
    "amount": 25,
    "isPerDay": false
  }
}
```

### Flat Price (Per Day)
```json
{
  "name": "Child Seat",
  "pricingType": "flat",
  "flatPrice": {
    "amount": 10,
    "isPerDay": true
  }
}
```

### Tiered Price (One-time)
```json
{
  "name": "Insurance Package",
  "pricingType": "tiered",
  "tieredPrice": {
    "isPerDay": false,
    "tiers": [
      { "minDays": 1, "maxDays": 3, "price": 50 },
      { "minDays": 4, "maxDays": 7, "price": 120 },
      { "minDays": 8, "maxDays": 999, "price": 200 }
    ]
  }
}
```

### Tiered Price (Per Day)
```json
{
  "name": "Additional Driver",
  "pricingType": "tiered",
  "tieredPrice": {
    "isPerDay": true,
    "tiers": [
      { "minDays": 1, "maxDays": 3, "price": 15 },
      { "minDays": 4, "maxDays": 7, "price": 12 },
      { "minDays": 8, "maxDays": 999, "price": 10 }
    ]
  }
}
```
