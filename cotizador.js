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

async function generarCotizacion(mensajesAnteriores, preciosAirtable) {
  // 1. AUMENTAMOS EL LÍMITE: Ahora que los datos son limpios, enviamos hasta 40 servicios
  const serviciosValidos = preciosAirtable
    .filter(s => s.precio > 0 && s.servicio)
    .slice(0, 40);

  const ahora = new Date();
  const fechaHoy = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaUsuario = "fecha deseada";

  // 1. Convertimos el historial en texto para que la IA lo lea
  const contextoHistorial = mensajesAnteriores.map(m => 
    `${m.role === 'user' ? 'Turista' : 'Guana Go'}: ${m.content}`
  ).join('\n');

  const prompt = `
    Eres Guana Go, el anfitrión oficial de San Andrés. 🌴
    
    🚨 REGLA DE ORO #1 (PROHIBIDO OLVIDAR): 
    - HOY ES ${fechaHoy}.
    - NO SE PUEDE RESERVAR NADA PARA HOY. NADA. 
    - Si el usuario pregunta por "hoy", tu respuesta DEBE EMPEZAR así: "¡Hola! Qué nota que nos escribas, pero por logística y seguridad, las reservas de hoy ya están cerradas 🚫. ¡Pero no te preocupes, que para mañana o el resto de tu viaje estamos listos!"

    📅 REGLA DE ORO #2 (CALENDARIO DE NOCHE BLANCA):
    - La Noche Blanca (Caribbean Night) SOLO OPERA LOS VIERNES. 
    - Si hoy es viernes ${fechaHoy}, la próxima Noche Blanca disponible es el PRÓXIMO VIERNES. 
    - NO digas que opera todos los días. Es un evento exclusivo de los viernes.

     CÁLCULO DE GRUPO (2 Adultos + 1 Niño de 4 años):
    - 2 Adultos: $585.000 COP
    - 1 Niño (4 años entra en tarifa 3-8 años): $224.250 COP
    - TOTAL: $809.250 COP. (Muestra siempre el total sumado).

    💬 COMPORTAMIENTO:
    - No repitas lo que ya hablamos. 
    - Si el usuario pregunta por el 28 de diciembre (que es domingo), dile: "El 28 es domingo y la Noche Blanca es solo los viernes. ¿Te gustaría el Yate Rumba para ese domingo?"

    HISTORIAL:
    ${contextoHistorial}

    INVENTARIO:
    ${JSON.stringify(serviciosValidos.slice(0, 30))}
  `;

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

        // Adaptamos la entrada simple a un historial para la nueva función
        const historial = [{ role: 'user', content: preguntaCliente }];

        // 2. Llamar a la función de Gemini que creamos en el paso anterior
        // Pasa el historial y los precios reales
        const cotizacion = await generarCotizacion(historial, serviciosLimpios);
        return cotizacion;
    } catch (error) {
        console.error("❌ Error en el proceso:", error);
        // Propagamos el error para que el endpoint /cotizar lo capture
        throw error;
    }
}

// Prueba el cotizador:
 //ejecutarCotizadorReal("Hola, somos 20 personas, ¿cuánto nos sale el tour CocoART BASIC?");