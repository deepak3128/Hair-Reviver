/* views/clients.jsx — client list, client profile, add-client flow */
import React from 'react';
import DB, { UT } from '../lib/data';
import { UI as U } from '../lib/ui';
import { API } from '../lib/api';
import { APP } from './appointments';
import { OPS } from './operations';
import { openWhatsApp, clientMsg } from '../lib/wa';
var Icon = U.Icon, Chip = U.Chip, Avatar = U.Avatar, Card = U.Card, Section = U.Section,
    Field = U.Field, Select = U.Select, Input = U.Input, Btn = U.Btn, Modal = U.Modal,
    Empty = U.Empty, toast = U.toast;

function clientOf(st, id){ return st.clients.find(function(c){ return c.id === id; }); }
function techName(id){ var t = DB.technicians.find(function(x){ return x.id === id; }); return t ? t.name : '—'; }
function balanceOf(st, clientId){
  return st.invoices.filter(function(i){ return i.clientId === clientId && i.status !== 'paid'; })
    .reduce(function(s, i){ return s + (i.total - i.paid); }, 0);
}
function dueChip(st, c){
  var due = UT.nextDue(c);
  var d = UT.daysUntil(due);
  if (d < 0) return React.createElement(Chip, { s: 'overdue' }, Math.abs(d) + 'd late');
  if (d === 0) return React.createElement(Chip, { s: 'due today' }, 'Due today');
  return React.createElement(Chip, { s: 'active' }, 'in ' + d + 'd');
}
function patchLabel(c){ return c.patchType + ' · ' + c.base; }

/* ---------------- Client list ---------------- */
function ClientList(props){
  var st = props.st, set = props.set, nav = props.nav;
  var q = React.useState('');
  var fStatus = React.useState('all');
  var fPatch = React.useState('all');
  var addOpen = React.useState(false);

  var rows = st.clients.filter(function(c){
    var s = UT.statusOf(c);
    if (fStatus[0] !== 'all' && s !== fStatus[0]) return false;
    if (fPatch[0] !== 'all' && c.patchType !== fPatch[0]) return false;
    var term = q[0].trim().toLowerCase();
    if (term && (c.name.toLowerCase().indexOf(term) < 0) && (c.phone.indexOf(term) < 0) && (c.city.toLowerCase().indexOf(term) < 0)) return false;
    return true;
  });

  var statusCount = {
    all: st.clients.length,
    active: st.clients.filter(function(c){ return UT.statusOf(c) === 'active'; }).length,
    overdue: st.clients.filter(function(c){ return UT.statusOf(c) === 'overdue' || UT.statusOf(c) === 'due today'; }).length
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'Clients'),
        React.createElement('div', { className: 'ph-sub' }, statusCount.active, ' on track · ', statusCount.overdue, ' need attention · ', st.clients.length, ' total')
      ),
      React.createElement('div', { className: 'page-actions' },
        React.createElement(Btn, { icon: 'plus', kind: 'primary', onClick: function(){ addOpen[1](true); }, dataid: 'btn-add-client' }, 'Add client')
      )
    ),
    React.createElement('div', { className: 'toolbar' },
      React.createElement('div', { className: 'search-big' },
        React.createElement(Field, { label: null },
          React.createElement(Input, { placeholder: 'Search by name, phone or city…', value: q[0], onChange: function(e){ q[1](e.target.value); } })
        )
      ),
      React.createElement(Field, { label: null, style: { minWidth: 150 } },
        React.createElement(Select, { value: fStatus[0], onChange: function(e){ fStatus[1](e.target.value); } },
          React.createElement('option', { value: 'all' }, 'All statuses'),
          React.createElement('option', { value: 'active' }, 'On track'),
          React.createElement('option', { value: 'overdue' }, 'Overdue / due today')
        )
      ),
      React.createElement(Field, { label: null, style: { minWidth: 150 } },
        React.createElement(Select, { value: fPatch[0], onChange: function(e){ fPatch[1](e.target.value); } },
          React.createElement('option', { value: 'all' }, 'All patch types'),
          React.createElement('option', { value: 'Indian Remy' }, 'Indian Remy'),
          React.createElement('option', { value: 'European' }, 'European'),
          React.createElement('option', { value: 'Synthetic' }, 'Synthetic')
        )
      )
    ),
    React.createElement(Card, null,
      React.createElement('div', { className: 'table-wrap' },
        React.createElement('table', { className: 'table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Client'),
              React.createElement('th', { className: 'hide-md' }, 'City'),
              React.createElement('th', null, 'Patch'),
              React.createElement('th', null, 'Next due'),
              React.createElement('th', null, 'Status'),
              React.createElement('th', { className: 'al-r hide-sm' }, 'Balance'),
              React.createElement('th', null, '')
            )
          ),
          React.createElement('tbody', null,
            rows.map(function(c){
              var due = UT.nextDue(c);
              return React.createElement('tr', { key: c.id, className: 't-row', onClick: function(){ nav('client', { id: c.id }); }, 'data-od-id': 'client-row-' + c.id },
                React.createElement('td', null,
                  React.createElement('div', { className: 't-cell-main' },
                    React.createElement(Avatar, { name: c.name, size: 36 }),
                    React.createElement('div', null,
                      React.createElement('div', { className: 't-name' }, c.name),
                      React.createElement('div', { className: 't-sub' }, c.phone)
                    )
                  )
                ),
                React.createElement('td', { className: 'hide-md' }, c.city),
                React.createElement('td', null,
                  React.createElement('div', { className: 't-name' }, patchLabel(c)),
                  React.createElement('div', { className: 't-sub' }, c.vendor, ' · ', c.attach)
                ),
                React.createElement('td', null,
                  React.createElement('div', { className: 't-name' }, UT.fmtShort(due)),
                  React.createElement('div', { className: 't-sub' }, dueChip(st, c))
                ),
                React.createElement('td', null, React.createElement(Chip, { s: UT.statusOf(c) }, UT.statusOf(c) === 'due today' ? 'Due today' : UT.statusOf(c))),
                React.createElement('td', { className: 'al-r hide-sm' },
                  React.createElement('span', { className: 'mono tnum' + (balanceOf(st, c.id) > 0 ? ' danger' : '') }, UT.fmtINR(balanceOf(st, c.id)))
                ),
                React.createElement('td', null, React.createElement(Icon, { i: 'chevRight', size: 16, cls: 'faint' }))
              );
            })
          )
        )
      ),
      rows.length === 0 ? React.createElement(Empty, { icon: 'users', title: 'No clients match', sub: 'Try a different search or filter.' }) : null
    ),
    addOpen[0] ? React.createElement(ClientForm, { st: st, set: set, nav: nav, onClose: function(){ addOpen[1](false); } }) : null
  );
}

/* ---------------- Add / edit client ---------------- */
function ClientForm(props){
  var st = props.st, set = props.set, nav = props.nav;
  var f = {
    name: React.useState(''), phone: React.useState('+91 '), city: React.useState(''),
    patchType: React.useState('Indian Remy'), base: React.useState('Crown Patch'),
    vendor: React.useState('Remy Co.'), attach: React.useState('Glue'),
    cycle: React.useState('3'), lastService: React.useState(UT.today()), notes: React.useState('')
  };
  function submit(e){
    e.preventDefault();
    if (!f.name[0].trim() || !f.phone[0].trim() || !f.city[0].trim()){ toast('Please fill name, phone and city', 'err'); return; }
    var c = {
      name: f.name[0].trim(), phone: f.phone[0].trim(), city: f.city[0].trim(), gender: '—',
      patchType: f.patchType[0], base: f.base[0], vendor: f.vendor[0], attach: f.attach[0],
      cycle: parseInt(f.cycle[0], 10) || 3, lastService: f.lastService[0], joined: UT.today(),
      packageId: null, notes: f.notes[0].trim()
    };
    API.post('/clients', c)
      .then(function(res){
        set(function(s){ return { clients: s.clients.concat(res.client) }; });
        props.onClose();
        toast(res.client.name + ' added — next maintenance auto-scheduled');
        nav('client', { id: res.client.id });
      })
      .catch(function(ex){ toast(ex.message, 'err'); });
  }
  return React.createElement(Modal, { title: 'Add new client', onClose: props.onClose, wide: true },
    React.createElement('form', { onSubmit: submit },
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Full name' }, React.createElement(Input, { placeholder: 'e.g. Aditi Rao', value: f.name[0], onChange: function(e){ f.name[1](e.target.value); } })),
        React.createElement(Field, { label: 'Phone' }, React.createElement(Input, { placeholder: '+91 98…', value: f.phone[0], onChange: function(e){ f.phone[1](e.target.value); } }))
      ),
      React.createElement(Field, { label: 'City' }, React.createElement(Input, { placeholder: 'e.g. Mumbai', value: f.city[0], onChange: function(e){ f.city[1](e.target.value); } })),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Patch type' },
          React.createElement(Select, { value: f.patchType[0], onChange: function(e){ f.patchType[1](e.target.value); } },
            React.createElement('option', null, 'Indian Remy'), React.createElement('option', null, 'European'), React.createElement('option', null, 'Synthetic'))),
        React.createElement(Field, { label: 'Base / size' },
          React.createElement(Select, { value: f.base[0], onChange: function(e){ f.base[1](e.target.value); } },
            React.createElement('option', null, 'Crown Patch'), React.createElement('option', null, 'Full Cap'), React.createElement('option', null, 'Toupee')))
      ),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Vendor' },
          React.createElement(Select, { value: f.vendor[0], onChange: function(e){ f.vendor[1](e.target.value); } },
            React.createElement('option', null, 'Remy Co.'), React.createElement('option', null, 'HairPro'), React.createElement('option', null, 'Luxe Locks'))),
        React.createElement(Field, { label: 'Attachment' },
          React.createElement(Select, { value: f.attach[0], onChange: function(e){ f.attach[1](e.target.value); } },
            React.createElement('option', null, 'Glue'), React.createElement('option', null, 'Tape-in'), React.createElement('option', null, 'Clip')))
      ),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Service cycle (weeks)', hint: 'Next visit is auto-scheduled from this.' },
          React.createElement(Select, { value: f.cycle[0], onChange: function(e){ f.cycle[1](e.target.value); } },
            React.createElement('option', { value: '2' }, '2 weeks'), React.createElement('option', { value: '3' }, '3 weeks'), React.createElement('option', { value: '4' }, '4 weeks'))),
        React.createElement(Field, { label: 'Last service date' },
          React.createElement(Input, { type: 'date', value: f.lastService[0], onChange: function(e){ f.lastService[1](e.target.value); } }))
      ),
      React.createElement(Field, { label: 'Notes', hint: 'Allergies, preferences, complaints' },
        React.createElement(Input, { tag: 'textarea', placeholder: 'e.g. Sensitive scalp — use gentle adhesive…', value: f.notes[0], onChange: function(e){ f.notes[1](e.target.value); } })),
      React.createElement('div', { className: 'modal-foot', style: { margin: '20px -22px -20px' } },
        React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
        React.createElement(Btn, { kind: 'primary', type: 'submit', icon: 'check' }, 'Save client')
      )
    )
  );
}

/* ---------------- Client detail ---------------- */
function ClientDetail(props){
  var st = props.st, set = props.set, nav = props.nav;
  var id = props.params.id;
  var c = clientOf(st, id);
  var notesDraft = React.useState(c ? c.notes : '');
  var book = React.useState(false);
  var pay = React.useState(null);

  if (!c) return React.createElement(Empty, { icon: 'users', title: 'Client not found', sub: 'This client may have been removed.' });

  var due = UT.nextDue(c);
  var days = UT.daysUntil(due);
  var remDate = UT.addDays(due, -2);
  var remSent = UT.daysUntil(remDate) < 0;
  var history = st.appointments.filter(function(a){ return a.clientId === id; })
    .sort(function(a, b){ if (a.date === b.date) return a.time.localeCompare(b.time); return a.date < b.date ? 1 : -1; });
  var invoices = st.invoices.filter(function(i){ return i.clientId === id; })
    .sort(function(a, b){ return a.date < b.date ? 1 : -1; });
  var pkg = DB.packages.find(function(p){ return p.id === c.packageId; });
  var bal = balanceOf(st, id);

  function saveNotes(){
    API.put('/clients/' + id, { notes: notesDraft[0] })
      .then(function(res){
        set(function(s){
          return { clients: s.clients.map(function(x){ return x.id === id ? res.client : x; }) };
        });
        toast('Notes saved for ' + c.name);
      })
      .catch(function(ex){ toast(ex.message, 'err'); });
  }

  return React.createElement('div', null,
    React.createElement('button', { className: 'back-btn', onClick: function(){ nav('clients'); } },
      React.createElement(Icon, { i: 'arrowLeft', size: 16 }), 'All clients'),
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', { className: 'profile-head' },
        React.createElement(Avatar, { name: c.name, size: 56, lg: true }),
        React.createElement('div', { className: 'profile-meta' },
          React.createElement('div', { className: 'profile-name' }, c.name, ' ', React.createElement(Chip, { s: UT.statusOf(c) }, UT.statusOf(c) === 'due today' ? 'Due today' : UT.statusOf(c))),
          React.createElement('div', { className: 'profile-sub' },
            React.createElement('span', null, React.createElement(Icon, { i: 'pin', size: 14 }), c.city),
            React.createElement('span', null, React.createElement(Icon, { i: 'phone', size: 14 }), c.phone),
            React.createElement('span', null, 'Client since ', UT.fmtShort(c.joined))
          )
        )
      ),
      React.createElement('div', { className: 'page-actions' },
        React.createElement(Btn, { icon: 'wa', kind: 'ghost', onClick: function(){ openWhatsApp(c.phone, clientMsg(c)); }, dataid: 'btn-wa-client' }, 'WhatsApp'),
        React.createElement(Btn, { icon: 'plus', kind: 'primary', onClick: function(){ book[1](true); }, dataid: 'btn-book-appointment' }, 'Book appointment')
      )
    ),

    React.createElement('div', { className: 'grid2' },
      React.createElement('div', { className: 'stack' },
        React.createElement(Section, { title: 'Patch profile', sub: 'Fitted base and maintenance plan', dataid: 'patch-profile' },
          React.createElement('div', { className: 'dl' },
            React.createElement('dt', null, 'Patch type'), React.createElement('dd', null, React.createElement('b', null, c.patchType)),
            React.createElement('dt', null, 'Base / size'), React.createElement('dd', null, c.base),
            React.createElement('dt', null, 'Vendor'), React.createElement('dd', null, c.vendor),
            React.createElement('dt', null, 'Attachment'), React.createElement('dd', null, c.attach),
            React.createElement('dt', null, 'Service cycle'), React.createElement('dd', null, 'Every ', c.cycle, ' weeks'),
            React.createElement('dt', null, 'Last service'), React.createElement('dd', null, UT.fmtDate(c.lastService))
          )
        ),
        React.createElement(Section, {
          title: 'Notes', sub: 'Allergies, preferences, complaints',
          action: React.createElement(Btn, { size: 'sm', kind: 'quiet', icon: 'check', onClick: saveNotes }, 'Save notes'),
          dataid: 'client-notes'
        },
          React.createElement(Input, { tag: 'textarea', value: notesDraft[0], onChange: function(e){ notesDraft[1](e.target.value); } })
        )
      ),

      React.createElement('div', { className: 'stack' },
        React.createElement(Section, { title: 'Next maintenance', sub: 'Auto-scheduled from service cycle', dataid: 'next-due' },
          React.createElement('div', { className: 'row', style: { alignItems: 'flex-end', gap: 18 } },
            React.createElement('div', { className: 'due-big' },
              React.createElement('div', { className: 'due-num ' + (days < 0 ? 'danger' : days === 0 ? 'warn' : 'ok') }, days < 0 ? Math.abs(days) + 'd late' : days === 0 ? 'Today' : 'in ' + days + 'd'),
              React.createElement('div', { className: 'faint' }, UT.fmtDate(due))
            ),
            React.createElement('div', null,
              React.createElement(Chip, { s: remSent ? 'low' : 'active' }, remSent ? 'Reminder sent' : 'Reminder on ' + UT.fmtShort(remDate)),
              React.createElement('div', { className: 'faint', style: { marginTop: 6, fontSize: 12.5 } }, 'WhatsApp · ', UT.daysUntil(remDate) <= 0 ? 'notified' : 'auto-scheduled'),
              React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ book[1](true); } }, 'Book this visit')
            )
          )
        ),
        React.createElement(Section, { title: 'Payments', sub: 'Invoices for this client', dataid: 'client-payments' },
          invoices.length === 0
            ? React.createElement(Empty, { icon: 'card', title: 'No invoices yet', sub: 'Invoices appear after services are completed.' })
            : React.createElement('div', { className: 'list-rows' },
              invoices.slice(0, 6).map(function(inv){
                var dueAmt = inv.total - inv.paid;
                return React.createElement('div', { className: 'list-row', key: inv.id },
                  React.createElement('div', { className: 'lr-main' },
                    React.createElement('div', { className: 'lr-title' }, inv.id, ' · ', UT.fmtShort(inv.date)),
                    React.createElement('div', { className: 'lr-sub' }, inv.items.map(function(it){ return it.label; }).join(' + '))
                  ),
                  React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(inv.total)),
                  React.createElement(Chip, { s: inv.status }, inv.status),
                  dueAmt > 0 ? React.createElement(Btn, { size: 'xs', kind: 'ghost', onClick: function(){ pay[1](inv); } }, 'Collect') : null
                );
              })
            )
        ),
        pkg ? React.createElement(Section, { title: 'Service package', sub: 'Prepaid plan on file', dataid: 'client-package' },
          React.createElement('div', { className: 'row', style: { justifyContent: 'space-between' } },
            React.createElement('div', null,
              React.createElement('div', { className: 't-name' }, pkg.name),
              React.createElement('div', { className: 't-sub' }, pkg.period, ' · ', pkg.svc, pkg.svc > 1 ? ' services' : ' replacement', ' included')
            ),
            React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(pkg.price))
          )
        ) : null
      )
    ),

    React.createElement('div', { className: 'grid2', style: { marginTop: 18 } },
      React.createElement(Section, {
        title: 'Service history', sub: 'Auto-populated from appointments',
        dataid: 'service-history'
      },
        history.length === 0
          ? React.createElement(Empty, { icon: 'calendar', title: 'No visits recorded', sub: 'Past appointments will appear here.' })
          : React.createElement('div', { className: 'list-rows' },
            history.slice(0, 10).map(function(a){
              return React.createElement('div', { className: 'list-row', key: a.id },
                React.createElement('div', { className: 'lr-main' },
                  React.createElement('div', { className: 'lr-title' }, a.service, ' · ', a.date === UT.today() ? 'Today' : UT.fmtDate(a.date), ' at ', a.time),
                  React.createElement('div', { className: 'lr-sub' }, techName(a.techId), ' · ', a.dur, ' min')
                ),
                React.createElement(Chip, { s: a.status }, a.status)
              );
            })
          )
      ),
      React.createElement(Section, { title: 'Reminder settings', sub: 'How and when we nudge this client', dataid: 'reminder-settings' },
        React.createElement('div', { className: 'dl' },
          React.createElement('dt', null, 'Channel'), React.createElement('dd', null, 'WhatsApp (preferred)'),
          React.createElement('dt', null, 'Lead time'), React.createElement('dd', null, '2 days before the due date'),
          React.createElement('dt', null, 'Next reminder'), React.createElement('dd', null, UT.fmtDate(remDate), React.createElement('span', { className: 'faint' }, ' — ', remSent ? 'sent' : 'pending')),
          React.createElement('dt', null, 'Current balance'), React.createElement('dd', null, React.createElement('b', { className: bal > 0 ? 'danger' : '' }, bal > 0 ? UT.fmtINR(bal) : 'Cleared'))
        )
      )
    ),

    book[0] ? React.createElement(APP.BookModal, {
      st: st, set: set, nav: nav, onClose: function(){ book[1](false); }, preset: { clientId: id }
    }) : null,
    pay[0] ? React.createElement(OPS.PaymentModal, {
      invoice: pay[0], st: st, set: set, onClose: function(){ pay[1](null); }
    }) : null
  );
}

export const CLIENTS = { ClientList: ClientList, ClientDetail: ClientDetail, ClientForm: ClientForm };
