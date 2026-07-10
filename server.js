const express = require("express");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const preguntas = [
    {
        id: 1,
        pregunta: "¿Qué jugador de fútbol le gusta más a Eric?",
        opciones: ["Messi", "Cristiano Ronaldo", "Neymar"],
        respuesta: "Messi",
        letra: "C"
    },
    {
        id: 2,
        pregunta: "¿Qué carrera estudia Andrea?",
        opciones: ["Medicina", "Fisioterapia", "Arquitectura"],
        respuesta: "Fisioterapia",
        letra: "A"
    },
    {
        id: 3,
        pregunta: "¿Cuál es el color favorito de los dos?",
        opciones: ["Azul", "Rojo", "Verde"],
        respuesta: "Azul",
        letra: "N"
    },
    {
        id: 4,
        pregunta: "¿Cuál fue el primer detalle que te regalé?",
        opciones: ["Rosa", "Girasol", "Chocolates"],
        respuesta: "Girasol",
        letra: "E"
    },
    {
        id: 5,
        pregunta: "¿De qué color es la pulsera que me regalaste?",
        opciones: ["Negra", "Blanca", "Roja"],
        respuesta: "Negra",
        letra: "L"
    },
    {
        id: 6,
        pregunta: "¿Cómo se llama el lugar donde vamos a tomar milkshakes?",
        opciones: ["McDonald's", "Papa Pizza", "Sweet & Coffee"],
        respuesta: "Papa Pizza",
        letra: "A"
    }
];

const palabraSecreta = "CANELA";

app.post("/api/jugadores", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        const nombre = req.body.nombre;

        if (!nombre || nombre.trim() === "") {
            return res.status(400).json({
                mensaje: "Debes escribir un nombre"
            });
        }

        const jugadorResultado = await pool.query(
            `INSERT INTO jugadores (nombre)
             VALUES ($1)
             RETURNING id, nombre`,
            [nombre.trim()]
        );

        const jugador = jugadorResultado.rows[0];

        console.log("Jugador creado:", jugador);

        await pool.query(
            `INSERT INTO progresos (
                jugador_id,
                preguntas_correctas,
                palabra_completada
            )
            VALUES ($1, 0, FALSE)`,
            [jugador.id]
        );

        console.log("Progreso creado correctamente");

        return res.status(201).json({
            mensaje: "Jugador registrado correctamente",
            jugador: jugador
        });

    } catch (error) {
        console.error("ERROR COMPLETO AL REGISTRAR:");
        console.error(error);

        return res.status(500).json({
            mensaje: error.message
        });
    }
});

app.get("/api/preguntas/:numero", (req, res) => {
    const numero = Number(req.params.numero);
    const pregunta = preguntas[numero - 1];

    if (!pregunta) {
        return res.status(404).json({ mensaje: "Pregunta no encontrada" });
    }

    res.json({
        id: pregunta.id,
        pregunta: pregunta.pregunta,
        opciones: pregunta.opciones
    });
});

app.post("/api/respuestas", async (req, res) => {
    try {
        const { jugadorId, preguntaId, respuesta } = req.body;

        const pregunta = preguntas.find(
            (item) => item.id === Number(preguntaId)
        );

        if (!pregunta) {
            return res.status(404).json({ mensaje: "Pregunta no encontrada" });
        }

        const correcta =
            respuesta.trim().toLowerCase() === pregunta.respuesta.toLowerCase();

        if (!correcta) {
            return res.json({
                correcta: false,
                mensaje: "Respuesta incorrecta. Inténtalo nuevamente."
            });
        }

        await pool.query(
            `UPDATE progresos
             SET preguntas_correctas = preguntas_correctas + 1,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE jugador_id = $1`,
            [jugadorId]
        );

        res.json({
            correcta: true,
            letra: pregunta.letra,
            mensaje: "¡Respuesta correcta!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "No se pudo comprobar la respuesta" });
    }
});

app.post("/api/palabra", async (req, res) => {
    try {
        const { jugadorId, palabra } = req.body;

        const correcta = palabra.trim().toUpperCase() === palabraSecreta;

        if (!correcta) {
            return res.json({
                correcta: false,
                mensaje: "Esa no es la palabra. Inténtalo otra vez."
            });
        }

        await pool.query(
            `UPDATE progresos
             SET palabra_completada = TRUE,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE jugador_id = $1`,
            [jugadorId]
        );

        res.json({
            correcta: true,
            mensaje: "¡Descubriste la palabra secreta!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "No se pudo comprobar la palabra" });
    }
});

app.get("/api/prueba-db", async (req, res) => {
    try {
        const resultado = await pool.query(
            `INSERT INTO jugadores (nombre)
             VALUES ($1)
             RETURNING id, nombre`,
            ["Eric"]
        );

        res.json({
            correcto: true,
            jugador: resultado.rows[0]
        });
    } catch (error) {
        console.error("ERROR PRUEBA DB:", error);

        res.status(500).json({
            correcto: false,
            mensaje: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Juego abierto en http://localhost:${PORT}`);
});
