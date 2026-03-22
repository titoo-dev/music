import { NextRequest } from "next/server";
import { ok, fail, handleError, requireDeezer } from "../v1/_lib/helpers";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const child = parseInt(searchParams.get("child") || "0", 10);

		const { dz, error } = await requireDeezer(request);
		if (error) return error;

		const [user, selectedAccount] = dz.changeAccount(child);

		return ok({
			user,
			selectedAccount,
			childs: dz.childs,
		});
	} catch (e) {
		return handleError(e);
	}
}
