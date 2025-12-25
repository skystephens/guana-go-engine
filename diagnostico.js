import 'dotenv/config';

async function listarModelos() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ No se encontró la GEMINI_API_KEY en el archivo .env");
        return;
    }
    
    console.log("🔍 Consultando modelos disponibles para tu API Key...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
        console.error(`❌ Error de conexión: ${response.status} ${response.statusText}`);
        return;
    }

    const data = await response.json();
    console.log("\n✅ Modelos habilitados en tu cuenta:");
    // Filtramos solo los que sirven para generar contenido
    const modelosGenerativos = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    modelosGenerativos.forEach(m => console.log(`   - ${m.name.replace('models/', '')}`));
}

listarModelos();