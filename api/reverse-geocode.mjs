export default async function handler(req, res) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { lat, lon } = req.query || {};
    const latNum = Number(lat);
    const lonNum = Number(lon);

    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      res.status(400).json({ error: 'Parâmetros lat e lon são obrigatórios' });
      return;
    }

    const email = process.env.GEOCODER_EMAIL || '';
    const uaEmail = email ? ` (${email})` : '';
    const userAgent = `contavoto-nominatim-proxy/1.0${uaEmail}`;

    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(latNum));
    url.searchParams.set('lon', String(lonNum));
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '18');

    const nomiResp = await fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        // Optional: provide email header too per policy
        ...(email ? { 'From': email } : {}),
      },
    });

    if (!nomiResp.ok) {
      const text = await nomiResp.text().catch(() => '');
      res.status(nomiResp.status).json({ error: 'Nominatim error', detail: text });
      return;
    }

    const data = await nomiResp.json();
    const addr = data?.address || {};

    // Normalize fields
    const rua = addr.road || addr.residential || addr.pedestrian || addr.street || addr.path || addr.cycleway || '';
    const numero = addr.house_number || '';
    const bairro = addr.suburb || addr.neighbourhood || addr.city_district || '';
    const cidade = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    const estado = addr.state || '';
    const cep = addr.postcode || '';

    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    res.status(200).json({
      rua,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      raw: data,
      fonte: 'nominatim-proxy-v1',
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno', detail: err?.message || String(err) });
  }
}
