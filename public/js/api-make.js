/**
 * api-make.js
 * Módulo encargado de la comunicación con el Webhook de Make.com
 */

// NOTA: Si usas Live Server o abres el HTML directamente, necesitarás la URL completa de Make.
// Por ahora mantenemos '/cotizar' como estaba en tu código original.
const API_URL = '/cotizar'; 

async function enviarMensajeIA(mensaje, usuario_id = "anonimo") {
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                mensaje: mensaje,
                usuario_id: usuario_id
            })
        });
        return await res.json();
    } catch (error) {
        console.error("Error en api-make.js:", error);
        throw error; // Re-lanzamos el error para manejarlo en main.js
    }
}