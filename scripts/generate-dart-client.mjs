// Regenerates the Dart (dio + built_value) client in clients/dart from
// openapi.json, via the pinned OpenAPI Generator Docker image (no Java needed).
// Run: npm run openapi:dart  (requires Docker + the Dart SDK).

import { execFileSync, execSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";

const IMAGE = "openapitools/openapi-generator-cli:v7.25.0";
const OUT = "clients/dart";

// Clear the previous output but keep the folder itself (Windows refuses to
// delete a directory some process uses as cwd) and .dart_tool (build cache).
mkdirSync(OUT, { recursive: true });
for (const entry of readdirSync(OUT)) {
	if (entry !== ".dart_tool") rmSync(`${OUT}/${entry}`, { recursive: true, force: true });
}

execFileSync(
	"docker",
	[
		"run", "--rm",
		"-v", `${process.cwd()}:/local`,
		IMAGE, "generate",
		"-i", "/local/openapi.json",
		"-g", "dart-dio",
		"-o", `/local/${OUT}`,
		"--additional-properties",
		[
			"pubName=wavelet_api",
			"pubVersion=1.0.0",
			"pubDescription=Generated Dart client for the Wavelet API",
			"serializationLibrary=built_value",
			"dateLibrary=core",
		].join(","),
	],
	{ stdio: "inherit" }
);

// Smoke test: (de)serialization of real payload shapes + bearer header wiring.
copyFileSync("scripts/dart-client.smoke_test.dart", `${OUT}/test/smoke_test.dart`);

// built_value serializers are code-generated: resolve deps and run build_runner,
// then fail on analyzer errors (generator warnings are tolerated) and run the smoke test.
const run = (cmd) => execSync(cmd, { stdio: "inherit", cwd: OUT });
run("dart pub get");
run("dart run build_runner build");
run("dart analyze --no-fatal-warnings lib");
run("dart test test/smoke_test.dart");
