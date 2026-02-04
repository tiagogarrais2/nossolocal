import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Ler o arquivo paises.json
    const filePath = path.join(process.cwd(), "paises.json");
    const fileContents = fs.readFileSync(filePath, "utf8");
    const countriesData = JSON.parse(fileContents);

    // Converter o objeto em array
    const countries = Object.values(countriesData);

    console.log(`API /api/countries: Retornando ${countries.length} países`);

    return Response.json({ countries });
  } catch (error) {
    console.error("Erro na API /api/countries:", error);
    return Response.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
