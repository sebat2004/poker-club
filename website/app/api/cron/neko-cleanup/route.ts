import { NextResponse } from "next/server";
import {
  DescribeInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { createEc2Client } from "@/app/lib/ec2";

export const runtime = "nodejs";

type NekoRoom = {
  id?: string;
  name?: string;
  url?: string;
  running?: boolean;
  paused?: boolean;
  is_ready?: boolean;
  status?: string;
  created?: string;
  labels?: Record<string, string>;
  [key: string]: unknown;
};

const ec2 = createEc2Client()

// This works for local/dev or a long-running Node server.
// For Vercel/serverless, use DynamoDB/KV instead because memory can reset.
let noRoomsSince: number | null = null;

const THIRTY_SECS_MS = 30 * 1000;
const ONE_MIN_MS = 1 * 60 * 1000;

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function getInstanceState(instanceId: string) {
  const result = await ec2.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    })
  );

  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name ?? "unknown";
}

async function stopInstance(instanceId: string) {
  await ec2.send(
    new StopInstancesCommand({
      InstanceIds: [instanceId],
    })
  );
}

async function listRooms(nekoRoomsApiUrl: string): Promise<NekoRoom[]> {
  const response = await fetch(`${nekoRoomsApiUrl}/api/rooms`, {
    cache: "no-store",
  });

  const rawText = await response.text();
  const data = safeJsonParse(rawText);

  if (!response.ok) {
    throw new Error(
      `Could not list rooms. Status ${response.status}: ${rawText}`
    );
  }

  return Array.isArray(data) ? data : [];
}

async function deleteRoom(nekoRoomsApiUrl: string, roomId: string) {
  const response = await fetch(`${nekoRoomsApiUrl}/api/rooms/${roomId}`, {
    method: "DELETE",
  });

  const rawText = await response.text();

  if (!response.ok) {
    console.error(`Failed to delete room ${roomId}:`, response.status, rawText);
    return false;
  }

  return true;
}

function isRoomOlderThan(room: NekoRoom, maxAgeMs: number) {
  if (!room.created) return false;

  const createdAt = new Date(room.created).getTime();

  if (Number.isNaN(createdAt)) return false;

  return Date.now() - createdAt > maxAgeMs;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const instanceId = process.env.NEKO_INSTANCE_ID;
  const nekoRoomsApiUrl = process.env.NEKO_ROOMS_PUBLIC_URL;

  if (!instanceId) {
    return NextResponse.json(
      { ok: false, error: "Missing NEKO_INSTANCE_ID" },
      { status: 500 }
    );
  }

  if (!nekoRoomsApiUrl) {
    return NextResponse.json(
      { ok: false, error: "Missing NEKO_ROOMS_PUBLIC_URL" },
      { status: 500 }
    );
  }

  try {
    const state = await getInstanceState(instanceId);

    if (state !== "running") {
      noRoomsSince = null;

      return NextResponse.json({
        ok: true,
        action: "none",
        message: "EC2 instance is not running.",
        state,
      });
    }

    const rooms = await listRooms(nekoRoomsApiUrl);

    const deletedRooms: string[] = [];

    for (const room of rooms) {
      if (!room.id) continue;

      // Basic cleanup rule:
      // Delete rooms older than thirty secs.
      // Later, replace this with heartbeat-based lastActiveAt cleanup.
      if (isRoomOlderThan(room, THIRTY_SECS_MS)) {
        const deleted = await deleteRoom(nekoRoomsApiUrl, room.id);

        if (deleted) {
          deletedRooms.push(room.id);
        }
      }
    }

    const remainingRooms = await listRooms(nekoRoomsApiUrl);

    if (remainingRooms.length === 0) {
      if (noRoomsSince === null) {
        noRoomsSince = Date.now();

        return NextResponse.json({
          ok: true,
          action: "waiting",
          message: "No rooms are active. Waiting 1 minute before stopping EC2.",
          state,
          roomsBeforeCleanup: rooms.length,
          deletedRooms,
          remainingRooms: remainingRooms.length,
          noRoomsSince,
        });
      }

      const noRoomsForMs = Date.now() - noRoomsSince;

      if (noRoomsForMs >= ONE_MIN_MS) {
        await stopInstance(instanceId);
        noRoomsSince = null;

        return NextResponse.json({
          ok: true,
          action: "stopped_ec2",
          message: "No rooms were active for 1 minute. EC2 stop request sent.",
          state,
          roomsBeforeCleanup: rooms.length,
          deletedRooms,
          remainingRooms: remainingRooms.length,
        });
      }

      return NextResponse.json({
        ok: true,
        action: "waiting",
        message: "No rooms are active, but 1 minute has not passed yet.",
        state,
        roomsBeforeCleanup: rooms.length,
        deletedRooms,
        remainingRooms: remainingRooms.length,
        noRoomsForSeconds: Math.floor(noRoomsForMs / 1000),
      });
    }

    noRoomsSince = null;

    return NextResponse.json({
      ok: true,
      action: "none",
      message: "Rooms are still active. EC2 stays running.",
      state,
      roomsBeforeCleanup: rooms.length,
      deletedRooms,
      remainingRooms: remainingRooms.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cleanup job failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}