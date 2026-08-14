/* WhatsApp sending — two modes:
 *   1. WhatsApp Cloud API (Meta): real automatic sending. Requires
 *      WHATSAPP_TOKEN + WHATSAPP_PHONE_ID in backend/.env.
 *   2. Fallback: no credentials → returns a wa.me deep link so staff can send
 *      with one tap (message pre-filled). No API key, no cost.
 */

function waPhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  else if (digits.length > 10 && digits[0] === '0') digits = '91' + digits.slice(1);
  return digits;
}

function waLink(phone, text) {
  return 'https://wa.me/' + waPhone(phone) + '?text=' + encodeURIComponent(text);
}

function reminderText(appt, client) {
  const first = String(client.name || '').split(' ')[0];
  const pretty = String(appt.date)
    .split('-')
    .reverse()
    .join('-');
  return (
    'Hi ' + first + ', this is Hair Reviver Clinic. Reminder: your ' +
    String(appt.service).toLowerCase() + ' appointment is on ' + pretty +
    ' at ' + (appt.time || 'your usual time') + '. Please be on time. See you soon!'
  );
}

async function sendWhatsApp(phone, text) {
  const token = (process.env.WHATSAPP_TOKEN || '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  const to = waPhone(phone);

  if (!token || !phoneId) {
    return { sent: false, reason: 'no-creds', link: waLink(phone, text) };
  }

  const res = await fetch('https://graph.facebook.com/v19.0/' + phoneId + '/messages', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error('WhatsApp API error ' + res.status + ': ' + detail.slice(0, 200));
  }
  return { sent: true, to: to };
}

module.exports = { waPhone, waLink, reminderText, sendWhatsApp };
