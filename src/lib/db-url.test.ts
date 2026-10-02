import { describe, it, expect } from "vitest";
import { withExplicitSslMode } from "./db-url";

describe("withExplicitSslMode", () => {
	it.each(["prefer", "require", "verify-ca"])(
		"pins sslmode=%s to verify-full (was: pg 'SECURITY WARNING: The SSL modes ... are treated as aliases for verify-full' on every cold start)",
		(mode) => {
			expect(withExplicitSslMode(`postgresql://u:p@host/db?sslmode=${mode}`)).toBe(
				"postgresql://u:p@host/db?sslmode=verify-full"
			);
		}
	);

	it("keeps the other query params in place", () => {
		expect(
			withExplicitSslMode("postgresql://u:p@host/db?channel_binding=require&sslmode=require&x=1")
		).toBe("postgresql://u:p@host/db?channel_binding=require&sslmode=verify-full&x=1");
	});

	it("leaves libpq-compat opt-ins alone", () => {
		const url = "postgresql://u:p@host/db?uselibpqcompat=true&sslmode=require";
		expect(withExplicitSslMode(url)).toBe(url);
	});

	it.each([
		"postgresql://u:p@localhost/db",
		"postgresql://u:p@host/db?sslmode=disable",
		"postgresql://u:p@host/db?sslmode=verify-full",
	])("leaves %s untouched", (url) => {
		expect(withExplicitSslMode(url)).toBe(url);
	});
});
