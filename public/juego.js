let jugadorId = null;
let nombreJugador = "";
let preguntaActual = 1;
let respuestasCorrectas = 0;

const totalPreguntas = 6;
const totalPaginasLibro = 30;


/* =========================
   ELEMENTOS DEL JUEGO
========================= */

const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaPreguntas = document.getElementById("pantallaPreguntas");
const pantallaVictoria = document.getElementById("pantallaVictoria");

const entradaNombre = document.getElementById("nombreJugador");
const botonIngresar = document.getElementById("botonIngresar");
const mensajeInicio = document.getElementById("mensajeInicio");

const saludoJugador = document.getElementById("saludoJugador");
const numeroPregunta = document.getElementById("numeroPregunta");
const barraProgreso = document.getElementById("barraProgreso");
const textoPregunta = document.getElementById("textoPregunta");
const contenedorOpciones = document.getElementById("contenedorOpciones");
const mensajePregunta = document.getElementById("mensajePregunta");
const letras = document.querySelectorAll(".letra");

const zonaPalabra = document.getElementById("zonaPalabra");
const entradaPalabra = document.getElementById("palabraJugador");
const botonComprobar = document.getElementById("botonComprobar");
const mensajePalabra = document.getElementById("mensajePalabra");
const textoVictoria = document.getElementById("textoVictoria");


/* =========================
   ELEMENTOS DEL LIBRO
========================= */

const libroCerrado = document.getElementById("libroCerrado");
const libroAbierto = document.getElementById("libroAbierto");
const controlesLibro = document.getElementById("controlesLibro");

const botonCerrarLibro = document.getElementById("botonCerrarLibro");
const botonGuardarLibro = document.getElementById("botonGuardarLibro");

const botonPaginaAnterior = document.getElementById(
    "botonPaginaAnterior"
);

const botonPaginaSiguiente = document.getElementById(
    "botonPaginaSiguiente"
);

const tituloPaginaIzquierda = document.getElementById(
    "tituloPaginaIzquierda"
);

const tituloPaginaDerecha = document.getElementById(
    "tituloPaginaDerecha"
);

const numeroPaginaIzquierda = document.getElementById(
    "numeroPaginaIzquierda"
);

const numeroPaginaDerecha = document.getElementById(
    "numeroPaginaDerecha"
);

const textoPaginaIzquierda = document.getElementById(
    "textoPaginaIzquierda"
);

const textoPaginaDerecha = document.getElementById(
    "textoPaginaDerecha"
);

const indicadorPaginas = document.getElementById(
    "indicadorPaginas"
);

const estadoGuardado = document.getElementById(
    "estadoGuardado"
);


/*
    Página izquierda actualmente visible.

    Se mostrarán las páginas de dos en dos:

    1 y 2
    3 y 4
    5 y 6
    ...
    29 y 30
*/

let paginaIzquierdaActual = 1;


/*
    Aquí se almacenan temporalmente las 30 páginas.

    Ejemplo:

    paginasLibro[1] = "Texto de la página 1";
    paginasLibro[2] = "Texto de la página 2";
*/

const paginasLibro = {};

for (let numero = 1; numero <= totalPaginasLibro; numero++) {
    paginasLibro[numero] = "";
}


/* =========================
   FUNCIONES GENERALES
========================= */

function mostrarPantalla(pantalla) {
    document.querySelectorAll(".pantalla").forEach((item) => {
        item.classList.remove("activa");
    });

    pantalla.classList.add("activa");
}


function mostrarMensaje(elemento, texto, tipo = "") {
    elemento.textContent = texto;
    elemento.className = `mensaje ${tipo}`;
}


/* =========================
   INGRESAR JUGADOR
========================= */

async function ingresarJugador() {
    nombreJugador = entradaNombre.value.trim();

    if (!nombreJugador) {
        mostrarMensaje(
            mensajeInicio,
            "Escribe tu nombre para comenzar.",
            "error"
        );

        return;
    }

    botonIngresar.disabled = true;
    botonIngresar.textContent = "Ingresando...";

    try {
        const respuesta = await fetch("/api/jugadores", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nombre: nombreJugador
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || "No se pudo ingresar"
            );
        }

        jugadorId = datos.jugador.id;

        saludoJugador.textContent =
            `Jugador: ${nombreJugador}`;

        mostrarPantalla(pantallaPreguntas);

        await cargarPregunta();

    } catch (error) {
        mostrarMensaje(
            mensajeInicio,
            error.message,
            "error"
        );

    } finally {
        botonIngresar.disabled = false;
        botonIngresar.textContent = "Comenzar aventura";
    }
}


/* =========================
   CARGAR PREGUNTA
========================= */

async function cargarPregunta() {
    mostrarMensaje(mensajePregunta, "");

    numeroPregunta.textContent =
        `Pregunta ${preguntaActual} de ${totalPreguntas}`;

    barraProgreso.style.width =
        `${(respuestasCorrectas / totalPreguntas) * 100}%`;

    try {
        const respuesta = await fetch(
            `/api/preguntas/${preguntaActual}`
        );

        const pregunta = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                pregunta.mensaje || "No se pudo cargar la pregunta"
            );
        }

        textoPregunta.textContent = pregunta.pregunta;
        contenedorOpciones.innerHTML = "";

        pregunta.opciones.forEach((opcion) => {
            const boton = document.createElement("button");

            boton.type = "button";
            boton.textContent = opcion;

            boton.addEventListener("click", () => {
                comprobarRespuesta(
                    pregunta.id,
                    opcion
                );
            });

            contenedorOpciones.appendChild(boton);
        });

    } catch (error) {
        mostrarMensaje(
            mensajePregunta,
            error.message,
            "error"
        );
    }
}


/* =========================
   COMPROBAR RESPUESTA
========================= */

async function comprobarRespuesta(
    preguntaId,
    respuestaElegida
) {
    const botonesOpciones =
        contenedorOpciones.querySelectorAll("button");

    botonesOpciones.forEach((boton) => {
        boton.disabled = true;
    });

    try {
        const respuesta = await fetch("/api/respuestas", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                jugadorId,
                preguntaId,
                respuesta: respuestaElegida
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo comprobar la respuesta"
            );
        }

        if (!datos.correcta) {
            mostrarMensaje(
                mensajePregunta,
                datos.mensaje,
                "error"
            );

            botonesOpciones.forEach((boton) => {
                boton.disabled = false;
            });

            return;
        }

        respuestasCorrectas++;

        letras[respuestasCorrectas - 1].textContent =
            datos.letra;

        letras[respuestasCorrectas - 1].classList.add(
            "descubierta"
        );

        barraProgreso.style.width =
            `${(respuestasCorrectas / totalPreguntas) * 100}%`;

        mostrarMensaje(
            mensajePregunta,
            datos.mensaje,
            "correcto"
        );

        setTimeout(() => {
            if (preguntaActual < totalPreguntas) {
                preguntaActual++;

                cargarPregunta();
            } else {
                activarZonaPalabra();
            }
        }, 700);

    } catch (error) {
        mostrarMensaje(
            mensajePregunta,
            error.message,
            "error"
        );

        botonesOpciones.forEach((boton) => {
            boton.disabled = false;
        });
    }
}


/* =========================
   ACTIVAR PALABRA SECRETA
========================= */

function activarZonaPalabra() {
    textoPregunta.textContent =
        "¡Completaste las seis preguntas!";

    numeroPregunta.textContent =
        "Palabra secreta";

    contenedorOpciones.innerHTML = "";

    zonaPalabra.classList.remove("bloqueada");

    entradaPalabra.disabled = false;
    botonComprobar.disabled = false;

    entradaPalabra.focus();
}


/* =========================
   COMPROBAR PALABRA
========================= */

async function comprobarPalabra() {
    const palabra = entradaPalabra.value.trim();

    if (!palabra) {
        mostrarMensaje(
            mensajePalabra,
            "Escribe la palabra secreta.",
            "error"
        );

        return;
    }

    botonComprobar.disabled = true;

    try {
        const respuesta = await fetch("/api/palabra", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                jugadorId,
                palabra
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo comprobar la palabra"
            );
        }

        if (!datos.correcta) {
            mostrarMensaje(
                mensajePalabra,
                datos.mensaje,
                "error"
            );

            botonComprobar.disabled = false;

            return;
        }

        textoVictoria.textContent =
            `${nombreJugador}, descubriste la palabra secreta.`;

        const pantallaSobres =
            document.getElementById("pantallaSobres");

        mostrarPantalla(pantallaSobres);

    } catch (error) {
        mostrarMensaje(
            mensajePalabra,
            error.message,
            "error"
        );

        botonComprobar.disabled = false;
    }
}


/* =========================
   SOBRES
========================= */

function abrirSobre(boton, numero) {
    boton.classList.toggle("abierto");

    const icono = boton.querySelector(".icono-sobre");

    if (icono) {
        if (boton.classList.contains("abierto")) {
            icono.style.opacity = "0";
        } else {
            icono.style.opacity = "1";
        }
    }

    const musica = document.getElementById("musicaSobre");

    if (musica) {
        musica.currentTime = 0;

        musica.play().catch(() => {
            console.log("El navegador bloqueó el audio.");
        });
    }
}


/* =========================
   MOSTRAR LIBRO
========================= */

async function mostrarLibro() {
    const pantallaLibro =
        document.getElementById("pantallaLibro");

    mostrarPantalla(pantallaLibro);

    /*
        Cada vez que entra al libro se cargan
        las páginas guardadas en la base de datos.
    */

    await cargarLibro();
}


/* =========================
   VOLVER A LOS SOBRES
========================= */

async function volverASobres() {
    guardarTextoTemporal();

    const pantallaSobres =
        document.getElementById("pantallaSobres");

    mostrarPantalla(pantallaSobres);
}


/* =========================
   ABRIR LIBRO
========================= */

async function abrirLibro() {
    libroCerrado.classList.add("oculto");
    libroAbierto.classList.remove("oculto");
    controlesLibro.classList.remove("oculto");

    botonCerrarLibro.classList.remove("oculto");
    botonGuardarLibro.classList.remove("oculto");

    await cargarLibro();

    mostrarPaginas();
}


/* =========================
   CERRAR LIBRO
========================= */

function cerrarLibro() {
    guardarTextoTemporal();

    libroAbierto.classList.add("oculto");
    controlesLibro.classList.add("oculto");

    botonCerrarLibro.classList.add("oculto");
    botonGuardarLibro.classList.add("oculto");

    estadoGuardado.classList.add("oculto");
    libroCerrado.classList.remove("oculto");
}


/* =========================
   CARGAR LIBRO DESDE LA DB
========================= */

async function cargarLibro() {
    if (!jugadorId) {
        return;
    }

    try {
        const respuesta = await fetch(
            `/api/libro/${jugadorId}`
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje ||
                "No se pudo cargar el libro"
            );
        }

        /*
            Primero se limpian las páginas locales.
        */

        for (
            let numero = 1;
            numero <= totalPaginasLibro;
            numero++
        ) {
            paginasLibro[numero] = "";
        }

        /*
            Después se colocan los textos recuperados
            desde PostgreSQL.
        */

        datos.paginas.forEach((pagina) => {
            const numero = Number(pagina.numero_pagina);

            if (
                numero >= 1 &&
                numero <= totalPaginasLibro
            ) {
                paginasLibro[numero] =
                    pagina.contenido || "";
            }
        });

        mostrarPaginas();

    } catch (error) {
        console.error(error);

        estadoGuardado.textContent =
            "No se pudo cargar el libro.";

        estadoGuardado.classList.remove("oculto");
    }
}


/* =========================
   MOSTRAR PÁGINAS ACTUALES
========================= */

function mostrarPaginas() {
    const paginaDerechaActual =
        paginaIzquierdaActual + 1;

    tituloPaginaIzquierda.textContent =
        `Página ${paginaIzquierdaActual}`;

    tituloPaginaDerecha.textContent =
        `Página ${paginaDerechaActual}`;

    numeroPaginaIzquierda.textContent =
        paginaIzquierdaActual;

    numeroPaginaDerecha.textContent =
        paginaDerechaActual;

    textoPaginaIzquierda.value =
        paginasLibro[paginaIzquierdaActual] || "";

    textoPaginaDerecha.value =
        paginasLibro[paginaDerechaActual] || "";

    indicadorPaginas.textContent =
        `Páginas ${paginaIzquierdaActual} - ` +
        `${paginaDerechaActual} de ${totalPaginasLibro}`;

    /*
        Desactiva el botón anterior en páginas 1 y 2.
    */

    botonPaginaAnterior.disabled =
        paginaIzquierdaActual === 1;

    /*
        Desactiva el botón siguiente en páginas 29 y 30.
    */

    botonPaginaSiguiente.disabled =
        paginaDerechaActual >= totalPaginasLibro;

    estadoGuardado.classList.add("oculto");
}


/* =========================
   GUARDAR TEXTO TEMPORAL
========================= */

function guardarTextoTemporal() {
    const paginaDerechaActual =
        paginaIzquierdaActual + 1;

    paginasLibro[paginaIzquierdaActual] =
        textoPaginaIzquierda.value;

    paginasLibro[paginaDerechaActual] =
        textoPaginaDerecha.value;
}


/* =========================
   PÁGINA ANTERIOR
========================= */

function paginaAnterior() {
    guardarTextoTemporal();

    if (paginaIzquierdaActual > 1) {
        paginaIzquierdaActual -= 2;
    }

    mostrarPaginas();
}


/* =========================
   PÁGINA SIGUIENTE
========================= */

function paginaSiguiente() {
    guardarTextoTemporal();

    if (
        paginaIzquierdaActual + 2 <
        totalPaginasLibro
    ) {
        paginaIzquierdaActual += 2;
    }

    mostrarPaginas();
}


/* =========================
   GUARDAR UNA PÁGINA EN DB
========================= */

async function guardarPagina(
    numeroPagina,
    contenido
) {
    const respuesta = await fetch("/api/libro", {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            jugadorId,
            numeroPagina,
            contenido
        })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.mensaje ||
            `No se pudo guardar la página ${numeroPagina}`
        );
    }

    return datos;
}


/* =========================
   GUARDAR PÁGINAS VISIBLES
========================= */

async function guardarPaginasVisibles() {
    if (!jugadorId) {
        estadoGuardado.textContent =
            "No se encontró el jugador.";

        estadoGuardado.classList.remove("oculto");

        return;
    }

    guardarTextoTemporal();

    const paginaDerechaActual =
        paginaIzquierdaActual + 1;

    botonGuardarLibro.disabled = true;
    botonGuardarLibro.textContent = "Guardando...";

    estadoGuardado.textContent =
        "Guardando páginas...";

    estadoGuardado.classList.remove("oculto");

    try {
        /*
            Guarda las dos páginas que se están viendo.
        */

        await Promise.all([
            guardarPagina(
                paginaIzquierdaActual,
                paginasLibro[paginaIzquierdaActual]
            ),

            guardarPagina(
                paginaDerechaActual,
                paginasLibro[paginaDerechaActual]
            )
        ]);

        estadoGuardado.textContent =
            `Páginas ${paginaIzquierdaActual} y ` +
            `${paginaDerechaActual} guardadas 💗`;

    } catch (error) {
        console.error(error);

        estadoGuardado.textContent =
            error.message;

    } finally {
        botonGuardarLibro.disabled = false;

        botonGuardarLibro.textContent =
            "💾 Guardar páginas";
    }
}


/* =========================
   DETECTAR CAMBIOS
========================= */

function marcarComoNoGuardado() {
    estadoGuardado.textContent =
        "Tienes cambios sin guardar.";

    estadoGuardado.classList.remove("oculto");
}


/* =========================
   EVENTOS
========================= */

botonIngresar.addEventListener(
    "click",
    ingresarJugador
);

botonComprobar.addEventListener(
    "click",
    comprobarPalabra
);

botonPaginaAnterior.addEventListener(
    "click",
    paginaAnterior
);

botonPaginaSiguiente.addEventListener(
    "click",
    paginaSiguiente
);

botonGuardarLibro.addEventListener(
    "click",
    guardarPaginasVisibles
);

textoPaginaIzquierda.addEventListener(
    "input",
    marcarComoNoGuardado
);

textoPaginaDerecha.addEventListener(
    "input",
    marcarComoNoGuardado
);


/*
    Permite entrar presionando Enter.
*/

entradaNombre.addEventListener(
    "keydown",
    (evento) => {
        if (evento.key === "Enter") {
            ingresarJugador();
        }
    }
);


/*
    Permite comprobar la palabra con Enter.
*/

entradaPalabra.addEventListener(
    "keydown",
    (evento) => {
        if (evento.key === "Enter") {
            comprobarPalabra();
        }
    }
);