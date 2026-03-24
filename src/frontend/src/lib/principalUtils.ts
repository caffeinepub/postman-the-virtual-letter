import { Principal } from "@icp-sdk/core/principal";

export function createPrincipal(text: string): Principal {
  return Principal.fromText(text);
}
