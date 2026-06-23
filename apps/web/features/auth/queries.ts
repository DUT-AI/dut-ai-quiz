import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { UserMeSchema, type UserMe } from "./types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserMe>("/api/v1/me", UserMeSchema),
    staleTime: 300_000,
    retry: false,
  });
}
