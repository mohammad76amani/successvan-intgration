# SuccessVanHire Customer Booking Journey

This document records the customer reservation journey work completed in this chat and tracks the remaining work.

## Goal

Give customers a simple view of:

1. Their current booking stage.
2. The one action they should take next.
3. What happens afterward.
4. The documents, deposit, contract, collection, return, and refund information connected to the booking.

The existing SuccessVan dark navy/orange customer dashboard, sidebar, header, and general layout are retained. Only **My Reservations** and the reservation journey experience are changed.

## Public customer journey

The customer sees nine simplified steps:

1. Submitted
2. Confirmed
3. Deposit
4. Contract
5. Collection
6. Active Rental
7. Return
8. Refund
9. Complete

Steps support `completed`, `current`, `upcoming`, `blocked`, and `failed` states. Green represents completed, orange current/action required, grey upcoming, and red problem states.

## Internal statuses

The detailed backend progression is:

```text
pending
confirmed
deposit_pending
deposit_paid
contract_pending
contract_signed
ready_for_collection
handover_in_progress
delivered
vehicle_returned
return_inspection
deposit_review
refund_processing
refund_completed
completed
```

Terminal problem statuses:

```text
canceled
expired
```

`rejected` was removed from the model, status utilities, journey mapper, and dashboard UI.

Legacy compatibility is preserved:

- `pending` is displayed as **Pending Review**.
- `delivered` is **Rental Active** for customers and remains **Collected** in the admin UI.
- Aliases such as `pending_review`, `rental_active`, `collected`, and `cancelled` are normalized.

Shared status definitions, labels, public-step mappings, availability groups, and badge styles live in `lib/reservation-status.ts`.

## Backend changes completed

### Reservation model

`model/reservation.ts` now includes:

- The complete journey status enum.
- `statusHistory` entries with status, date, source, and optional note.
- Deposit data: amount, selected option, payment status, due/paid dates, method, transaction reference, receipt URL/upload date, and discount percentage snapshot.
- Collection code.
- Vehicle handover data.
- Return inspection data.
- Refund calculation and processing data.

### Status API

`PATCH /api/reservations/[id]` now:

- Normalizes and validates statuses.
- Rejects unknown statuses.
- Appends changes to `statusHistory`.
- Preserves the pending-only customer edit/cancel rule.
- Maps relevant statuses to the existing SMS notification flow.

### Journey-aware queries

- Pre-pickup and active-rental reservations block availability.
- Canceled and expired reservations do not block booking slots.
- Fleet pickup/return summaries include applicable journey statuses.
- Reservation filters and availability/RAG logic use shared status groups.

### Admin dashboard

Reservation filters, dropdowns, labels, and badges recognize the expanded status list. Admin users can move a reservation through the journey with the existing management UI.

## Deposit rules

### Category configuration

`model/category.ts` contains:

| Field | Purpose |
| --- | --- |
| `amount` | Full refundable deposit amount |
| `fullPayDiscountPercent` | Rental discount offered for paying the full deposit upfront |
| `securePayPrice` | Smaller non-refundable Safe & Secure deposit price |
| `officePayPrice` | Amount/fee for paying at the office |

The corresponding TypeScript fields are in `types/type.ts`.

### Customer choices

- `full`: pay the full refundable deposit by transfer and save the offered discount percentage.
- `secure`: pay the configured Safe & Secure amount.
- `office`: record that payment will be made at the office.

The full-deposit discount is recorded on the reservation but does **not yet automatically reduce `totalPrice`**. The final application rule must be agreed before automation.

### Deposit API

`POST /api/reservations/[id]/deposit`:

- Validates the selected option.
- Reads pricing from the populated category.
- Snapshots the amount and discount.
- Stores the uploaded payment receipt URL.
- Marks transfer receipts as pending verification.
- Records office-payment selection without a receipt.
- Adds an activity-history note.
- Sends administrators an SMS when verification is required.

### Payment details

`lib/payment-info.ts` reads:

```env
NEXT_PUBLIC_DEPOSIT_CARD_NUMBER=
NEXT_PUBLIC_DEPOSIT_ACCOUNT_NAME=
```

Production values must be configured in the deployment environment. Placeholder payment details must not be used for real payments.

## Customer UI completed

### My Reservations

`components/customerDashboard/ReservesContent.tsx` now uses reservation cards showing:

- Vehicle name.
- Booking reference.
- Pickup and return date/time.
- Current public status.
- One primary next action.
- **Track booking** link.

The empty state says **No reservations yet**, **Start by creating your first reservation**, and provides **Book a Van**.

### Journey detail page

Route:

```text
/customerDashboard/reservations/[reservationId]
```

It includes:

- Main reservation card.
- One dynamic Next Action card.
- Responsive nine-step journey tracker.
- Four compact cards: Deposit, Contract, Collection, Refund.
- Expandable booking, documents, payment, contract, collection/return, handover, inspection, refund, and activity sections.
- Smart default accordion: action-related section first, otherwise Booking summary.

### Existing integrations reused

- Pending-only reservation editing.
- Existing licence/document upload area.
- Existing DocuSign signing and signed-document downloads.
- Deposit option selection, transfer/card details, exact amount, copy action, and receipt upload.
- Customer-visible handover, inspection, and refund summaries.

## Remaining work

### Latest completed block

- Added authenticated customer reservation list, journey-detail, and timeline APIs.
- Enforced reservation ownership for customer detail, update, and deposit requests.
- Restricted reservation/category administrative mutations to dashboard roles.
- Added category deposit fields to the admin create/edit form.
- Added admin deposit receipt approval/rejection and verification metadata.
- Deposit approval advances eligible reservations to `deposit_paid`.
- Added a customer reservation-list API error state.
- Added authenticated admin vehicle-handover and return-inspection APIs/forms.
- Handover completion starts the rental and marks the vehicle unavailable.
- Return inspection starts deposit review and releases the vehicle.
- Added refund deduction calculation, approval, processing, and completion controls.

### High priority

- Decide exactly when `fullPayDiscountPercent` changes the reservation total.
- Restrict receipt uploads by ownership, file type, size, and storage access.

### Journey operations

- Define and enforce allowed status transitions.
- Decide which status changes happen automatically after deposit verification and DocuSign completion.
- Add notifications for deposit, contract, collection, inspection, and refund milestones.

### Tests and build

- Unit-test status normalization, public-step mapping, next-action selection, and deposit calculations.
- API-test deposit choices, receipt submission, ownership, invalid statuses, and history.
- Test desktop/mobile journey layouts and legacy reservations.
- Resolve the existing Next.js Turbopack conflict with `docusign-esign`. TypeScript and development-route smoke tests currently pass.

## Key files

- `model/reservation.ts`
- `model/category.ts`
- `lib/reservation-status.ts`
- `lib/reservation-journey.ts`
- `lib/payment-info.ts`
- `types/reservation-journey.ts`
- `types/type.ts`
- `app/api/reservations/[id]/route.ts`
- `app/api/reservations/[id]/deposit/route.ts`
- `app/api/reservations/by-office/route.ts`
- `app/api/fleet-status/route.ts`
- `components/customerDashboard/ReservesContent.tsx`
- `components/customerDashboard/journey/ReservationJourneyPage.tsx`
- `components/customerDashboard/journey/JourneyTracker.tsx`
- `components/customerDashboard/journey/NextActionCard.tsx`
- `components/customerDashboard/journey/JourneyDetailCards.tsx`
- `components/customerDashboard/journey/JourneyAccordions.tsx`
- `components/customerDashboard/journey/DepositPanel.tsx`

## Recommended next task

Build the **customer change/cancellation/extension request APIs**, then add event-based timeline visibility and notifications.
