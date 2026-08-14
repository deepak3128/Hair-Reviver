const { today } = require('../config/env');
const DAY = 86400000;

function parse(d) {
  const p = String(d || '').split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}

function addDays(d, n) {
  const x = parse(d);
  x.setDate(x.getDate() + n);
  return fmt(x);
}

function addWeeks(d, n) {
  return addDays(d, 7 * n);
}

function fmt(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function daysUntil(d) {
  return Math.round((parse(d) - parse(today())) / DAY);
}

function nextDue(client) {
  return addWeeks(client.lastService, client.cycle);
}

function statusOf(client) {
  const du = daysUntil(nextDue(client));
  return du < 0 ? 'overdue' : du === 0 ? 'due today' : 'active';
}

function thisMonth() {
  return today().slice(0, 7);
}

function prevMonths(n) {
  const out = [];
  const [y, m] = today().slice(0, 7).split('-').map(Number);
  for (let i = 0; i < n; i++) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
  }
  return out;
}

module.exports = { today, parse, addDays, addWeeks, fmt, daysUntil, nextDue, statusOf, thisMonth, prevMonths };
