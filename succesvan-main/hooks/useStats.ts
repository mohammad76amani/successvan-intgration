import { Stats } from "@/types/type";
import useSWR from "swr";



const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useStats() {
  const { data, isLoading } = useSWR<{ data: Stats }>(
    "/api/stats",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const stats = data?.data || {
    vehicles: 0,
    offices: 0,
    reservations: 0,
    categories: 0,
  };

  return { stats, isLoading };
}
