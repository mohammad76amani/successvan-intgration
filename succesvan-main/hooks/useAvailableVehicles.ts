import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAvailableVehicles() {
    const { data, error, isLoading, mutate } = useSWR(
        "/api/vehicles?available=true&limit=500",
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000,
        }
    );

    return {
        availableVehicles: data?.data ?? [],
        isLoading,
        isError: !!error,
        mutate,
    };
}