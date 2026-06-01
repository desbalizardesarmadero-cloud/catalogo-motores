// api/feed.js — Feed de vehículos para Meta Catalog
// Vercel la expone en: https://motores.vercel.app/api/feed

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    // Traer todos los motores de Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/motores?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const motores = await response.json();

    // Generar XML en formato Vehicle Catalog de Meta
    const items = motores
      .map((m) => {
        const title = `${m.marca || ""} ${m.modelo || ""}`.trim();
        const description = [
          m.marca && `Marca: ${m.marca}`,
          m.modelo && `Modelo: ${m.modelo}`,
          m.anio && `Año: ${m.anio}`,
          m.cilindrada && `Cilindrada: ${m.cilindrada}`,
          m.codigo_motor && `Código: ${m.codigo_motor}`,
          m.kilometraje && `Kilometraje: ${m.kilometraje} km`,
          "Motor usado original con garantía de funcionamiento.",
        ]
          .filter(Boolean)
          .join(" | ");

        // Primera foto del motor (puede ser array o string)
        let imageUrl = "";
        if (Array.isArray(m.fotos) && m.fotos.length > 0) {
          imageUrl = m.fotos[0];
        } else if (typeof m.fotos === "string" && m.fotos) {
          imageUrl = m.fotos;
        }

        // URL directa al motor en el catálogo
        const motorUrl = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;

        // Kilometraje numérico para Meta (solo dígitos)
        const mileageValue = m.kilometraje
          ? String(m.kilometraje).replace(/\D/g, "")
          : "0";

        return `
    <item>
      <id>${escXml(String(m.id))}</id>
      <title>${escXml(title || "Motor usado")}</title>
      <description>${escXml(description)}</description>
      <condition>used</condition>
      <availability>in stock</availability>
      <link>${escXml(motorUrl)}</link>
      ${imageUrl ? `<image_link>${escXml(imageUrl)}</image_link>` : ""}
      <make>${escXml(m.marca || "")}</make>
      <model>${escXml(m.modelo || "")}</model>
      <year>${escXml(String(m.anio || ""))}</year>
      <mileage>
        <value>${mileageValue}</value>
        <unit>KM</unit>
      </mileage>
      <vehicle_type>car</vehicle_type>
      <body_style>other</body_style>
      <drivetrain>other</drivetrain>
      <fuel_type>gasoline</fuel_type>
      <transmission>other</transmission>
      <price>0 ARS</price>
      <sale_price>0 ARS</sale_price>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Desbalizar S.A. — Catálogo de Motores</title>
    <link>https://catalogo-motores.vercel.app</link>
    <description>Motores usados originales con garantía de funcionamiento. Bolívar, Bs.As.</description>
    ${items}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    // Cache 1 hora — Meta lo actualiza cada 24hs de todas formas
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ error: err.message });
  }
}

function escXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
