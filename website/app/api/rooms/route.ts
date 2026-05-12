import {
  DescribeInstancesCommand,
  EC2Client,
  StartInstancesCommand,
} from "@aws-sdk/client-ec2";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { requireRoomAccess } from "@/app/lib/roomAuth";

export const runtime = "nodejs";

type CreateRoomMode = "balanced" | "good-720p";
type RoomAccess = "public" | "private";

type CreateRoomBody = {
  mode?: CreateRoomMode;
  access?: RoomAccess;
};

const AWS_REGION = process.env.AWS_REGION || "us-west-2";
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN;
const NEKO_INSTANCE_ID = process.env.NEKO_INSTANCE_ID;
const NEKO_ROOMS_PUBLIC_URL = process.env.NEKO_ROOMS_PUBLIC_URL;
const MAX_ACTIVE_ROOMS = Number(process.env.MAX_ACTIVE_ROOMS || 2);

const NEKO_ROOM_IMAGE =
  process.env.NEKO_ROOM_IMAGE?.trim() ||
  "sebat2004/neko-firefox-xprintidle:latest";

const GTO_PROFILE_IDS = (
  process.env.GTO_PROFILE_IDS ||
  "gto-profile-1,gto-profile-2,gto-profile-3,gto-profile-4,gto-profile-5"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function createEc2Client() {
  const isVercel = Boolean(process.env.VERCEL);

  return new EC2Client({
    region: AWS_REGION,
    ...(isVercel && AWS_ROLE_ARN
      ? {
          credentials: awsCredentialsProvider({
            roleArn: AWS_ROLE_ARN,
          }),
        }
      : {}),
  });
}

const ec2 = createEc2Client();

function requireEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBaseUrl() {
  return requireEnv(NEKO_ROOMS_PUBLIC_URL, "NEKO_ROOMS_PUBLIC_URL").replace(
    /\/$/,
    "",
  );
}

function buildPublicRoomUrl(roomName: string) {
  return `${getBaseUrl()}/room/${roomName}/`;
}

function normalizeNekoRoomUrl(rawUrl: string | undefined, roomName: string) {
  const baseUrl = getBaseUrl();

  if (!rawUrl) {
    return buildPublicRoomUrl(roomName);
  }

  try {
    const parsedRaw = new URL(rawUrl);
    const parsedBase = new URL(baseUrl);

    parsedRaw.protocol = parsedBase.protocol;
    parsedRaw.host = parsedBase.host;

    return parsedRaw.toString();
  } catch {
    return buildPublicRoomUrl(roomName);
  }
}

function getRoomName(room: any) {
  return (
    room?.name ||
    room?.id ||
    room?.slug ||
    room?.path?.replace(/^\/room\//, "").replace(/^\/+/, "").replace(/\/+$/, "")
  );
}

function isRoomReady(room: any) {
  return room?.is_ready === true;
}

function buildJoinUrl(roomUrl: string) {
  const userPass = process.env.NEKO_ROOM_USER_PASS || "neko";
  const url = new URL(roomUrl);

  url.searchParams.set("usr", "viewer");
  url.searchParams.set("pwd", userPass);
  url.searchParams.set("cast", "1");

  return url.toString();
}

function normalizeRoom(room: any) {
  const name = getRoomName(room);
  const ready = isRoomReady(room);

  const publicUrl = name
    ? normalizeNekoRoomUrl(room?.url || room?.public_url, name)
    : room?.url || room?.public_url;

  return {
    ...room,
    name,
    is_ready: ready,
    ready,
    running: room?.running === true,
    display_status: ready ? "Ready" : "Starting",
    url: publicUrl,
    public_url: publicUrl,
    join_url: publicUrl ? buildJoinUrl(publicUrl) : undefined,
  };
}

function getRoomPreset(mode: CreateRoomMode) {
  if (mode === "balanced") {
    return {
      screen: "1152x648@24",
      video_codec: "VP8",
      video_bitrate: 900,
      video_max_fps: 24,
      audio_codec: "OPUS",
      audio_bitrate: 64,
      resources: {
        memory: 3000000000,
        shm_size: 1500000000,
        nano_cpus: 2500000000,
      },
    };
  }

  return {
    screen: "1280x720@30",
    video_codec: "VP8",
    video_bitrate: 1500,
    video_max_fps: 30,
    audio_codec: "OPUS",
    audio_bitrate: 64,
    resources: {
      memory: 3000000000,
      shm_size: 1500000000,
      nano_cpus: 4000000000,
    },
  };
}

function getNekoRequestHeaders(extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);

  const username = process.env.NEKO_PROXY_BASIC_AUTH_USER;
  const password = process.env.NEKO_PROXY_BASIC_AUTH_PASS;

  if (username && password) {
    const token = Buffer.from(`${username}:${password}`).toString("base64");
    headers.set("Authorization", `Basic ${token}`);
  }

  return headers;
}

function parseCreateRoomBody(body: unknown): Required<CreateRoomBody> {
  const maybeBody = body && typeof body === "object" ? (body as CreateRoomBody) : {};

  const mode: CreateRoomMode =
    maybeBody.mode === "balanced" || maybeBody.mode === "good-720p"
      ? maybeBody.mode
      : "good-720p";

  const access: RoomAccess =
    maybeBody.access === "private" || maybeBody.access === "public"
      ? maybeBody.access
      : "public";

  return { mode, access };
}

function isActiveRoom(room: any) {
  return room?.running === true || room?.is_ready === true;
}

function getRoomProfileId(room: any) {
  return (
    room?.labels?.profile_id ||
    room?.labels?.profileId ||
    room?.metadata?.profile_id ||
    room?.metadata?.profileId ||
    null
  );
}

function pickUnusedProfileId(rooms: any[]) {
  const usedProfileIds = new Set(
    rooms.map((room) => getRoomProfileId(room)).filter(Boolean),
  );

  return GTO_PROFILE_IDS.find((profileId) => !usedProfileIds.has(profileId));
}

async function getInstanceState() {
  const instanceId = requireEnv(NEKO_INSTANCE_ID, "NEKO_INSTANCE_ID");

  const result = await ec2.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    }),
  );

  return result.Reservations?.[0]?.Instances?.[0]?.State?.Name || "unknown";
}

async function waitForInstanceState(
  desiredStates: string[],
  timeoutMs = 5 * 60 * 1000,
  intervalMs = 5000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const state = await getInstanceState();

    if (desiredStates.includes(state)) {
      return state;
    }

    await sleep(intervalMs);
  }

  throw new Error(
    `EC2 instance did not reach one of these states in time: ${desiredStates.join(
      ", ",
    )}`,
  );
}

async function startInstanceIfNeeded() {
  const instanceId = requireEnv(NEKO_INSTANCE_ID, "NEKO_INSTANCE_ID");
  let state = await getInstanceState();

  if (state === "running") {
    return;
  }

  if (state === "pending") {
    await waitForInstanceState(["running"]);
    return;
  }

  if (state === "stopping") {
    console.log(
      "EC2 is stopping. Waiting for it to fully stop before starting...",
    );
    state = await waitForInstanceState(["stopped"], 5 * 60 * 1000, 5000);
  }

  if (state === "stopped") {
    await ec2.send(
      new StartInstancesCommand({
        InstanceIds: [instanceId],
      }),
    );

    await waitForInstanceState(["running"], 5 * 60 * 1000, 5000);
    return;
  }

  throw new Error(`EC2 instance is in unsupported state: ${state}`);
}

async function waitForNekoRoomsHealthy() {
  const baseUrl = getBaseUrl();

  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`${baseUrl}/api/rooms`, {
				cache: "no-store",
				headers: getNekoRequestHeaders(),
			});

      if (response.ok) {
        return;
      }
    } catch {
      // Neko Rooms may still be starting. Keep retrying.
    }

    await sleep(3000);
  }

  throw new Error("Neko Rooms did not become healthy in time");
}

async function listRooms() {
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/api/rooms`, {
		cache: "no-store",
		headers: getNekoRequestHeaders(),
	});

  if (!response.ok) {
    throw new Error(`Could not list Neko rooms: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.rooms)) {
    return data.rooms;
  }

  return [];
}

async function waitForRoomReady(roomName: string) {
  for (let i = 0; i < 40; i++) {
    try {
      const rooms = await listRooms();
      const matchingRoom = rooms.find(
        (room: any) => getRoomName(room) === roomName,
      );

      if (matchingRoom && isRoomReady(matchingRoom)) {
        return normalizeRoom(matchingRoom);
      }
    } catch {
      // Keep retrying.
    }

    await sleep(1500);
  }

  throw new Error(`Room ${roomName} was created but did not become ready`);
}

async function createNekoRoom({
  profileId,
  mode,
  access,
  createdByEmail,
}: {
  profileId: string;
  mode: CreateRoomMode;
  access: RoomAccess;
  createdByEmail: string;
}) {
  const baseUrl = getBaseUrl();
  const roomName = `poker-room-${Date.now()}`;
  const userPass = process.env.NEKO_ROOM_USER_PASS || "neko";
  const adminPass = process.env.NEKO_ROOM_ADMIN_PASS || "admin";
  const preset = getRoomPreset(mode);

  const payload = {
    name: roomName,

    // Neko Rooms expects `neko_image`, not `image`.
    neko_image: NEKO_ROOM_IMAGE,

    user_pass: userPass,
    admin_pass: adminPass,

    labels: {
      club: "poker-club",
      purpose: "gto-wizard",
      profile_id: profileId,
      created_by: "website",
      created_by_email: createdByEmail,
      access,
      mode,
    },

    control_protection: false,
    implicit_control: true,

    screen: preset.screen,
    video_codec: preset.video_codec,
    video_bitrate: preset.video_bitrate,
    video_max_fps: preset.video_max_fps,

    audio_codec: preset.audio_codec,
    audio_bitrate: preset.audio_bitrate,

    envs: {
      NEKO_SESSION_IMPLICIT_HOSTING: "true",
      NEKO_SESSION_CONTROL_PROTECTION: "false",
      NEKO_SESSION_LOCKED_CONTROLS: "false",
      NEKO_SESSION_INACTIVE_CURSORS: "true",
    },

    resources: preset.resources,

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
  };

  if (!payload.neko_image) {
    throw new Error("NEKO_ROOM_IMAGE is missing before creating room");
  }

  console.log("Creating Neko room:", {
    roomName,
    profileId,
    neko_image: payload.neko_image,
    mode,
    access,
    createdByEmail,
  });

  const response = await fetch(`${baseUrl}/api/rooms`, {
		method: "POST",
		headers: getNekoRequestHeaders({
			"Content-Type": "application/json",
		}),
		body: JSON.stringify(payload),
	});

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Could not create Neko room: ${responseText || response.statusText}`,
    );
  }

  const readyRoom = await waitForRoomReady(roomName);
  const publicUrl = normalizeNekoRoomUrl(readyRoom.url, roomName);

  return {
    ...readyRoom,
    name: roomName,
    profile_id: profileId,
    url: publicUrl,
    public_url: publicUrl,
    join_url: buildJoinUrl(publicUrl),
    is_ready: true,
    ready: true,
    running: readyRoom.running === true,
    display_status: "Ready",
    labels: {
      ...(readyRoom.labels || {}),
      club: "poker-club",
      purpose: "gto-wizard",
      profile_id: profileId,
      created_by: "website",
      created_by_email: createdByEmail,
      access,
      mode,
    },
  };
}

function authErrorResponse(access: Awaited<ReturnType<typeof requireRoomAccess>>) {
  if (access.ok) {
    throw new Error("authErrorResponse called with successful access");
  }

  return Response.json(
    {
      error: access.error,
      auth: {
        isSignedIn: access.isSignedIn,
        isPaidMember: access.isPaidMember,
        email: access.email,
      },
    },
    { status: access.status },
  );
}

export async function GET() {
  const access = await requireRoomAccess();

  if (!access.ok) {
    return authErrorResponse(access);
  }

  try {
    const state = await getInstanceState();

    if (state !== "running") {
      return Response.json({
        ec2_state: state,
        server: {
          state,
          online: false,
          message:
            state === "stopped"
              ? "Server is asleep. Create a room to wake it up."
              : state === "pending"
                ? "Server is starting..."
                : state === "stopping"
                  ? "Server is shutting down."
                  : "Server is offline.",
        },
        rooms: [],
      });
    }

    try {
      const rooms = await listRooms();

			const normalizedRooms = rooms.map(normalizeRoom);

			const visibleRooms = normalizedRooms.filter((room: any) => {
				if (room.labels?.access !== "private") return true;
				return room.labels?.created_by_email === access.email;
			});

			return Response.json({
				ec2_state: state,
				server: {
					state,
					online: true,
					message: "Server is online.",
				},
				rooms: visibleRooms,
			});
    } catch (nekoError) {
      console.warn("EC2 is running but Neko Rooms is not ready yet:", nekoError);

      return Response.json({
        ec2_state: state,
        server: {
          state: "pending",
          online: false,
          message: "Server is starting. Neko Rooms is still booting...",
        },
        rooms: [],
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  const access = await requireRoomAccess();

  if (!access.ok) {
    return authErrorResponse(access);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { mode, access: roomAccess } = parseCreateRoomBody(body);

    await startInstanceIfNeeded();
    await waitForNekoRoomsHealthy();

    const rooms = await listRooms();
    const activeRooms = rooms.filter(isActiveRoom);

    if (activeRooms.length >= MAX_ACTIVE_ROOMS) {
      return Response.json(
        {
          error: `Room limit reached. Max active rooms: ${MAX_ACTIVE_ROOMS}.`,
        },
        { status: 409 },
      );
    }

    const profileId = pickUnusedProfileId(rooms);

    if (!profileId) {
      return Response.json(
        {
          error: "All GTO Wizard profile clones are currently in use.",
        },
        {
          status: 409,
        },
      );
    }

    const room = await createNekoRoom({
      profileId,
      mode,
      access: roomAccess,
      createdByEmail: access.email,
    });

    return Response.json(room);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return Response.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}