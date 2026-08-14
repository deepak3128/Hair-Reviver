/* WhatsApp deep-link helpers (no external API needed — opens a chat with a pre-filled message). */
import { UT } from './data';

export function waPhone(phone){
  var digits = String(phone || '').replace(/[^\d]/g, '');
  if (digits.length === 10) digits = '91' + digits;
  if (digits.length === 12 && digits.slice(0, 2) === '91') digits = digits;
  if (digits.length > 0 && digits[0] === '0') digits = '91' + digits.slice(1);
  return digits;
}

export function waLink(phone, text){
  return 'https://wa.me/' + waPhone(phone) + '?text=' + encodeURIComponent(text);
}

export function openWhatsApp(phone, text){
  window.open(waLink(phone, text), '_blank');
}

export function apptReminder(c, a){
  var first = String(c.name || '').split(' ')[0];
  return 'Hi ' + first + ', this is Hair Reviver Clinic. Reminder: your ' +
    String(a.service).toLowerCase() + ' appointment is on ' + UT.fmtDate(a.date) +
    ' at ' + a.time + '. Please be on time. See you soon!';
}

export function invoiceMsg(c, inv){
  var first = String(c.name || '').split(' ')[0];
  var due = inv.total - inv.paid;
  return 'Hi ' + first + ', this is Hair Reviver Clinic. Your invoice ' + inv.id +
    ' (' + UT.fmtINR(inv.total) + ') has a pending balance of ' + UT.fmtINR(due) +
    '. Kindly clear it at the front desk at your earliest. Thank you!';
}

export function clientMsg(c){
  return 'Hi ' + String(c.name || '').split(' ')[0] + ', this is Hair Reviver Clinic. ' +
    'Your hair patch maintenance is due soon. Please book your next visit. Thank you!';
}
