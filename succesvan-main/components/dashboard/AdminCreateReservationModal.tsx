"use client";

import { useState } from "react";
import { FiX } from "react-icons/fi";
import AdminReservationForm from "./AdminReservationForm";
import AdminReservationModal from "./AdminReservationModal";

interface AdminCreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminCreateReservationModal({
  isOpen,
  onClose,
}: AdminCreateReservationModalProps) {
  const [showReservationSteps, setShowReservationSteps] = useState(false);

  if (!isOpen && !showReservationSteps) return null;

  const closeInitialForm = () => {
    onClose();
  };

  const closeReservationSteps = () => {
    setShowReservationSteps(false);
    sessionStorage.removeItem("rentalDetails");
    window.location.reload();
  };

  return (
    <>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-9999"
            onClick={closeInitialForm}
          />
          <div className="fixed inset-0 z-10000 flex items-center justify-center p-4 overflow-y-auto">
            <div className="relative bg-[#0f172b] rounded-2xl max-w-6xl w-full h-130 overflow-y-auto border border-white/10">
              <div className="sticky top-0 bg-[#0f172b] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-white">
                  Create New Reservation
                </h2>
                <button
                  onClick={closeInitialForm}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiX className="text-white text-xl" />
                </button>
              </div>
              <div className="p-6">
                <AdminReservationForm
                  isModal={true}
                  isAdminMode={true}
                  onClose={closeInitialForm}
                  onBookNow={() => {
                    onClose();
                    setTimeout(() => setShowReservationSteps(true), 100);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showReservationSteps && (
        <AdminReservationModal
          isAdminMode={true}
          onClose={closeReservationSteps}
        />
      )}
    </>
  );
}
