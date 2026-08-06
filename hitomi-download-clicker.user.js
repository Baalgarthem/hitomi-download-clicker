// ==UserScript==
// @name         Hitomi Clicker
// @namespace    https://github.com/Baalgarthem/
// @version      1.0.0
// @description  Recorre pestañas abiertas de Hitomi y pulsa automáticamente el botón de descarga evitando repetir páginas ya procesadas.
// @author       Baalgarthem
// @icon         https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/media/hitomi-logo.ico
// @downloadURL  https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
// @updateURL    https://raw.githubusercontent.com/Baalgarthem/hitomi-download-clicker/principal/hitomi-clicker.user.js
// @match        https://hitomi.la/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// @license      MIT
// ==/UserScript==

/*
╔══════════════════════════════════════════════════════════════════════╗
║                         HITOMI CLICKER                              ║
╚══════════════════════════════════════════════════════════════════════╝


PROPÓSITO DEL SCRIPT
────────────────────

Este script automatiza una tarea repetitiva dentro de Hitomi.la:

1. Detecta todas las pestañas abiertas pertenecientes al dominio Hitomi.
2. Comprueba si cada página contiene el botón real de descarga.
3. Envía una orden individual a cada pestaña preparada.
4. Ejecuta el click únicamente sobre páginas pendientes.
5. Guarda memoria permanente de las páginas donde ya realizó la acción.


FILOSOFÍA DE FUNCIONAMIENTO
───────────────────────────

El programa separa tres conceptos:

- Página disponible:
  Una pestaña donde existe un botón de descarga válido.

- Página procesada:
  Una página donde el usuario ya permitió ejecutar el click.
  Estas páginas quedan almacenadas y son ignoradas en futuras ejecuciones.

- Página pendiente:
  Una página nueva que todavía necesita ser procesada.


MEMORIA
───────

La memoria utiliza el almacenamiento proporcionado por
Tampermonkey / Violentmonkey mediante GM_setValue.

Esto permite que:

- La información sobreviva al cierre del navegador.
- Varias pestañas compartan el mismo historial.
- El usuario pueda continuar trabajando sin repetir acciones.


SEGURIDAD
─────────

El script nunca navega automáticamente.
Nunca abre enlaces externos.
Nunca ejecuta acciones fuera de Hitomi.

Solo pulsa el elemento #dl-button detectado dentro de una pestaña
del propio dominio.


ARQUITECTURA GENERAL
────────────────────

Cada pestaña funciona como un agente independiente:

Pestaña A
   ↓
Detecta botón
   ↓
Publica presencia


Pestaña principal
   ↓
Consulta pestañas disponibles
   ↓
Envía orden
   ↓
Recibe resultado


Después de éxito:

URL → Memoria permanente → Ignorada en futuras ejecuciones.


*/


(() => {

    "use strict";


    // ─────────────────────────────────────────────
    // Configuración general del sistema
    // ─────────────────────────────────────────────

    const CONFIGURACION = {

        dominio: "hitomi.la",

        selectorBotonDescarga: "#dl-button",

        intervaloBusquedaBoton: 150,

        intentosBusquedaBoton: 40,

        tiempoEntreOrdenes: 120,

        tiempoRespuestaPestana: 4000,


        ids:

        {

            pastilla:
                "hitomi-clicker-pastilla",

            anfitrion:
                "hitomi-clicker-interfaz"

        }

    };



    // ─────────────────────────────────────────────
    // Identidad única de cada pestaña
    // ─────────────────────────────────────────────

    const ID_PESTANA = obtenerIdPestana();



    function obtenerIdPestana() {

        const CLAVE =
            "hitomi_clicker_identidad_pestana";


        let id =
            sessionStorage.getItem(CLAVE);


        if (!id) {

            id =
                `${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;


            sessionStorage.setItem(
                CLAVE,
                id
            );

        }


        return id;

    }



    // ─────────────────────────────────────────────
    // Claves compartidas entre pestañas
    // ─────────────────────────────────────────────


    const CLAVES = {

        presencia:
            id =>
                `hitomi_presencia_${id}`,


        orden:
            "hitomi_orden_global",


        respuesta:
            (nonce, id) =>
                `hitomi_respuesta_${nonce}_${id}`,


        memoriaPaginas:
            "hitomi_paginas_procesadas",


        urlPestana:
            id =>
                `hitomi_url_${id}`

    };



    // ─────────────────────────────────────────────
    // Estado interno del script
    // ─────────────────────────────────────────────


    const ESTADO = {


        bloqueado:
            false,


        ordenesEjecutadas:
            new Set(),


        botonPastilla:
            null,


        observador:
            null


    };



    // ─────────────────────────────────────────────
    // Herramientas generales
    // ─────────────────────────────────────────────


    const esperar =
        milisegundos =>
            new Promise(
                resolver =>
                    setTimeout(
                        resolver,
                        milisegundos
                    )
            );



    const obtenerHora =
        () =>
            `[${new Date()
                .toTimeString()
                .slice(0, 8)}]`;



    function esPaginaHitomi() {

        return /^https?:\/\/(?:www\.)?hitomi\.la\//i
            .test(location.href);

    }



    function elementoVisible(elemento) {

        if (!elemento) {
            return false;
        }


        const estilo =
            getComputedStyle(elemento);


        const rectangulo =
            elemento.getBoundingClientRect();


        return (
            estilo.display !== "none" &&
            estilo.visibility !== "hidden" &&
            rectangulo.width > 0 &&
            rectangulo.height > 0
        );

    }



    function ejecutarClick(elemento) {

        if (
            elemento &&
            typeof elemento.click === "function"
        ) {

            elemento.click();

            return true;

        }


        if (elemento) {

            return elemento.dispatchEvent(
                new MouseEvent(
                    "click",
                    {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    }
                )
            );

        }


        return false;

    }



    // ─────────────────────────────────────────────
    // Memoria persistente
    // ─────────────────────────────────────────────


    function obtenerPaginasProcesadas() {

        try {

            return new Set(
                GM_getValue(
                    CLAVES.memoriaPaginas,
                    []
                )
            );


        } catch {

            return new Set();

        }

    }



    function guardarPaginaProcesada(url) {

        if (!url) {
            return;
        }


        try {

            const memoria =
                obtenerPaginasProcesadas();


            memoria.add(url);


            GM_setValue(
                CLAVES.memoriaPaginas,
                [...memoria]
            );


        } catch { }

    }



    function paginaYaProcesada(url) {

        return obtenerPaginasProcesadas()
            .has(url);

    }



    function limpiarMemoriaProcesadas() {

        try {

            GM_deleteValue(
                CLAVES.memoriaPaginas
            );


        } catch { }

    }

})();


// ─────────────────────────────────────────────
// Detección del botón de descarga
// ─────────────────────────────────────────────


async function buscarBotonDescarga(
    opciones = {}
) {

    const intentos =
        opciones.intentos ??
        CONFIGURACION.intentosBusquedaBoton;


    const pausa =
        opciones.pausa ??
        CONFIGURACION.intervaloBusquedaBoton;



    for (
        let intento = 0;
        intento < intentos;
        intento++
    ) {


        const boton =
            document.querySelector(
                CONFIGURACION.selectorBotonDescarga
            );


        if (
            boton &&
            elementoVisible(boton)
        ) {

            return boton;

        }


        await esperar(pausa);

    }



    return null;

}



// ─────────────────────────────────────────────
// Publicación del estado de la pestaña
// ─────────────────────────────────────────────
//
// Cada pestaña informa al sistema:
//
// 1. Si pertenece a Hitomi.
// 2. Si tiene botón de descarga.
// 3. Si todavía no ha sido procesada.
//
// Esto permite que la pestaña principal
// trabaje solamente con páginas pendientes.
// ─────────────────────────────────────────────


async function publicarEstadoPestana() {

    try {


        const esObjetivo =
            esPaginaHitomi();


        const boton =
            await buscarBotonDescarga({
                intentos: 10,
                pausa: 120
            });



        const paginaPendiente =
            !paginaYaProcesada(
                location.href
            );



        GM_setValue(

            CLAVES.presencia(
                ID_PESTANA
            ),

            (
                esObjetivo &&
                boton &&
                paginaPendiente
            )
                ? 1
                : 0

        );



        GM_setValue(

            CLAVES.urlPestana(
                ID_PESTANA
            ),

            location.href

        );



    } catch { }

}



// ─────────────────────────────────────────────
// Limpieza de presencia
// ─────────────────────────────────────────────


function eliminarPresenciaPestana() {

    try {


        GM_deleteValue(
            CLAVES.presencia(
                ID_PESTANA
            )
        );


        GM_deleteValue(
            CLAVES.urlPestana(
                ID_PESTANA
            )
        );


    } catch { }

}



// ─────────────────────────────────────────────
// Observación de cambios dinámicos
// ─────────────────────────────────────────────
//
// Hitomi puede modificar el DOM después de cargar.
//
// El observador mantiene actualizada la disponibilidad.
// ─────────────────────────────────────────────


const OBSERVADOR_DOM =
    new MutationObserver(
        () => {

            publicarEstadoPestana();

        }
    );



if (document.documentElement) {


    OBSERVADOR_DOM.observe(

        document.documentElement,

        {
            childList: true,
            subtree: true,
            attributes: true
        }

    );

}



window.addEventListener(
    "beforeunload",
    eliminarPresenciaPestana
);



publicarEstadoPestana();



// ─────────────────────────────────────────────
// Ejecución de órdenes recibidas
// ─────────────────────────────────────────────
//
// La pestaña principal no pulsa directamente.
//
// Envía una orden global.
// Cada pestaña verifica si le corresponde.
// ─────────────────────────────────────────────


async function ejecutarOrdenDescarga(
    identificadorOrden
) {


    if (
        ESTADO.ordenesEjecutadas.has(
            identificadorOrden
        )
    ) {

        return "orden_repetida";

    }



    const boton =
        await buscarBotonDescarga();



    if (!boton) {

        return "sin_boton";

    }



    try {


        ESTADO.ordenesEjecutadas.add(
            identificadorOrden
        );



        ejecutarClick(
            boton
        );



        await esperar(
            400
        );



        return "correcto";



    } catch {


        return "error";

    }


}



// ─────────────────────────────────────────────
// Escucha de órdenes entre pestañas
// ─────────────────────────────────────────────


try {


    GM_addValueChangeListener(

        CLAVES.orden,


        async (
            _clave,
            _valorAnterior,
            valorNuevo,
            cambioRemoto
        ) => {


            if (
                !cambioRemoto ||
                !valorNuevo ||
                typeof valorNuevo !== "object"
            ) {

                return;

            }



            const {

                pestañaDestino,

                nonce


            } = valorNuevo;



            if (
                pestañaDestino !==
                ID_PESTANA
            ) {

                return;

            }



            const resultado =
                await ejecutarOrdenDescarga(
                    nonce
                );



            try {


                GM_setValue(

                    CLAVES.respuesta(
                        nonce,
                        ID_PESTANA
                    ),

                    resultado

                );


            } catch { }


        }

    );



} catch { }



// ─────────────────────────────────────────────
// Consulta de pestañas disponibles
// ─────────────────────────────────────────────
//
// Obtiene únicamente pestañas:
// - abiertas.
// - con botón.
// - no procesadas.
// ─────────────────────────────────────────────


function obtenerPestanasPendientes() {


    try {


        const prefijo =
            "hitomi_presencia_";



        const claves =
            GM_listValues()
                .filter(
                    clave =>
                        clave.startsWith(
                            prefijo
                        )
                );



        return claves

            .map(
                clave => ({

                    id:
                        clave.slice(
                            prefijo.length
                        ),


                    disponible:
                        Number(
                            GM_getValue(
                                clave,
                                0
                            )
                        ) > 0


                })
            )


            .filter(
                pestaña =>
                    pestaña.disponible
            )


            .filter(
                pestaña => {


                    const url =
                        GM_getValue(

                            CLAVES.urlPestana(
                                pestaña.id
                            ),

                            ""

                        );



                    return (
                        url &&
                        !paginaYaProcesada(
                            url
                        )
                    );


                }
            )


            .map(
                pestaña =>
                    pestaña.id
            )


            .sort();



    } catch {


        return [];

    }


}


// ─────────────────────────────────────────────
// Interfaz visual del usuario
// ─────────────────────────────────────────────
//
// La interfaz se mantiene separada del sitio
// mediante un contenedor propio.
//
// Esto evita conflictos con los estilos internos
// de Hitomi.
// ─────────────────────────────────────────────


function crearInterfaz() {


    let anfitrion =
        document.getElementById(
            CONFIGURACION.ids.anfitrion
        );



    if (!anfitrion) {


        anfitrion =
            document.createElement(
                "div"
            );


        anfitrion.id =
            CONFIGURACION.ids.anfitrion;



        Object.assign(
            anfitrion.style,
            {

                all: "initial",

                position: "fixed",

                inset: "0",

                zIndex:
                    "2147483647",

                pointerEvents:
                    "none"

            }
        );



        document.documentElement.appendChild(
            anfitrion
        );


    }



    return anfitrion;

}



// ─────────────────────────────────────────────
// Estilos de la interfaz
// ─────────────────────────────────────────────


GM_addStyle(`


#${CONFIGURACION.ids.pastilla} {


    position: fixed;


    right: 15px;


    bottom: 15px;


    z-index: 2147483647;


    display:flex;


    align-items:center;


    gap:8px;


    padding:10px 16px;


    border-radius:999px;


    background:#0d1117;


    color:#ffffff;


    border:1px solid #30363d;


    box-shadow:
        0 8px 24px
        rgba(0,0,0,.35);


    font:

        700 13px

        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;


    cursor:pointer;


    user-select:none;


    transition:

        transform .2s ease,

        background .2s ease,

        color .2s ease;



}



#${CONFIGURACION.ids.pastilla}:hover {


    transform:
        translateY(-2px);


}



.hitomi-punto {


    width:8px;


    height:8px;


    border-radius:50%;


    background:#238636;



}



.hitomi-ok {


    animation:

        animacion_exito
        .5s ease;



}



.hitomi-error {


    animation:

        animacion_error
        .8s ease;



}



@keyframes animacion_exito {


    0% {

        background:#0d1117;

    }


    50% {

        background:#12b886;

        color:#06140f;

    }


    100% {

        background:#0d1117;

    }


}



@keyframes animacion_error {


    0%,100% {

        background:#0d1117;

    }


    50% {

        background:#b00020;

    }


}



`);





// ─────────────────────────────────────────────
// Crear pastilla principal
// ─────────────────────────────────────────────


function montarPastilla() {


    if (
        ESTADO.botonPastilla ||
        !esPaginaHitomi()
    ) {

        return;

    }



    const interfaz =
        crearInterfaz();



    const pastilla =
        document.createElement(
            "div"
        );



    pastilla.id =
        CONFIGURACION.ids.pastilla;



    pastilla.innerHTML = `

        <span class="hitomi-punto"></span>

        <strong>
            Hitomi DL
        </strong>

    `;



    pastilla.title =
        "Click para procesar páginas pendientes.\nShift + Click limpia memoria.";



    pastilla.addEventListener(

        "click",

        evento => {


            if (
                evento.shiftKey
            ) {


                limpiarMemoriaProcesadas();


                mostrarEstado(

                    pastilla,

                    "Memoria limpiada",

                    "correcto"

                );


                return;

            }



            recorrerPestanasDescarga(
                pastilla
            );


        }

    );



    interfaz.appendChild(
        pastilla
    );



    ESTADO.botonPastilla =
        pastilla;


}




// ─────────────────────────────────────────────
// Feedback visual
// ─────────────────────────────────────────────


function mostrarEstado(
    elemento,
    mensaje,
    tipo
) {


    if (!elemento) {
        return;
    }



    const textoOriginal =
        elemento.innerHTML;



    elemento.innerHTML = `

        <span class="hitomi-punto"></span>

        <strong>
            ${mensaje}
        </strong>

    `;



    elemento.classList.remove(

        "hitomi-ok",

        "hitomi-error"

    );



    if (
        tipo === "correcto"
    ) {


        elemento.classList.add(
            "hitomi-ok"
        );


    }


    else {


        elemento.classList.add(
            "hitomi-error"
        );


    }



    setTimeout(

        () => {


            elemento.innerHTML =
                textoOriginal;



            elemento.classList.remove(

                "hitomi-ok",

                "hitomi-error"

            );


        },


        1500

    );


}


// ─────────────────────────────────────────────
// Ejecución del recorrido completo
// ─────────────────────────────────────────────
//
// Este bloque coordina:
//
// 1. Obtención de pestañas pendientes.
// 2. Envío de órdenes.
// 3. Espera de respuestas.
// 4. Registro en memoria.
//
// ─────────────────────────────────────────────


async function recorrerPestanasDescarga(
    pastilla
) {


    if (
        ESTADO.bloqueado
    ) {

        return;

    }



    ESTADO.bloqueado =
        true;



    mostrarEstado(

        pastilla,

        "Buscando...",

        "correcto"

    );



    try {


        const pestañas =
            obtenerPestanasPendientes();



        if (
            !pestañas.length
        ) {


            mostrarEstado(

                pastilla,

                "Sin pendientes",

                "error"

            );


            return;

        }



        let procesadas = 0;



        for (
            const idPestana
            of pestañas
        ) {



            const nonce =
                `${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 7)}`;



            GM_deleteValue(

                CLAVES.respuesta(
                    nonce,
                    idPestana
                )

            );



            GM_setValue(

                CLAVES.orden,

                {

                    pestañaDestino:
                        idPestana,


                    nonce

                }

            );



            const inicio =
                Date.now();



            let respuesta =
                null;



            while (
                Date.now() - inicio <
                CONFIGURACION.tiempoRespuestaPestana
            ) {


                await esperar(100);



                respuesta =
                    GM_getValue(

                        CLAVES.respuesta(
                            nonce,
                            idPestana
                        ),

                        null

                    );



                if (
                    respuesta
                ) {

                    break;

                }


            }




            console.info(

                obtenerHora(),

                `Pestaña ${idPestana}:`,

                respuesta

            );




            if (
                respuesta ===
                "correcto"
            ) {


                const url =
                    GM_getValue(

                        CLAVES.urlPestana(
                            idPestana
                        ),

                        ""

                    );



                if (url) {


                    guardarPaginaProcesada(
                        url
                    );


                }



                procesadas++;


            }



            await esperar(
                CONFIGURACION.tiempoEntreOrdenes
            );


        }




        if (
            procesadas > 0
        ) {


            mostrarEstado(

                pastilla,

                `${procesadas} completadas`,

                "correcto"

            );


        }

        else {


            mostrarEstado(

                pastilla,

                "Sin cambios",

                "error"

            );


        }



    }

    finally {


        ESTADO.bloqueado =
            false;


        publicarEstadoPestana();


    }



}


// ─────────────────────────────────────────────
// Limpieza de recursos temporales
// ─────────────────────────────────────────────
//
// Elimina registros antiguos de pestañas cerradas.
// No toca la memoria de páginas procesadas.
//
// La memoria de páginas es permanente porque
// representa acciones reales realizadas.
// ─────────────────────────────────────────────


function limpiarRegistrosPestanasAntiguas() {


    try {


        const prefijo =
            "hitomi_url_";



        const claves =
            GM_listValues()
                .filter(

                    clave =>
                        clave.startsWith(
                            prefijo
                        )

                );



        for (
            const clave
            of claves
        ) {


            const id =
                clave.replace(
                    prefijo,
                    ""
                );



            const presencia =
                GM_getValue(

                    CLAVES.presencia(id),

                    null

                );



            if (
                presencia === null
            ) {


                GM_deleteValue(
                    clave
                );


            }


        }



    } catch { }

}




// ─────────────────────────────────────────────
// Inicialización principal
// ─────────────────────────────────────────────
//
// Orden de arranque:
//
// 1. Verifica página válida.
// 2. Limpia residuos.
// 3. Crea interfaz.
// 4. Activa sincronización.
// 5. Publica estado.
//
// ─────────────────────────────────────────────


function iniciarScript() {


    if (
        !esPaginaHitomi()
    ) {


        return;

    }



    limpiarRegistrosPestanasAntiguas();



    montarPastilla();



    publicarEstadoPestana();



    console.info(

        obtenerHora(),

        "Hitomi Clicker iniciado",

        {

            pestaña:
                ID_PESTANA,


            pagina:
                location.href


        }

    );



}





// ─────────────────────────────────────────────
// Control de carga del documento
// ─────────────────────────────────────────────


if (
    document.readyState ===
    "loading"
) {


    document.addEventListener(

        "DOMContentLoaded",

        iniciarScript,

        {
            once: true
        }

    );


}

else {


    iniciarScript();


}


}) ();
