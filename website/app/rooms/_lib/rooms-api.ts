import type {
  CreateRoomOptions,
  RoomsApiResponse,
} from "@/app/rooms/_lib/types";
import { getApiErrorMessage, readJsonResponse } from "@/app/rooms/_lib/room-utils";

export class RoomsApiError extends Error {
  status: number;
  data: RoomsApiResponse;

  constructor(message: string, status: number, data: RoomsApiResponse) {
    super(message);
    this.name = "RoomsApiError";
    this.status = status;
    this.data = data;
  }
}

export async function fetchRooms() {
  const response = await fetch("/api/rooms", {
    cache: "no-store",
  });

  const data = (await readJsonResponse(response)) as RoomsApiResponse;

  if (!response.ok) {
    throw new RoomsApiError(
      data.error || "Failed to load rooms",
      response.status,
      data,
    );
  }

  return data;
}

export async function createRoom(options: CreateRoomOptions) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  const data = (await readJsonResponse(response)) as RoomsApiResponse;

  if (!response.ok) {
    throw new RoomsApiError(getApiErrorMessage(data), response.status, data);
  }

  return data;
}