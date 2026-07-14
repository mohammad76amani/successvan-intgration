"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiCalendar, FiMapPin, FiTruck, FiClock } from "react-icons/fi";

export default function ReservationConfirmation() {
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("lastReservation");
    if (data) {
      setReservation(JSON.parse(data));
      console.log("📋 [Confirmation] Loaded reservation:", JSON.parse(data));
    } else {
      // No reservation found, redirect to home
      router.push("/");
    }
  }, [router]);

  if (!reservation) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full border-4 border-green-500 mb-4">
            <FiCheck className="text-green-500 text-4xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-400">
            Thank you for your reservation. We've sent a confirmation email.
          </p>
        </div>

        {/* Reservation Details */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-amber-500/30 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-amber-500 to-amber-600 px-6 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Reservation Details
            </h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Booking ID */}
            {reservation._id && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Booking Reference</p>
                <p className="text-white font-mono text-lg">
                  #{reservation._id.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Office */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <FiMapPin />
                  <span className="font-semibold">Pickup Location</span>
                </div>
                <p className="text-white">{reservation.office?.name || "Office"}</p>
              </div>

              {/* Category */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <FiTruck />
                  <span className="font-semibold">Vehicle Category</span>
                </div>
                <p className="text-white">{reservation.category?.name || "Vehicle"}</p>
              </div>

              {/* Pickup */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <FiCalendar />
                  <span className="font-semibold">Pickup</span>
                </div>
                <p className="text-white">
                  {new Date(reservation.pickupDate).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  <FiClock className="inline mr-1" />
                  {reservation.pickupTime || "10:00"}
                </p>
              </div>

              {/* Return */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <FiCalendar />
                  <span className="font-semibold">Return</span>
                </div>
                <p className="text-white">
                  {new Date(reservation.returnDate).toLocaleDateString()}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  <FiClock className="inline mr-1" />
                  {reservation.returnTime || "10:00"}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            {reservation.email && (
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-300 text-sm">
                  📧 Confirmation sent to: <strong>{reservation.email}</strong>
                </p>
              </div>
            )}

            {/* Message */}
            {reservation.message && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm mb-1">Special Requests</p>
                <p className="text-white">{reservation.message}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => router.push("/register")}
              className="flex-1 px-6 py-3 rounded-lg font-semibold text-slate-900 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/30"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">What's Next?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">✓</span>
              <span>Check your email for booking confirmation and details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">✓</span>
              <span>Bring a valid driver's licences and ID on pickup day</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">✓</span>
              <span>Arrive 15 minutes early to complete paperwork</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">✓</span>
              <span>Create an account to manage your bookings</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
