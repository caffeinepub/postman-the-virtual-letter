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
    getInbox(arg0: {
        userId: Principal;
    }): Promise<Array<LetterId>>;
    getOutbox(arg0: {
        userId: Principal;
    }): Promise<Array<LetterId>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchProfilesByName(searchText: string): Promise<Array<Profile>>;
    sendLetter(to: Principal, body: string, stamp: StampType): Promise<bigint>;
}
