const pool = require('./pool');
// Setup examples
async function getAllMessages() {
	const { rows } = await pool.query('SELECT * FROM messages');
	return rows || null;
}

async function getMessage(id) {
	const { rows } = await pool.query('SELECT * FROM messages WHERE id = ($1)', [id]);
	return rows[0] || null;
}

async function insertMessage(msg) {
	await pool.query('INSERT INTO messages VALUES (DEFAULT, $1, $2, $3)', [...msg]); 
}

module.exports = {
	getAllMessages,
	getMessage,
	insertMessage,
}
