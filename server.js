import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// REGLA DE ORO: Esta línea debe apuntar a la carpeta donde están tus archivos
app.use(express.static(path.join(__dirname, 'public')));

app.post('/cotizar', async (req, res) => {
    const { mensaje, usuario_id } = req.body;
    
    console.log(`📩 Mensaje recibido del chat: "${mensaje}" de usuario: ${usuario_id}`);

    try {
        // 1. LLAMADA A MAKE
        const response = await fetch('https://hook.us1.make.com/qzt8267tyrh95ptx9dh4bk63ftebbkt6', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mensaje: mensaje, 
                usuario_id: usuario_id 
            })
        });

        // 2. RECIBIR RESPUESTA DE MAKE
        const respuestaIA = await response.text();
        console.log("✅ Make respondió:", respuestaIA);

        // 3. ENVIAR DE VUELTA AL NAVEGADOR (Esto quita el 'Pending')
        res.json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("❌ Error en el puente a Make:", error);
        res.status(500).json({ error: "No se pudo conectar con el cerebro de Guana." });
    }
});

app.listen(3000, () => {
    console.log('🚀 Servidor listo en http://localhost:3000');
});