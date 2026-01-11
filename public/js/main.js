/**
 * main.js
 * Lógica principal de la interfaz de usuario (UI)
 */

let carritoTemporal = null;

async function enviarMensaje() {
    const input = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const btnCart = document.getElementById('cart-action');
    const btnTotalText = document.getElementById('btn-total');

    const mensaje = input.value;
    
    if (!mensaje) return;

    // 1. Limpiamos el input y mostramos el mensaje del usuario
    chatBox.innerHTML += `<div class="message user-message">${mensaje}</div>`;
    btnCart.style.display = 'none';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // 2. ENVIAMOS AL SERVIDOR LOCAL (Node.js), NO DIRECTO A MAKE
        const response = await fetch('/cotizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mensaje: mensaje,
                usuario_id: "test_usuario_sky" // ID fijo para probar ahora
            })
        });

        const data = await response.json();
        
        // 3. MOSTRAMOS LA RESPUESTA EN EL CHAT
        console.log("IA dice:", data.respuesta);

        // Lógica para crear la burbuja en el HTML
        const textoLimpio = data.respuesta.split('[DATA]')[0];
        const rawData = data.respuesta.match(/\[DATA\]([\s\S]*?)\[\/DATA\]/);

        chatBox.innerHTML += `<div class="message ai-message">${textoLimpio}</div>`;

        // Si hay datos de compra, activar el botón
        if (rawData && rawData[1]) {
            carritoTemporal = JSON.parse(rawData[1]);
            if (carritoTemporal.total > 0) {
                btnTotalText.innerText = carritoTemporal.total.toLocaleString();
                btnCart.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error al cotizar:", error);
        chatBox.innerHTML += `<div class="message ai-message" style="color:red;">Error de conexión. Intenta nuevamente.</div>`;
    }
    
    input.value = ''; // Limpiar el cuadro de texto
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Asegúrate de que el ID coincida con tu botón en el HTML
document.getElementById('send-btn').addEventListener('click', enviarMensaje);

function irAlCarrito() {
    if (carritoTemporal) {
        alert(`¡Éxito! Has añadido "${carritoTemporal.resumen}" al carrito.\nTotal: $${carritoTemporal.total}\nProcediendo a pasarela de pagos...`);
        // Aquí conectarás con PayU
    }
}

// Detectar tecla Enter
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') enviarMensaje();
});