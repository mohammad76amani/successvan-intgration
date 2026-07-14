import useSWR from "swr";
import { Reservation } from "@/types/type";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch reservations");
  return res.json();
};

export function useRecentReservations() {
  const { data, isLoading } = useSWR<{ data: Reservation[] }>(
    "/api/reservations?page=1&limit=3",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: allReservations, isLoading: isLoadingCount } = useSWR<{
    data: Reservation[];
    total: number;
  }>("/api/reservations?page=1&limit=100", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const pendingCount =
    allReservations?.data?.filter((r) => r.status === "pending").length || 0;

  return {
    reservations: data?.data || [],
    pendingCount,
    isLoading,
  };
}
