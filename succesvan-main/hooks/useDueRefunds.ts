import useSWR from "swr";
import { clientAuthHeaders } from "@/lib/client-auth";
import type { Reservation } from "@/types/type";

export type DueRefundReservation = Reservation & {
  _id: string;
  reservationCode?: string;
  user?: {
    name?: string;
    lastName?: string;
    phoneData?: { phoneNumber?: string };
  };
  vehicle?: {
    _id?: string;
    title?: string;
    number?: string | number;
    keyNumber?: string;
    color?: string;
  };
};

type DueRefundResponse = {
  data: {
    reservations: DueRefundReservation[];
    count: number;
    totalRefundAmount: number;
    generatedAt: string;
  };
};

const fetcher = async (url: string): Promise<DueRefundResponse> => {
  const response = await fetch(url, { headers: clientAuthHeaders() });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "Could not load due refunds");
  }
  return payload;
};

export function useDueRefunds() {
  const { data, error, isLoading, mutate } = useSWR<DueRefundResponse>(
    "/api/admin/refunds/due",
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
      dedupingInterval: 30_000,
    },
  );

  return {
    dueRefunds: data?.data.reservations || [],
    dueRefundsCount: data?.data.count || 0,
    dueRefundsTotal: data?.data.totalRefundAmount || 0,
    isLoading,
    error,
    mutate,
  };
}
