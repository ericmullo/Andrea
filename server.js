const express = require("express");
const path = require("path");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


/* =========================
   PREGUNTAS DEL JUEGO
========================= */

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


/* =========================
   REGISTRAR O RECUPERAR JUGADOR
========================= */

app.post("/api/jugadores", async (req, res) => {
    try {
        const nombre = req.body.nombre?.trim();

        if (!nombre) {
            return res.status(400).json({
                mensaje: "Debes escribir un nombre"
            });
        }

        /*
            Busca primero si el jugador ya existe.
            Así, si vuelve a entrar con el mismo nombre,
            recupera el mismo libro.
        */

        const jugadorExistente = await pool.query(
            `SELECT id, nombre
             FROM jugadores
             WHERE LOWER(nombre) = LOWER($1)
             ORDER BY id ASC
             LIMIT 1`,
            [nombre]
        );

        if (jugadorExistente.rows.length > 0) {
            const jugador = jugadorExistente.rows[0];

            return res.json({
                mensaje: "Jugador encontrado",
                jugador
            });
        }

        /*
            Si no existe, lo crea.
        */

        const jugadorResultado = await pool.query(
            `INSERT INTO jugadores (nombre)
             VALUES ($1)
             RETURNING id, nombre`,
            [nombre]
        );

        const jugador = jugadorResultado.rows[0];

        await pool.query(
            `INSERT INTO progresos (
                jugador_id,
                preguntas_correctas,
                palabra_completada
            )
            VALUES ($1, 0, FALSE)`,
            [jugador.id]
        );

        return res.status(201).json({
            mensaje: "Jugador registrado correctamente",
            jugador
        });

    } catch (error) {
        console.error("ERROR AL REGISTRAR JUGADOR:");
        console.error(error);

        return res.status(500).json({
            mensaje: error.message
        });
    }
});


/* =========================
   OBTENER PREGUNTA
========================= */

app.get("/api/preguntas/:numero", (req, res) => {
    const numero = Number(req.params.numero);
    const pregunta = preguntas[numero - 1];

    if (!pregunta) {
        return res.status(404).json({
            mensaje: "Pregunta no encontrada"
        });
    }

    res.json({
        id: pregunta.id,
        pregunta: pregunta.pregunta,
        opciones: pregunta.opciones
    });
});


/* =========================
   COMPROBAR RESPUESTA
========================= */

app.post("/api/respuestas", async (req, res) => {
    try {
        const {
            jugadorId,
            preguntaId,
            respuesta
        } = req.body;

        if (!jugadorId || !preguntaId || !respuesta) {
            return res.status(400).json({
                mensaje: "Faltan datos"
            });
        }

        const pregunta = preguntas.find(
            (item) => item.id === Number(preguntaId)
        );

        if (!pregunta) {
            return res.status(404).json({
                mensaje: "Pregunta no encontrada"
            });
        }

        const correcta =
            respuesta.trim().toLowerCase() ===
            pregunta.respuesta.toLowerCase();

        if (!correcta) {
            return res.json({
                correcta: false,
                mensaje: "Respuesta incorrecta. Inténtalo nuevamente."
            });
        }

        await pool.query(
            `UPDATE progresos
             SET preguntas_correctas =
                 CASE
                     WHEN preguntas_correctas < 6
                     THEN preguntas_correctas + 1
                     ELSE preguntas_correctas
                 END,
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
        console.error("ERROR AL COMPROBAR RESPUESTA:");
        console.error(error);

        res.status(500).json({
            mensaje: "No se pudo comprobar la respuesta"
        });
    }
});


/* =========================
   COMPROBAR PALABRA
========================= */

app.post("/api/palabra", async (req, res) => {
    try {
        const {
            jugadorId,
            palabra
        } = req.body;

        if (!jugadorId || !palabra) {
            return res.status(400).json({
                mensaje: "Faltan datos"
            });
        }

        const correcta =
            palabra.trim().toUpperCase() === palabraSecreta;

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
        console.error("ERROR AL COMPROBAR PALABRA:");
        console.error(error);

        res.status(500).json({
            mensaje: "No se pudo comprobar la palabra"
        });
    }
});


/* =========================
   OBTENER PÁGINAS DEL LIBRO
========================= */

app.get("/api/libro/:jugadorId", async (req, res) => {
    try {
        const jugadorId = Number(req.params.jugadorId);

        if (!jugadorId) {
            return res.status(400).json({
                mensaje: "Jugador no válido"
            });
        }

        const resultado = await pool.query(
            `SELECT numero_pagina, contenido
             FROM paginas_libro
             WHERE jugador_id = $1
             ORDER BY numero_pagina`,
            [jugadorId]
        );

        res.json({
            paginas: resultado.rows
        });

    } catch (error) {
        console.error("ERROR AL CARGAR EL LIBRO:");
        console.error(error);

        res.status(500).json({
            mensaje: "No se pudo cargar el libro"
        });
    }
});


/* =========================
   GUARDAR UNA PÁGINA DEL LIBRO
========================= */

app.post("/api/libro", async (req, res) => {
    try {
        const {
            jugadorId,
            numeroPagina,
            contenido
        } = req.body;

        if (!jugadorId) {
            return res.status(400).json({
                mensaje: "Jugador no válido"
            });
        }

        if (
            !numeroPagina ||
            numeroPagina < 1 ||
            numeroPagina > 30
        ) {
            return res.status(400).json({
                mensaje: "Número de página no válido"
            });
        }

        await pool.query(
            `INSERT INTO paginas_libro (
                jugador_id,
                numero_pagina,
                contenido
            )
            VALUES ($1, $2, $3)

            ON CONFLICT (jugador_id, numero_pagina)

            DO UPDATE SET
                contenido = EXCLUDED.contenido,
                fecha_actualizacion = CURRENT_TIMESTAMP`,
            [
                jugadorId,
                numeroPagina,
                contenido || ""
            ]
        );

        res.json({
            correcto: true,
            mensaje: "Página guardada correctamente"
        });

    } catch (error) {
        console.error("ERROR AL GUARDAR LA PÁGINA:");
        console.error(error);

        res.status(500).json({
            mensaje: "No se pudo guardar la página"
        });
    }
});


/* =========================
   PROBAR CONEXIÓN
========================= */

app.get("/api/prueba-db", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT NOW() AS fecha"
        );

        res.json({
            correcto: true,
            fecha: resultado.rows[0].fecha
        });

    } catch (error) {
        console.error("ERROR PRUEBA DB:");
        console.error(error);

        res.status(500).json({
            correcto: false,
            mensaje: error.message
        });
    }
});


/* =========================
   INICIAR SERVIDOR
========================= */

app.listen(PORT, () => {
    console.log(`Juego abierto en http://localhost:${PORT}`);
});