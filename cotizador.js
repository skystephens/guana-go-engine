import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Airtable from 'airtable';

// Verificación de seguridad: Asegurarse de que las llaves existan
if (!process.env.GEMINI_API_KEY || !process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.error("❌ Error: Faltan variables en el archivo .env. Por favor configura GEMINI_API_KEY, AIRTABLE_API_KEY y AIRTABLE_BASE_ID.");
    process.exit(1);
}

// 1. Configura tu llave (la que sacaste de AI Studio)
// Se utiliza process.env.GEMINI_API_KEY cargada desde el archivo .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generarCotizacion(datosUsuario, preciosAirtable) {
// Este es el modelo que sí "respondió" antes
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Intentamos extraer el número de personas del texto (ej: "20 personas" -> "20")
  const cantidadPersonas = datosUsuario.match(/\d+/)?.[0] || "1";

  // 2. Aquí es donde sucede el RAG: le das la "sabiduría" a la IA
  const prompt = `
  ERES EL AGENTE DE RESERVAS Y LOGÍSTICA DE GUANA GO. Eres un experto en los tours de San Andrés. Tu lógica debe ser precisa.
  
  BASE DE DATOS: ${JSON.stringify(preciosAirtable)}
  CANTIDAD DE PERSONAS: ${cantidadPersonas}

  REGLAS DE OPERACIÓN (SÍGUELAS EN ORDEN):
  1. BÚSQUEDA: Identifica el servicio que el cliente quiere en su pregunta. Búscalo en la BASE DE DATOS usando "servicio" o "nombresAlternativos". Si no lo encuentras, informa que no está disponible y detente.
  
  2. VALIDACIÓN DE DÍA Y HORARIO:
     - DÍAS: Si el cliente menciona un día (ej: "sábado"), verifica si el tour opera ese día usando el campo "diasOperacion". Si no, informa y sugiere los días correctos.
     - HORARIOS: El campo "horarios" contiene las HORAS DE INICIO. Un rango como "9:00 am - 11:00 am" significa que el tour INICIA a las 9:00 am.
     - LÓGICA DE RESERVA: Si el cliente pide una hora que NO es una hora de inicio válida, infórmale amablemente que no es posible y sugiérele las horas de inicio correctas que sí están disponibles. NO ofrezcas una hora que esté dentro de un rango pero que no sea la hora de inicio.

  3. CÁLCULO DE PRECIO: Calcula el costo total con la fórmula: (Precio del servicio x ${cantidadPersonas} personas).
  
  4. FORMATO DE RESPUESTA:
     - Responde de forma amigable, presenta el desglose del cálculo.
     - Incluye la información de días y horarios de INICIO disponibles.
  
  5. BLOQUE DE DATOS OBLIGATORIO: Al final de TODA tu respuesta, genera el bloque [DATA] para el carrito de compras. La estructura debe ser exactamente:
     [DATA]{ "total": VALOR_TOTAL_NUMERICO, "resumen": "NOMBRE_DEL_SERVICIO_COTIZADO" }[/DATA]
     (Si no se pudo cotizar, usa total 0 y un resumen vacío).

  PREGUNTA DEL CLIENTE: "${datosUsuario}"
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text(); // Devolvemos el texto para que el servidor lo use
}

export { generarCotizacion, ejecutarCotizadorReal };

// Configuración de Airtable
// Se utilizan process.env.AIRTABLE_API_KEY y process.env.AIRTABLE_BASE_ID cargadas desde el archivo .env
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID);

async function obtenerPreciosDeAirtable() {
    const registros = await base('ServiciosTuristicos_SAI').select({
        view: "Grid view"
    }).all();

    console.log("=========================================");
    console.log("🔍 DIAGNÓSTICO DE AIRTABLE");
    
    if (registros.length > 0) {
        // Esto nos mostrará los nombres EXACTOS que Airtable reconoce
        const nombresColumnas = Object.keys(registros[0].fields);
        console.log("Tus columnas se llaman EXACTAMENTE así:", nombresColumnas);
        
        // Vamos a ver qué hay en la primera fila para estar seguros
        console.log("Contenido de la primera fila:", registros[0].fields);
    } else {
        console.log("❌ ERROR: No se encontraron registros en la tabla.");
    }
    console.log("=========================================");

    return registros.map(reg => ({
        servicio: reg.get('nombre') || reg.get('Nombre') || reg.get('Servicio') || "Sin nombre",
        nombresAlternativos: reg.get('Nombre alternativo') || reg.get('Nombre Alternativo') || "", // <-- CAMPO RESTAURADO: Clave para búsquedas flexibles.
        precio: reg.get('Precio') || 0,
        capacidad: reg.get('Capacidad') || 0,
        ubicacion: reg.get('Ubicacion') || "San Andrés",
        // --- NUEVOS CAMPOS DE TIEMPO ---
        diasOperacion: reg.get('Días Operación') || "Todos los días",
        horarios: reg.get('Horarios de Operación') || "Consultar horario"
    }));
}

// FUNCIÓN MAESTRA: Une Airtable con Gemini
async function ejecutarCotizadorReal(preguntaCliente) {
    console.log("Consultando precios en tiempo real...");
    
    try {
        // 1. Traer datos frescos de Airtable
        const preciosActuales = await obtenerPreciosDeAirtable();
        
        // Agrega esto para ver en la terminal qué está leyendo de Airtable
        console.log("DATOS RECUPERADOS DE AIRTABLE:", JSON.stringify(preciosActuales, null, 2));

        // 2. Llamar a la función de Gemini que creamos en el paso anterior
        // Pasa la pregunta del cliente y los precios reales
        const cotizacion = await generarCotizacion(preguntaCliente, preciosActuales);
        return cotizacion;
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
        // Propagamos el error para que el endpoint /cotizar lo capture
        throw error;
    }
}

// Prueba el cotizador:
 //ejecutarCotizadorReal("Hola, somos 20 personas, ¿cuánto nos sale el tour CocoART BASIC?");