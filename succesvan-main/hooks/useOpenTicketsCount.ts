import useSWR from "swr";

const fetcher = async (url: string) => {
  // Only run on client side after mount
  if (typeof window === "undefined") {
    return { success: true, count: 0 };
  }
  
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  
  if (!res.ok) {
    // If unauthorized, return 0 instead of throwing
    if (res.status === 401) {
      return { success: true, count: 0 };
    }
    throw new Error("Failed to fetch open tickets count");
  }
  return res.json();
};

export function useOpenTicketsCount() {
  // Optimized: only fetches count, not full ticket data
  // Uses longer deduping interval to reduce unnecessary requests
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; count: number }>(
    "/api/tickets/open-count",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute - reduce API calls
      refreshInterval: 60000, // Poll every minute for real-time updates
      fallbackData: { success: true, count: 0 },
    }
  );

  return {
    openTicketsCount: data?.count || 0,
    isLoading,
    error,
    mutate,
  };
}
