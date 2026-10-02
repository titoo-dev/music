// pg treats sslmode=prefer/require/verify-ca as verify-full today and logs a
// SECURITY WARNING on every new Pool (Neon's injected DATABASE_URL uses
// sslmode=require). Pinning the mode we already get keeps the behavior and
// silences the warning; libpq-compat opt-ins are left alone.
export function withExplicitSslMode(connectionString: string): string {
	if (/[?&]uselibpqcompat=true(?:&|$)/i.test(connectionString)) return connectionString;
	return connectionString.replace(
		/([?&]sslmode=)(?:prefer|require|verify-ca)(?=&|$)/i,
		"$1verify-full"
	);
}
