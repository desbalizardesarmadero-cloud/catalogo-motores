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

    const data = motores.map((m) => {
      // Imagen: Meta espera un array de objetos { url, tag }
      let imageUrl = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) imageUrl = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') imageUrl = m.fotos || '';

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.kilometraje ? parseInt(String(m.kilometraje).replace(/\D/g, ''), 10) || 1 : 1;
      const year = m.anio ? parseInt(String(m.anio), 10) : 2000;
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;

      return {
        vehicle_id: String(m.id),
        title,
        description: desc,
        url,
        // image: array de objetos — formato obligatorio de Meta para catálogo de vehículos
        image: [{ url: imageUrl, tag: ['Car'] }],
        make: m.marca || '',
        model: m.modelo || '',
        year,
        // mileage: objeto con value (número) y unit — formato obligatorio de Meta
        mileage: { value: km, unit: 'KM' },
        state_of_vehicle: 'used',
        condition: 'GOOD',
        availability: 'AVAILABLE',
        vehicle_type: 'CAR_TRUCK',
        body_style: 'OTHER',
        transmission: 'OTHER',
        fuel_type: 'GASOLINE',
        price: '1 ARS',
        dealer_name: 'Desbalizar S.A.',
        dealer_id: 'desbalizar-001',
        // address: objeto con campos separados — formato obligatorio de Meta
        address: {
          addr1: 'Santiago del Estero 910',
          city: 'Bolivar',
          region: 'Buenos Aires',
          country: 'AR',
          postal_code: '6550',
        },
      };
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
