CREATE TABLE jugadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE progresos (
    id SERIAL PRIMARY KEY,
    jugador_id INTEGER NOT NULL,
    preguntas_correctas INTEGER DEFAULT 0,
    palabra_completada BOOLEAN DEFAULT FALSE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_jugador
        FOREIGN KEY (jugador_id)
        REFERENCES jugadores(id)
        ON DELETE CASCADE
);
