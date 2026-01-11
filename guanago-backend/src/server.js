require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors'); // 1. Importar
const path = require('path');
const axios = require('axios');
const mapaRoutes = require('./routes/mapa');

const app = express();

app.use(cors()); // 2. Activar ANTES de las rutas
// Middleware
app.use(express.json());

// 1. RUTAS DE LA API
app.use('/api/v1', mapaRoutes);

// 2. SERVIR ARCHIVOS ESTÁTICOS (EL MAPA)
// Esta línea busca la carpeta 'public' que está afuera de 'src'
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));


// Ruta para el Onboarding (Lo que hicimos con Groq anteriormente)
app.post('/api/v1/onboarding', async (req, res) => {
    // ... tu código de onboarding aquí ...
    res.json({ success: true, message: "Jarvis escuchando" });
});

// 3. RUTA RAÍZ (Enviar el index.html del mapa)
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// 4. CONFIGURACIÓN DEL PUERTO (Vital para Render y Local)
// Si existe un puerto en el sistema (Render), lo usa. Si no, usa el 5000.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 GuanaGo Backend corriendo en: http://localhost:${PORT}`);
});