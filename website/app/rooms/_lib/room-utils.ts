import type { Room, RoomsApiResponse } from "@/app/rooms/_lib/types";

export function formatDate(date?: string) {
  if (!date) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Server returned invalid JSON");
  }
}

export function isRoomReady(room: Room) {
  return room.is_ready === true;
}

export function getRoomUrl(room: Room) {
  return room.public_url || room.url;
}

export function getJoinUrl(room: Room) {
  return room.join_url || room.public_url || room.url;
}

export function parseEmailList(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getRoomDisplayName(room: Room) {
  return room.labels?.title || room.name;
}

export function getStatusMessage(data?: RoomsApiResponse) {
  const state = data?.server?.state || data?.ec2_state;

  if (state === "stopped") {
    return "Server is asleep. Create a room to wake it up.";
  }

  if (state === "stopping") {
    return "Server is shutting down.";
  }

  if (state === "pending") {
    return "Server is starting...";
  }

  if (state === "running" || data?.server?.online) {
    return "Server is online.";
  }

  return data?.server?.message ?? "Server is offline.";
}

export function getApiErrorMessage(data: RoomsApiResponse) {
  const details =
    typeof data.details === "string"
      ? data.details
      : data.details
        ? JSON.stringify(data.details, null, 2)
        : "";

  return `${data.error || "Something went wrong"}${
    details ? `: ${details}` : ""
  }`;
}