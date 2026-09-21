export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  currencyPref: string;
  themePref: string;
}

export type RoomRole = "ADMIN" | "ROOMMATE";

export interface RoomSummary {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  currency: string;
  memberCount: number;
  role: RoomRole;
  joinedAt: string;
}
