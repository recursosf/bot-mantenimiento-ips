const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// IDs de Telegram de los administradores, separados por coma, en la variable
// de entorno ADMIN_TELEGRAM_IDS. Ej: "123456789,987654321"
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isAdmin(id) {
  return ADMIN_IDS.includes(String(id));
}

async function getEstado(telegramId) {
  const { data } = await supabase
    .from('conversacion_estado')
    .select('*')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return data;
}

async function setEstado(telegramId, paso, datos = {}) {
  await supabase
    .from('conversacion_estado')
    .upsert({ telegram_id: telegramId, paso, datos, updated_at: new Date().toISOString() });
}

async function limpiarEstado(telegramId) {
  await supabase.from('conversacion_estado').delete().eq('telegram_id', telegramId);
}

async function getUsuario(telegramId) {
  const { data } = await supabase.from('usuarios').select('*').eq('telegram_id', telegramId).maybeSingle();
  return data;
}

bot.start(async (ctx) => {
  const usuario = await getUsuario(ctx.from.id);
  if (usuario) {
    return ctx.reply(`Hola de nuevo, ${usuario.nombre}. Usa /reportar para crear una solicitud de mantenimiento.`);
  }
  await setEstado(ctx.from.id, 'registro_nombre');
  ctx.reply(
    'Bienvenido al bot de reportes de mantenimiento de la IPS Municipal de Ipiales.\n\n¿Cuál es tu nombre completo?'
  );
});

bot.command('reportar', async (ctx) => {
  const usuario = await getUsuario(ctx.from.id);
  if (!usuario) return ctx.reply('Primero debes registrarte con /start');
  await setEstado(ctx.from.id, 'reportar_tipo', { puesto_salud: usuario.puesto_salud });
  ctx.reply('¿Qué tipo de solicitud es?\n1️⃣ Infraestructura\n2️⃣ Equipo biomédico\n\nResponde con 1 o 2.');
});

bot.command('mis_reportes', async (ctx) => {
  const { data } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('telegram_id', ctx.from.id)
    .order('created_at', { ascending: false })
    .limit(10);
  if (!data || data.length === 0) return ctx.reply('No tienes reportes registrados.');
  const lista = data
    .map((s) => `#${s.id.slice(0, 8)} · ${s.tipo} · ${s.estado} · ${new Date(s.created_at).toLocaleDateString()}`)
    .join('\n');
  ctx.reply(`Tus últimos reportes:\n\n${lista}`);
});

bot.command('pendientes', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('Este comando es solo para administradores.');
  const { data } = await supabase
    .from('solicitudes')
    .select('*')
    .neq('estado', 'resuelto')
    .order('created_at', { ascending: true });
  if (!data || data.length === 0) return ctx.reply('No hay solicitudes pendientes. 🎉');
  const lista = data
    .map((s) => {
      const asignacion = s.asignado_a ? `asignada a ${s.asignado_a}` : 'sin asignar';
      return `#${s.id.slice(0, 8)} · ${s.puesto_salud} · ${s.tipo} · prioridad ${s.prioridad} · ${s.estado} (${asignacion})\n${s.descripcion}`;
    })
    .join('\n\n');
  ctx.reply(
    `Solicitudes pendientes:\n\n${lista}\n\nUsa /asignar <id_corto> <id_telegram_operario> para asignarla, o /estado <id_corto> <en_proceso|resuelto> para actualizarla.`
  );
});

bot.command('operarios', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('Este comando es solo para administradores.');
  const { data } = await supabase.from('usuarios').select('*').eq('rol', 'operario');
  if (!data || data.length === 0) {
    return ctx.reply(
      'No hay operarios registrados todavía.\n\nPara agregar uno: pídele que le escriba /start a este bot, consigue su ID con @userinfobot, y luego usa /hacer_operario <id_telegram>.'
    );
  }
  const lista = data.map((u) => `${u.telegram_id} · ${u.nombre} (${u.puesto_salud || 'sin puesto'})`).join('\n');
  ctx.reply(`Operarios registrados:\n\n${lista}`);
});

bot.command('hacer_operario', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('Este comando es solo para administradores.');
  const partes = ctx.message.text.split(' ').filter(Boolean);
  if (partes.length < 2) return ctx.reply('Uso: /hacer_operario <id_telegram>');
  const idOperario = partes[1];
  const usuario = await getUsuario(idOperario);
  if (!usuario) {
    return ctx.reply('Ese usuario todavía no se ha registrado con /start en el bot. Pídele que lo haga primero.');
  }
  await supabase.from('usuarios').update({ rol: 'operario' }).eq('telegram_id', idOperario);
  ctx.reply(`${usuario.nombre} (${idOperario}) ahora es operario.`);
  try {
    await bot.telegram.sendMessage(
      idOperario,
      '🔧 Has sido registrado como operario de mantenimiento. Cuando te asignen una solicitud te va a llegar un mensaje aquí. Usa /mis_asignadas para verlas.'
    );
  } catch (e) {
    /* el usuario pudo haber bloqueado el bot */
  }
});

bot.command('asignar', async (ctx) => {
  if (!isAdmin(ctx.from.id)) return ctx.reply('Este comando es solo para administradores.');
  const partes = ctx.message.text.split(' ').filter(Boolean);
  if (partes.length < 3) return ctx.reply('Uso: /asignar <id_corto> <id_telegram_operario>');
  const [, idCorto, idOperario] = partes;

  const operario = await getUsuario(idOperario);
  if (!operario) return ctx.reply('Ese ID no corresponde a un usuario registrado. Pídele que use /start primero.');

  const { data: solicitudes } = await supabase.from('solicitudes').select('*');
  const solicitud = (solicitudes || []).find((s) => s.id.startsWith(idCorto));
  if (!solicitud) return ctx.reply('No encontré una solicitud con ese id.');

  await supabase
    .from('solicitudes')
    .update({ asignado_a: idOperario, estado: 'en_proceso', updated_at: new Date().toISOString() })
    .eq('id', solicitud.id);

  ctx.reply(`Solicitud #${idCorto} asignada a ${operario.nombre}.`);

  try {
    await bot.telegram.sendMessage(
      idOperario,
      `🔧 Te asignaron una solicitud:\n#${idCorto}\n📍 ${solicitud.puesto_salud}\n🏷️ ${solicitud.tipo}\n⚠️ Prioridad: ${solicitud.prioridad}\n📝 ${solicitud.descripcion}\n\nCuando la resuelvas, escribe:\n/estado ${idCorto} resuelto`
    );
  } catch (e) {
    /* operario pudo haber bloqueado el bot */
  }

  try {
    await bot.telegram.sendMessage(
      solicitud.telegram_id,
      `📢 Tu solicitud #${idCorto} fue asignada a un operario y está en proceso.`
    );
  } catch (e) {
    /* reportante pudo haber bloqueado el bot */
  }
});

bot.command('mis_asignadas', async (ctx) => {
  const { data } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('asignado_a', ctx.from.id)
    .neq('estado', 'resuelto')
    .order('created_at', { ascending: true });
  if (!data || data.length === 0) return ctx.reply('No tienes solicitudes asignadas pendientes.');
  const lista = data
    .map((s) => `#${s.id.slice(0, 8)} · ${s.puesto_salud} · ${s.tipo} · prioridad ${s.prioridad}\n${s.descripcion}`)
    .join('\n\n');
  ctx.reply(`Tus solicitudes asignadas:\n\n${lista}\n\nUsa /estado <id_corto> resuelto cuando termines una.`);
});

bot.command('estado', async (ctx) => {
  const partes = ctx.message.text.split(' ').filter(Boolean);
  if (partes.length < 3) return ctx.reply('Uso: /estado <id_corto> <en_proceso|resuelto>');
  const [, idCorto, nuevoEstado] = partes;
  if (!['pendiente', 'en_proceso', 'resuelto'].includes(nuevoEstado)) {
    return ctx.reply('Estado inválido. Usa: pendiente, en_proceso o resuelto.');
  }
  const { data: solicitudes } = await supabase.from('solicitudes').select('*');
  const solicitud = (solicitudes || []).find((s) => s.id.startsWith(idCorto));
  if (!solicitud) return ctx.reply('No encontré una solicitud con ese id.');

  const esAdmin = isAdmin(ctx.from.id);
  const esAsignado = solicitud.asignado_a && String(solicitud.asignado_a) === String(ctx.from.id);
  if (!esAdmin && !esAsignado) {
    return ctx.reply('Solo el administrador o el operario asignado pueden cambiar el estado de esta solicitud.');
  }

  await supabase
    .from('solicitudes')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', solicitud.id);

  ctx.reply(`Solicitud #${idCorto} actualizada a "${nuevoEstado}".`);
  try {
    await bot.telegram.sendMessage(
      solicitud.telegram_id,
      `📢 Tu solicitud #${idCorto} (${solicitud.tipo}) cambió de estado a: ${nuevoEstado}`
    );
  } catch (e) {
    /* el usuario pudo haber bloqueado el bot */
  }
});

bot.on('photo', async (ctx) => {
  const estado = await getEstado(ctx.from.id);
  if (!estado || estado.paso !== 'reportar_foto') return;
  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  await guardarSolicitud(ctx, { ...estado.datos, foto_file_id: fileId });
});

bot.on('text', async (ctx) => {
  const texto = ctx.message.text.trim();
  const estado = await getEstado(ctx.from.id);
  if (!estado) return; // sin flujo activo, se ignora el mensaje

  switch (estado.paso) {
    case 'registro_nombre':
      await setEstado(ctx.from.id, 'registro_puesto', { nombre: texto });
      return ctx.reply('¿En qué puesto de salud trabajas?');

    case 'registro_puesto': {
      await supabase.from('usuarios').upsert({
        telegram_id: ctx.from.id,
        nombre: estado.datos.nombre,
        puesto_salud: texto,
        rol: isAdmin(ctx.from.id) ? 'admin' : 'reportante',
      });
      await limpiarEstado(ctx.from.id);
      return ctx.reply(
        `Registro completo, ${estado.datos.nombre}. Usa /reportar para enviar una solicitud de mantenimiento.`
      );
    }

    case 'reportar_tipo': {
      const tipo = texto === '1' ? 'infraestructura' : texto === '2' ? 'equipo_biomedico' : null;
      if (!tipo) return ctx.reply('Responde con 1 (Infraestructura) o 2 (Equipo biomédico).');
      await setEstado(ctx.from.id, 'reportar_descripcion', { ...estado.datos, tipo });
      return ctx.reply('Describe brevemente el problema o la necesidad de mantenimiento.');
    }

    case 'reportar_descripcion':
      await setEstado(ctx.from.id, 'reportar_prioridad', { ...estado.datos, descripcion: texto });
      return ctx.reply('¿Prioridad?\n1️⃣ Alta\n2️⃣ Media\n3️⃣ Baja');

    case 'reportar_prioridad': {
      const prioridad = { '1': 'alta', '2': 'media', '3': 'baja' }[texto];
      if (!prioridad) return ctx.reply('Responde con 1, 2 o 3.');
      await setEstado(ctx.from.id, 'reportar_foto', { ...estado.datos, prioridad });
      return ctx.reply('Si tienes una foto del problema, envíala ahora. Si no, escribe "no".');
    }

    case 'reportar_foto':
      if (texto.toLowerCase() === 'no') return guardarSolicitud(ctx, estado.datos);
      return ctx.reply('Envía la foto o escribe "no" para continuar sin foto.');

    default:
      return;
  }
});

async function guardarSolicitud(ctx, datos) {
  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      telegram_id: ctx.from.id,
      puesto_salud: datos.puesto_salud,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      prioridad: datos.prioridad,
      foto_file_id: datos.foto_file_id || null,
      estado: 'pendiente',
    })
    .select()
    .single();

  await limpiarEstado(ctx.from.id);

  if (error) {
    console.error(error);
    return ctx.reply('Hubo un error guardando tu solicitud. Intenta de nuevo con /reportar.');
  }

  await ctx.reply(`✅ Solicitud registrada (#${data.id.slice(0, 8)}). Te avisaremos cuando cambie de estado.`);

  const { data: admins } = await supabase.from('usuarios').select('telegram_id').eq('rol', 'admin');
  for (const admin of admins || []) {
    try {
      await bot.telegram.sendMessage(
        admin.telegram_id,
        `🆕 Nueva solicitud #${data.id.slice(0, 8)}\n📍 ${data.puesto_salud}\n🔧 ${data.tipo}\n⚠️ Prioridad: ${data.prioridad}\n📝 ${data.descripcion}`
      );
    } catch (e) {
      /* admin pudo haber bloqueado el bot */
    }
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('Bot activo ✅');
  try {
    await bot.handleUpdate(req.body, res);
  } catch (e) {
    console.error(e);
  }
  if (!res.headersSent) res.status(200).send('ok');
};
