/* API client — talks to the Express backend on the same origin (/api). */

var TOKEN_KEY = 'hr-token';

export function getToken(){ return localStorage.getItem(TOKEN_KEY); }
export function setToken(t){ if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); }

var onUnauthorized = null;
export function setAuthHandler(fn){ onUnauthorized = fn; }

var REQUEST_TIMEOUT_MS = 20000;

async function request(method, path, body){
  var headers = { 'Content-Type': 'application/json' };
  var t = getToken();
  if (t) headers.Authorization = 'Bearer ' + t;
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timer = controller ? setTimeout(function(){ controller.abort(); }, REQUEST_TIMEOUT_MS) : null;
  var res;
  try {
    res = await fetch('/api' + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      throw new Error('The clinic server did not respond. Make sure the API is running, then try again.');
    }
    throw new Error('Cannot reach the clinic server. Check that the API is running, then try again.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  var data = null;
  try { data = await res.json(); } catch (e) {}
  if (res.status === 401 && onUnauthorized) onUnauthorized(data);
  if (!res.ok){
    var msg = (data && data.error) ? data.error : ('Request failed (' + res.status + ')');
    var err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const API = {
  get: function(p){ return request('GET', p); },
  post: function(p, b){ return request('POST', p, b); },
  put: function(p, b){ return request('PUT', p, b); },
  patch: function(p, b){ return request('PATCH', p, b); },
  del: function(p){ return request('DELETE', p); }
};

export async function login(email, password){
  var res = await request('POST', '/auth/login', { email: email, password: password });
  setToken(res.token);
  return res.user;
}
export async function logout(){ setToken(null); }
export async function me(){ return request('GET', '/auth/me'); }

export async function loadAll(){
  var [clients, appts, invoices, inventory, purchases, roles] = await Promise.all([
    API.get('/clients'),
    API.get('/appointments'),
    API.get('/invoices'),
    API.get('/inventory'),
    API.get('/inventory/purchases'),
    API.get('/roles')
  ]);
  return {
    clients: clients.clients,
    appointments: appts.appointments,
    invoices: invoices.invoices,
    inventory: inventory.items,
    purchases: purchases.purchases,
    perms: roles
  };
}
