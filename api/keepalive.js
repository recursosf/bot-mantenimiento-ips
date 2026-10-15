const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Consulta mínima a la base de datos. Vercel la ejecuta una vez al día (ver vercel.json)
// para que Supabase no pause el proyecto por inactividad.
module.exports = async (req, res) => {
  try {
    const { error } = await supabase.from('usuarios').select('telegram_id', { head: true, count: 'exact' });
    if (error) throw error;
    return res.status(200).send('ok');
  } catch (e) {
    console.error('Keepalive error:', e?.message || e);
    return res.status(500).send('error');
  }
};
