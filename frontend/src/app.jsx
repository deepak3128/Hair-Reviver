/* app.jsx — root: state store, role-based auth, shell, routing */
import React from 'react';
import DB, { UT } from './lib/data';
import { UI as U } from './lib/ui';
import { API, login, logout, me, setToken, getToken, setAuthHandler, loadAll } from './lib/api';
import { DASH } from './views/dashboard';
import { CLIENTS } from './views/clients';
import { APP } from './views/appointments';
import { OPS } from './views/operations';
import { DEFAULT_PERMS, ROLE_LABEL, HOME } from './lib/permissions';
var Icon = U.Icon, Avatar = U.Avatar, Chip = U.Chip, Btn = U.Btn, Field = U.Field, Input = U.Input, toast = U.toast, ToastHost = U.ToastHost;

var TITLES = {
  dashboard: 'Dashboard', clients: 'Clients', client: 'Client profile', appointments: 'Appointments',
  inventory: 'Patch inventory', billing: 'Billing & payments', staff: 'Staff & team', reports: 'Reports'
};
var NAVS = [
  { view: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { view: 'clients', label: 'Clients', icon: 'users' },
  { view: 'appointments', label: 'Appointments', icon: 'calendar' },
  { view: 'inventory', label: 'Inventory', icon: 'box' },
  { view: 'billing', label: 'Billing & payments', icon: 'card' },
  { view: 'staff', label: 'Staff', icon: 'users2' },
  { view: 'reports', label: 'Reports', icon: 'chart' }
];

/* ---------------- Login ---------------- */
var DEMO = {
  owner: { email: 'neeraj@hairreviver.in', label: 'Neeraj Gupta', role: 'Owner / Admin', desc: 'Full access — dashboards, clients, billing, inventory, staff, reports' },
  staff: { email: 'ritu@hairreviver.in', label: 'Ritu Sharma', role: 'Front Desk', desc: 'Clients, appointment booking and billing entry' },
  technician: { email: 'meghna@hairreviver.in', label: 'Meghna Verma', role: 'Technician', desc: 'My appointments, service status and stock usage' }
};
function Login(props){
  var email = React.useState('');
  var pass = React.useState('');
  var busy = React.useState('');
  var err = React.useState('');

  function doLogin(e, p){
    if (e && e.preventDefault) e.preventDefault();
    err[1]('');
    busy[1](p || 'form');
    props.onLogin(email[0].trim() || (DEMO[p] ? DEMO[p].email : ''), p ? 'demo1234' : pass[0])
      .then(function(){})
      .catch(function(ex){ err[1](ex.message || 'Sign in failed'); })
      .then(function(){ busy[1](''); });
  }

  return React.createElement('div', { className: 'login' },
    React.createElement('div', { className: 'login-brand' },
      React.createElement('div', { className: 'lb-logo' },
        React.createElement('div', { className: 'brand-mark' }, 'HR'),
        React.createElement('div', null,
          React.createElement('div', { className: 'brand-name' }, 'Hair Reviver'),
          React.createElement('div', { className: 'brand-sub' }, 'Hair patch clinic')
        )
      ),
      React.createElement('div', { className: 'lb-head' },
        React.createElement('h1', null, 'Every patch, every visit, under control.'),
        React.createElement('p', null, 'One place to manage clients, appointments, patch inventory and billing — with automatic reminders for recurring maintenance.')
      ),
      React.createElement('div', { className: 'lb-stats' },
        React.createElement('div', { className: 'lb-stat' }, React.createElement('div', { className: 'n' }, DB.clients.length), React.createElement('div', { className: 'l' }, 'Active clients')),
        React.createElement('div', { className: 'lb-stat' }, React.createElement('div', { className: 'n' }, DB.appointments.length), React.createElement('div', { className: 'l' }, 'Appointments seeded')),
        React.createElement('div', { className: 'lb-stat' }, React.createElement('div', { className: 'n' }, '3', React.createElement('small', null, ' roles')), React.createElement('div', { className: 'l' }, 'Demo accounts'))
      )
    ),
    React.createElement('div', { className: 'login-form' },
      React.createElement('h1', null, 'Sign in to the clinic'),
      React.createElement('p', { className: 'lf-sub' }, 'Connected to the live clinic server. Use a demo account below or your own login.'),
      Object.keys(DEMO).map(function(k){
        var d = DEMO[k];
        return React.createElement('button', { key: k, className: 'role-card', 'data-od-id': 'login-role-' + k, disabled: !!busy[0], onClick: function(){ doLogin({ preventDefault: function(){} }, k); } },
          React.createElement('div', { className: 'rc-ic' }, React.createElement(Icon, { i: k === 'owner' ? 'chart' : k === 'staff' ? 'calendar' : 'scissors', size: 19 })),
          React.createElement('div', { style: { minWidth: 0, flex: 1 } },
            React.createElement('div', { className: 'rc-name' }, d.label),
            React.createElement('div', { className: 'rc-role' }, d.role, ' · ', k === 'owner' ? 'works anywhere' : 'clinic Wi-Fi only'),
            React.createElement('div', { className: 'rc-desc' }, d.desc)
          ),
          busy[0] === k ? React.createElement('span', { className: 'rc-busy' }, '…') : React.createElement(Icon, { i: 'chevRight', size: 18, cls: 'chev' })
        );
      }),
      React.createElement('div', { className: 'lf-sep' }, 'or sign in with email'),
      React.createElement('form', { onSubmit: function(e){ doLogin(e, ''); } },
        React.createElement('div', { className: 'lf-row' },
          React.createElement(Field, { label: 'Email' }, React.createElement(Input, { placeholder: 'you@hairreviver.in', value: email[0], onChange: function(e){ email[1](e.target.value); } })),
          React.createElement(Field, { label: 'Password' }, React.createElement(Input, { type: 'password', placeholder: '••••••••', value: pass[0], onChange: function(e){ pass[1](e.target.value); } }))
        ),
        err[0] ? React.createElement('div', { className: 'lf-err' }, err[0]) : null,
        React.createElement(Btn, { kind: 'primary', type: 'submit', icon: 'check', disabled: !!busy[0] }, busy[0] === 'form' ? 'Signing in…' : 'Sign in')
      ),
      React.createElement('div', { className: 'lf-note' }, 'Front Desk & Technician sign in works only on the clinic network · demo password: demo1234')
    )
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar(props){
  var navs = props.navs, view = props.view, nav = props.nav, u = props.u;
  return React.createElement('aside', { className: 'sidebar' },
    React.createElement('div', { className: 'brand' },
      React.createElement('div', { className: 'brand-mark' }, 'HR'),
      React.createElement('div', null,
        React.createElement('div', { className: 'brand-name' }, 'Hair Reviver'),
        React.createElement('div', { className: 'brand-sub' }, 'Clinic CRM')
      )
    ),
    React.createElement('div', { className: 'nav-sec' }, 'Workspace'),
    React.createElement('nav', { className: 'nav' },
      navs.map(function(n){
        var active = view === n.view || (n.view === 'clients' && view === 'client');
        return React.createElement('button', { key: n.view, className: 'nav-item' + (active ? ' active' : ''), 'data-od-id': 'nav-' + n.view, onClick: function(){ nav(n.view); } },
          React.createElement(Icon, { i: n.icon, size: 18 }),
          React.createElement('span', null, n.label)
        );
      })
    ),
    React.createElement('div', { className: 'sidebar-foot' },
      React.createElement('div', { className: 'user-card' },
        React.createElement(Avatar, { name: u.name, size: 34 }),
        React.createElement('div', { className: 'user-meta' },
          React.createElement('div', { className: 'user-name' }, u.name),
          React.createElement('div', { className: 'user-role' }, ROLE_LABEL[u.role])
        )
      ),
      React.createElement('div', { className: 'switch-row' },
        React.createElement(Btn, { size: 'sm', kind: 'quiet', icon: 'logOut', onClick: props.logout }, 'Sign out')
      )
    )
  );
}

/* ---------------- Top bar ---------------- */
function Topbar(props){
  var st = props.st, u = props.u, nav = props.nav;
  var open = React.useState(false);
  var readKey = 'hr-notif-read-' + (u.id || u.email);
  var readState = React.useState(function(){
    try { return JSON.parse(localStorage.getItem(readKey) || '[]'); } catch (e) { return []; }
  });
  var read = readState[0];
  var overdue = st.clients.filter(function(c){ return UT.daysUntil(UT.nextDue(c)) < 0; });
  var pending = st.invoices.filter(function(i){ return i.status !== 'paid'; });
  var items = overdue.map(function(c){
    var due = UT.nextDue(c);
    return {
      key: 'o' + c.id + ':' + due,
      name: c.name,
      title: c.name + ' is overdue',
      sub: 'Maintenance due ' + UT.fmtShort(due) + ' · ' + Math.abs(UT.daysUntil(due)) + 'd late',
      go: function(){ nav('clients'); }
    };
  }).concat(pending.map(function(inv){
    var c = st.clients.find(function(x){ return x.id === inv.clientId; });
    return {
      key: 'p' + inv.id,
      name: c ? c.name : '?',
      title: UT.fmtINR(inv.total - inv.paid) + ' due · ' + (c ? c.name : '—'),
      sub: inv.id + ' · ' + inv.status,
      go: function(){ nav('billing'); }
    };
  }));
  var unread = items.filter(function(it){ return read.indexOf(it.key) < 0; });
  var count = unread.length;
  function markRead(keys){
    var next = read.slice();
    keys.forEach(function(k){ if (next.indexOf(k) < 0) next.push(k); });
    readState[1](next);
    try { localStorage.setItem(readKey, JSON.stringify(next)); } catch (e) {}
  }
  function openItem(it){
    markRead([it.key]);
    it.go();
    open[1](false);
  }
  return React.createElement('header', { className: 'topbar' },
    React.createElement('button', { className: 'icon-btn menu-btn', onClick: props.onMenu, 'aria-label': 'Menu' }, React.createElement(Icon, { i: 'menu' })),
    React.createElement('div', { className: 'tb-title' },
      React.createElement('div', { className: 'tb-h' }, props.title),
      React.createElement('div', { className: 'tb-sub' }, UT.fmtDate(UT.today()), ' · Hair Reviver Clinic')
    ),
    React.createElement('div', { className: 'tb-right' },
      React.createElement('div', { className: 'searchbox' },
        React.createElement(Icon, { i: 'search', size: 16 }),
        React.createElement('input', { placeholder: 'Quick search…', onKeyDown: function(e){ if (e.key === 'Enter' && e.target.value.trim()) toast('Search is simulated — use the Clients list filters', 'err'); } })
      ),
      React.createElement('div', { className: 'notif' },
        React.createElement('button', { className: 'icon-btn', onClick: function(){ open[1](!open[0]); }, 'aria-label': 'Notifications', 'data-od-id': 'notifications' },
          React.createElement(Icon, { i: 'bell' }),
          count > 0 ? React.createElement('span', { className: 'dot' }, count) : null
        ),
        open[0] ? React.createElement('div', { className: 'notif-panel' },
          React.createElement('div', { className: 'notif-head' },
            React.createElement('h4', null, 'Notifications'),
            React.createElement('div', { className: 'row', style: { gap: 6 } },
              count > 0 ? React.createElement('button', { className: 'btn btn-quiet btn-sm', style: { height: 28 }, onClick: function(){ markRead(unread.map(function(it){ return it.key; })); } }, 'Mark all read') : null,
              React.createElement('button', { className: 'icon-btn', style: { width: 28, height: 28 }, onClick: function(){ open[1](false); }, 'aria-label': 'Close' }, React.createElement(Icon, { i: 'x', size: 14 }))
            )
          ),
          count === 0 ? React.createElement('div', { className: 'notif-empty' }, 'All caught up — nothing needs attention.') :
            React.createElement('div', null,
              unread.map(function(it){
                return React.createElement('div', { key: it.key, className: 'notif-row', 'data-od-id': 'notif-' + it.key, onClick: function(){ openItem(it); } },
                  React.createElement(Avatar, { name: it.name, size: 30 }),
                  React.createElement('div', { className: 'n-main' },
                    React.createElement('div', { className: 'n-title' }, it.title),
                    React.createElement('div', { className: 'n-sub' }, it.sub)
                  )
                );
              })
            )
        ) : null
      ),
      React.createElement(Avatar, { name: u.name, size: 34 })
    )
  );
}

/* ---------------- Shell ---------------- */
function Shell(props){
  var st = props.st, set = props.set, nav = props.nav, view = props.view, u = props.u, perm = props.perm;
  var open = React.useState(false);
  var navs = NAVS.filter(function(n){ return perm.indexOf(n.view) >= 0; }).map(function(n){
    if (n.view === 'appointments' && u.role === 'technician') return Object.assign({}, n, { label: 'My Appointments' });
    return n;
  });
  function go(v, p){ nav(v, p); open[1](false); }

  return React.createElement('div', { className: 'shell' + (open[0] ? ' side-open' : '') },
    React.createElement('div', { className: 'backdrop', onClick: function(){ open[1](false); } }),
    React.createElement(Sidebar, { navs: navs, view: view, nav: go, u: u, logout: props.logout }),
    React.createElement('div', { className: 'main' },
      React.createElement(Topbar, { title: TITLES[view], u: u, st: st, nav: nav, onMenu: function(){ open[1](true); } }),
      React.createElement('main', { className: 'content' },
        view === 'dashboard' ? (u.role === 'technician' ? React.createElement(DASH.TechDash, { st: st, set: set, nav: nav, u: u }) : React.createElement(DASH.OwnerDash, { st: st, set: set, nav: nav })) : null,
        view === 'clients' ? React.createElement(CLIENTS.ClientList, { st: st, set: set, nav: nav }) : null,
        view === 'client' ? React.createElement(CLIENTS.ClientDetail, { st: st, set: set, nav: nav, params: st.route.params }) : null,
        view === 'appointments' ? React.createElement(APP.Appointments, { st: st, set: set, nav: nav, u: u, params: st.route.params }) : null,
        view === 'inventory' ? React.createElement(OPS.Inventory, { st: st, set: set, u: u }) : null,
        view === 'billing' ? React.createElement(OPS.Billing, { st: st, set: set, nav: nav }) : null,
        view === 'staff' ? React.createElement(OPS.StaffView, { st: st, set: set, nav: nav, u: u }) : null,
        view === 'reports' ? React.createElement(OPS.Reports, { st: st, nav: nav }) : null
      )
    ),
    React.createElement(ToastHost, null)
  );
}

/* ---------------- Root ---------------- */
function emptyState(){
  return {
    user: null,
    booting: true,
    route: { view: 'dashboard', params: {} },
    clients: [], appointments: [], invoices: [], inventory: [], purchases: [], team: [],
    packages: DB.packages.map(function(p){ return Object.assign({}, p, { members: p.members.slice() }); }),
    perms: { owner: DEFAULT_PERMS.owner.slice(), staff: DEFAULT_PERMS.staff.slice(), technician: DEFAULT_PERMS.technician.slice() }
  };
}

function Root(){
  var s0 = React.useState(emptyState);
  var st = s0[0], setRaw = s0[1];
  var nav = function(view, params){
    setRaw(function(s){ return Object.assign({}, s, { route: { view: view, params: params || {} } }); });
  };
  var set = function(patch){
    setRaw(function(s){ return typeof patch === 'function' ? Object.assign({}, s, patch(s)) : Object.assign({}, s, patch); });
  };

  async function hydrate(u){
    try {
      var data = await loadAll();
      if (u && u.role === 'owner'){
        try {
          var team = await API.get('/staff');
          data.team = team.team;
        } catch (e) {}
      }
      set(function(s){ return Object.assign({}, s, data, { user: u, booting: false }); });
    } catch (e) {
      setToken(null);
      set({ user: null, booting: false });
      toast('Could not load clinic data: ' + (e.message || 'server unreachable'), 'err');
    }
  }
  function onLogin(email, password){
    return login(email, password)
      .then(function(u){ return hydrate(u); })
      .catch(function(e){ set({ booting: false }); throw e; });
  }
  function doLogout(){
    logout();
    set({ user: null, route: { view: 'dashboard', params: {} } });
  }

  React.useEffect(function(){
    setAuthHandler(function(){
      setToken(null);
      set(function(s){ return Object.assign({}, s, { user: null, booting: false }); });
    });
    var t = getToken();
    if (!t){ set({ booting: false }); return; }
    me().then(function(res){ return hydrate(res.user); })
      .catch(function(){ setToken(null); set({ booting: false }); });
  }, []);

  if (st.booting){
    return React.createElement('div', { className: 'boot' },
      React.createElement('div', { className: 'boot-spin' }),
      React.createElement('div', { className: 'boot-txt' }, 'Loading clinic…')
    );
  }
  if (!st.user){
    return React.createElement(React.Fragment, null,
      React.createElement(Login, { onLogin: onLogin }),
      React.createElement(ToastHost, null)
    );
  }
  var u = st.user;
  var perms = st.perms || DEFAULT_PERMS;
  var perm = perms[u.role] || [];
  var allowed = perm.indexOf(st.route.view) >= 0 || (st.route.view === 'client' && perm.indexOf('clients') >= 0);
  var view = allowed ? st.route.view : (perm[0] || 'dashboard');
  return React.createElement(Shell, {
    st: st, set: set, nav: nav, view: view, u: u, perm: perm,
    logout: doLogout
  });
}

export default Root;
