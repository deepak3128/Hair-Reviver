/* app.jsx — root: state store, role-based auth, shell, routing */
import React from 'react';
import DB, { UT } from './lib/data';
import { UI as U } from './lib/ui';
import { DASH } from './views/dashboard';
import { CLIENTS } from './views/clients';
import { APP } from './views/appointments';
import { OPS } from './views/operations';
import { DEFAULT_PERMS, ROLE_LABEL, HOME } from './lib/permissions';
var Icon = U.Icon, Avatar = U.Avatar, Chip = U.Chip, Btn = U.Btn, Field = U.Field, Input = U.Input, toast = U.toast, ToastHost = U.ToastHost;

var KEY = 'hr-crm-v1';
var SEED = 1;
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

function seed(){
  return {
    seed: SEED,
    user: null,
    route: { view: 'dashboard', params: {} },
    clients: DB.clients.map(function(c){ return Object.assign({}, c); }),
    appointments: DB.appointments.map(function(a){ return Object.assign({}, a, { reminder: Object.assign({}, a.reminder) }); }),
    invoices: DB.invoices.map(function(i){ return Object.assign({}, i, { items: i.items.map(function(x){ return Object.assign({}, x); }) }); }),
    inventory: DB.inventory.map(function(x){ return Object.assign({}, x); }),
    purchases: DB.purchases.map(function(p){ return Object.assign({}, p); }),
    packages: DB.packages.map(function(p){ return Object.assign({}, p, { members: p.members.slice() }); }),
    perms: { owner: DEFAULT_PERMS.owner.slice(), staff: DEFAULT_PERMS.staff.slice(), technician: DEFAULT_PERMS.technician.slice() }
  };
}
function loadState(){
    try {
      var raw = localStorage.getItem(KEY);
      if (raw){
        var s = JSON.parse(raw);
        if (s && s.seed === SEED && s.clients && s.appointments){
          if (!s.perms) s.perms = { owner: DEFAULT_PERMS.owner.slice(), staff: DEFAULT_PERMS.staff.slice(), technician: DEFAULT_PERMS.technician.slice() };
          return s;
        }
      }
    } catch (e) {}
  return seed();
}

/* ---------------- Login ---------------- */
function Login(props){
  var roles = [
    { id: 'owner', icon: 'chart', name: 'Neeraj Gupta', role: 'Owner / Admin', desc: 'Full access — dashboards, clients, billing, inventory, staff, reports', user: { id: 'U-01', name: 'Neeraj Gupta', role: 'owner' } },
    { id: 'staff', icon: 'calendar', name: 'Ritu Sharma', role: 'Front Desk', desc: 'Clients, appointment booking and billing entry', user: { id: 'S-01', name: 'Ritu Sharma', role: 'staff' } },
    { id: 'technician', icon: 'scissors', name: 'Meghna Verma', role: 'Technician', desc: 'My appointments, service status and stock usage', user: { id: 'T-01', name: 'Meghna Verma', role: 'technician', techId: 'T-01' } }
  ];
  var apptsThisMonth = DB.appointments.filter(function(a){ return a.date.slice(0, 7) === UT.today().slice(0, 7); }).length;
  var outstanding = DB.invoices.filter(function(i){ return i.status !== 'paid'; }).reduce(function(s, i){ return s + (i.total - i.paid); }, 0);

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
        React.createElement('div', { className: 'lb-stat' }, React.createElement('div', { className: 'n' }, apptsThisMonth), React.createElement('div', { className: 'l' }, 'Appointments this month')),
        React.createElement('div', { className: 'lb-stat' }, React.createElement('div', { className: 'n' }, UT.fmtINR(outstanding)), React.createElement('div', { className: 'l' }, 'Outstanding dues'))
      )
    ),
    React.createElement('div', { className: 'login-form' },
      React.createElement('h1', null, 'Sign in to the clinic'),
      React.createElement('p', { className: 'lf-sub' }, 'This is a working demo prototype — choose a role to explore the CRM. All data is simulated in your browser.'),
      roles.map(function(r){
        return React.createElement('button', { key: r.id, className: 'role-card', 'data-od-id': 'login-role-' + r.id, onClick: function(){ props.onLogin(r.user); } },
          React.createElement('div', { className: 'rc-ic' }, React.createElement(Icon, { i: r.icon, size: 19 })),
          React.createElement('div', { style: { minWidth: 0, flex: 1 } },
            React.createElement('div', { className: 'rc-name' }, r.name),
            React.createElement('div', { className: 'rc-role' }, r.role),
            React.createElement('div', { className: 'rc-desc' }, r.desc)
          ),
          React.createElement(Icon, { i: 'chevRight', size: 18, cls: 'chev' })
        );
      }),
      React.createElement('div', { className: 'lf-sep' }, 'or'),
      React.createElement('div', { className: 'lf-row' },
        React.createElement(Field, { label: 'Email' }, React.createElement(Input, { placeholder: 'you@hairreviver.in' })),
        React.createElement(Field, { label: 'Password' }, React.createElement(Input, { type: 'password', placeholder: '••••••••' }))
      ),
      React.createElement(Btn, { kind: 'primary', onClick: function(){ toast('Use a demo role above to sign in', 'err'); } }, 'Sign in'),
      React.createElement('div', { className: 'lf-note' }, 'Prototype data only · no real client information is stored')
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
  var overdue = st.clients.filter(function(c){ return UT.daysUntil(UT.nextDue(c)) < 0; });
  var pending = st.invoices.filter(function(i){ return i.status !== 'paid'; });
  var count = overdue.length + pending.length;
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
            React.createElement('button', { className: 'icon-btn', style: { width: 28, height: 28 }, onClick: function(){ open[1](false); }, 'aria-label': 'Close' }, React.createElement(Icon, { i: 'x', size: 14 }))
          ),
          count === 0 ? React.createElement('div', { className: 'notif-empty' }, 'All caught up — nothing needs attention.') :
            React.createElement('div', null,
              overdue.map(function(c){
                return React.createElement('div', { key: 'o' + c.id, className: 'notif-row', onClick: function(){ nav('clients'); open[1](false); } },
                  React.createElement(Avatar, { name: c.name, size: 30 }),
                  React.createElement('div', { className: 'n-main' },
                    React.createElement('div', { className: 'n-title' }, c.name, ' is overdue'),
                    React.createElement('div', { className: 'n-sub' }, 'Maintenance due ', UT.fmtShort(UT.nextDue(c)), ' · ', Math.abs(UT.daysUntil(UT.nextDue(c))), 'd late')
                  )
                );
              }),
              pending.map(function(inv){
                var c = st.clients.find(function(x){ return x.id === inv.clientId; });
                return React.createElement('div', { key: 'p' + inv.id, className: 'notif-row', onClick: function(){ nav('billing'); open[1](false); } },
                  React.createElement(Avatar, { name: c ? c.name : '?', size: 30 }),
                  React.createElement('div', { className: 'n-main' },
                    React.createElement('div', { className: 'n-title' }, UT.fmtINR(inv.total - inv.paid), ' due · ', c ? c.name : '—'),
                    React.createElement('div', { className: 'n-sub' }, inv.id, ' · ', inv.status)
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
function Root(){
  var s0 = React.useState(loadState);
  var st = s0[0], setRaw = s0[1];
  var nav = function(view, params){
    setRaw(function(s){ return Object.assign({}, s, { route: { view: view, params: params || {} } }); });
  };
  var set = function(patch){
    setRaw(function(s){ return typeof patch === 'function' ? Object.assign({}, s, patch(s)) : Object.assign({}, s, patch); });
  };
  React.useEffect(function(){
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }, [st]);

  if (!st.user){
    return React.createElement(React.Fragment, null,
      React.createElement(Login, { onLogin: function(user){ set({ user: user }); } }),
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
    logout: function(){ set({ user: null, route: { view: 'dashboard', params: {} } }); }
  });
}

export default Root;
