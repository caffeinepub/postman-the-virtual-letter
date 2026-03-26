import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FriendEntry,
  FriendRequestResult,
  LetterDetail,
  SetUsernameResult,
  StampType,
  UserProfile,
  UserSearchResult,
} from "../backend.d";
import { useActor } from "./useActor";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms),
    ),
  ]);
}

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
  return useMutation<
    bigint,
    Error,
    { to: Principal; body: string; stamp: StampType }
  >({
    mutationFn: async ({ to, body, stamp }) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendLetter(to, body, stamp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbox"] });
    },
  });
}

export function useMyUsername() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["myUsername"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await withTimeout(actor.getMyUsername(), 12000);
        return result;
      } catch {
        // If backend times out or errors, treat as no username (not a fatal error)
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
    staleTime: 60000,
  });
}

export function useSetUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<SetUsernameResult, Error, string>({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.setUsername(username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myUsername"] });
    },
  });
}

export function useCheckUsername(username: string) {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["checkUsername", username],
    queryFn: async () => {
      if (!actor) return false;
      return actor.checkUsernameAvailable(username);
    },
    enabled: !!actor && !isFetching && username.length >= 3,
  });
}

export function useFindUserByUsername() {
  const { actor } = useActor();
  return useMutation<UserSearchResult | null, Error, string>({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.findUserByUsername(username);
    },
  });
}

export function useGetLetter(letterId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<LetterDetail | null>({
    queryKey: ["letter", letterId?.toString()],
    queryFn: async (): Promise<LetterDetail | null> => {
      if (!actor || letterId === null) return null;
      return (actor as any).getLetter(letterId) as Promise<LetterDetail | null>;
    },
    enabled: !!actor && !isFetching && letterId !== null,
  });
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", principal?.toString()],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 300000,
  });
}

export function useSignLetter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    boolean,
    Error,
    { letterId: bigint; signatureData: string }
  >({
    mutationFn: async ({ letterId, signatureData }) => {
      if (!actor) throw new Error("Not connected");
      return actor.signLetter(letterId, signatureData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["letter", variables.letterId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["letterSignature", variables.letterId.toString()],
      });
    },
  });
}

export function useGetLetterSignature(letterId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["letterSignature", letterId?.toString()],
    queryFn: async () => {
      if (!actor || letterId === null) return null;
      return actor.getLetterSignature(letterId);
    },
    enabled: !!actor && !isFetching && letterId !== null,
  });
}

export function useSendFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<FriendRequestResult, Error, string>({
    mutationFn: async (username: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.sendFriendRequest(username) as Promise<FriendRequestResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
    },
  });
}

export function useAcceptFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, Principal>({
    mutationFn: async (fromPrincipal: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.acceptFriendRequest(fromPrincipal) as Promise<boolean>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
    },
  });
}

export function useDeclineFriendRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, Principal>({
    mutationFn: async (fromPrincipal: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.declineFriendRequest(fromPrincipal) as Promise<boolean>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFriendRequests"] });
    },
  });
}

export function useRemoveFriend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, Principal>({
    mutationFn: async (friendPrincipal: Principal) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeFriend(friendPrincipal) as Promise<boolean>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
}

export function useGetFriends() {
  const { actor, isFetching } = useActor();
  return useQuery<FriendEntry[]>({
    queryKey: ["friends"],
    queryFn: async (): Promise<FriendEntry[]> => {
      if (!actor) return [];
      return actor.getFriends() as Promise<FriendEntry[]>;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useGetPendingFriendRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<FriendEntry[]>({
    queryKey: ["pendingFriendRequests"],
    queryFn: async (): Promise<FriendEntry[]> => {
      if (!actor) return [];
      return actor.getPendingFriendRequests() as Promise<FriendEntry[]>;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}
