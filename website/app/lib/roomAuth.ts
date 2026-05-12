import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { isAllowedMember } from "@/app/lib/membership";

export type RoomAccess =
  | {
      ok: true;
      email: string;
      name: string;
      isPaidMember: true;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
      isSignedIn: boolean;
      isPaidMember: false;
      email?: string;
    };

export async function requireRoomAccess(): Promise<RoomAccess> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const email = session?.user?.email;

  if (!email) {
    return {
      ok: false,
      status: 401,
      error: "Sign in with Google to access rooms.",
      isSignedIn: false,
      isPaidMember: false,
    };
  }

  if (!isAllowedMember(email)) {
    return {
      ok: false,
      status: 403,
      error: "This Google account is not marked as paid for this week.",
      isSignedIn: true,
      isPaidMember: false,
      email,
    };
  }

  return {
    ok: true,
    email,
    name: session.user.name || email,
    isPaidMember: true,
  };
}