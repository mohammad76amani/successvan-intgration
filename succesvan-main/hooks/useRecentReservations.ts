import useSWR from "swr";
import { Reservation } from "@/types/type";
import { clientAuthHeaders } from "@/lib/client-auth";

const TWENTY_MINUTES = 20 * 60 * 1000;

const fetcher = async (url: string) => {
  const res = await fetch(url, { headers: clientAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch reservations");
  return res.json();
};

export function useRecentReservations() {
  const { data, isLoading } = useSWR<{ data: Reservation[] }>(
    "/api/reservations?page=1&limit=3",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: TWENTY_MINUTES }
  );

  const { data: allReservations } = useSWR<{
    data: Reservation[];
    total: number;
  }>("/api/reservations?page=1&limit=100", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    refreshInterval: TWENTY_MINUTES,
  });

  const pendingCount =
    allReservations?.data?.filter((r) => r.status === "pending").length || 0;

  return {
    reservations: data?.data || [],
    pendingCount,
    isLoading,
  };
}
