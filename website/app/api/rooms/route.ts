import { NextResponse } from "next/server";

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

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatRoom(room: NekoRoom) {
  return {
    id: room.id,
    name: room.name,
    url: room.url,
    running: room.running ?? false,
    paused: room.paused ?? false,
    isReady: room.is_ready ?? false,
    status: room.status ?? "unknown",
    created: room.created,
    labels: room.labels ?? {},
    userPassword: "memberpass",
    adminPassword: "adminpass",
  };
}

async function fetchRoomById(apiUrl: string, roomId: string) {
  const response = await fetch(`${apiUrl}/api/rooms/${roomId}`, {
    cache: "no-store",
  });

  const rawText = await response.text();
  const data = safeJsonParse(rawText) as NekoRoom | null;

  return {
    ok: response.ok,
    status: response.status,
    rawText,
    data,
  };
}

export async function GET() {
  const nekoRoomsApiUrl = process.env.NEKO_ROOMS_API_URL;

  if (!nekoRoomsApiUrl) {
    return NextResponse.json(
      { error: "Missing NEKO_ROOMS_API_URL" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${nekoRoomsApiUrl}/api/rooms`, {
      cache: "no-store",
    });

    const rawText = await response.text();
    const data = safeJsonParse(rawText);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch rooms",
          details: data ?? rawText,
        },
        { status: response.status }
      );
    }

    const rooms = Array.isArray(data) ? data.map(formatRoom) : [];

    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not connect to Neko Rooms",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const nekoRoomsApiUrl = process.env.NEKO_ROOMS_API_URL;
  const nekoRoomImage = process.env.NEKO_ROOM_IMAGE;

  if (!nekoRoomsApiUrl || !nekoRoomImage) {
    return NextResponse.json(
      { error: "Missing Neko Rooms environment variables" },
      { status: 500 }
    );
  }

  const roomName = `poker-room-${Date.now()}`;

  try {
    const response = await fetch(`${nekoRoomsApiUrl}/api/rooms?start=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        neko_image: nekoRoomImage,
        max_connections: 5,

        user_pass: "memberpass",
        admin_pass: "adminpass",

        control_protection: false,
        implicit_control: true,

        envs: {
          NEKO_SESSION_IMPLICIT_HOSTING: "true",
          NEKO_SESSION_CONTROL_PROTECTION: "false",
          NEKO_SESSION_LOCKED_CONTROLS: "false",
          NEKO_SESSION_INACTIVE_CURSORS: "true",

          // default browser page
          NEKO_FIREFOX_URL: "https://www.gtowizard.com",
        },

        screen: "1280x720@30",
        video_codec: "VP8",
        video_bitrate: 2000,
        video_max_fps: 30,

        audio_codec: "OPUS",
        audio_bitrate: 128,

        labels: {
          club: "poker-club",
          created_by: "local-test-user",
        },

        resources: {
          memory: 2000000000,
          shm_size: 2000000000,
          nano_cpus: 2000000000,
        },
      }),
    });

    const rawText = await response.text();
    const createdRoom = safeJsonParse(rawText) as NekoRoom | null;

    console.log("Neko Rooms create status:", response.status);
    console.log("Neko Rooms create raw response:", rawText);
    console.log("Neko Rooms create parsed response:", createdRoom);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Failed to create Neko room",
          status: response.status,
          details: createdRoom ?? rawText,
        },
        { status: response.status }
      );
    }

    if (!createdRoom?.id || !createdRoom?.url) {
      return NextResponse.json(
        {
          error: "Neko Rooms returned an unexpected response",
          status: response.status,
          details: createdRoom ?? rawText,
        },
        { status: 500 }
      );
    }

    let readyRoom = createdRoom;

    for (let attempt = 1; attempt <= 15; attempt++) {
      await sleep(2000);

      const roomResult = await fetchRoomById(nekoRoomsApiUrl, createdRoom.id);

      if (roomResult.ok && roomResult.data) {
        readyRoom = roomResult.data;

        if (readyRoom.is_ready === true) {
          break;
        }
      }
    }

    return NextResponse.json({
      room: formatRoom({
        ...createdRoom,
        ...readyRoom,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not connect to Neko Rooms",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}