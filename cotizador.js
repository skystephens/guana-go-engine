import 'dotenv/config';
import Groq from "groq-sdk";
import Airtable from 'airtable';

// Verificación de seguridad: Asegurarse de que las llaves existan
if (!process.env.GROQ_API_KEY || !process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.error("❌ Error: Faltan variables en el archivo .env. Por favor configura GROQ_API_KEY, AIRTABLE_API_KEY y AIRTABLE_BASE_ID.");
    process.exit(1);
}

// 1. Configura tu llave (la que sacaste de AI Studio)
// Se utiliza process.env.GROQ_API_KEY cargada desde el archivo .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generarCotizacion(datosUsuario, preciosAirtable) {
  // Filtramos para enviar solo datos útiles
  const serviciosValidos = preciosAirtable.filter(s => s.precio > 0 && s.servicio);

  const prompt = `Eres Guana Go, experto en San Andrés. 
  Usa este inventario: ${JSON.stringify(serviciosValidos.slice(0, 15))}
  Pregunta del turista: "${datosUsuario}"
  Responde corto, con precios y emojis.`;

  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile", // El modelo más potente de Groq
  });

  return chatCompletion.choices[0].message.content;
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

        // FILTRO: Solo enviamos servicios con precio y nombre válido
        const serviciosLimpios = preciosActuales.filter(s => s.precio > 0 && s.servicio !== "Sin nombre");

        // 2. Llamar a la función de Gemini que creamos en el paso anterior
        // Pasa la pregunta del cliente y los precios reales
        const cotizacion = await generarCotizacion(preguntaCliente, serviciosLimpios);
        return cotizacion;
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
        // Propagamos el error para que el endpoint /cotizar lo capture
        throw error;
    }
}

// Prueba el cotizador:
 //ejecutarCotizadorReal("Hola, somos 20 personas, ¿cuánto nos sale el tour CocoART BASIC?");