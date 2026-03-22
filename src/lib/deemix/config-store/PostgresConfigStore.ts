import pg from "pg";
import type { ConfigStore } from "./ConfigStore";

export class PostgresConfigStore implements ConfigStore {
	private pool: pg.Pool;

	constructor(connectionString: string) {
		this.pool = new pg.Pool({ connectionString });
	}

	async init() {
		await this.pool.query(`
			CREATE TABLE IF NOT EXISTS config (
				user_id TEXT NOT NULL DEFAULT 'default',
				key TEXT NOT NULL,
				value JSONB NOT NULL,
				updated_at TIMESTAMPTZ DEFAULT NOW(),
				PRIMARY KEY (user_id, key)
			)
		`);
	}

	async get<T = any>(key: string, userId = "default"): Promise<T | null> {
		const result = await this.pool.query(
			"SELECT value FROM config WHERE user_id = $1 AND key = $2",
			[userId, key]
		);
		return result.rows[0]?.value ?? null;
	}

	async set(key: string, value: any, userId = "default"): Promise<void> {
		await this.pool.query(
			`INSERT INTO config (user_id, key, value, updated_at)
			 VALUES ($1, $2, $3::jsonb, NOW())
			 ON CONFLICT (user_id, key) DO UPDATE SET value = $3::jsonb, updated_at = NOW()`,
			[userId, key, JSON.stringify(value)]
		);
	}
}
