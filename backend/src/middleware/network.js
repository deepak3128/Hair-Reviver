/*
 * Clinic-network gate.
 *
 * Front Desk (staff) and Technician accounts are only allowed to use the CRM
 * when the request comes from the clinic Wi-Fi / LAN, identified by client IP.
 * Owner / Admin is never restricted and can work from anywhere.
 *
 * Allowed networks are configured with the CLINIC_NETWORKS env var
 * (comma-separated CIDRs). Defaults to the private LAN ranges plus localhost
 * so local development works out of the box.
 */

function parseNetworks() {
  const raw = (process.env.CLINIC_NETWORKS || '').trim();
  if (raw) return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '127.0.0.0/8'];
}

function normalizeIp(ip) {
  if (!ip) return null;
  ip = String(ip).trim();
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
  return parseNetworks().some((cidr) => ipInCidr(ip, cidr));
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
