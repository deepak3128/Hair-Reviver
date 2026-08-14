/* views/operations.jsx — inventory, billing, staff, reports + shared modals */
import React from 'react';
import DB, { UT } from '../lib/data';
import { UI as U } from '../lib/ui';
import { DEFAULT_PERMS } from '../lib/permissions';
var Icon = U.Icon, Chip = U.Chip, Avatar = U.Avatar, Card = U.Card, Section = U.Section,
    Field = U.Field, Select = U.Select, Input = U.Input, Btn = U.Btn, Modal = U.Modal,
    Empty = U.Empty, toast = U.toast;

function clientOf(st, id){ return st.clients.find(function(c){ return c.id === id; }); }
function invDue(i){ return i.total - i.paid; }

/* ---------------- Payment modal ---------------- */
function PaymentModal(props){
  var inv = props.invoice;
  var due = invDue(inv);
  var amt = React.useState(due);
  function save(){
    var pay = Math.min(Math.max(0, parseInt(amt[0], 10) || 0), due);
    if (pay <= 0){ toast('Enter an amount to collect', 'err'); return; }
    props.set(function(s){
      return { invoices: s.invoices.map(function(i){
        if (i.id !== inv.id) return i;
        var paid = i.paid + pay;
        return Object.assign({}, i, { paid: paid, status: paid >= i.total ? 'paid' : 'partial' });
      }) };
    });
    props.onClose();
    toast('Payment recorded · ' + UT.fmtINR(pay) + ' collected');
  }
  return React.createElement(Modal, { title: 'Collect payment · ' + inv.id, onClose: props.onClose },
    React.createElement('div', { className: 'dl', style: { marginBottom: 16 } },
      React.createElement('dt', null, 'Client'),
      React.createElement('dd', null, clientOf(props.st, inv.clientId) ? clientOf(props.st, inv.clientId).name : '—'),
      React.createElement('dt', null, 'Invoice total'), React.createElement('dd', null, React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(inv.total))),
      React.createElement('dt', null, 'Paid so far'), React.createElement('dd', null, UT.fmtINR(inv.paid)),
      React.createElement('dt', null, 'Balance due'), React.createElement('dd', null, React.createElement('b', { className: 'danger' }, UT.fmtINR(due)))
    ),
    React.createElement(Field, { label: 'Amount to collect' },
      React.createElement(Input, { type: 'number', min: 0, max: due, value: amt[0], onChange: function(e){ amt[1](e.target.value); } })
    ),
    React.createElement('div', { className: 'btn-row', style: { marginBottom: 6 } },
      React.createElement(Btn, { size: 'sm', kind: 'ghost', onClick: function(){ amt[1](due); } }, 'Pay full ' + UT.fmtINR(due)),
      React.createElement(Btn, { size: 'sm', kind: 'ghost', onClick: function(){ amt[1](Math.ceil(due / 2)); } }, 'Half')
    ),
    React.createElement('div', { className: 'modal-foot', style: { margin: '18px -22px -20px' } },
      React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
      React.createElement(Btn, { kind: 'primary', icon: 'check', onClick: save }, 'Record payment')
    )
  );
}

/* ---------------- Inventory ---------------- */
function stockStatus(x){
  if (x.qty === 0) return 'out';
  if (x.qty <= x.thr) return 'low';
  return 'instock';
}

function RestockModal(props){
  var skus = props.st.inventory;
  var sel = React.useState(skus.length ? skus[0].id : '');
  var qty = React.useState('');
  var cost = React.useState(skus.length ? String(skus[0].cost) : '');
  function onSelect(id){
    sel[1](id);
    var s = skus.find(function(x){ return x.id === id; });
    if (s) cost[1](String(s.cost));
  }
  function save(){
    var n = parseInt(qty[0], 10);
    if (!n || n <= 0){ toast('Enter a quantity', 'err'); return; }
    var s = skus.find(function(x){ return x.id === sel[0]; });
    var unit = parseInt(cost[0], 10) || s.cost;
    props.set(function(st){
      return {
        inventory: st.inventory.map(function(x){ return x.id === s.id ? Object.assign({}, x, { qty: x.qty + n, cost: unit, received: UT.today() }) : x; }),
        purchases: [{
          id: UT.nextId(st.purchases, 'PR-'), date: UT.today(), vendor: s.vendor,
          item: s.type + ' ' + s.base + ' ×' + n, qty: n, cost: unit * n
        }].concat(st.purchases)
      };
    });
    props.onClose();
    toast('Stock logged · +' + n + ' ' + s.base + ' received');
  }
  return React.createElement(Modal, { title: 'Log stock received', onClose: props.onClose },
    React.createElement(Field, { label: 'Item (SKU)' },
      React.createElement(Select, { value: sel[0], onChange: function(e){ onSelect(e.target.value); } },
        skus.map(function(x){ return React.createElement('option', { key: x.id, value: x.id }, x.id, ' — ', x.type, ' ', x.base, ' (', x.qty, ' on hand)'); })
      )
    ),
    React.createElement('div', { className: 'frow' },
      React.createElement(Field, { label: 'Quantity received' }, React.createElement(Input, { type: 'number', min: 1, value: qty[0], onChange: function(e){ qty[1](e.target.value); } })),
      React.createElement(Field, { label: 'Unit cost (₹)' }, React.createElement(Input, { type: 'number', min: 0, value: cost[0], onChange: function(e){ cost[1](e.target.value); } }))
    ),
    React.createElement('div', { className: 'modal-foot', style: { margin: '18px -22px -20px' } },
      React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
      React.createElement(Btn, { kind: 'primary', icon: 'check', onClick: save }, 'Log received')
    )
  );
}

function DeductModal(props){
  var skus = props.st.inventory;
  var sel = React.useState(skus.length ? skus[0].id : '');
  var qty = React.useState('');
  var reason = React.useState(props.reason || 'Service use');
  function save(){
    var n = parseInt(qty[0], 10);
    if (!n || n <= 0){ toast('Enter a quantity', 'err'); return; }
    var s = skus.find(function(x){ return x.id === sel[0]; });
    props.set(function(st){
      return { inventory: st.inventory.map(function(x){ return x.id === s.id ? Object.assign({}, x, { qty: Math.max(0, x.qty - n) }) : x; }) };
    });
    props.onClose();
    toast('Stock deducted · −' + n + ' (' + reason[0].toLowerCase() + ')');
  }
  return React.createElement(Modal, { title: 'Deduct stock on use', onClose: props.onClose },
    React.createElement(Field, { label: 'Item (SKU)' },
      React.createElement(Select, { value: sel[0], onChange: function(e){ sel[1](e.target.value); } },
        skus.map(function(x){ return React.createElement('option', { key: x.id, value: x.id }, x.id, ' — ', x.type, ' ', x.base, ' (', x.qty, ' on hand)'); })
      )
    ),
    React.createElement('div', { className: 'frow' },
      React.createElement(Field, { label: 'Quantity used' }, React.createElement(Input, { type: 'number', min: 1, value: qty[0], onChange: function(e){ qty[1](e.target.value); } })),
      React.createElement(Field, { label: 'Reason' },
        React.createElement(Select, { value: reason[0], onChange: function(e){ reason[1](e.target.value); } },
          React.createElement('option', null, 'Service use'), React.createElement('option', null, 'Damaged'), React.createElement('option', null, 'Expired')
        )
      )
    ),
    React.createElement('div', { className: 'modal-foot', style: { margin: '18px -22px -20px' } },
      React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
      React.createElement(Btn, { kind: 'primary', icon: 'check', onClick: save }, 'Deduct')
    )
  );
}

function Inventory(props){
  var st = props.st, set = props.set, u = props.u;
  var isTech = u.role === 'technician';
  var restock = React.useState(false);
  var deduct = React.useState(null);

  var units = st.inventory.reduce(function(s, x){ return s + x.qty; }, 0);
  var low = st.inventory.filter(function(x){ return x.qty <= x.thr; });
  var value = st.inventory.reduce(function(s, x){ return s + x.qty * x.cost; }, 0);
  var pending = st.invoices.filter(function(i){ return i.status !== 'paid'; });

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'Patch inventory'),
        React.createElement('div', { className: 'ph-sub' }, 'Patches, supplies and vendor purchases · reorder at threshold')
      ),
      React.createElement('div', { className: 'page-actions' },
        !isTech ? React.createElement(Btn, { icon: 'plus', kind: 'primary', onClick: function(){ restock[1](true); }, dataid: 'btn-log-stock' }, 'Log stock received') : null
      )
    ),
    React.createElement('div', { className: 'kpi-strip', 'data-od-id': 'inventory-kpis' },
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'SKUs tracked'), React.createElement('div', { className: 's-val' }, st.inventory.length)),
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Units on hand'), React.createElement('div', { className: 's-val' }, units)),
      React.createElement('div', { className: 'strip low-blink' }, React.createElement('div', { className: 's-lbl' }, 'Low stock'), React.createElement('div', { className: 's-val' }, low.length), React.createElement('div', { className: 's-sub' }, low.length ? 'reorder needed' : 'all healthy')),
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Stock value'), React.createElement('div', { className: 's-val' }, UT.fmtINR(value)))
    ),

    React.createElement(Card, null,
      React.createElement('div', { className: 'table-wrap' },
        React.createElement('table', { className: 'table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'SKU'),
              React.createElement('th', null, 'Item'),
              React.createElement('th', { className: 'hide-md' }, 'Vendor'),
              React.createElement('th', { className: 'hide-sm' }, 'Batch'),
              React.createElement('th', null, 'Qty'),
              React.createElement('th', { className: 'hide-sm' }, 'Threshold'),
              React.createElement('th', null, 'Status'),
              React.createElement('th', { className: 'al-r hide-md' }, 'Unit cost'),
              React.createElement('th', { className: 'al-r' }, '')
            )
          ),
          React.createElement('tbody', null,
            st.inventory.map(function(x){
              var ss = stockStatus(x);
              return React.createElement('tr', { key: x.id, 'data-od-id': 'sku-row-' + x.id },
                React.createElement('td', null, React.createElement('span', { className: 'mono' }, x.id)),
                React.createElement('td', null,
                  React.createElement('div', { className: 't-name' }, x.type, ' · ', x.base),
                  React.createElement('div', { className: 't-sub' }, 'received ', UT.fmtShort(x.received))
                ),
                React.createElement('td', { className: 'hide-md' }, x.vendor),
                React.createElement('td', { className: 'hide-sm' }, React.createElement('span', { className: 'mono' }, x.batch)),
                React.createElement('td', null, React.createElement('span', { className: 'qty-now ' + (ss === 'instock' ? 'ok' : 'low') }, x.qty)),
                React.createElement('td', { className: 'hide-sm' }, React.createElement('span', { className: 'mono muted' }, x.thr)),
                React.createElement('td', null, React.createElement(Chip, { s: ss }, ss === 'instock' ? 'In stock' : ss === 'low' ? 'Low' : 'Out')),
                React.createElement('td', { className: 'al-r hide-md' }, React.createElement('span', { className: 'mono tnum' }, UT.fmtINR(x.cost))),
                React.createElement('td', null,
                  React.createElement('div', { className: 'btn-row', style: { justifyContent: 'flex-end' } },
                    React.createElement(Btn, { size: 'xs', kind: 'ghost', icon: 'minus', onClick: function(){ deduct[1](x); } }, isTech ? 'Use' : 'Deduct'),
                    !isTech ? React.createElement(Btn, { size: 'xs', kind: 'quiet', icon: 'plus', onClick: function(){ restock[1](true); } }, 'Restock') : null
                  )
                )
              );
            })
          )
        )
      ),
      low.length ? React.createElement('div', { style: { padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--warn-soft)', color: 'var(--warn)', fontSize: 12.5, fontWeight: 600 } },
        React.createElement(Icon, { i: 'alert', size: 15 }), '  ', low.length, ' item', low.length === 1 ? '' : 's', ' at or below reorder threshold — log received stock to refresh.'
      ) : null
    ),

    !isTech ? React.createElement(Card, { cls: 'card-pad', style: { marginTop: 18 } },
      React.createElement('div', { className: 'card-title', style: { marginBottom: 14 } }, 'Vendor purchase log'),
      React.createElement('div', { className: 'table-wrap' },
        React.createElement('table', { className: 'table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Date'), React.createElement('th', null, 'Vendor'), React.createElement('th', null, 'Item'), React.createElement('th', { className: 'al-r' }, 'Qty'), React.createElement('th', { className: 'al-r' }, 'Total')
            )
          ),
          React.createElement('tbody', null,
            st.purchases.map(function(p){
              return React.createElement('tr', { key: p.id },
                React.createElement('td', null, UT.fmtShort(p.date)),
                React.createElement('td', null, React.createElement('span', { className: 'strong' }, p.vendor)),
                React.createElement('td', null, p.item),
                React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono' }, p.qty)),
                React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum' }, UT.fmtINR(p.cost)))
              );
            })
          )
        )
      )
    ) : null,

    restock[0] ? React.createElement(RestockModal, { st: st, set: set, onClose: function(){ restock[1](false); } }) : null,
    deduct[0] ? React.createElement(DeductModal, { st: st, set: set, onClose: function(){ deduct[1](null); } }) : null,
    null
  );
}

/* ---------------- Billing ---------------- */
function Billing(props){
  var st = props.st, set = props.set, nav = props.nav;
  var fStatus = React.useState('all');
  var pay = React.useState(null);
  var pkgBuy = React.useState(null);
  var today = UT.today();

  var outstanding = st.invoices.filter(function(i){ return i.status !== 'paid'; }).reduce(function(s, i){ return s + invDue(i); }, 0);
  var collectedMonth = st.invoices.filter(function(i){ return i.date.slice(0, 7) === today.slice(0, 7); }).reduce(function(s, i){ return s + i.paid; }, 0);
  var pendingCount = st.invoices.filter(function(i){ return i.status !== 'paid'; }).length;

  var rows = st.invoices.filter(function(i){ return fStatus[0] === 'all' ? true : i.status === fStatus[0]; })
    .sort(function(a, b){ return a.date < b.date ? 1 : -1; });
  var followUp = st.invoices.filter(function(i){ return invDue(i) > 0; })
    .sort(function(a, b){ return a.date < b.date ? -1 : 1; });

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'Billing & payments'),
        React.createElement('div', { className: 'ph-sub' }, 'Invoices, collections and service packages')
      )
    ),
    React.createElement('div', { className: 'kpi-strip', 'data-od-id': 'billing-kpis' },
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Outstanding'), React.createElement('div', { className: 's-val danger' }, UT.fmtINR(outstanding))),
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Collected this month'), React.createElement('div', { className: 's-val' }, UT.fmtINR(collectedMonth))),
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Invoices pending'), React.createElement('div', { className: 's-val' }, pendingCount)),
      React.createElement('div', { className: 'strip' }, React.createElement('div', { className: 's-lbl' }, 'Avg invoice'), React.createElement('div', { className: 's-val' }, UT.fmtINR(Math.round(st.invoices.reduce(function(s, i){ return s + i.total; }, 0) / Math.max(1, st.invoices.length)))))
    ),

    React.createElement('div', { className: 'card-title', style: { margin: '26px 0 12px' } }, 'Service packages'),
    React.createElement('div', { className: 'pkg-grid' },
      st.packages.map(function(p, idx){
        return React.createElement(Card, { key: p.id, cls: 'pkg-card', dataid: 'package-card-' + p.id.toLowerCase() },
          React.createElement('div', { className: 'tag' }, idx === 0 ? 'Most popular' : 'Prepaid'),
          React.createElement('div', { className: 'pkg-name' }, p.name),
          React.createElement('div', { className: 'pkg-price' }, UT.fmtINR(p.price), React.createElement('small', null, ' / ' + p.period)),
          React.createElement('div', { className: 'pkg-desc' }, p.desc),
          React.createElement('div', { className: 'pkg-members' },
            'On plan: ', p.members.map(function(m){ var c = clientOf(st, m); return c ? c.name.split(' ')[0] : ''; }).join(', ') || 'none yet'
          ),
          React.createElement(Btn, { kind: 'ghost', onClick: function(){ pkgBuy[1](p); } }, 'Purchase plan')
        );
      })
    ),

    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, margin: '26px 0 12px' } },
      React.createElement('div', { className: 'card-title' }, 'Invoices'),
      React.createElement('div', { className: 'seg' },
        ['all', 'paid', 'partial', 'pending'].map(function(s){
          return React.createElement('button', { key: s, className: fStatus[0] === s ? 'on' : '', onClick: function(){ fStatus[1](s); } },
            s.charAt(0).toUpperCase() + s.slice(1)
          );
        })
      )
    ),
    React.createElement(Card, { dataid: 'invoice-table' },
      React.createElement('div', { className: 'table-wrap' },
        React.createElement('table', { className: 'table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Invoice'), React.createElement('th', null, 'Date'), React.createElement('th', { className: 'hide-md' }, 'Client'),
              React.createElement('th', { className: 'hide-sm' }, 'Description'), React.createElement('th', { className: 'al-r' }, 'Total'), React.createElement('th', { className: 'al-r hide-sm' }, 'Paid'),
              React.createElement('th', { className: 'al-r' }, 'Status'), React.createElement('th', null, '')
            )
          ),
          React.createElement('tbody', null,
            rows.map(function(inv){
              var c = clientOf(st, inv.clientId);
              return React.createElement('tr', { key: inv.id, 'data-od-id': 'inv-row-' + inv.id },
                React.createElement('td', null, React.createElement('span', { className: 'mono' }, inv.id)),
                React.createElement('td', null, UT.fmtShort(inv.date)),
                React.createElement('td', { className: 'hide-md' }, React.createElement('span', { className: 'strong' }, c ? c.name : '—')),
                React.createElement('td', { className: 'hide-sm muted' }, inv.items.map(function(it){ return it.label; }).join(' + ')),
                React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(inv.total))),
                React.createElement('td', { className: 'al-r hide-sm' }, React.createElement('span', { className: 'mono tnum' }, UT.fmtINR(inv.paid))),
                React.createElement('td', { className: 'al-r' }, React.createElement(Chip, { s: inv.status, onClick: function(){ pay[1](inv); } }, inv.status)),
                React.createElement('td', null,
                  invDue(inv) > 0 ? React.createElement(Btn, { size: 'xs', kind: 'ghost', onClick: function(){ pay[1](inv); } }, 'Collect') : React.createElement(Icon, { i: 'check', size: 16, cls: 'ok' })
                )
              );
            })
          )
        )
      ),
      rows.length === 0 ? React.createElement(Empty, { icon: 'card', title: 'No invoices match', sub: 'Choose a different status filter.' }) : null
    ),

    React.createElement(Section, {
      title: 'Pending follow-up', sub: 'Invoices with outstanding balances',
      cls: '', style: undefined,
      action: null,
      dataid: 'pending-followup'
    },
      followUp.length === 0
        ? React.createElement(Empty, { icon: 'check', title: 'All settled', sub: 'No outstanding balances.' })
        : React.createElement('div', { className: 'list-rows' },
          followUp.map(function(inv){
            var c = clientOf(st, inv.clientId);
            var due = invDue(inv);
            return React.createElement('div', { className: 'list-row', key: inv.id },
              React.createElement(Avatar, { name: c ? c.name : '?', size: 34 }),
              React.createElement('div', { className: 'lr-main' },
                React.createElement('div', { className: 'lr-title' }, c ? c.name : '—', ' · ', UT.fmtINR(due), ' due'),
                React.createElement('div', { className: 'lr-sub' }, c ? c.phone : '', ' · ', inv.id, ' · ', UT.fmtShort(inv.date))
              ),
              React.createElement(Chip, { s: inv.status }, inv.status),
              React.createElement(Btn, { size: 'sm', kind: 'ghost', onClick: function(){ pay[1](inv); } }, 'Collect')
            );
          })
        )
    ),

    pay[0] ? React.createElement(PaymentModal, { invoice: pay[0], st: st, set: set, onClose: function(){ pay[1](null); } }) : null,
    pkgBuy[0] ? React.createElement(PkgBuyModal, { st: st, set: set, pkg: pkgBuy[0], onClose: function(){ pkgBuy[1](null); } }) : null
  );
}

function PkgBuyModal(props){
  var st = props.st, set = props.set;
  var pkg = props.pkg;
  var sel = React.useState(st.clients.length ? st.clients[0].id : '');
  var isMember = function(id){ return pkg.members.indexOf(id) >= 0; };
  function buy(){
    var c = clientOf(st, sel[0]);
    if (!c){ toast('Select a client', 'err'); return; }
    set(function(s){
      var invoices = s.invoices;
      if (!invoices.find(function(i){ return i.apptId === 'PKG-' + pkg.id + '-' + c.id; })){
        invoices = s.invoices.concat({
          id: UT.nextId(s.invoices, 'INV-'), date: UT.today(), clientId: c.id,
          items: [{ label: pkg.name, amount: pkg.price }], total: pkg.price, paid: pkg.price,
          status: 'paid', apptId: 'PKG-' + pkg.id + '-' + c.id
        });
      }
      return {
        clients: s.clients.map(function(x){ return x.id === c.id ? Object.assign({}, x, { packageId: pkg.id }) : x; }),
        packages: s.packages.map(function(p){ return p.id === pkg.id ? Object.assign({}, p, { members: p.members.indexOf(c.id) < 0 ? p.members.concat(c.id) : p.members }) : p; }),
        invoices: invoices
      };
    });
    props.onClose();
    toast(pkg.name + ' purchased for ' + c.name);
  }
  return React.createElement(Modal, { title: 'Purchase · ' + pkg.name, onClose: props.onClose },
    React.createElement('div', { className: 'dl', style: { marginBottom: 16 } },
      React.createElement('dt', null, 'Plan'), React.createElement('dd', null, pkg.name, ' — ', UT.fmtINR(pkg.price), ' / ', pkg.period),
      React.createElement('dt', null, 'Includes'), React.createElement('dd', null, pkg.desc)
    ),
    React.createElement(Field, { label: 'Assign to client' },
      React.createElement(Select, { value: sel[0], onChange: function(e){ sel[1](e.target.value); } },
        st.clients.map(function(c){
          return React.createElement('option', { key: c.id, value: c.id }, c.name, isMember(c.id) ? ' · already on plan' : '');
        })
      )
    ),
    React.createElement('div', { className: 'modal-foot', style: { margin: '18px -22px -20px' } },
      React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
      React.createElement(Btn, { kind: 'primary', icon: 'check', onClick: buy }, 'Confirm purchase')
    )
  );
}

/* ---------------- Staff ---------------- */
var ACCESS_MODULES = [
  { view: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { view: 'clients', label: 'Clients', icon: 'users' },
  { view: 'appointments', label: 'Appointments', icon: 'calendar' },
  { view: 'inventory', label: 'Patch inventory', icon: 'box' },
  { view: 'billing', label: 'Billing & payments', icon: 'card' },
  { view: 'staff', label: 'Staff & team', icon: 'users2' },
  { view: 'reports', label: 'Reports', icon: 'chart' }
];
var ACCESS_ROLES = [
  { id: 'technician', name: 'Technician', sub: 'Performs services, updates status, logs stock usage' },
  { id: 'staff', name: 'Front Desk', sub: 'Handles clients, bookings and billing entry' }
];
function RoleAccess(props){
  var st = props.st, set = props.set;
  var perms = st.perms || DEFAULT_PERMS;
  function has(role, view){ return (perms[role] || []).indexOf(view) >= 0; }
  function toggle(role, view){
    set(function(s){
      var cur = s.perms || DEFAULT_PERMS;
      var list = (cur[role] || []).slice();
      var i = list.indexOf(view);
      if (i >= 0){
        list.splice(i, 1);
        if (view === 'clients'){ var c = list.indexOf('client'); if (c >= 0) list.splice(c, 1); }
      } else {
        list.push(view);
        if (view === 'clients' && list.indexOf('client') < 0) list.push('client');
      }
      return { perms: Object.assign({}, cur, (function(){ var o = {}; o[role] = list; return o; })()) };
    });
    toast(has(role, view) ? (view + ' access removed for ' + role) : (view + ' access granted for ' + role), has(role, view) ? 'err' : 'ok');
  }
  return React.createElement('div', { className: 'card', style: { marginTop: 24 } },
    React.createElement('div', { className: 'card-head', style: { paddingBottom: 4 } },
      React.createElement('div', null,
        React.createElement('h3', { style: { margin: 0 } }, 'Role access'),
        React.createElement('div', { className: 't-sub', style: { marginTop: 2 } }, 'Choose which modules each role can open. Changes apply instantly and are saved in this browser.')
      )
    ),
    React.createElement('div', { className: 'perm-table', style: { marginTop: 10 } },
      React.createElement('div', { className: 'perm-row perm-head' },
        React.createElement('div', { className: 'perm-role' }, 'Role'),
        ACCESS_MODULES.map(function(m){
          return React.createElement('div', { key: m.view, className: 'perm-cell' }, m.label);
        })
      ),
      ACCESS_ROLES.map(function(r){
        return React.createElement('div', { key: r.id, className: 'perm-row' },
          React.createElement('div', { className: 'perm-role' },
            React.createElement('div', { className: 't-name' }, r.name),
            React.createElement('div', { className: 't-sub' }, r.sub)
          ),
          ACCESS_MODULES.map(function(m){
            var on = has(r.id, m.view);
            var locked = m.view === 'dashboard';
            return React.createElement('div', { key: m.view, className: 'perm-cell' },
              locked ? React.createElement('span', { className: 'perm-toggle on', title: 'Always available' }, 'On')
                : React.createElement('button', { className: 'perm-toggle ' + (on ? 'on' : 'off'), 'data-od-id': 'perm-' + r.id + '-' + m.view, onClick: function(){ toggle(r.id, m.view); } },
                    React.createElement('span', { className: 'perm-dot' }),
                    on ? 'On' : 'Off'
                  )
            );
          })
        );
      })
    ),
    React.createElement('div', { className: 't-sub', style: { marginTop: 10 } },
      'Owner / Admin always has full access and cannot be changed here.'
    )
  );
}

/* ---------------- Staff ---------------- */
function StaffView(props){
  var st = props.st, set = props.set, nav = props.nav, u = props.u;
  var today = UT.today();
  var next7End = UT.addDays(today, 6);
  var ranked = DB.technicians.slice().sort(function(a, b){ return b.completed - a.completed; });
  var maxLoad = 1;
  ranked.forEach(function(t){
    var n = st.appointments.filter(function(a){ return a.techId === t.id && a.date >= today && a.date <= next7End && a.status !== 'cancelled'; }).length;
    if (n > maxLoad) maxLoad = n;
  });

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'Staff & team'),
        React.createElement('div', { className: 'ph-sub' }, 'Front desk, technicians and workload')
      ),
      React.createElement('div', { className: 'page-actions' },
        React.createElement(Btn, { icon: 'calendar', onClick: function(){ nav('appointments'); } }, 'Assign technicians')
      )
    ),

    u && u.role === 'owner' ? React.createElement(RoleAccess, { st: st, set: set }) : null,

    React.createElement(Card, null,
      React.createElement('div', { className: 'table-wrap' },
        React.createElement('table', { className: 'table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Team member'), React.createElement('th', null, 'Role'), React.createElement('th', { className: 'hide-md' }, 'Phone'),
              React.createElement('th', { className: 'hide-sm' }, 'Joined'), React.createElement('th', null, 'Status'), React.createElement('th', { className: 'al-r' }, 'Load')
            )
          ),
          React.createElement('tbody', null,
            [DB.owner].concat(DB.staff, DB.technicians).map(function(m){
              var isTech = m.rating !== undefined;
              var load = isTech ? st.appointments.filter(function(a){ return a.techId === m.id && a.date >= today && a.date <= next7End && a.status !== 'cancelled'; }).length : 0;
              return React.createElement('tr', { key: m.id, 'data-od-id': 'staff-row-' + m.id },
                React.createElement('td', null,
                  React.createElement('div', { className: 't-cell-main' },
                    React.createElement(Avatar, { name: m.name, size: 34 }),
                    React.createElement('div', null,
                      React.createElement('div', { className: 't-name' }, m.name),
                      React.createElement('div', { className: 't-sub' }, m.id)
                    )
                  )
                ),
                React.createElement('td', null, m.role),
                React.createElement('td', { className: 'hide-md' }, m.phone),
                React.createElement('td', { className: 'hide-sm' }, m.joined),
                React.createElement('td', null, React.createElement(Chip, { s: 'active' }, 'Active')),
                React.createElement('td', { className: 'al-r' }, isTech ? React.createElement('span', { className: 'mono strong' }, load + ' · next 7d') : React.createElement('span', { className: 'faint' }, '—'))
              );
            })
          )
        )
      )
    ),

    React.createElement('div', { className: 'card-title', style: { margin: '26px 0 12px' } }, 'Technician performance'),
    React.createElement('div', { className: 'grid3' },
      ranked.map(function(t, idx){
        var load = st.appointments.filter(function(a){ return a.techId === t.id && a.date >= today && a.date <= next7End && a.status !== 'cancelled'; }).length;
        var completedMonth = st.appointments.filter(function(a){ return a.techId === t.id && a.status === 'completed' && a.date.slice(0, 7) === today.slice(0, 7); }).length;
        return React.createElement(Card, { key: t.id, cls: 'card-pad', dataid: 'tech-rank-' + t.id },
          React.createElement('div', { className: 'row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
            React.createElement('div', { className: 'row' },
              React.createElement(Avatar, { name: t.name, size: 40 }),
              React.createElement('div', null,
                React.createElement('div', { className: 't-name' }, t.name),
                React.createElement('div', { className: 't-sub' }, t.role)
              )
            ),
            React.createElement('div', { className: 'rank-badge ' + (idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : '') }, '#' + (idx + 1))
          ),
          React.createElement('div', { className: 'row', style: { justifyContent: 'space-between', marginTop: 14 } },
            React.createElement('div', { className: 'mini-stat' }, React.createElement('b', null, t.completed), ' services'),
            React.createElement('div', { className: 'mini-stat' }, React.createElement('b', null, t.rating), ' / 5 rating'),
            React.createElement('div', { className: 'mini-stat' }, React.createElement('b', null, completedMonth), ' this month')
          ),
          React.createElement('div', { style: { marginTop: 12 } },
            React.createElement('div', { className: 'mini-stat', style: { marginBottom: 5 } }, 'Next 7 days workload · ', load, ' visits'),
            React.createElement('div', { className: 'loadtrack' }, React.createElement('div', { className: 'loadbar' + (load / maxLoad > 0.75 ? ' amber' : ''), style: { width: Math.max(6, (load / maxLoad) * 100) + '%' } }))
          ),
          React.createElement('div', { className: 'mini-stat', style: { marginTop: 10 } }, React.createElement('b', null, t.onTime), '% on-time · on-time completion')
        );
      })
    )
  );
}

/* ---------------- Reports ---------------- */
function Reports(props){
  var st = props.st, nav = props.nav;
  var tab = React.useState('revenue');
  var today = UT.today();

  var last7 = [];
  for (var i = 6; i >= 0; i--){
    var d = UT.addDays(today, -i);
    var invs = st.invoices.filter(function(x){ return x.date === d; });
    last7.push({
      d: d, label: UT.fmtShort(d) + (i === 0 ? ' · today' : ''),
      appts: st.appointments.filter(function(a){ return a.date === d && a.status !== 'cancelled'; }).length,
      invs: invs.length, gross: invs.reduce(function(s, x){ return s + x.total; }, 0),
      collected: invs.reduce(function(s, x){ return s + x.paid; }, 0)
    });
  }
  var months = {};
  st.invoices.forEach(function(inv){
    var m = inv.date.slice(0, 7);
    months[m] = months[m] || { gross: 0, collected: 0, count: 0 };
    months[m].gross += inv.total;
    months[m].collected += inv.paid;
    months[m].count++;
  });
  var monthKeys = Object.keys(months).sort();

  var overdue = st.clients.filter(function(c){ return UT.daysUntil(UT.nextDue(c)) < 0; })
    .sort(function(a, b){ return UT.daysUntil(UT.nextDue(a)) - UT.daysUntil(UT.nextDue(b)); });

  var ranked = DB.technicians.slice().sort(function(a, b){ return b.completed - a.completed; });

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'Reports'),
        React.createElement('div', { className: 'ph-sub' }, 'Revenue, retention and technician performance')
      )
    ),
    React.createElement('div', { className: 'tabs', style: { marginBottom: 18 } },
      ['revenue', 'retention', 'performance'].map(function(t){
        return React.createElement('button', { key: t, className: tab[0] === t ? 'tab on' : 'tab', onClick: function(){ tab[1](t); } },
          t.charAt(0).toUpperCase() + t.slice(1)
        );
      })
    ),

    tab[0] === 'revenue' ? React.createElement('div', { className: 'stack' },
      React.createElement(Card, null,
        React.createElement('div', { className: 'card-head' },
          React.createElement('div', null, React.createElement('div', { className: 'card-title' }, 'Daily summary — last 7 days'), React.createElement('div', { className: 'card-sub' }, 'Invoices and collections per day'))
        ),
        React.createElement('div', { className: 'table-wrap' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null, React.createElement('tr', null,
              React.createElement('th', null, 'Day'), React.createElement('th', { className: 'al-r' }, 'Appointments'), React.createElement('th', { className: 'al-r' }, 'Invoices'), React.createElement('th', { className: 'al-r' }, 'Gross'), React.createElement('th', { className: 'al-r' }, 'Collected')
            )),
            React.createElement('tbody', null,
              last7.map(function(r){
                return React.createElement('tr', { key: r.d },
                  React.createElement('td', null, React.createElement('span', { className: 'strong' }, r.label)),
                  React.createElement('td', { className: 'al-r' }, r.appts),
                  React.createElement('td', { className: 'al-r' }, r.invs),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum' }, UT.fmtINR(r.gross))),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(r.collected)))
                );
              })
            )
          )
        )
      ),
      React.createElement(Card, null,
        React.createElement('div', { className: 'card-head' },
          React.createElement('div', null, React.createElement('div', { className: 'card-title' }, 'Monthly summary'), React.createElement('div', { className: 'card-sub' }, 'Across all invoices'))
        ),
        React.createElement('div', { className: 'table-wrap' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null, React.createElement('tr', null,
              React.createElement('th', null, 'Month'), React.createElement('th', { className: 'al-r' }, 'Invoices'), React.createElement('th', { className: 'al-r' }, 'Gross'), React.createElement('th', { className: 'al-r' }, 'Collected'), React.createElement('th', { className: 'al-r' }, 'Collection rate')
            )),
            React.createElement('tbody', null,
              monthKeys.map(function(m){
                var M = months[m];
                var rate = M.gross > 0 ? Math.round((M.collected / M.gross) * 100) : 0;
                return React.createElement('tr', { key: m },
                  React.createElement('td', null, React.createElement('span', { className: 'strong' }, UT.MONTHS[parseInt(m.slice(5), 10) - 1], ' ', m.slice(0, 4))),
                  React.createElement('td', { className: 'al-r' }, M.count),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum' }, UT.fmtINR(M.gross))),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(M.collected))),
                  React.createElement('td', { className: 'al-r' }, React.createElement(Chip, { s: rate >= 90 ? 'active' : rate >= 60 ? 'low' : 'overdue' }, rate + '%'))
                );
              })
            )
          )
        ),
        React.createElement('div', { className: 'report-tbl-note' }, 'Collection rate = share of invoiced amount actually collected in that month. Pending invoices raise this over time.')
      )
    ) : tab[0] === 'retention' ? React.createElement('div', { className: 'stack' },
      React.createElement('div', { className: 'grid-kpi' },
        React.createElement(Card, { cls: 'kpi' }, React.createElement('div', { className: 'kpi-lbl' }, 'Clients on track'), React.createElement('div', { className: 'kpi-val' }, st.clients.filter(function(c){ return UT.statusOf(c) === 'active'; }).length), React.createElement('div', { className: 'kpi-sub' }, 'within their service cycle')),
        React.createElement(Card, { cls: 'kpi' }, React.createElement('div', { className: 'kpi-lbl' }, 'Overdue'), React.createElement('div', { className: 'kpi-val danger' }, overdue.length), React.createElement('div', { className: 'kpi-sub' }, 'need a reminder or re-book')),
        React.createElement(Card, { cls: 'kpi' }, React.createElement('div', { className: 'kpi-lbl' }, 'Avg days late'), React.createElement('div', { className: 'kpi-val' }, overdue.length ? Math.round(overdue.reduce(function(s, c){ return s + Math.abs(UT.daysUntil(UT.nextDue(c))); }, 0) / overdue.length) : 0), React.createElement('div', { className: 'kpi-sub' }, 'across overdue clients')),
        React.createElement(Card, { cls: 'kpi' }, React.createElement('div', { className: 'kpi-lbl' }, 'On packages'), React.createElement('div', { className: 'kpi-val' }, st.clients.filter(function(c){ return c.packageId; }).length), React.createElement('div', { className: 'kpi-sub' }, 'prepaid plans active'))
      ),
      React.createElement(Card, null,
        React.createElement('div', { className: 'card-head' },
          React.createElement('div', null, React.createElement('div', { className: 'card-title' }, 'Overdue clients'), React.createElement('div', { className: 'card-sub' }, 'Auto-reminders enabled · WhatsApp/SMS/Email'))
        ),
        React.createElement('div', { className: 'table-wrap' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null, React.createElement('tr', null,
              React.createElement('th', null, 'Client'), React.createElement('th', { className: 'hide-md' }, 'Last service'), React.createElement('th', null, 'Next due'), React.createElement('th', { className: 'al-r' }, 'Days late'), React.createElement('th', null, 'Status'), React.createElement('th', null, '')
            )),
            React.createElement('tbody', null,
              overdue.map(function(c){
                var due = UT.nextDue(c);
                var late = Math.abs(UT.daysUntil(due));
                return React.createElement('tr', { key: c.id },
                  React.createElement('td', null,
                    React.createElement('div', { className: 't-cell-main' }, React.createElement(Avatar, { name: c.name, size: 32 }), React.createElement('span', { className: 't-name' }, c.name))
                  ),
                  React.createElement('td', { className: 'hide-md' }, UT.fmtShort(c.lastService)),
                  React.createElement('td', null, UT.fmtShort(due)),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono strong danger' }, late, 'd')),
                  React.createElement('td', null, React.createElement(Chip, { s: 'overdue' }, 'Overdue')),
                  React.createElement('td', null, React.createElement(Btn, { size: 'xs', kind: 'ghost', onClick: function(){ nav('clients'); } }, 'View'))
                );
              })
            )
          )
        ),
        overdue.length === 0 ? React.createElement(Empty, { icon: 'check', title: 'No overdue clients', sub: 'Retention is healthy.' }) : null
      )
    ) : React.createElement('div', { className: 'stack' },
      React.createElement(Card, null,
        React.createElement('div', { className: 'card-head' },
          React.createElement('div', null, React.createElement('div', { className: 'card-title' }, 'Technician performance'), React.createElement('div', { className: 'card-sub' }, 'Ranked by lifetime services completed'))
        ),
        React.createElement('div', { className: 'table-wrap' },
          React.createElement('table', { className: 'table' },
            React.createElement('thead', null, React.createElement('tr', null,
              React.createElement('th', null, 'Rank'), React.createElement('th', null, 'Technician'), React.createElement('th', { className: 'al-r' }, 'Completed (all)'), React.createElement('th', { className: 'al-r hide-sm' }, 'This month'), React.createElement('th', { className: 'al-r' }, 'Rating'), React.createElement('th', { className: 'al-r hide-sm' }, 'On-time'), React.createElement('th', null, 'Next 7d load')
            )),
            React.createElement('tbody', null,
              ranked.map(function(t, idx){
                var monthCount = st.appointments.filter(function(a){ return a.techId === t.id && a.status === 'completed' && a.date.slice(0, 7) === today.slice(0, 7); }).length;
                var load = st.appointments.filter(function(a){ return a.techId === t.id && a.date >= today && a.date <= UT.addDays(today, 6) && a.status !== 'cancelled'; }).length;
                var max = Math.max.apply(null, ranked.map(function(x){ return x.completed; }));
                return React.createElement('tr', { key: t.id },
                  React.createElement('td', null, React.createElement('div', { className: 'rank-badge ' + (idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : '') }, '#' + (idx + 1))),
                  React.createElement('td', null, React.createElement('div', { className: 't-cell-main' }, React.createElement(Avatar, { name: t.name, size: 32 }), React.createElement('span', { className: 't-name' }, t.name))),
                  React.createElement('td', { className: 'al-r' }, React.createElement('span', { className: 'mono strong' }, t.completed)),
                  React.createElement('td', { className: 'al-r hide-sm' }, React.createElement('span', { className: 'mono' }, monthCount)),
                  React.createElement('td', { className: 'al-r' }, t.rating, ' / 5'),
                  React.createElement('td', { className: 'al-r hide-sm' }, t.onTime + '%'),
                  React.createElement('td', null,
                    React.createElement('div', { className: 'loadtrack', style: { width: 110 } }, React.createElement('div', { className: 'loadbar', style: { width: Math.max(6, (t.completed / max) * 100) + '%' } }))
                  )
                );
              })
            )
          )
        )
      )
    )
  );
}

export const OPS = { PaymentModal: PaymentModal, RestockModal: RestockModal, DeductModal: DeductModal, PkgBuyModal: PkgBuyModal, Inventory: Inventory, Billing: Billing, StaffView: StaffView, Reports: Reports };
