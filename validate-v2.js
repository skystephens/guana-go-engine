#!/usr/bin/env node

/**
 * Validación rápida de cambios Mapa v2
 * Verifica que MapView y POIDetail estén correctamente integrados
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

const OK = `${GREEN}✅${RESET}`;
const FAIL = `${RED}❌${RESET}`;
const WARN = `${YELLOW}⚠️${RESET}`;

const log = (msg) => console.log(msg);
const logOk = (msg) => log(`${OK} ${msg}`);
const logFail = (msg) => log(`${FAIL} ${msg}`);
const logWarn = (msg) => log(`${WARN} ${msg}`);

const rootPath = __dirname;

log('\n' + '='.repeat(60));
log('🗺️  VALIDACIÓN - Mapa San Andrés v2');
log('='.repeat(60) + '\n');

let allPassed = true;

// 1. Verificar archivos nuevos
log(`${BLUE}1. Archivos nuevos creados...${RESET}`);
const newFiles = [
  'pages/POIDetail.tsx',
  'MEJORAS_v2.md',
];

newFiles.forEach(file => {
  const filePath = path.join(rootPath, file);
  if (fs.existsSync(filePath)) {
    logOk(file);
  } else {
    logFail(`${file} - NO ENCONTRADO`);
    allPassed = false;
  }
});

// 2. Verificar cambios en archivos clave
log(`\n${BLUE}2. Cambios en archivos clave...${RESET}`);

try {
  const appContent = fs.readFileSync(path.join(rootPath, 'App.tsx'), 'utf8');
  if (appContent.includes('import POIDetail')) {
    logOk('App.tsx - import POIDetail ✓');
  } else {
    logFail('App.tsx - falta import POIDetail');
    allPassed = false;
  }

  if (appContent.includes('AppRoute.POI_DETAIL')) {
    logOk('App.tsx - caso POI_DETAIL en switch ✓');
  } else {
    logFail('App.tsx - falta caso POI_DETAIL');
    allPassed = false;
  }

  if (appContent.includes('onSelectPOI')) {
    logOk('App.tsx - callback onSelectPOI ✓');
  } else {
    logFail('App.tsx - falta callback onSelectPOI');
    allPassed = false;
  }
} catch (e) {
  logFail(`App.tsx: ${e.message}`);
  allPassed = false;
}

// 3. Verificar tipos
log(`\n${BLUE}3. Tipos TypeScript...${RESET}`);

try {
  const typesContent = fs.readFileSync(path.join(rootPath, 'types.ts'), 'utf8');
  if (typesContent.includes('POI_DETAIL')) {
    logOk('types.ts - AppRoute.POI_DETAIL ✓');
  } else {
    logFail('types.ts - falta POI_DETAIL');
    allPassed = false;
  }
} catch (e) {
  logFail(`types.ts: ${e.message}`);
  allPassed = false;
}

// 4. Verificar MapView actualizado
log(`\n${BLUE}4. MapView.tsx actualizado...${RESET}`);

try {
  const mapViewContent = fs.readFileSync(path.join(rootPath, 'pages/MapView.tsx'), 'utf8');
  
  if (mapViewContent.includes('sidebarOpen')) {
    logOk('MapView - sidebar colapsable ✓');
  } else {
    logFail('MapView - falta sidebar colapsable');
    allPassed = false;
  }

  if (mapViewContent.includes('categoryFilter')) {
    logOk('MapView - filtro por categoría ✓');
  } else {
    logFail('MapView - falta filtro por categoría');
    allPassed = false;
  }

  if (mapViewContent.includes('onSelectPOI')) {
    logOk('MapView - prop onSelectPOI ✓');
  } else {
    logFail('MapView - falta prop onSelectPOI');
    allPassed = false;
  }

  if (mapViewContent.includes('Ver Detalles')) {
    logOk('MapView - botón Ver Detalles ✓');
  } else {
    logFail('MapView - falta botón Ver Detalles');
    allPassed = false;
  }
} catch (e) {
  logFail(`MapView.tsx: ${e.message}`);
  allPassed = false;
}

// 5. Verificar backend mapa.js
log(`\n${BLUE}5. Backend mapa.js actualizado...${RESET}`);

try {
  const mapaContent = fs.readFileSync(path.join(rootPath, 'guanago-backend/src/routes/mapa.js'), 'utf8');
  
  if (mapaContent.includes('fetch(')) {
    logOk('mapa.js - usa fetch nativo ✓');
  } else {
    logFail('mapa.js - sigue usando axios');
    allPassed = false;
  }

  if (mapaContent.includes('Airtable')) {
    logOk('mapa.js - conecta a Airtable ✓');
  } else {
    logFail('mapa.js - no menciona Airtable');
    allPassed = false;
  }

  if (mapaContent.includes('Descripcion')) {
    logOk('mapa.js - mapea campo Descripcion ✓');
  } else {
    logFail('mapa.js - no mapea Descripcion');
  }

  if (mapaContent.includes('Horario')) {
    logOk('mapa.js - mapea campo Horario ✓');
  } else {
    logFail('mapa.js - no mapea Horario');
  }

  if (mapaContent.includes('loadLocalFallback')) {
    logOk('mapa.js - tiene fallback local ✓');
  } else {
    logFail('mapa.js - falta fallback local');
    allPassed = false;
  }
} catch (e) {
  logFail(`mapa.js: ${e.message}`);
  allPassed = false;
}

// 6. POIDetail.tsx
log(`\n${BLUE}6. POIDetail.tsx...${RESET}`);

try {
  const poiDetailContent = fs.readFileSync(path.join(rootPath, 'pages/POIDetail.tsx'), 'utf8');
  
  if (poiDetailContent.includes('activeTab')) {
    logOk('POIDetail - tabs (info, fotos, reseñas) ✓');
  } else {
    logFail('POIDetail - falta tabs');
    allPassed = false;
  }

  if (poiDetailContent.includes('📞 Llamar')) {
    logOk('POIDetail - botón llamada ✓');
  } else {
    logFail('POIDetail - falta botón llamada');
  }

  if (poiDetailContent.includes('📅 Hacer una Reserva')) {
    logOk('POIDetail - botón reserva ✓');
  } else {
    logFail('POIDetail - falta botón reserva');
  }

  if (poiDetailContent.includes('🗺️ Cómo Llegar')) {
    logOk('POIDetail - botón directions ✓');
  } else {
    logFail('POIDetail - falta botón directions');
  }
} catch (e) {
  logFail(`POIDetail.tsx: ${e.message}`);
  allPassed = false;
}

// SUMMARY
log(`\n${'='.repeat(60)}`);
if (allPassed) {
  log(`${GREEN}✅ VALIDACIÓN COMPLETADA - TODO LISTO${RESET}\n`);
  log('Próximos pasos:\n');
  log('  1. Terminal Backend:');
  log('     cd guanago-backend');
  log('     npm start\n');
  log('  2. Terminal Frontend:');
  log('     npm run dev\n');
  log('  3. Pruebas:');
  log('     - Abre MapView');
  log('     - Verifica que carga 31 POIs (o tu cantidad real)');
  log('     - Clickea categoría en sidebar para filtrar');
  log('     - Clickea POI → popup');
  log('     - Clickea "Ver Detalles" → página POIDetail\n');
} else {
  log(`${RED}⚠️  REVISAR ERRORES ARRIBA${RESET}\n`);
}
log('='.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
