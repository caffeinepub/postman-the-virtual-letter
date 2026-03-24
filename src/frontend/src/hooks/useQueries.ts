import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StampType, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useInbox(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["inbox", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getInbox({ userId });
    },
    enabled: !!actor && !isFetching && !!userId,
    refetchInterval: 30000,
  });
}

export function useOutbox(userId: Principal | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["outbox", userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getOutbox({ userId });
    },
    enabled: !!actor && !isFetching && !!userId,
  });
}

export function useSearchProfiles(searchText: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["searchProfiles", searchText],
    queryFn: async () => {
      if (!actor || !searchText.trim()) return [];
      return actor.searchProfilesByName(searchText);
    },
    enabled: !!actor && !isFetching && searchText.trim().length >= 2,
  });
}

export function useSendLetter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      to,
      body,
      stamp,
    }: { to: Principal; body: string; stamp: StampType }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendLetter(to, body, stamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbox"] });
    },
  });
}
