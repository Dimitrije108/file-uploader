require('dotenv').config();
const { Client } = require('pg');
// Setup example
const SQL = `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
		text TEXT,
		username VARCHAR ( 255 ),
		added TIMESTAMP
	);

	INSERT INTO messages
	VALUES
		(DEFAULT, 'Hello There!', 'General Kenobi', CURRENT_TIMESTAMP),
		(DEFAULT, 'General Kenobi . . .', 'General Grievous', CURRENT_TIMESTAMP);
`;

async function main() {
	console.log('seeding...');
	const client = new Client({
		connectionString: process.env.DB_URL
	});
	await client.connect();
	await client.query(SQL);
	await client.end();
	console.log('done');
}

main();
