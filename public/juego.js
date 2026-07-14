let jugadorId = null;
let nombreJugador = "";
let preguntaActual = 1;
let respuestasCorrectas = 0;
const totalPreguntas = 6;

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

async function ingresarJugador() {
    nombreJugador = entradaNombre.value.trim();

    if (!nombreJugador) {
        mostrarMensaje(mensajeInicio, "Escribe tu nombre para comenzar.", "error");
        return;
    }

    try {
        const respuesta = await fetch("/api/jugadores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nombreJugador })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje);
        }

        jugadorId = datos.jugador.id;
        saludoJugador.textContent = `Jugador: ${nombreJugador}`;
        mostrarPantalla(pantallaPreguntas);
        cargarPregunta();
    } catch (error) {
        mostrarMensaje(mensajeInicio, error.message, "error");
    }
}

async function cargarPregunta() {
    mostrarMensaje(mensajePregunta, "");
    numeroPregunta.textContent = `Pregunta ${preguntaActual} de ${totalPreguntas}`;

    const respuesta = await fetch(`/api/preguntas/${preguntaActual}`);
    const pregunta = await respuesta.json();

    textoPregunta.textContent = pregunta.pregunta;
    contenedorOpciones.innerHTML = "";

    pregunta.opciones.forEach((opcion) => {
        const boton = document.createElement("button");
        boton.textContent = opcion;
        boton.addEventListener("click", () => comprobarRespuesta(pregunta.id, opcion));
        contenedorOpciones.appendChild(boton);
    });
}

async function comprobarRespuesta(preguntaId, respuestaElegida) {
    const respuesta = await fetch("/api/respuestas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jugadorId,
            preguntaId,
            respuesta: respuestaElegida
        })
    });

    const datos = await respuesta.json();

    if (!datos.correcta) {
        mostrarMensaje(mensajePregunta, datos.mensaje, "error");
        return;
    }

    respuestasCorrectas++;
    letras[respuestasCorrectas - 1].textContent = datos.letra;
    letras[respuestasCorrectas - 1].classList.add("descubierta");
    barraProgreso.style.width = `${(respuestasCorrectas / totalPreguntas) * 100}%`;
    mostrarMensaje(mensajePregunta, datos.mensaje, "correcto");

    setTimeout(() => {
        if (preguntaActual < totalPreguntas) {
            preguntaActual++;
            cargarPregunta();
        } else {
            activarZonaPalabra();
        }
    }, 700);
}

function activarZonaPalabra() {
    textoPregunta.textContent = "¡Completaste las cinco preguntas!";
    contenedorOpciones.innerHTML = "";
    zonaPalabra.classList.remove("bloqueada");
    entradaPalabra.disabled = false;
    botonComprobar.disabled = false;
}

async function comprobarPalabra() {
    const palabra = entradaPalabra.value.trim();

    const respuesta = await fetch("/api/palabra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jugadorId, palabra })
    });

    const datos = await respuesta.json();

    if (!datos.correcta) {
        mostrarMensaje(mensajePalabra, datos.mensaje, "error");
        return;
    }

    textoVictoria.textContent = `${nombreJugador}, descubriste la palabra secreta.`;
   const pantallaSobres = document.getElementById("pantallaSobres");
   mostrarPantalla(pantallaSobres);
}

botonIngresar.addEventListener("click", ingresarJugador);
botonComprobar.addEventListener("click", comprobarPalabra);

function abrirSobre(boton, numero){

    boton.classList.toggle("abierto");

    const icono = boton.querySelector(".icono-sobre");

    if(icono){

        if(boton.classList.contains("abierto")){

            icono.style.opacity="0";

        }else{

            icono.style.opacity="1";

        }

    }
    const musica = document.getElementById("musicaSobre");

musica.currentTime = 0;
musica.play();

}

function mostrarLibro() {
    const pantallaLibro = document.getElementById("pantallaLibro");

    mostrarPantalla(pantallaLibro);
}


function volverASobres() {
    const pantallaSobres = document.getElementById("pantallaSobres");

    mostrarPantalla(pantallaSobres);
}


function abrirLibro() {
    const libroCerrado = document.getElementById("libroCerrado");
    const libroAbierto = document.getElementById("libroAbierto");
    const botonCerrarLibro = document.getElementById(
        "botonCerrarLibro"
    );

    libroCerrado.classList.add("oculto");
    libroAbierto.classList.remove("oculto");
    botonCerrarLibro.classList.remove("oculto");
}


function cerrarLibro() {
    const libroCerrado = document.getElementById("libroCerrado");
    const libroAbierto = document.getElementById("libroAbierto");
    const botonCerrarLibro = document.getElementById(
        "botonCerrarLibro"
    );

    libroAbierto.classList.add("oculto");
    botonCerrarLibro.classList.add("oculto");
    libroCerrado.classList.remove("oculto");
}