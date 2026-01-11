#!/usr/bin/env node

/**
 * Script de verificación de setup para GuanaGo San Andrés
 * 
 * Uso:
 *   node verify-setup.js
 * 
 * Verifica:
 *   ✅ Node.js y NPM instalados
 *   ✅ Archivos necesarios existen
 *   ✅ .env tiene credenciales
 *   ✅ Dependencias instaladas
 *   ✅ Puerto 3000 y 5173 están libres
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

const OK = `${GREEN}✅${RESET}`;
const FAIL = `${RED}❌${RESET}`;
const WARN = `${YELLOW}⚠️ ${RESET}`;
const INFO = `${BLUE}ℹ${RESET}`;

const log = (msg) => console.log(msg);
const logOk = (msg) => log(`${OK} ${msg}`);
const logFail = (msg) => log(`${FAIL} ${msg}`);
const logWarn = (msg) => log(`${WARN} ${msg}`);
const logInfo = (msg) => log(`${INFO} ${msg}`);

const rootPath = __dirname;
const backendPath = path.join(rootPath, 'guanago-backend');
const dataPath = path.join(rootPath, 'data');

log('\n' + '='.repeat(60));
log('🗺️  VERIFICACIÓN DE SETUP - GuanaGo San Andrés');
log('='.repeat(60) + '\n');

let allPassed = true;

// 1. Node.js y NPM
log(`${BLUE}1. Verificando Node.js y NPM...${RESET}`);
try {
  const nodeVersion = execSync('node --version').toString().trim();
  const npmVersion = execSync('npm --version').toString().trim();
  logOk(`Node ${nodeVersion}`);
  logOk(`NPM ${npmVersion}`);
} catch (e) {
  logFail('Node.js o NPM no instalados');
  allPassed = false;
}

// 2. Archivos necesarios
log(`\n${BLUE}2. Verificando archivos...${RESET}`);

const requiredFiles = [
  '.env',
  'data/pois-san-andres.json',
  'public/data/pois-san-andres.json',
  'pages/MapView.tsx',
  'guanago-backend/src/routes/mapa.js',
  'guanago-backend/src/server.js',
];

requiredFiles.forEach(file => {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath)) {
    logOk(`${file}`);
  } else {
    logFail(`${file} - NO ENCONTRADO`);
    allPassed = false;
  }
});

// 3. Variables de entorno
log(`\n${BLUE}3. Verificando .env...${RESET}`);

try {
  const envPath = path.join(rootPath, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const checks = {
    'AIRTABLE_API_KEY': envContent.includes('AIRTABLE_API_KEY'),
    'AIRTABLE_BASE_ID': envContent.includes('AIRTABLE_BASE_ID'),
    'MAPBOX_API_KEY': envContent.includes('MAPBOX_API_KEY'),
  };
  
  Object.entries(checks).forEach(([key, exists]) => {
    if (exists) {
      logOk(`${key}`);
    } else {
      logFail(`${key} - FALTA EN .env`);
      allPassed = false;
    }
  });
} catch (e) {
  logFail('.env no encontrado');
  allPassed = false;
}

// 4. Dependencias
log(`\n${BLUE}4. Verificando dependencias...${RESET}`);

try {
  const pkgPath = path.join(rootPath, 'package.json');
  if (fs.existsSync(path.join(rootPath, 'node_modules'))) {
    logOk('node_modules/ (Frontend)');
  } else {
    logWarn('node_modules/ (Frontend) - Ejecuta: npm install');
  }
  
  const backendPkgPath = path.join(backendPath, 'package.json');
  if (fs.existsSync(path.join(backendPath, 'node_modules'))) {
    logOk('guanago-backend/node_modules/ (Backend)');
  } else {
    logWarn('guanago-backend/node_modules/ (Backend) - Ejecuta: cd guanago-backend && npm install');
  }
} catch (e) {
  logWarn('No se pudo verificar node_modules');
}

// 5. Estructura de POIs
log(`\n${BLUE}5. Verificando datos de POIs...${RESET}`);

try {
  const poisPath = path.join(dataPath, 'pois-san-andres.json');
  const poiData = JSON.parse(fs.readFileSync(poisPath, 'utf8'));
  const count = poiData.features?.length || 0;
  logOk(`POIs cargados: ${count} lugares`);
  
  if (count > 0) {
    const sample = poiData.features[0].properties.storeName;
    logInfo(`  Ejemplo: "${sample}"`);
  }
} catch (e) {
  logFail(`POIs: ${e.message}`);
  allPassed = false;
}

// 6. Puertos disponibles
log(`\n${BLUE}6. Verificando puertos...${RESET}`);

const checkPort = (port) => {
  try {
    execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
    return false; // Puerto en uso
  } catch {
    return true; // Puerto libre
  }
};

const port3000 = checkPort(3000);
const port5173 = checkPort(5173);

if (port3000) {
  logOk('Puerto 3000 (Backend) - LIBRE');
} else {
  logWarn('Puerto 3000 (Backend) - OCUPADO. Termina proceso: taskkill /PID ... /F');
}

if (port5173) {
  logOk('Puerto 5173 (Frontend) - LIBRE');
} else {
  logWarn('Puerto 5173 (Frontend) - OCUPADO');
}

// SUMMARY
log(`\n${'='.repeat(60)}`);
if (allPassed) {
  log(`${GREEN}🎉 SETUP LISTO PARA EJECUTAR${RESET}\n`);
  log('Próximos pasos:\n');
  log(`  1. Terminal 1 - Backend:`);
  log(`     cd guanago-backend`);
  log(`     npm start\n`);
  log(`  2. Terminal 2 - Frontend:`);
  log(`     npm run dev\n`);
  log(`  3. Abre en navegador: http://localhost:5173`);
  log(`     Navega a MapView para ver el mapa de San Andrés\n`);
} else {
  log(`${RED}⚠️  REVISAR ERRORES ARRIBA${RESET}\n`);
  log('Pasos de corrección:\n');
  log('  1. Asegúrate de que .env tiene credenciales de Airtable y Mapbox');
  log('  2. Ejecuta: npm install (en raíz)');
  log('  3. Ejecuta: cd guanago-backend && npm install');
  log('  4. Verifica que archivos POIs existan:\n');
  log(`     - data/pois-san-andres.json`);
  log(`     - public/data/pois-san-andres.json\n`);
}
log('='.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
