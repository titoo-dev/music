import { NextRequest } from "next/server";
import { exec } from "child_process";
import { existsSync } from "fs";
import { ok, fail, handleError } from "../../_lib/helpers";

export async function POST(request: NextRequest) {
	try {
		const { path } = await request.json();

		if (!path || typeof path !== "string") {
			return fail("MISSING_PATH", "A folder path is required.", 400);
		}

		if (!existsSync(path)) {
			return fail("PATH_NOT_FOUND", "The specified folder does not exist.", 404);
		}

		const platform = process.platform;
		let command: string;
		if (platform === "win32") {
			command = `explorer "${path}"`;
		} else if (platform === "darwin") {
			command = `open "${path}"`;
		} else {
			command = `xdg-open "${path}"`;
		}

		exec(command);
		return ok({ message: "Folder opened." });
	} catch (e) {
		return handleError(e);
	}
}
