import pg from "pg";

async function main() {
	const pool = new pg.Pool({
		connectionString: "postgresql://deemix:deemix@51.210.8.107:5432/deemix",
	});

	const history = await pool.query("SELECT * FROM download_history");
	console.log("Download History:", JSON.stringify(history.rows, null, 2));

	await pool.end();
}

main();
