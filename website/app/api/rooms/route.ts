import { NextResponse } from "next/server";
import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
} from "@aws-sdk/client-ec2";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

export const runtime = "nodejs";

const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

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

type FormattedRoom = {
  id: string;
  name: string;
  url: string;
  running: boolean;
  paused: boolean;
  isReady: boolean;
  status: string;
  created?: string;
  labels: Record<string, string>;
  userPassword: string;
  adminPassword: string;
};

export const ec2 = new EC2Client({
  region: AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
});

const DEFAULT_GTO_PROFILE_IDS = [
  "gto-profile-1",
  "gto-profile-2",
  "gto-profile-3",
  "gto-profile-4",
  "gto-profile-5",
];

const GTO_PROFILE_IDS = process.env.GTO_PROFILE_IDS
  ? process.env.GTO_PROFILE_IDS.split(",")
      .map((profileId) => profileId.trim())
      .filter(Boolean)
  : DEFAULT_GTO_PROFILE_IDS;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function formatRoom(room: NekoRoom): FormattedRoom {
  return {
    id: room.id ?? "",
    name: room.name ?? "Unnamed Room",
    url: room.url ?? "",
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

function pickAvailableProfileId(rooms: FormattedRoom[]) {
  const activeGtoRooms = rooms.filter((room) => {
    return (
      room.labels?.club === "poker-club" &&
      room.labels?.purpose === "gto-wizard" &&
      (room.running || room.isReady)
    );
  });

  const usedProfileIds = new Set(
    activeGtoRooms
      .map((room) => room.labels?.profile_id)
      .filter((profileId): profileId is string => Boolean(profileId))
  );

  return GTO_PROFILE_IDS.find((profileId) => !usedProfileIds.has(profileId));
}

async function getInstanceState(instanceId: string) {
  const result = await ec2.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    })
  );

  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name ?? "unknown";
}

async function startInstance(instanceId: string) {
  await ec2.send(
    new StartInstancesCommand({
      InstanceIds: [instanceId],
    })
  );
}

async function waitForInstanceRunning(instanceId: string) {
  for (let attempt = 1; attempt <= 60; attempt++) {
    const state = await getInstanceState(instanceId);

    console.log(`EC2 state check ${attempt}:`, state);

    if (state === "running") {
      return;
    }

    if (state === "terminated" || state === "shutting-down") {
      throw new Error(`EC2 instance is ${state}`);
    }

    await sleep(5000);
  }

  throw new Error("EC2 instance did not become running in time");
}

async function waitForNekoRoomsHealthy(apiUrl: string) {
  for (let attempt = 1; attempt <= 60; attempt++) {
    try {
      console.log(`Neko health check ${attempt}: ${apiUrl}/api/rooms`);

      const response = await fetch(`${apiUrl}/api/rooms`, {
        cache: "no-store",
      });

      if (response.ok) {
        return;
      }
    } catch {
      // EC2/Neko Rooms is probably still booting
    }

    await sleep(3000);
  }

  throw new Error("Neko Rooms did not become reachable in time");
}

async function fetchRoomsFromNeko(nekoRoomsApiUrl: string) {
  const response = await fetch(`${nekoRoomsApiUrl}/api/rooms`, {
    cache: "no-store",
  });

  const rawText = await response.text();
  const data = safeJsonParse(rawText);

  if (!response.ok) {
    throw new Error(
      `Neko Rooms returned ${response.status}: ${rawText || "No response body"}`
    );
  }

  return Array.isArray(data) ? data.map(formatRoom) : [];
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

async function ensureNekoInfrastructureReady() {
  const instanceId = process.env.NEKO_INSTANCE_ID;
  const nekoRoomsApiUrl =
    process.env.NEKO_ROOMS_PUBLIC_URL ?? process.env.NEKO_ROOMS_API_URL;

  if (!nekoRoomsApiUrl) {
    throw new Error("Missing NEKO_ROOMS_PUBLIC_URL or NEKO_ROOMS_API_URL");
  }

  // Local mode: no EC2 instance configured
  if (!instanceId) {
    await waitForNekoRoomsHealthy(nekoRoomsApiUrl);
    return nekoRoomsApiUrl;
  }

  const state = await getInstanceState(instanceId);

  console.log("Current EC2 state:", state);

  if (state === "stopped") {
    console.log("Starting EC2 instance:", instanceId);
    await startInstance(instanceId);
    await waitForInstanceRunning(instanceId);
  } else if (state === "pending" || state === "stopping") {
    await waitForInstanceRunning(instanceId);
  } else if (state !== "running") {
    throw new Error(`EC2 instance is in unsupported state: ${state}`);
  }

  await waitForNekoRoomsHealthy(nekoRoomsApiUrl);

  return nekoRoomsApiUrl;
}

export async function GET() {
  const instanceId = process.env.NEKO_INSTANCE_ID;
  const nekoRoomsApiUrl =
    process.env.NEKO_ROOMS_PUBLIC_URL ?? process.env.NEKO_ROOMS_API_URL;

  if (!nekoRoomsApiUrl) {
    return NextResponse.json(
      { error: "Missing NEKO_ROOMS_PUBLIC_URL or NEKO_ROOMS_API_URL" },
      { status: 500 }
    );
  }

  try {
    // EC2 mode: check EC2 first.
    // If server is offline, do not query Neko Rooms.
    if (instanceId) {
      const state = await getInstanceState(instanceId);

      if (state === "stopped") {
        return NextResponse.json({
          rooms: [],
          server: {
            state,
            online: false,
            message: "Server is asleep. Create a room to wake it up.",
          },
        });
      }

      if (state === "stopping") {
        return NextResponse.json({
          rooms: [],
          server: {
            state,
            online: false,
            message: "Server is shutting down.",
          },
        });
      }

      if (state === "pending") {
        return NextResponse.json({
          rooms: [],
          server: {
            state,
            online: false,
            message: "Server is starting.",
          },
        });
      }

      if (state !== "running") {
        return NextResponse.json({
          rooms: [],
          server: {
            state,
            online: false,
            message: `Server is not ready. Current EC2 state: ${state}`,
          },
        });
      }
    }

    const rooms = await fetchRoomsFromNeko(nekoRoomsApiUrl);

    return NextResponse.json({
      rooms,
      server: {
        state: instanceId ? "running" : "local",
        online: true,
        message: "Server is online.",
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        rooms: [],
        server: {
          online: false,
          message: `Could not load server status: ${details}`,
        },
        error: "Could not load rooms",
        details,
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const nekoRoomImage = process.env.NEKO_ROOM_IMAGE;

  if (!nekoRoomImage) {
    return NextResponse.json(
      { error: "Missing NEKO_ROOM_IMAGE" },
      { status: 500 }
    );
  }

  const roomName = `poker-room-${Date.now()}`;

  try {
    // Starts EC2 if stopped, then waits for Neko Rooms.
    const nekoRoomsApiUrl = await ensureNekoInfrastructureReady();

    const existingRooms = await fetchRoomsFromNeko(nekoRoomsApiUrl);
    const profileId = pickAvailableProfileId(existingRooms);

    if (!profileId) {
      return NextResponse.json(
        {
          error: "All GTO Wizard profiles are currently in use",
          details: `Active rooms are already using all available profiles: ${GTO_PROFILE_IDS.join(
            ", "
          )}`,
        },
        { status: 409 }
      );
    }

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

        screen: "1024x576@20",
        video_codec: "VP8",
        video_bitrate: 650,
        video_max_fps: 20,

        audio_codec: "OPUS",
        audio_bitrate: 48,

        mounts: [
					{
						type: "public",
						host_path: `/opt/neko-rooms/data/public/profile-clones/${profileId}`,
						container_path: "/home/neko/.mozilla/firefox/profile.default",
					},
					{
						type: "template",
						host_path: "/firefox-policy/policies.json",
						container_path: "/usr/lib/firefox/distribution/policies.json",
					},
					{
						type: "template",
						host_path: "/firefox.conf",
						container_path: "/etc/neko/supervisord/firefox.conf",
					},
				],

        resources: {
          memory: 3000000000,
          shm_size: 2000000000,
          nano_cpus: 3000000000,
        },

        envs: {
          NEKO_SESSION_IMPLICIT_HOSTING: "true",
          NEKO_SESSION_CONTROL_PROTECTION: "false",
          NEKO_SESSION_LOCKED_CONTROLS: "false",
          NEKO_SESSION_INACTIVE_CURSORS: "true",
        },

        labels: {
          club: "poker-club",
          purpose: "gto-wizard",
          profile_id: profileId,
          created_by: "website",
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
      profileId,
      server: {
        state: "running",
        online: true,
        message: `Room created using profile ${profileId}.`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not create Neko room",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}