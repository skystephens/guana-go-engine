#!/usr/bin/env node

// Script para verificar conexión a Airtable
import dotenv from 'dotenv';
dotenv.config();

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;

console.log('🔍 Verificando conexión a Airtable...\n');

// 1. Verificar credenciales
console.log('1️⃣  Verificando credenciales:');
console.log(`   BASE_ID: ${BASE_ID ? '✅ ' + BASE_ID.substring(0, 8) + '...' : '❌ No encontrado'}`);
console.log(`   API_KEY: ${API_KEY ? '✅ ' + API_KEY.substring(0, 10) + '...' : '❌ No encontrado'}\n`);

if (!BASE_ID || !API_KEY) {
    console.error('❌ Credenciales incompletas. Por favor configura .env');
    process.exit(1);
}

// 2. Hacer request a Airtable
console.log('2️⃣  Conectando a Airtable API...');

const apiUrl = `https://api.airtable.com/v0/${BASE_ID}/Directorio_Mapa`;
console.log(`   URL: ${apiUrl}\n`);

fetch(apiUrl, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
})
.then(res => {
    console.log(`3️⃣  Respuesta HTTP: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
    }
    
    return res.json();
})
.then(data => {
    console.log(`\n4️⃣  Datos recibidos:\n`);
    
    const records = data.records || [];
    console.log(`   ✅ Total de registros: ${records.length}\n`);
    
    if (records.length === 0) {
        console.log('   ⚠️  No hay registros en la tabla');
        process.exit(0);
    }
    
    // Mostrar resumen de primeros 5 registros
    console.log('📍 Primeros 5 registros:\n');
    records.slice(0, 5).forEach((record, idx) => {
        const fields = record.fields || {};
        const nombre = fields.Nombre || 'Sin nombre';
        const lat = fields.Latitud;
        const lng = fields.Longitud;
        const categoria = fields.Categoria || 'N/A';
        
        const hasCoords = lat && lng ? '✅' : '❌';
        
        console.log(`   ${idx + 1}. ${nombre}`);
        console.log(`      Categoría: ${categoria}`);
        console.log(`      Coordenadas: ${hasCoords} (${lat}, ${lng})`);
        console.log('');
    });
    
    // Verificar registros con coordenadas válidas
    console.log('5️⃣  Análisis de coordenadas:\n');
    
    const cleanCoord = (v) => {
        if (!v) return null;
        const parsed = parseFloat(v.toString().replace(',', '.'));
        return isNaN(parsed) ? null : parsed;
    };
    
    const recordsWithCoords = records.filter(r => {
        const lat = cleanCoord(r.fields?.Latitud);
        const lng = cleanCoord(r.fields?.Longitud);
        return lat && lng && !(lat === 0 && lng === 0);
    });
    
    console.log(`   Total registros: ${records.length}`);
    console.log(`   Con coordenadas válidas: ${recordsWithCoords.length}`);
    console.log(`   Sin coordenadas: ${records.length - recordsWithCoords.length}`);
    
    if (recordsWithCoords.length > 0) {
        console.log(`\n✅ Conexión exitosa. ${recordsWithCoords.length} POIs listos para mostrar.\n`);
    } else {
        console.log(`\n⚠️  Ningún registro tiene coordenadas válidas.\n`);
    }
})
.catch(err => {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${err.message}\n`);
    
    console.log('Posibles causas:');
    console.log('  • Credenciales incorrectas');
    console.log('  • Base ID no existe');
    console.log('  • Tabla "Directorio_Mapa" no existe');
    console.log('  • Sin conexión a internet\n');
    
    process.exit(1);
});
