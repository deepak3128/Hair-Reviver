/* Automatic appointment reminders.
 *  - dueReminders(): appointments that are due for a reminder today
 *    (reminder day = appointment date − reminder.daysBefore), still scheduled
 *    and not yet reminded.
 *  - runReminderCheck(): when WhatsApp Cloud API credentials are configured,
 *    sends each due reminder and stamps reminderSentAt. Without credentials it
 *    is a no-op — the frontend Reminders list offers a one-tap wa.me send.
 */

const { today } = require('../config/env');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');
const { waLink, reminderText, sendWhatsApp } = require('./whatsapp');

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

async function dueReminders() {
  const t = today();
  const appts = await Appointment.find({
    status: 'scheduled',
    'reminder.channel': 'WhatsApp',
    reminderSentAt: null
  }).lean();

  const filtered = appts.filter((a) => {
    const reminderDay = addDays(a.date, -a.reminder.daysBefore);
    return a.date >= t && reminderDay <= t; // reminder day is today or already passed
  });
  const ids = [...new Set(filtered.map((a) => a.clientId))];
  const clients = await Client.find({ id: { $in: ids } }).lean();
  const map = new Map(clients.map((c) => [c.id, c]));

  return filtered.map((a) => {
    const c = map.get(a.clientId) || { name: 'Client', phone: '' };
    return Object.assign({}, a, {
      clientName: c.name,
      phone: c.phone,
      text: reminderText(a, c),
      link: waLink(c.phone, reminderText(a, c))
    });
  });
}

async function runReminderCheck() {
  const token = (process.env.WHATSAPP_TOKEN || '').trim();
  const phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
  if (!token || !phoneId) return; // no credentials — manual send via UI

  const due = await dueReminders();
  for (const a of due) {
    try {
      const res = await sendWhatsApp(a.phone, a.text);
      if (res.sent) {
        await Appointment.updateOne({ id: a.id }, { $set: { reminderSentAt: new Date() } });
        console.log('[reminder] sent to ' + a.phone + ' for ' + a.id);
      }
    } catch (e) {
      console.error('[reminder] failed for ' + a.id + ': ' + e.message);
    }
  }
}

let started = false;
function startReminderScheduler() {
  if (started) return;
  started = true;
  const ms = Math.max(60000, parseInt(process.env.REMINDER_INTERVAL_MS, 10) || 300000);
  setInterval(runReminderCheck, ms).unref();
  console.log('[reminder] scheduler active (every ' + (ms / 60000) + ' min)' +
    ((process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID)
      ? ' — WhatsApp Cloud API auto-send ON'
      : ' — no WhatsApp credentials, manual send only'));
}

module.exports = { dueReminders, runReminderCheck, startReminderScheduler };
