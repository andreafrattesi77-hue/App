const SYSTEME_IO_API_KEY =
  process.env.SYSTEME_IO_API_KEY ||
  'aglqtfw4ilfr1z33q4b8zwc2d230eby743pyhh1gh82octrjcaufchhbsoqqzlcc';
const SYSTEME_IO_TAG_ID = 2247225; // Tag "Prova Gratuita App"

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo non consentito' });
    return;
  }

  const { name, email } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
    res.status(400).json({ error: 'Nome ed email valida sono obbligatori.' });
    return;
  }

  try {
    let contactId: number | null = null;
    let alreadyExisted = false;

    // 1. Crea o recupera contatto su Systeme.io
    const createRes = await fetch('https://api.systeme.io/api/contacts', {
      method: 'POST',
      headers: {
        'X-API-Key': SYSTEME_IO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        fields: [{ slug: 'first_name', value: cleanName }],
      }),
    });

    const createBodyText = await createRes.text().catch(() => '');

    if (createRes.ok) {
      try {
        const data = JSON.parse(createBodyText);
        contactId = data?.id || null;
      } catch {}
    } else {
      // Se il contatto esiste già (422)
      if (createRes.status === 422 || createBodyText.includes('already used')) {
        alreadyExisted = true;
        const searchRes = await fetch(
          `https://api.systeme.io/api/contacts?email=${encodeURIComponent(cleanEmail)}`,
          {
            headers: {
              'X-API-Key': SYSTEME_IO_API_KEY,
              'Accept': 'application/json',
            },
          }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json().catch(() => ({}));
          if (Array.isArray(searchData.items) && searchData.items.length > 0) {
            contactId = searchData.items[0].id;
          }
        }
      }
    }

    // 2. Assegna Tag "Prova Gratuita App"
    if (contactId) {
      await fetch(`https://api.systeme.io/api/contacts/${contactId}/tags`, {
        method: 'POST',
        headers: {
          'X-API-Key': SYSTEME_IO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tagId: SYSTEME_IO_TAG_ID }),
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      systemeIoSynced: !!contactId,
      systemeIoContactId: contactId,
      systemeIoAlreadyExisted: alreadyExisted,
      trialCoachQuestionsUsed: 0,
      trialCoachRemaining: 3,
    });
  } catch (err: any) {
    console.error('Systeme.io sync error:', err);
    res.status(200).json({
      success: true,
      systemeIoSynced: false,
      trialCoachQuestionsUsed: 0,
      trialCoachRemaining: 3,
    });
  }
}
