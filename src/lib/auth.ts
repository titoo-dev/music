import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	// Errors raised before the OAuth state is read (state mismatch, expired flow) land on the sign-in
	// page with `?error=` rather than Better Auth's bare error page, outside the app.
	onAPIError: { errorURL: "/login" },
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24, // refresh every 24h
		// Sign the session into a short-lived cookie so getSession() can
		// skip the DB roundtrip on every API call. Critical for hot paths
		// like /library/status which fire dozens of times per page render.
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},
	// Native clients (Flutter) authenticate with `Authorization: Bearer <token>`
	// instead of cookies. The token comes from the `set-auth-token` response
	// header on sign-in; the plugin turns it back into a session cookie so every
	// `auth.api.getSession({ headers })` call in the API routes keeps working.
	plugins: [bearer()],
});

export type Session = typeof auth.$Infer.Session;
