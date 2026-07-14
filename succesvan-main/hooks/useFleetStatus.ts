import useSWR from "swr";

interface TodayActivity {
  _id: string;
  startDate: string;
  endDate: string;
  vehicle?: {
    number: string;
    title: string;
    make: string;
  } | null;
  category: { name: string };
  status: string;
  user?: any;
}

interface FleetStatusData {
  fleet: {
    available: number;
    inUse: number;
    maintenance: number;
    total: number;
  };
  today: {
    pickups: TodayActivity[];
    returns: TodayActivity[];
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch fleet status");
  return res.json();
};

export function useFleetStatus() {
  const { data, isLoading, error } = useSWR<{ data: FleetStatusData }>(
    "/api/fleet-status",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 60000, // optional: refresh every minute
    }
  );

  const fleetStatus = data?.data.fleet || {
    available: 0,
    inUse: 0,
    maintenance: 0,
    total: 0,
  };

  const todayActivity = data?.data.today || { pickups: [], returns: [] };

  return {
    fleetStatus,
    todayActivity,
    isLoading,
    error,
  };
}
