"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRoomOptions, EditRoomOptions } from "@/app/rooms/_lib/types";
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  RoomsApiError,
  updateRoom,
} from "@/app/rooms/_lib/rooms-api";

export const roomsQueryKey = ["rooms"];

export function useRoomsQuery() {
  return useQuery({
    queryKey: roomsQueryKey,
    queryFn: fetchRooms,
    refetchInterval: 10_000,
  });
}

export function useCreateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: CreateRoomOptions) => createRoom(options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: roomsQueryKey,
      });
    },
  });
}

export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roomId,
      options,
    }: {
      roomId: string;
      options: EditRoomOptions;
    }) => updateRoom(roomId, options),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}

export function useDeleteRoomMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomsQueryKey });
    },
  });
}

export function isRoomsAuthError(error: unknown) {
  return error instanceof RoomsApiError && [401, 403].includes(error.status);
}

export function getRoomsAuthError(error: unknown) {
  if (!isRoomsAuthError(error)) return null;

  const apiError = error as RoomsApiError;

  return {
    status: apiError.status as 401 | 403,
    message: apiError.data.error || "You do not have access to rooms.",
  };
}

export function getRoomsErrorMessage(error: unknown) {
  if (!error) return "";

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}