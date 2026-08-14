/* ui.jsx — shared primitives: icons, chips, cards, modals, charts */
import React from 'react';
import { createPortal } from 'react-dom';
import { UT } from './data';

var ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>',
  card: '<rect x="1.5" y="4" width="21" height="16" rx="2.5"/><path d="M1.5 10h21"/>',
  users2: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chart: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  chevRight: '<path d="m9 18 6-6-6-6"/>',
  chevLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  rupee: '<path d="M6 3h12M6 8h12M6 3c3 0 5.5 2 5.5 5S9 13 6 13l7 8"/>',
  wallet: '<path d="M20 7H4a2 2 0 0 1 0-4h14v4"/><path d="M20 7v14H4a2 2 0 0 1-2-2V5"/><path d="M15 13h2"/>',
  refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.36L3 16m0-4a9 9 0 0 1 15.5-6.36L21 8"/><path d="M3 5v4h4M21 15v-4h-4"/>',
  flag: '<path d="M4 22V4a2 2 0 0 1 2-2h12l-2 4 2 4H6"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
  wa: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>'
};

function Icon(props){
  return React.createElement('svg', {
    className: 'icon' + (props.cls ? ' ' + props.cls : ''),
    width: props.size || 18,
    height: props.size || 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: props.sw || 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    dangerouslySetInnerHTML: { __html: ICONS[props.i] || '' }
  });
}

var CHIP = {
  scheduled:'chip-blue', inprogress:'chip-amber', completed:'chip-green', noshow:'chip-red', cancelled:'chip-gray',
  paid:'chip-green', partial:'chip-amber', pending:'chip-red',
  active:'chip-green', overdue:'chip-red', 'due today':'chip-amber', 'at-risk':'chip-red', inactive:'chip-gray',
  instock:'chip-green', low:'chip-amber', out:'chip-red'
};

function Chip(props){
  var cls = CHIP[props.s] || 'chip-gray';
  return React.createElement('span', {
    className: 'chip ' + cls + (props.onClick ? ' chip-click' : ''),
    onClick: props.onClick,
    title: props.title
  }, props.children);
}

var AVS = [
  ['var(--av0)','var(--av0-ink)'],['var(--av1)','var(--av1-ink)'],['var(--av2)','var(--av2-ink)'],
  ['var(--av3)','var(--av3-ink)'],['var(--av4)','var(--av4-ink)'],['var(--av5)','var(--av5-ink)']
];

function Avatar(props){
  var name = props.name || '?';
  var h = 0;
  for (var i = 0; i < name.length; i++) h += name.charCodeAt(i);
  h = h % 6;
  var size = props.size || 36;
  var font = Math.max(10, size * 0.36);
  var sm = props.sm ? ' avatar-sm' : (props.lg ? ' avatar-lg' : '');
  return React.createElement('div', {
    className: 'avatar' + sm,
    style: { width: size, height: size, fontSize: font, background: AVS[h][0], color: AVS[h][1] }
  }, UT.initials(name));
}

function Card(props){
  return React.createElement('div', {
    className: 'card ' + (props.cls || ''),
    style: props.style,
    'data-od-id': props.dataid
  }, props.children);
}

function Section(props){
  return React.createElement('div', { className: 'card ' + (props.cls || ''), 'data-od-id': props.dataid },
    React.createElement('div', { className: 'card-head' },
      React.createElement('div', { style: { minWidth: 0, flex: 1 } },
        React.createElement('div', { className: 'card-title' }, props.title),
        props.sub ? React.createElement('div', { className: 'card-sub' }, props.sub) : null
      ),
      props.action ? React.createElement('div', { className: 'card-act' }, props.action) : null
    ),
    React.createElement('div', { className: 'card-body' }, props.children)
  );
}

function Field(props){
  var children = props.children;
  return React.createElement('div', { className: 'field' + (props.col ? ' fcol-1' : ''), style: props.style },
    props.label ? React.createElement('label', { className: 'field-label' }, props.label) : null,
    children,
    props.hint ? React.createElement('div', { className: 'field-hint' }, props.hint) : null
  );
}

function Select(props){
  return React.createElement('select', {
    className: 'select',
    value: props.value,
    onChange: props.onChange,
    disabled: props.disabled
  }, props.children);
}

function Input(props){
  var tag = props.tag || 'input';
  var cls = 'input' + (props.cls ? ' ' + props.cls : '');
  if (tag === 'textarea') {
    return React.createElement('textarea', Object.assign({}, props, { tag: undefined, className: cls }));
  }
  return React.createElement('input', Object.assign({}, props, { tag: undefined, className: cls }));
}

function Btn(props){
  var kind = props.kind || 'ghost';
  var cls = 'btn btn-' + kind + (props.size ? ' btn-' + props.size : '') + (props.cls ? ' ' + props.cls : '');
  return React.createElement('button', {
    className: cls,
    onClick: props.onClick,
    disabled: props.disabled,
    title: props.title,
    type: props.type || 'button',
    'data-od-id': props.dataid
  },
    props.icon ? React.createElement(Icon, { i: props.icon, size: props.size === 'sm' ? 14 : (props.size === 'xs' ? 12 : 16) }) : null,
    props.children
  );
}

function Modal(props){
  return createPortal(
    React.createElement('div', { className: 'overlay', onClick: props.onClose },
      React.createElement('div', { className: 'modal' + (props.wide ? ' wide' : ''), onClick: function(e){ e.stopPropagation(); } },
        React.createElement('div', { className: 'modal-head' },
          React.createElement('h3', null, props.title),
          React.createElement('button', { className: 'icon-btn', onClick: props.onClose, 'aria-label': 'Close' },
            React.createElement(Icon, { i: 'x' })
          )
        ),
        React.createElement('div', { className: 'modal-body' }, props.children)
      )
    ),
    document.body
  );
}

function Empty(props){
  return React.createElement('div', { className: 'empty' },
    React.createElement(Icon, { i: props.icon || 'box', size: 30 }),
    React.createElement('div', { className: 'e-title' }, props.title || 'Nothing here yet'),
    props.sub ? React.createElement('div', { className: 'e-sub' }, props.sub) : null,
    props.children || null
  );
}

function Bars(props){
  var data = props.data || [];
  var max = 1;
  data.forEach(function(d){ if (d.v > max) max = d.v; });
  return React.createElement('div', { className: 'bars' },
    data.map(function(d, i){
      return React.createElement('div', { className: 'bar-col', key: i },
        React.createElement('div', { className: 'bar-val', title: UT.fmtINR(d.v) }, d.v > 0 ? UT.fmtINR(d.v) : '—'),
        React.createElement('div', { className: 'bar-track' },
          React.createElement('div', {
            className: 'bar' + (d.today ? ' today' : ''),
            style: { height: Math.max(4, (d.v / max) * 100) + '%' }
          })
        ),
        React.createElement('div', { className: 'bar-lbl' + (d.today ? ' today' : '') }, d.l)
      );
    })
  );
}

function Kpi(props){
  var tone = props.tone || 'a';
  return React.createElement('div', { className: 'card kpi', 'data-tone': tone, 'data-od-id': props.dataid },
    React.createElement('div', { className: 'kpi-ic' }, React.createElement(Icon, { i: props.icon, size: 18 })),
    React.createElement('div', { className: 'kpi-lbl' }, props.label),
    React.createElement('div', { className: 'kpi-val' }, props.value),
    props.sub ? React.createElement('div', { className: 'kpi-sub' }, props.sub) : null
  );
}

function toast(msg, type){
  window.dispatchEvent(new CustomEvent('hr-toast', { detail: { msg: msg, type: type || 'ok' } }));
}

function ToastHost(){
  var state = React.useState(null);
  var t = state[0], setT = state[1];
  React.useEffect(function(){
    var timer = null;
    function h(e){
      setT(e.detail);
      clearTimeout(timer);
      timer = setTimeout(function(){ setT(null); }, 2800);
    }
    window.addEventListener('hr-toast', h);
    return function(){ window.removeEventListener('hr-toast', h); clearTimeout(timer); };
  }, []);
  if (!t) return null;
  return React.createElement('div', { className: 'toast' + (t.type === 'err' ? ' toast-err' : '') },
    React.createElement(Icon, { i: t.type === 'err' ? 'alert' : 'check', size: 16 }),
    React.createElement('span', null, t.msg)
  );
}

export const UI = {
  ICONS: ICONS,
  Icon: Icon,
  Chip: Chip,
  Avatar: Avatar,
  Card: Card,
  Section: Section,
  Field: Field,
  Select: Select,
  Input: Input,
  Btn: Btn,
  Modal: Modal,
  Empty: Empty,
  Bars: Bars,
  Kpi: Kpi,
  toast: toast,
  ToastHost: ToastHost
};
