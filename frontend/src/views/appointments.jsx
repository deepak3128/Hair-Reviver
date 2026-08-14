/* views/appointments.jsx — day/week schedule, booking, status lifecycle */
import React from 'react';
import DB, { UT } from '../lib/data';
import { UI as U } from '../lib/ui';
var Icon = U.Icon, Chip = U.Chip, Avatar = U.Avatar, Card = U.Card, Section = U.Section,
    Field = U.Field, Select = U.Select, Input = U.Input, Btn = U.Btn, Modal = U.Modal,
    Empty = U.Empty, toast = U.toast;

var TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:15','12:30','13:00','14:00','14:30','15:00','15:30','16:00','16:15','16:30','17:00','17:30','18:00'];
var SERVICES = ['Cleaning','Refit','Replacement','New Patch','Consultation'];
var CHANNELS = ['WhatsApp','SMS','Email'];

function clientOf(st, id){ return st.clients.find(function(c){ return c.id === id; }); }
function techOf(id){ return DB.technicians.find(function(t){ return t.id === id; }); }
function period(t){ var h = parseInt(t.split(':')[0], 10); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; }

/* ---------------- Book / reschedule modal ---------------- */
function BookModal(props){
  var st = props.st, set = props.set, nav = props.nav;
  var preset = props.preset || {};
  var existing = preset.appointmentId ? st.appointments.find(function(a){ return a.id === preset.appointmentId; }) : null;

  var f = {
    clientId: React.useState(preset.clientId || existing ? existing.clientId : (st.clients[0] ? st.clients[0].id : '')),
    service: React.useState(existing ? existing.service : 'Cleaning'),
    techId: React.useState(existing ? existing.techId : (DB.technicians[0] ? DB.technicians[0].id : '')),
    date: React.useState(existing ? existing.date : (preset.date || UT.today())),
    time: React.useState(existing ? existing.time : '10:00'),
    dur: React.useState(existing ? existing.dur : 45),
    channel: React.useState(existing ? existing.reminder.channel : 'WhatsApp'),
    daysBefore: React.useState(existing ? existing.reminder.daysBefore : 1)
  };

  function submit(e){
    e.preventDefault();
    if (!f.clientId[0]){ toast('Select a client', 'err'); return; }
    var c = clientOf(st, f.clientId[0]);
    var item = st.inventory.find(function(x){ return x.type === c.patchType && x.base === c.base && x.type !== 'Supplies'; });
    var isPatchWork = f.service[0] === 'New Patch' || f.service[0] === 'Replacement';
    if (isPatchWork && item && item.qty <= item.thr){
      toast('Heads up: ' + c.patchType + ' ' + c.base + ' is low in stock (' + item.qty + ' left)', 'err');
    }

    if (existing){
      set(function(s){
        return { appointments: s.appointments.map(function(a){
          if (a.id !== existing.id) return a;
          return Object.assign({}, a, {
            clientId: f.clientId[0], service: f.service[0], techId: f.techId[0],
            date: f.date[0], time: f.time[0], dur: parseInt(f.dur[0], 10),
            reminder: { channel: f.channel[0], daysBefore: parseInt(f.daysBefore[0], 10) }
          });
        }) };
      });
      toast('Appointment updated · ' + UT.fmtDate(f.date[0]) + ' at ' + f.time[0]);
    } else {
      var a = {
        id: UT.nextId(st.appointments, 'A-'),
        clientId: f.clientId[0], techId: f.techId[0], service: f.service[0],
        date: f.date[0], time: f.time[0], dur: parseInt(f.dur[0], 10),
        status: 'scheduled', reminder: { channel: f.channel[0], daysBefore: parseInt(f.daysBefore[0], 10) }
      };
      set(function(s){ return { appointments: s.appointments.concat(a) }; });
      toast('Appointment booked · ' + UT.fmtDate(f.date[0]) + ' at ' + f.time[0]);
      if (nav && f.date[0] === UT.today()) nav('appointments', { date: f.date[0] });
    }
    props.onClose();
  }

  var fee = UT.svcFee[f.service[0]] || 0;
  var cSel = clientOf(st, f.clientId[0]);
  var patchCost = (cSel && (f.service[0] === 'New Patch' || f.service[0] === 'Replacement'))
    ? (UT.PATCHCOST[cSel.patchType] ? UT.PATCHCOST[cSel.patchType][cSel.base] : 0) : 0;

  return React.createElement(Modal, { title: existing ? 'Reschedule appointment' : 'Book appointment', onClose: props.onClose, wide: true },
    React.createElement('form', { onSubmit: submit },
      React.createElement(Field, { label: 'Client' },
        React.createElement(Select, { value: f.clientId[0], onChange: function(e){ f.clientId[1](e.target.value); } },
          st.clients.map(function(c){ return React.createElement('option', { key: c.id, value: c.id }, c.name, ' — ', c.city); })
        )
      ),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Service' },
          React.createElement(Select, { value: f.service[0], onChange: function(e){ f.service[1](e.target.value); } },
            SERVICES.map(function(sv){ return React.createElement('option', { key: sv, value: sv }, sv); })
          )
        ),
        React.createElement(Field, { label: 'Technician' },
          React.createElement(Select, { value: f.techId[0], onChange: function(e){ f.techId[1](e.target.value); } },
            DB.technicians.map(function(t){ return React.createElement('option', { key: t.id, value: t.id }, t.name, ' · ', t.role); })
          )
        )
      ),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Date' },
          React.createElement(Input, { type: 'date', value: f.date[0], onChange: function(e){ f.date[1](e.target.value); } })),
        React.createElement(Field, { label: 'Time' },
          React.createElement(Select, { value: f.time[0], onChange: function(e){ f.time[1](e.target.value); } },
            TIMES.map(function(t){ return React.createElement('option', { key: t, value: t }, t); })
          )
        )
      ),
      React.createElement('div', { className: 'frow' },
        React.createElement(Field, { label: 'Duration' },
          React.createElement(Select, { value: String(f.dur[0]), onChange: function(e){ f.dur[1](parseInt(e.target.value, 10)); } },
            React.createElement('option', { value: '30' }, '30 min'), React.createElement('option', { value: '45' }, '45 min'),
            React.createElement('option', { value: '60' }, '60 min'), React.createElement('option', { value: '75' }, '75 min'),
            React.createElement('option', { value: '90' }, '90 min')
          )
        ),
        React.createElement(Field, { label: 'Reminder channel' },
          React.createElement(Select, { value: f.channel[0], onChange: function(e){ f.channel[1](e.target.value); } },
            CHANNELS.map(function(ch){ return React.createElement('option', { key: ch, value: ch }, ch); })
          )
        )
      ),
      React.createElement(Field, { label: 'Remind', hint: 'How many days before the visit to send the reminder' },
        React.createElement(Select, { value: String(f.daysBefore[0]), onChange: function(e){ f.daysBefore[1](parseInt(e.target.value, 10)); } },
          React.createElement('option', { value: '0' }, 'Same day'), React.createElement('option', { value: '1' }, '1 day before'),
          React.createElement('option', { value: '2' }, '2 days before'), React.createElement('option', { value: '3' }, '3 days before')
        )
      ),
      React.createElement('div', { className: 'card', cls: '', style: { background: 'var(--surface-2)', border: '1px dashed var(--border-strong)', padding: '12px 16px', marginTop: 4 } },
        React.createElement('div', { className: 'row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 } },
          React.createElement('span', { className: 'faint', style: { fontSize: 13 } }, 'Service charge ', UT.fmtINR(fee), patchCost ? ' + patch ' + UT.fmtINR(patchCost) : ''),
          React.createElement('span', { className: 'mono tnum strong' }, UT.fmtINR(fee + patchCost))
        )
      ),
      React.createElement('div', { className: 'modal-foot', style: { margin: '20px -22px -20px' } },
        React.createElement(Btn, { kind: 'ghost', onClick: props.onClose }, 'Cancel'),
        React.createElement(Btn, { kind: 'primary', type: 'submit', icon: 'check' }, existing ? 'Save changes' : 'Book appointment')
      )
    )
  );
}

/* ---------------- Status lifecycle actions ---------------- */
function setApptStatus(st, set, a, status){
  set(function(s){
    return { appointments: s.appointments.map(function(x){ return x.id === a.id ? Object.assign({}, x, { status: status }) : x; }) };
  });
  toast(status === 'inprogress' ? 'Started — service in progress' : status === 'noshow' ? 'Marked as no-show' : status === 'cancelled' ? 'Appointment cancelled' : 'Status updated');
}

function completeAppt(st, set, a){
  var c = clientOf(st, a.clientId);
  set(function(s){
    var appts = s.appointments.map(function(x){ return x.id === a.id ? Object.assign({}, x, { status: 'completed' }) : x; });
    var clients = c ? s.clients.map(function(x){ return x.id === c.id ? Object.assign({}, x, { lastService: a.date }) : x; }) : s.clients;
    var invoices = s.invoices;
    if (c && !s.invoices.find(function(i){ return i.apptId === a.id; })){
      var items = [{ label: a.service + ' — ' + c.name, amount: UT.svcFee[a.service] || 0 }];
      if (a.service === 'New Patch' || a.service === 'Replacement'){
        var pc = UT.PATCHCOST[c.patchType] ? (UT.PATCHCOST[c.patchType][c.base] || 0) : 0;
        items.unshift({ label: c.patchType + ' ' + c.base + ' patch', amount: pc });
      }
      var total = items.reduce(function(s2, i){ return s2 + i.amount; }, 0);
      invoices = s.invoices.concat({
        id: UT.nextId(s.invoices, 'INV-'), date: a.date, clientId: c.id, items: items,
        total: total, paid: 0, status: 'pending', apptId: a.id
      });
      toast('Service completed · invoice raised (pending)');
      return { appointments: appts, clients: clients, invoices: invoices };
    }
    toast('Service completed');
    return { appointments: appts, clients: clients };
  });
}

function ApptCard(props){
  var a = props.a, st = props.st, set = props.set, c = clientOf(st, a.clientId), tech = techOf(a.techId);
  var canBook = props.canBook;
  return React.createElement(Card, { cls: 'appt-card', dataid: 'appt-row-' + a.id },
    React.createElement('div', { className: 'appt-time' }, a.time),
    React.createElement(Avatar, { name: c ? c.name : '?', size: 36 }),
    React.createElement('div', { className: 'appt-main' },
      React.createElement('div', { className: 't-name' }, c ? c.name : '—', ' · ', a.service),
      React.createElement('div', { className: 't-sub' }, tech ? tech.name : '—', ' · ', a.dur, ' min · ', a.reminder.channel, ' reminder ', a.reminder.daysBefore, 'd before')
    ),
    React.createElement(Chip, { s: a.status }, a.status === 'inprogress' ? 'In progress' : a.status),
    React.createElement('div', { className: 'appt-acts' },
      a.status === 'scheduled' ? React.createElement(React.Fragment, null,
        React.createElement(Btn, { size: 'sm', kind: 'primary', onClick: function(){ setApptStatus(st, set, a, 'inprogress'); } }, 'Start'),
        React.createElement(Btn, { size: 'sm', kind: 'ghost', onClick: function(){ setApptStatus(st, set, a, 'noshow'); } }, 'No-show'),
        React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ setApptStatus(st, set, a, 'cancelled'); } }, 'Cancel')
      ) : a.status === 'inprogress' ? React.createElement(Btn, { size: 'sm', kind: 'primary', onClick: function(){ completeAppt(st, set, a); } }, 'Complete')
        : (a.status === 'noshow' || a.status === 'cancelled') && canBook
          ? React.createElement(Btn, { size: 'sm', kind: 'ghost', icon: 'repeat', onClick: function(){ props.onEdit(a); } }, 'Re-book')
          : null
    )
  );
}

/* ---------------- Appointments view ---------------- */
function Appointments(props){
  var st = props.st, set = props.set, nav = props.nav, u = props.u;
  var isTech = u.role === 'technician';
  var dateState = React.useState((props.params && props.params.date) || UT.today());
  var cur = dateState[0];
  var mode = React.useState('day');
  var techF = React.useState(isTech ? u.techId : 'all');
  var book = React.useState(null);   // preset or {appointmentId}
  var edit = React.useState(null);   // appointment being re-booked

  var techFilter = techF[0];
  var rows = st.appointments.filter(function(a){
    if (techFilter !== 'all' && a.techId !== techFilter) return false;
    return a.date === cur;
  }).sort(function(a, b){ return a.time.localeCompare(b.time); });

  function shift(n){
    var step = mode[0] === 'week' ? 7 : 1;
    dateState[1](UT.addDays(cur, n * step));
  }
  function mondayOf(d){
    var x = UT.parse(d);
    var dow = (x.getDay() + 6) % 7;
    return UT.fmt(new Date(x.getFullYear(), x.getMonth(), x.getDate() - dow));
  }
  function openBook(preset){
    book[1](preset || {});
  }
  function onEdit(a){
    edit[1](a);
  }

  var weekDays = [];
  var monday = mondayOf(cur);
  for (var i = 0; i < 7; i++) weekDays.push(UT.addDays(monday, i));

  var dayLabel = cur === UT.today() ? 'Today · ' + UT.fmtDate(cur) : UT.fmtDate(cur);

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, isTech ? 'My appointments' : 'Appointments'),
        React.createElement('div', { className: 'ph-sub' }, 'Bookings across the clinic · reminders set automatically')
      ),
      React.createElement('div', { className: 'page-actions' },
        React.createElement(Btn, { icon: 'plus', kind: 'primary', onClick: function(){ openBook(); }, dataid: 'btn-book-appointment' }, 'Book appointment')
      )
    ),

    React.createElement(Card, { cls: 'card-pad', style: { marginBottom: 18 } },
      React.createElement('div', { className: 'appt-bar' },
        React.createElement('div', { className: 'date-nav' },
          React.createElement('button', { className: 'icon-btn', onClick: function(){ shift(-1); }, 'aria-label': 'Previous' }, React.createElement(Icon, { i: 'chevLeft', size: 16 })),
          React.createElement('button', { className: 'btn btn-sm btn-ghost', onClick: function(){ dateState[1](UT.today()); } }, 'Today'),
          React.createElement('button', { className: 'icon-btn', onClick: function(){ shift(1); }, 'aria-label': 'Next' }, React.createElement(Icon, { i: 'chevRight', size: 16 }))
        ),
        React.createElement('div', { className: 'seg' },
          React.createElement('button', { className: mode[0] === 'day' ? 'on' : '', onClick: function(){ mode[1]('day'); } }, 'Day'),
          React.createElement('button', { className: mode[0] === 'week' ? 'on' : '', onClick: function(){ mode[1]('week'); } }, 'Week')
        ),
        React.createElement(Field, { label: null, style: { minWidth: 200, margin: 0 } },
          React.createElement(Select, { value: techFilter, disabled: isTech, onChange: function(e){ techF[1](e.target.value); } },
            isTech ? null : React.createElement('option', { value: 'all' }, 'All technicians'),
            DB.technicians.map(function(t){ return React.createElement('option', { key: t.id, value: t.id }, t.name); })
          )
        ),
        React.createElement('div', { className: 'strong', style: { marginLeft: 'auto', fontSize: 14 } }, dayLabel)
      )
    ),

    mode[0] === 'day'
      ? React.createElement(Card, { dataid: 'day-schedule' },
          rows.length === 0
            ? React.createElement(Empty, { icon: 'calendar', title: 'No appointments on ' + dayLabel, sub: 'Book a slot to start filling the schedule.' })
            : ['Morning', 'Afternoon', 'Evening'].map(function(p){
                var group = rows.filter(function(a){ return period(a.time) === p; });
                if (!group.length) return null;
                return React.createElement('div', { key: p },
                  React.createElement('div', { className: 'period' }, React.createElement('span', null, p)),
                  group.map(function(a){ return React.createElement(ApptCard, { key: a.id, a: a, st: st, set: set, canBook: true, onEdit: onEdit }); })
                );
              })
        )
      : React.createElement('div', { className: 'week-scroll' },
          React.createElement('div', { className: 'week-grid' },
            weekDays.map(function(d){
              var dayAppts = st.appointments.filter(function(a){
                if (techFilter !== 'all' && a.techId !== techFilter) return false;
                return a.date === d;
              }).sort(function(a, b){ return a.time.localeCompare(b.time); });
              var isToday = d === UT.today();
              return React.createElement('div', { key: d, className: 'w-col' + (isToday ? ' today' : '') },
                React.createElement('div', { className: 'w-head' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'w-day' }, UT.DOW[UT.parse(d).getDay()]),
                    React.createElement('div', { className: 'w-date' }, UT.fmtShort(d))
                  ),
                  React.createElement('span', { className: 'w-count' }, dayAppts.length)
                ),
                dayAppts.length === 0
                  ? React.createElement('div', { className: 'faint', fontSize: 12, padding: '8px 2px' }, 'Free')
                  : dayAppts.map(function(a){
                      var c = clientOf(st, a.clientId);
                      return React.createElement('div', { key: a.id, className: 'w-mini', onClick: function(){ dateState[1](d); mode[1]('day'); }, 'data-od-id': 'wmini-' + a.id },
                        React.createElement('div', { className: 'wm-time' }, a.time, ' · ', a.dur, 'm'),
                        React.createElement('div', { className: 'wm-name' }, c ? c.name : '—'),
                        React.createElement('div', { className: 'wm-svc' }, a.service, ' · ', React.createElement('span', { style: { color: a.status === 'scheduled' ? 'var(--blue)' : a.status === 'inprogress' ? 'var(--warn)' : 'var(--faint)' } }, a.status))
                      );
                    })
              );
            })
          )
        ),

    (book[0]) ? React.createElement(BookModal, { st: st, set: set, nav: nav, preset: book[0], onClose: function(){ book[1](null); } }) : null,
    (edit[0]) ? React.createElement(BookModal, { st: st, set: set, nav: nav, preset: { appointmentId: edit[0].id }, onClose: function(){ edit[1](null); } }) : null
  );
}

export const APP = { BookModal: BookModal, Appointments: Appointments, completeAppt: completeAppt };
