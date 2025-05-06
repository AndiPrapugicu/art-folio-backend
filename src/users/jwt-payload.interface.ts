export interface JwtPayload {
  sub: number;
  id: number;
  email: string;
  username: string;
  bio?: string | null;
  profileImage?: string | null;
  website?: string | null;
  phone?: string | null;
  contactMessage?: string | null;
}
