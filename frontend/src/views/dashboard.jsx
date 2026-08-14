/* views/dashboard.jsx — Owner dashboard + Technician "my day" */
import React from 'react';
import DB, { UT } from '../lib/data';
import { UI as U } from '../lib/ui';
import { API } from '../lib/api';
import { APP } from './appointments';
import { OPS } from './operations';
var Icon = U.Icon, Chip = U.Chip, Avatar = U.Avatar, Card = U.Card, Section = U.Section,
    Btn = U.Btn, Empty = U.Empty, Bars = U.Bars, Kpi = U.Kpi, toast = U.toast;

function clientOf(st, id){ return st.clients.find(function(c){ return c.id === id; }); }
function techName(id){ var t = DB.technicians.find(function(x){ return x.id === id; }); return t ? t.name : '—'; }
function weekRange(){
  var today = UT.parse(UT.today());
  var dow = (today.getDay() + 6) % 7;
  var start = UT.fmt(new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow));
  var end = UT.addDays(start, 6);
  return { start: start, end: end };
}
function last7(){
  var out = [];
  for (var i = 6; i >= 0; i--){
    var d = UT.addDays(UT.today(), -i);
    out.push({ d: d, label: UT.fmtShort(d), today: i === 0 });
  }
  return out;
}

function OwnerDash(props){
  var st = props.st, set = props.set, nav = props.nav;
  var today = UT.today();
  var apptsToday = st.appointments.filter(function(a){ return a.date === today && a.status !== 'cancelled'; });
  var inProg = apptsToday.filter(function(a){ return a.status === 'inprogress'; }).length;
  var scheduledNow = apptsToday.filter(function(a){ return a.status === 'scheduled'; }).length;
  var noshowNow = apptsToday.filter(function(a){ return a.status === 'noshow'; }).length;
  var revToday = st.invoices.filter(function(i){ return i.date === today; }).reduce(function(s, i){ return s + i.paid; }, 0);
  var revMonth = st.invoices.filter(function(i){ return i.date.slice(0, 7) === today.slice(0, 7); }).reduce(function(s, i){ return s + i.paid; }, 0);
  var overdue = st.clients.filter(function(c){ return UT.daysUntil(UT.nextDue(c)) < 0; });
  var lowStock = st.inventory.filter(function(x){ return x.qty <= x.thr; });
  var pendingInv = st.invoices.filter(function(i){ return i.status !== 'paid'; });
  var upcoming = st.appointments.filter(function(a){
    return a.date >= today && (a.status === 'scheduled' || a.status === 'inprogress');
  }).sort(function(a, b){
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date < b.date ? -1 : 1;
  }).slice(0, 6);

  var days = last7();
  var chart = days.map(function(x){
    var v = st.invoices.filter(function(i){ return i.date === x.d; }).reduce(function(s, i){ return s + i.paid; }, 0);
    return { v: v, l: x.label, today: x.today };
  });
  var weekCollected = chart.reduce(function(s, x){ return s + x.v; }, 0);

  var bookClient = React.useState(null);
  var payInv = React.useState(null);

  return React.createElement('div', null,
    React.createElement('div', { className: 'grid-kpi', 'data-od-id': 'dashboard-kpis' },
      React.createElement(Kpi, { icon: 'calendar', label: 'Today’s appointments', value: apptsToday.length, sub: React.createElement(React.Fragment, null, React.createElement('b', null, scheduledNow), ' scheduled · ', React.createElement('b', null, inProg), ' in progress', React.createElement('br', null), React.createElement('b', null, noshowNow), ' no-show'), dataid: 'kpi-appts-today' }),
      React.createElement(Kpi, { icon: 'rupee', label: 'Revenue today', value: UT.fmtINR(revToday), sub: React.createElement(React.Fragment, null, 'This month ', React.createElement('b', null, UT.fmtINR(revMonth))), dataid: 'kpi-revenue' }),
      React.createElement(Kpi, { icon: 'users', label: 'Active clients', value: st.clients.length, sub: React.createElement(React.Fragment, null, React.createElement('b', null, overdue.length), ' overdue for maintenance'), dataid: 'kpi-clients' }),
      React.createElement(Kpi, { icon: 'alert', label: 'Overdue maintenance', value: overdue.length, tone: overdue.length ? 'danger' : 'a', sub: 'auto-reminders enabled · WhatsApp', dataid: 'kpi-overdue' })
    ),

    React.createElement('div', { className: 'grid2' },
      React.createElement(Section, { title: 'Revenue — last 7 days', sub: 'Collected across invoices', cls: '', dataid: 'revenue-chart' },
        React.createElement('div', { style: { height: 190 } },
          React.createElement(Bars, { data: chart })
        ),
        React.createElement('div', { className: 'chart-stat' },
          React.createElement('div', { className: 'mini-stat' }, React.createElement('b', null, UT.fmtINR(weekCollected)), ' collected this week'),
          React.createElement('div', { className: 'mini-stat' }, React.createElement('b', null, st.invoices.filter(function(i){ return i.date.slice(0,7) === today.slice(0,7); }).length), ' invoices this month')
        )
      ),
      React.createElement(Section, { title: 'Low stock alerts', sub: 'Items at or below reorder threshold', dataid: 'low-stock-panel' },
        lowStock.length === 0
          ? React.createElement(Empty, { icon: 'check', title: 'Stock levels healthy', sub: 'No items below threshold.' })
          : React.createElement('div', { className: 'list-rows' },
            lowStock.map(function(x){
              return React.createElement('div', { className: 'list-row', key: x.id, 'data-od-id': 'lowstock-' + x.id },
                React.createElement('div', { className: 'lr-main' },
                  React.createElement('div', { className: 'lr-title' }, x.type, ' · ', x.base),
                  React.createElement('div', { className: 'lr-sub' }, x.vendor, ' · batch ', x.batch)
                ),
                React.createElement(Chip, { s: x.qty === 0 ? 'out' : 'low' }, x.qty === 0 ? 'Out' : x.qty + ' left'),
                React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ nav('inventory'); } }, 'Reorder')
              );
            })
          )
      )
    ),

    React.createElement('div', { className: 'grid2', style: { marginTop: 18 } },
      React.createElement(Section, {
        title: 'Upcoming appointments', sub: 'Next on the schedule',
        action: React.createElement(Btn, { size: 'sm', icon: 'plus', onClick: function(){ bookClient[1]({}); } }, 'Book'),
        dataid: 'upcoming-appointments'
      },
        upcoming.length === 0
          ? React.createElement(Empty, { icon: 'calendar', title: 'No upcoming visits', sub: 'Book an appointment to get started.' })
          : React.createElement('div', { className: 'list-rows' },
            upcoming.map(function(a){
              var c = clientOf(st, a.clientId);
              return React.createElement('div', { className: 'list-row', key: a.id },
                React.createElement(Avatar, { name: c ? c.name : '?', size: 34 }),
                React.createElement('div', { className: 'lr-main' },
                  React.createElement('div', { className: 'lr-title' }, c ? c.name : '—', ' · ', a.service),
                  React.createElement('div', { className: 'lr-sub' }, a.date === today ? 'Today' : UT.fmtDate(a.date), ' at ', a.time, ' · ', techName(a.techId))
                ),
                React.createElement(Chip, { s: a.status }, a.status === 'inprogress' ? 'In progress' : a.status),
                React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ nav('appointments'); } }, 'Open')
              );
            })
          )
      ),

      React.createElement('div', { className: 'stack' },
        React.createElement(Section, {
          title: 'Overdue maintenance', sub: 'Clients who missed their cycle',
          dataid: 'overdue-maintenance'
        },
          overdue.length === 0
            ? React.createElement(Empty, { icon: 'check', title: 'All caught up', sub: 'No clients are overdue.' })
            : React.createElement('div', { className: 'list-rows' },
              overdue.map(function(c){
                var due = UT.nextDue(c);
                var days = UT.daysUntil(due);
                return React.createElement('div', { className: 'list-row', key: c.id },
                  React.createElement(Avatar, { name: c.name, size: 34 }),
                  React.createElement('div', { className: 'lr-main' },
                    React.createElement('div', { className: 'lr-title' }, c.name),
                    React.createElement('div', { className: 'lr-sub' }, 'Due ', UT.fmtShort(due), ' · ', Math.abs(days), ' day', Math.abs(days) === 1 ? '' : 's', ' late')
                  ),
                  React.createElement(Btn, { size: 'sm', onClick: function(){ bookClient[1]({ clientId: c.id }); } }, 'Re-book')
                );
              })
            )
        ),
        React.createElement(Section, {
          title: 'Pending payments', sub: 'Invoices to follow up',
          dataid: 'pending-payments'
        },
          pendingInv.length === 0
            ? React.createElement(Empty, { icon: 'check', title: 'Nothing pending', sub: 'All invoices are settled.' })
            : React.createElement('div', { className: 'list-rows' },
              pendingInv.slice(0, 5).map(function(inv){
                var c = clientOf(st, inv.clientId);
                var due = inv.total - inv.paid;
                return React.createElement('div', { className: 'list-row', key: inv.id },
                  React.createElement(Avatar, { name: c ? c.name : '?', size: 34 }),
                  React.createElement('div', { className: 'lr-main' },
                    React.createElement('div', { className: 'lr-title' }, c ? c.name : '—', ' · ', UT.fmtINR(due)),
                    React.createElement('div', { className: 'lr-sub' }, inv.id, ' · ', UT.fmtShort(inv.date), ' · ', Math.max(0, UT.daysUntil(inv.date)), ' days ago')
                  ),
                  React.createElement(Chip, { s: inv.status }, inv.status),
                  React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ payInv[1](inv); } }, 'Collect')
                );
              })
            )
        )
      )
    ),

    bookClient[0]
      ? React.createElement(APP.BookModal, {
          st: st, set: set, nav: nav,
          onClose: function(){ bookClient[1](null); },
          preset: bookClient[0]
        })
      : null,
    payInv[0]
      ? React.createElement(OPS.PaymentModal, {
          invoice: payInv[0], st: st, set: set,
          onClose: function(){ payInv[1](null); }
        })
      : null
  );
}

function TechDash(props){
  var st = props.st, set = props.set, nav = props.nav, u = props.u;
  var techId = u.techId;
  var today = UT.today();
  var wk = weekRange();
  var my = st.appointments.filter(function(a){ return a.techId === techId && a.status !== 'cancelled'; });
  var todays = my.filter(function(a){ return a.date === today; }).sort(function(a, b){ return a.time.localeCompare(b.time); });
  var weekCount = my.filter(function(a){ return a.date >= wk.start && a.date <= wk.end; }).length;
  var tech = DB.technicians.find(function(t){ return t.id === techId; });
  var lowStock = st.inventory.filter(function(x){ return x.qty <= x.thr; });

  function setStatus(id, status){
    API.patch('/appointments/' + id + '/status', { status: status })
      .then(function(res){
        set(function(s){
          return { appointments: s.appointments.map(function(a){ return a.id === id ? res.appointment : a; }) };
        });
        toast(status === 'inprogress' ? 'Service started' : status === 'completed' ? 'Marked as completed' : status === 'noshow' ? 'Marked as no-show' : 'Updated');
      })
      .catch(function(ex){ toast(ex.message, 'err'); });
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-head' },
      React.createElement('div', null,
        React.createElement('h2', null, 'My day'),
        React.createElement('div', { className: 'ph-sub' }, 'Good morning, ', u.name.split(' ')[0], ' — here is your schedule for ', UT.fmtDate(today), '.')
      )
    ),
    React.createElement('div', { className: 'grid-kpi', 'data-od-id': 'tech-kpis' },
      React.createElement(Kpi, { icon: 'calendar', label: 'Today’s services', value: todays.length, sub: React.createElement(React.Fragment, null, React.createElement('b', null, todays.filter(function(a){return a.status==='completed';}).length), ' completed'), dataid: 'tech-kpi-today' }),
      React.createElement(Kpi, { icon: 'clock', label: 'This week', value: weekCount, sub: 'assigned visits', dataid: 'tech-kpi-week' }),
      React.createElement(Kpi, { icon: 'check', label: 'Client rating', value: (tech ? tech.rating : '—') + ' / 5', sub: 'lifetime satisfaction', dataid: 'tech-kpi-rating' }),
      React.createElement(Kpi, { icon: 'box', label: 'Low stock', value: lowStock.length, tone: lowStock.length ? 'warn' : 'a', sub: 'items to reorder', dataid: 'tech-kpi-stock' })
    ),
    React.createElement('div', { className: 'grid2' },
      React.createElement(Section, {
        title: 'Today’s schedule', sub: 'Tap a chip to advance status',
        action: React.createElement(Btn, { size: 'sm', icon: 'plus', onClick: function(){ nav('appointments'); } }, 'Open calendar'),
        dataid: 'tech-today'
      },
        todays.length === 0
          ? React.createElement(Empty, { icon: 'calendar', title: 'No services today', sub: 'Your schedule is clear for today.' })
          : React.createElement('div', { className: 'list-rows' },
            todays.map(function(a){
              var c = clientOf(st, a.clientId);
              return React.createElement('div', { className: 'list-row', key: a.id, 'data-od-id': 'tech-appt-' + a.id },
                React.createElement('div', { className: 'lr-main' },
                  React.createElement('div', { className: 'lr-title' }, a.time, ' · ', c ? c.name : '—', ' · ', a.service),
                  React.createElement('div', { className: 'lr-sub' }, a.dur, ' min · ', a.reminder.channel, ' reminder ', a.reminder.daysBefore, 'd before')
                ),
                a.status === 'scheduled' ? React.createElement(React.Fragment, null,
                  React.createElement(Btn, { size: 'xs', kind: 'primary', onClick: function(){ setStatus(a.id, 'inprogress'); } }, 'Start'),
                  React.createElement(Btn, { size: 'xs', kind: 'ghost', onClick: function(){ setStatus(a.id, 'noshow'); } }, 'No-show')
                ) : a.status === 'inprogress' ? React.createElement(Btn, { size: 'xs', kind: 'primary', onClick: function(){ setStatus(a.id, 'completed'); } }, 'Complete')
                  : React.createElement(Chip, { s: a.status }, a.status)
              );
            })
          )
      ),
      React.createElement(Section, {
        title: 'Stock watch', sub: 'Patches below reorder threshold',
        dataid: 'tech-stock'
      },
        lowStock.length === 0
          ? React.createElement(Empty, { icon: 'check', title: 'All stocked', sub: 'Nothing needs reordering.' })
          : React.createElement('div', { className: 'list-rows' },
            lowStock.map(function(x){
              return React.createElement('div', { className: 'list-row', key: x.id },
                React.createElement('div', { className: 'lr-main' },
                  React.createElement('div', { className: 'lr-title' }, x.type, ' · ', x.base),
                  React.createElement('div', { className: 'lr-sub' }, x.vendor, ' · batch ', x.batch)
                ),
                React.createElement(Chip, { s: x.qty === 0 ? 'out' : 'low' }, x.qty + ' / ' + x.thr),
                React.createElement(Btn, { size: 'sm', kind: 'quiet', onClick: function(){ nav('inventory'); } }, 'Use stock')
              );
            })
          )
      )
    )
  );
}

export const DASH = { OwnerDash: OwnerDash, TechDash: TechDash };
