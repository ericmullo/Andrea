const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
});

pool.connect()
    .then((cliente) => {
        console.log("✅ Conectado correctamente a PostgreSQL");
        cliente.release();
    })
    .catch((error) => {
        console.error("❌ Error de conexión:");
        console.error(error.message);
    });

module.exports = pool;