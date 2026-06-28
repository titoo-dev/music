// Auth servie par le composant @convex-dev/better-auth (HTTP actions Convex).
// Postgres/prismaAdapter supprimés (Phase 6).
import { handler } from "@/lib/auth-server";

export const { GET, POST } = handler;
