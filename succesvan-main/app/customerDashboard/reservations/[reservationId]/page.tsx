import ReservationJourneyPage from "@/components/customerDashboard/journey/ReservationJourneyPage";

export const metadata = {
  title: "Track Booking | Success Van Hire",
  robots: { index: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  return <ReservationJourneyPage reservationId={reservationId} />;
}
