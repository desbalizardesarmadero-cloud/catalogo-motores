const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/motores?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    const motores = await response.json();

    // CORRECCIONES vs versión anterior:
    // 1. image_link → image  (Meta Automotive requiere exactamente "image")
    // 2. addr1/city/region/country/postal_code → address (columna combinada que Meta requiere)
    // 3. mileage.value / mileage.unit → mileage (formato "XXXX KM")
    const headers = [
      'id',
      'vehicle_id',
      'title',
      'description',
      'url',
      'image',          // ← era image_link, Meta rechaza ese nombre
      'make',
      'model',
      'year',
      'mileage',        // ← era mileage.value + mileage.unit separados
      'state_of_vehicle',
      'condition',
      'availability',
      'vehicle_type',
      'body_style',
      'transmission',
      'fuel_type',
      'price',
      'dealer_name',
      'dealer_id',
      'address',        // ← era addr1/city/region/country/postal_code separados
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') img = m.fotos || '';

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') || '1' : '1';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;

      // address combinada: "calle, ciudad, provincia, país código-postal"
      const address = 'Santiago del Estero 910, Bolivar, Buenos Aires, AR 6550';

      // mileage combinado: "XXXX KM"
      const mileage = `${km} KM`;

      return [
        m.id,
        m.id,
        title,
        desc,
        url,
        img,
        m.marca || '',
        m.modelo || '',
        year,
        mileage,
        'used',
        'GOOD',
        'available',
        'CAR_TRUCK',
        'OTHER',
        'OTHER',
        'GASOLINE',
        '1 ARS',
        'Desbalizar S.A.',
        'desbalizar-001',
        address,
      ].map(v => String(v == null ? '' : v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(tsv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
