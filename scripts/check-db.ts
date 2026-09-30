import pg from "pg";

async function main() {
	const pool = new pg.Pool({
		connectionString: process.env.DATABASE_URL,
	});

	const history = await pool.query("SELECT * FROM download_history");
	console.log("Download History:", JSON.stringify(history.rows, null, 2));

	await pool.end();
}

main();
