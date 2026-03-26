export interface DeliveryData {
  letterId: string;
  senderCity: string;
  recipientCity: string;
  startTime: number;
  durationMs: number;
  delivered?: boolean;
}

const STORE_KEY = "postman_deliveries";

function getAll(): Record<string, DeliveryData> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setAll(data: Record<string, DeliveryData>) {
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

export function saveDelivery(
  data: Omit<DeliveryData, "durationMs"> & { durationMs?: number },
) {
  const all = getAll();
  all[data.letterId] = {
    ...data,
    durationMs: data.durationMs ?? (Math.floor(Math.random() * 120) + 1) * 1000,
  };
  setAll(all);
}

export function getDelivery(letterId: string): DeliveryData | null {
  return getAll()[letterId] ?? null;
}

export function markDelivered(letterId: string) {
  const all = getAll();
  if (all[letterId]) {
    all[letterId].delivered = true;
    setAll(all);
  }
}
