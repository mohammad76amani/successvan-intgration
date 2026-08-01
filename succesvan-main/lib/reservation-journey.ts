// Builds the customer-facing booking journey view model from a reservation
// (plus its DocuSign contract, when one exists). Pure functions — safe to use
// on server and client.

import type { Reservation } from "@/types/type";
import type { SafeContractSummary } from "@/lib/docusign/types";
import type {
  ReservationJourneyViewModel,
  ReservationJourneyStep,
  ReservationNextAction,
  ContractPanelStatus,
  JourneyStepState,
} from "@/types/reservation-journey";
import {
  normalizeReservationStatus,
  isProblemStatus,
  PUBLIC_JOURNEY_STEPS,
  PUBLIC_STEP_LABELS,
  STATUS_TO_PUBLIC_STEP,
  RESERVATION_STATUS_LABELS,
  type ReservationStatus,
  type PublicJourneyStep,
} from "@/lib/reservation-status";
import { formatDateTimeInLondon } from "@/lib/englandTime";

// Statuses where the customer must do something before the journey moves on.
const ACTION_REQUIRED_STATUSES: ReservationStatus[] = [
  "confirmed",
  "deposit_pending",
  "contract_pending",
];

const formatReservationDateTime = (
  reservation: Reservation,
  type: "start" | "end",
): string => {
  if (type === "start") {
    if (reservation.startDateDisplay && reservation.pickupTime) {
      return `${reservation.startDateDisplay} ${reservation.pickupTime}`;
    }
    return reservation.startDate
      ? formatDateTimeInLondon(reservation.startDate)
      : "-";
  }
  if (reservation.endDateDisplay && reservation.returnTime) {
    return `${reservation.endDateDisplay} ${reservation.returnTime}`;
  }
  return reservation.endDate
    ? formatDateTimeInLondon(reservation.endDate)
    : "-";
};

const durationLabel = (reservation: Reservation): string => {
  const start = new Date(reservation.startDate).getTime();
  const end = new Date(reservation.endDate).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return "-";
  const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
  return days === 1 ? "1 day" : `${days} days`;
};

const contractPanelStatus = (
  contract: SafeContractSummary | null | undefined,
): ContractPanelStatus => {
  if (!contract) return "not_created";
  switch (contract.status) {
    case "draft":
    case "generating":
    case "ready":
      return "generating";
    case "sent":
    case "delivered":
    case "viewed":
    case "signing":
      return "awaiting_customer_signature";
    case "completed":
      return "signed";
    default:
      return "expired";
  }
};

// Date of the most recent history entry that belongs to the given public step.
const stepDate = (
  reservation: Reservation,
  step: PublicJourneyStep,
): string | undefined => {
  const history = reservation.statusHistory || [];
  for (let i = history.length - 1; i >= 0; i--) {
    const entryStatus = normalizeReservationStatus(history[i].status);
    if (entryStatus && STATUS_TO_PUBLIC_STEP[entryStatus] === step) {
      return formatDateTimeInLondon(history[i].changedAt);
    }
  }
  return undefined;
};

const buildSteps = (
  reservation: Reservation,
  status: ReservationStatus,
): ReservationJourneyStep[] => {
  const officeDepositSelected = reservation.deposit?.option === "office";
  const waitingForVehicleAfterOfficePay =
    officeDepositSelected &&
    ["confirmed", "deposit_pending", "deposit_paid"].includes(status);
  const waitingForDeposit = status === "confirmed" && !officeDepositSelected;
  const problem = isProblemStatus(status);
  // For a canceled/expired booking, the journey stopped at the step
  // of the last healthy status in the history.
  let referenceStatus: ReservationStatus = status;
  if (problem) {
    referenceStatus = "pending";
    for (const entry of reservation.statusHistory || []) {
      const s = normalizeReservationStatus(entry.status);
      if (s && !isProblemStatus(s)) referenceStatus = s;
    }
  }

  const currentStep = waitingForVehicleAfterOfficePay
    ? "vehicle_assignment"
    : waitingForDeposit
      ? "deposit"
      : STATUS_TO_PUBLIC_STEP[referenceStatus];
  const currentIdx = PUBLIC_JOURNEY_STEPS.indexOf(currentStep);
  const journeyDone = status === "completed";
  const actionRequired =
    ACTION_REQUIRED_STATUSES.includes(status) &&
    !waitingForVehicleAfterOfficePay;

  return PUBLIC_JOURNEY_STEPS.map((key, idx) => {
    let state: JourneyStepState;
    if (journeyDone || idx < currentIdx) {
      state = "completed";
    } else if (idx === currentIdx) {
      state = problem ? "failed" : actionRequired ? "blocked" : "current";
    } else {
      state = "upcoming";
    }
    return {
      key,
      label:
        waitingForVehicleAfterOfficePay && key === "deposit"
          ? "Pay at office"
          : waitingForVehicleAfterOfficePay && key === "vehicle_assignment"
            ? "Vehicle assignment"
            : PUBLIC_STEP_LABELS[key],
      state,
      description:
        waitingForVehicleAfterOfficePay && key === "vehicle_assignment"
          ? "We’ll assign your van before collection."
          : undefined,
      date:
        state === "completed" || state === "current" || state === "blocked"
          ? stepDate(reservation, key)
          : undefined,
    };
  });
};

const buildNextAction = (
  reservation: Reservation,
  status: ReservationStatus,
): ReservationNextAction => {
  const officeDepositSelected = reservation.deposit?.option === "office";
  switch (status) {
    case "pending":
      return {
        type: "none",
        title: "Booking under review",
        description:
          "We're checking vehicle availability and your booking details. We'll text you as soon as it's confirmed.",
        buttonLabel: "View Details",
        href: "#summary",
      };
    case "confirmed":
    case "deposit_pending":
      if (officeDepositSelected) {
        return {
          type: "none",
          title: "Vehicle assignment pending",
          description:
            "Your pay-at-office choice is saved. We’ll assign your van before collection. When you arrive at the office, you’ll pay the deposit, sign the agreement, and complete vehicle handover.",
          buttonLabel: "View Collection Details",
          href: "#collection",
        };
      }
      return {
        type: "pay_deposit",
        title: "Pay your deposit",
        description: "Pay your deposit to secure your booking.",
        buttonLabel: "Pay Deposit",
        href: "#deposit",
      };
    case "deposit_paid":
      return {
        type: "none",
        title: "Vehicle assignment pending",
        description: officeDepositSelected
          ? "We’ll assign your van before collection. When you arrive at the office, we’ll complete the agreement and handover with you."
          : "Your deposit is received. We’ll assign your van next, then your contract will be ready to sign.",
      };
    case "contract_pending":
      return {
        type: "sign_contract",
        title: "Sign your rental agreement",
        description:
          "Please review and sign your rental agreement before collection.",
        buttonLabel: "Sign Contract",
        href: "#contract",
      };
    case "contract_signed":
      return {
        type: "none",
        title: "Agreement signed",
        description:
          "All set on your side. We're getting your van ready for collection.",
      };
    case "ready_for_collection":
      return {
        type: "view_collection",
        title: "Ready for collection",
        description:
          "Your van is ready. Bring your documents and collection code.",
        buttonLabel: "View Collection Details",
        href: "#collection",
      };
    case "handover_in_progress":
      return {
        type: "view_collection",
        title: "Vehicle handover",
        description:
          "We're completing the handover checks with you at the office.",
        buttonLabel: "View Collection Details",
        href: "#handover",
      };
    case "delivered":
      return {
        type: "view_return",
        title: "Rental in progress",
        description: "Your rental is active. Please return the van on time.",
        buttonLabel: "View Return Instructions",
        href: "#return",
      };
    case "vehicle_returned":
    case "return_inspection":
      return {
        type: "view_return",
        title: "Return inspection",
        description:
          "We've received the van and are completing the inspection.",
        buttonLabel: "View Inspection Status",
        href: "#inspection",
      };
    case "deposit_review":
    case "refund_processing":
      return {
        type: "view_refund",
        title: "Refund processing",
        description: "Your deposit refund is being processed.",
        buttonLabel: "View Refund Details",
        href: "#refund",
      };
    case "refund_completed":
      return {
        type: "view_refund",
        title: "Refund completed",
        description: "Your deposit refund has been sent to your account.",
        buttonLabel: "View Refund Details",
        href: "#refund",
      };
    case "completed":
      return {
        type: "book_again",
        title: "Booking complete",
        description: "Your booking has been completed successfully.",
        buttonLabel: "Book Again",
        href: "/reservation",
      };
    case "canceled":
    case "expired":
      return {
        type: "contact_support",
        title: status === "canceled" ? "Booking canceled" : "Booking expired",
        description:
          reservation.cancelReason?.trim() ||
          "This booking is no longer active. Contact us if you have any questions.",
        buttonLabel: "Contact Support",
        href: "/customerDashboard#support",
      };
  }
};

export function buildReservationJourney(
  reservation: Reservation,
  contract?: SafeContractSummary | null,
): ReservationJourneyViewModel {
  const status = normalizeReservationStatus(reservation.status) ?? "pending";

  const category = reservation.category as
    | {
        name?: string;
        image?: string;
        deposit?: { securePayPrice?: number };
      }
    | undefined;
  const vehicle = reservation.vehicle as { title?: string } | undefined;
  const office = reservation.office as
    { name?: string; address?: string } | undefined;

  const deposit = reservation.deposit;
  const refund = reservation.refund;

  return {
    reservationId: reservation._id || "",
    bookingReference: reservation.reservationCode || reservation._id || "-",
    vehicleName: vehicle?.title || category?.name || "Van",
    vehicleImage: category?.image,
    pickupDateTime: formatReservationDateTime(reservation, "start"),
    returnDateTime: formatReservationDateTime(reservation, "end"),
    durationLabel: durationLabel(reservation),
    publicStatusLabel: RESERVATION_STATUS_LABELS[status],
    mainStatus: status,
    steps: buildSteps(reservation, status),
    nextAction: buildNextAction(reservation, status),
    deposit: (() => {
      // Fall back to the reservation total until the customer has chosen an
      // option. Full deposit is the booking total; secure/office amounts are
      // snapshotted into reservation.deposit.amount after selection.
      const amount = deposit?.amount ?? reservation.totalPrice;
      if (amount === undefined && !deposit?.status) return undefined;
      return {
        amount: amount ?? 0,
        status: deposit?.status ?? "not_paid",
        paidAt: deposit?.paidAt
          ? formatDateTimeInLondon(deposit.paidAt)
          : undefined,
        dueAt: deposit?.dueAt
          ? formatDateTimeInLondon(deposit.dueAt)
          : undefined,
        receiptUrl: deposit?.receiptUrl,
      };
    })(),
    contract: {
      status: contractPanelStatus(contract),
      contractId: contract?._id,
      contractNumber: contract?.contractNumber,
      signedAt: contract?.docusign?.completedAt
        ? formatDateTimeInLondon(contract.docusign.completedAt)
        : undefined,
    },
    collection: {
      location:
        [office?.name, office?.address].filter(Boolean).join(", ") || "-",
      collectionCode: reservation.collectionCode,
      readyAt: reservation.startDateDisplay
        ? `${reservation.startDateDisplay} ${reservation.pickupTime || ""}`.trim()
        : undefined,
    },
    refund:
      refund && (refund.status || refund.refundAmount !== undefined)
        ? {
            depositPaid: refund.depositPaid ?? deposit?.amount ?? 0,
            deductionsTotal: refund.deductionsTotal ?? 0,
            refundAmount: refund.refundAmount ?? 0,
            status: refund.status ?? "not_started",
            reference: refund.reference,
            expectedBy: refund.expectedBy
              ? new Date(refund.expectedBy).toISOString()
              : undefined,
          }
        : undefined,
  };
}
