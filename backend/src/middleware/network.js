/*
 * Clinic-network gate.
 *
 * Front Desk (staff) and Technician accounts are only allowed to use the CRM
 * when the request comes from the clinic Wi-Fi / LAN, identified by client IP.
 * Owner / Admin is never restricted and can work from anywhere.
 *
 * The gate is OFF by default so the app works from anywhere (localhost, Vercel,
 * Render). To enforce it, set CLINIC_NETWORKS to a comma-separated list of
 * CIDRs (e.g. "192.168.1.0/24"). A value of "*", "all", "0.0.0.0/0" or "::/0"
 * keeps it off.
 */

function parseNetworks() {
  const raw = (process.env.CLINIC_NETWORKS || '').trim();
  if (!raw) return null;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const open = list.some((s) => {
    const v = s.toLowerCase();
    return v === '*' || v === 'all' || v === '0.0.0.0/0' || v === '::/0';
  });
  return open ? null : list;
}

function normalizeIp(ip) {
  if (!ip) return null;
  ip = String(ip).trim().replace(/^\[|\]$/g, '');
  // "localhost" resolves to the IPv6 loopback ::1 first on most systems.
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return '127.0.0.1';
  const m = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return m ? m[1] : ip;
}

function ipToLong(ip) {
  const p = ip.split('.');
  if (p.length !== 4) return null;
  const n = +p[0], o = +p[1], q = +p[2], r = +p[3];
  if ([n, o, q, r].some((x) => isNaN(x) || x < 0 || x > 255)) return null;
  return ((n << 24) | (o << 16) | (q << 8) | r) >>> 0;
}

function ipInCidr(ip, cidr) {
  const parts = cidr.split('/');
  const bits = parts[1] !== undefined ? parseInt(parts[1], 10) : 32;
  const ipL = ipToLong(normalizeIp(ip));
  const netL = ipToLong(normalizeIp(parts[0]));
  if (ipL == null || netL == null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipL & mask) === (netL & mask);
}

function isAllowed(ip) {
  const networks = parseNetworks();
  if (!networks) return true;
  return networks.some((cidr) => ipInCidr(ip, cidr));
}

function clinicOnly(req, res, next) {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'technician')) {
    if (!isAllowed(req.ip)) {
      return res.status(403).json({
        error: 'Front Desk and Technician accounts can only be used from the clinic network (clinic Wi-Fi).'
      });
    }
  }
  next();
}

module.exports = { clinicOnly, isAllowed };
