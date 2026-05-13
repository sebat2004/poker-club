export type Room = {
  id: string;
  name: string;
  url: string;
  public_url?: string;
  join_url?: string;
  running: boolean;
  paused: boolean;
  is_ready: boolean;
  ready?: boolean;
  display_status?: string;
  status: string;
  created?: string;
  labels?: Record<string, string>;
};

export type RoomsApiResponse = {
  rooms?: Room[];
  max_active_rooms?: number;
  ec2_state?: string;
  server?: {
    state?: string;
    online?: boolean;
    message?: string;
  };
  auth?: {
    isSignedIn?: boolean;
    isPaidMember?: boolean;
    email?: string;
  };
  error?: string;
  details?: unknown;
};

export type CreateRoomOptions = {
  title: string;
  access: "public" | "private";
  invitedEmails: string[];
};

export type AuthErrorState = {
  status: 401 | 403;
  message: string;
} | null;
