import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export default function useCategories(status = "active") {
  const { data, error, isValidating, mutate } = useSWR(
    `/api/categories?status=${status}`,
    fetcher,


    
    { revalidateOnFocus: false }
  );

  const categories = data ? data.data?.data || data.data || [] : [];
  const isLoading = !data && !error;

  return { categories, isLoading, error, mutate, isValidating };
}
