import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ensureProfile, updateProfile } from "./xcape.functions";
import { useAccount } from "./auth-context";

export function useProfile() {
  const { user } = useAccount();
  const ensure = useServerFn(ensureProfile);
  return useQuery({ queryKey: ["profile", user?.id], queryFn: () => ensure(), enabled: !!user, staleTime: 60_000 });
}

export type Profile = NonNullable<ReturnType<typeof useProfile>["data"]>;

export function useSaveProfile() {
  const { user } = useAccount();
  const save = useServerFn(updateProfile);
  const queries = useQueryClient();
  return async (data: Parameters<typeof save>[0]["data"]) => {
    const result = await save({ data });
    if (result.ok) queries.setQueryData(["profile", user?.id], result.profile);
    return result;
  };
}
