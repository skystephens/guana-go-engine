import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Importa la función maestra del cotizador
import { ejecutarCotizadorReal } from './cotizador.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
// Sirve los archivos estáticos (como index.html) desde la carpeta raíz del proyecto
app.use(express.static(__dirname));

app.post('/cotizar', async (req, res) => {
    const { mensaje } = req.body;
    try {
        // Llama a la función que une Airtable y Gemini
        const respuestaIA = await ejecutarCotizadorReal(mensaje); 
        // Devuelve la respuesta de la IA al cliente
        res.json({ respuesta: respuestaIA });
    } catch (error) {
        console.error('Error en el endpoint /cotizar:', error);
        res.status(500).json({ error: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.' });
    }
});

app.listen(3000, () => {
    console.log('🚀 Guana Go corriendo en http://localhost:3000');
});