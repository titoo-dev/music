import type { User } from "./types";

/** A Deezer account as API clients see it: everything but the license token. */
export type PublicDeezerUser = Omit<User, "license_token">;

/**
 * Strips `license_token` (it lets anyone request media URLs as this
 * account) from a Deezer user before it goes into an API response.
 * Unknown extra keys are kept; nullish stays nullish.
 */
export function toPublicDeezerUser<T extends User | null | undefined>(
	user: T
): T extends User ? PublicDeezerUser : T {
	if (!user || typeof user !== "object") return user as never;
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { license_token, ...rest } = user;
	return rest as never;
}

/** The login / account-switch payload shared by the auth routes. */
export function deezerAccountPayload(dz: {
	currentUser?: User;
	childs?: User[];
	selectedAccount?: number;
}) {
	const childs = (dz.childs ?? []).map((c) => toPublicDeezerUser(c));
	return {
		user: toPublicDeezerUser(dz.currentUser),
		childs,
		currentChild: dz.selectedAccount ?? 0,
		hasMultipleAccounts: childs.length > 1,
	};
}
