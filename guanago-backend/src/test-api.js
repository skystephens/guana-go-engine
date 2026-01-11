require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🧪 TEST: Verificando configuración de Airtable...');
console.log('AIRTABLE_BASE_ID:', process.env.AIRTABLE_BASE_ID ? '✅ set' : '❌ missing');
console.log('AIRTABLE_API_KEY:', process.env.AIRTABLE_API_KEY ? '✅ set' : '❌ missing');

const testAPI = async () => {
    try {
        console.log('\n📡 Intentando conectar a Airtable...');
        const response = await axios.get(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Directorio_Mapa`,
            {
                headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` },
                timeout: 5000
            }
        );
        console.log('✅ Conexión exitosa');
        console.log('Registros encontrados:', response.data.records?.length);
        console.log('Primero:', response.data.records?.[0]?.fields?.Nombre);
    } catch (error) {
        console.log('❌ Error Airtable:', error.message);
        console.log('\n📂 Usando fallback local...');
        
        const fallbackPath = path.join(__dirname, '../..', 'data', 'pois-san-andres.json');
        console.log('Ruta fallback:', fallbackPath);
        console.log('Existe:', fs.existsSync(fallbackPath));
        
        if (fs.existsSync(fallbackPath)) {
            const data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
            console.log('✅ POIs locales:', data.features?.length);
            console.log('Primero:', data.features?.[0]?.properties?.storeName);
        }
    }
};

testAPI();
