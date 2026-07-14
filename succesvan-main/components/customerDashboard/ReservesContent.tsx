"use client";

import { useState, useEffect } from "react";
import { Reservation } from "@/types/type";
import DynamicTableView from "@/components/dashboard/DynamicTableView";
import CustomerReservationEditModal from "./CustomerReservationEditModal";
import { formatDateTimeInLondon } from "@/lib/englandTime";

const formatReservationDateTime = (
  reservation: Reservation | undefined,
  type: "start" | "end",
) => {
  if (!reservation) return "-";

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

  return reservation.endDate ? formatDateTimeInLondon(reservation.endDate) : "-";
};

export default function ReservesContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData && typeof userData === "object" && userData._id) {
          setUserId(userData._id);
        }
      } catch (error) {
        console.log("Failed to parse user data:", error);
      }
    }
  }, []);

  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleUpdate = () => {
    // Trigger table refresh by setting a new key or calling a refetch
    const tableElement = document.querySelector("[data-table-key]");
    if (tableElement) {
      tableElement.dispatchEvent(new CustomEvent("refetch"));
    }
  };

  if (!userId) {
    return <div className="text-gray-400">Loading reservations...</div>;
  }

  return (
    <>
      <DynamicTableView<Reservation>
        apiEndpoint={`/api/reservations?userId=${userId}`}
        title="Reservation"
        hideDelete
        hideViewBtn
        hiddenColumns={[]}
        onEdit={handleViewReservation}
        columns={[
          {
            key: "reservationCode" as keyof Reservation,
            label: "Order ID",
            render: (value: any, reservation) =>
              value || (reservation as any)?._id ? (
                <span className="font-bold text-[#fe9a00]">
                  {value || (reservation as any)?._id}
                </span>
              ) : (
                "-"
              ),
          },
          {
            key: "office" as keyof Reservation,
            label: "Office",
            render: (value: any) => {
              if (typeof value === "object" && value?.name) {
                return value.name;
              }
              return value || "-";
            },
          },
          {
            key: "startDate" as keyof Reservation,
            label: "Start Date & Time",
            render: (_value: string, reservation) =>
              formatReservationDateTime(reservation, "start"),
          },
          {
            key: "endDate" as keyof Reservation,
            label: "End Date & Time",
            render: (_value: string, reservation) =>
              formatReservationDateTime(reservation, "end"),
          },
          {
            key: "totalPrice" as keyof Reservation,
            label: "Total Price",
            render: (value: any, reservation) => {
              if ((reservation as any)?.perInvoice && !value) {
                return (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400">
                    Per Invoice
                  </span>
                );
              }
              if (
                typeof value === "object" &&
                value !== null &&
                value?.amount !== undefined
              ) {
                return <span>£{value.amount}</span>;
              }
              if (typeof value === "number") {
                return <span>£{value}</span>;
              }
              return <span>£0</span>;
            },
          },
          {
            key: "status" as keyof Reservation,
            label: "Status",
            render: (value: string, reservation) => (
              <div className="space-y-1">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                    value === "confirmed"
                      ? "bg-green-500/20 text-green-400"
                      : value === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : value === "canceled"
                          ? "bg-red-500/20 text-red-400"
                          : value === "completed"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : value === "delivered"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {value === "confirmed"
                    ? "Confirmed"
                    : value === "pending"
                      ? "Pending"
                      : value === "canceled"
                        ? "Canceled"
                        : value === "completed"
                          ? "Completed"
                          : value === "delivered"
                            ? "Collected"
                            : "Unknown"}
                </span>
                {value === "canceled" && reservation?.cancelReason && (
                  <p className="max-w-64 text-xs leading-snug text-red-300 whitespace-pre-wrap">
                    Reason: {reservation.cancelReason}
                  </p>
                )}
              </div>
            ),
          },
        ]}
      />

      <CustomerReservationEditModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleUpdate}
      />
    </>
  );
}
