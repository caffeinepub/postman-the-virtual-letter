import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Profile {
    signature: string;
    city: string;
    name: string;
}
export type LetterId = bigint;
export interface UserProfile {
    signature: string;
    city: string;
    name: string;
}
export interface UserSearchResult {
    name: string;
    city: string;
    username: string;
    principal: Principal;
}
export interface LetterDetail {
    id: bigint;
    from: Principal;
    to: Principal;
    body: string;
    stamp: StampType;
    timestamp: bigint;
    signed: boolean;
    deliveryTime: bigint;
}
export interface FriendEntry {
    username: string;
    principal: Principal;
}
export type SetUsernameResult = { __kind__: "ok" } | { __kind__: "error"; value: string };
export type FriendRequestResult = { __kind__: "ok" } | { __kind__: "error"; value: string };
export enum StampType {
    indian = "indian",
    pakistani = "pakistani"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getInbox(arg0: { userId: Principal }): Promise<Array<LetterId>>;
    getOutbox(arg0: { userId: Principal }): Promise<Array<LetterId>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProfilesByName(searchText: string): Promise<Array<Profile>>;
    sendLetter(to: Principal, body: string, stamp: StampType): Promise<bigint>;
    getLetter(letterId: bigint): Promise<LetterDetail | null>;
    signLetter(letterId: bigint, signatureData: string): Promise<boolean>;
    getLetterSignature(letterId: bigint): Promise<string | null>;
    setUsername(username: string): Promise<SetUsernameResult>;
    getMyUsername(): Promise<string | null>;
    checkUsernameAvailable(username: string): Promise<boolean>;
    findUserByUsername(username: string): Promise<UserSearchResult | null>;
    sendFriendRequest(toUsername: string): Promise<FriendRequestResult>;
    acceptFriendRequest(fromPrincipal: Principal): Promise<boolean>;
    declineFriendRequest(fromPrincipal: Principal): Promise<boolean>;
    removeFriend(friendPrincipal: Principal): Promise<boolean>;
    getFriends(): Promise<Array<FriendEntry>>;
    getPendingFriendRequests(): Promise<Array<FriendEntry>>;
}
