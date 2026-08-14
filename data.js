/* ============================================================
   Hair Reviver — CRM · sample dataset (simulated, no backend)
   Simulated "today" is pinned to 2026-08-13 so the prototype
   always renders coherent data regardless of when it is opened.
   ============================================================ */
window.DB = (function () {

  var TODAY = '2026-08-13';
  var DAY = 86400000;
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function parse(d){ var p = (d||'').split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function fmt(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function addDays(d, n){ var x = parse(d); x.setDate(x.getDate() + n); return fmt(x); }
  function addWeeks(d, n){ return addDays(d, 7*n); }
  function daysUntil(d){ return Math.round((parse(d) - parse(TODAY)) / DAY); }
  function fmtDate(d){ var x = parse(d); return DOW[x.getDay()] + ', ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function fmtShort(d){ var x = parse(d); return x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function fmtINR(n){ return '₹' + Math.round(n||0).toLocaleString('en-IN'); }
  function initials(name){ return String(name||'?').split(/\s+/).map(function(w){ return w[0]; }).slice(0,2).join('').toUpperCase(); }

  var UT = {
    TODAY: TODAY,
    DAY: DAY,
    MONTHS: MONTHS,
    DOW: DOW,
    parse: parse,
    fmt: fmt,
    today: function(){ return TODAY; },
    addDays: addDays,
    addWeeks: addWeeks,
    daysUntil: daysUntil,
    fmtDate: fmtDate,
    fmtShort: fmtShort,
    fmtINR: fmtINR,
    initials: initials,
    svcFee: { 'Cleaning': 1200, 'Refit': 800, 'Replacement': 1500, 'New Patch': 2500, 'Consultation': 500 },
    PATCHCOST: {
      'Indian Remy': { 'Crown Patch': 14000, 'Full Cap': 16000, 'Toupee': 9000 },
      'European':   { 'Crown Patch': 18500, 'Full Cap': 21000, 'Toupee': 13000 },
      'Synthetic':  { 'Crown Patch': 4200,  'Full Cap': 5200,  'Toupee': 3400 }
    },
    nextDue: function(c){ return addWeeks(c.lastService, c.cycle); },
    statusOf: function(c){
      var du = daysUntil(addWeeks(c.lastService, c.cycle));
      return du < 0 ? 'overdue' : (du === 0 ? 'due today' : 'active');
    },
    nextId: function(arr, p){
      var max = 0;
      arr.forEach(function(x){ var n = parseInt(String(x.id).replace(p,''), 10); if (!isNaN(n) && n > max) max = n; });
      return p + (max + 1);
    }
  };
  window.UT = UT;

  /* ---------------- Clients ---------------- */
  var clients = [
    { id:'C-1001', name:'Aarav Sharma',   phone:'+91 98201 44567', city:'Mumbai',    gender:'M', patchType:'European',   base:'Full Cap',   vendor:'Remy Co.', attach:'Glue',     cycle:3, lastService:'2026-07-24', joined:'2025-11-02', packageId:null, notes:'Sensitive scalp near the crown — use the gentle adhesive. Prefers morning slots.' },
    { id:'C-1002', name:'Priya Nair',     phone:'+91 98470 22118', city:'Kochi',     gender:'F', patchType:'Indian Remy', base:'Crown Patch', vendor:'HairPro',  attach:'Tape-in',  cycle:3, lastService:'2026-07-20', joined:'2025-08-19', packageId:'P-1',  notes:'Reacts to standard tape — use medical tape. Asks for the same technician every visit.' },
    { id:'C-1003', name:'Rohan Mehta',    phone:'+91 99020 33456', city:'Ahmedabad', gender:'M', patchType:'Synthetic',   base:'Toupee',      vendor:'Luxe Locks', attach:'Clip',    cycle:4, lastService:'2026-07-28', joined:'2026-01-14', packageId:null, notes:'Wears the patch daily for work; prefers clip attachment for easy removal.' },
    { id:'C-1004', name:'Ananya Iyer',    phone:'+91 98110 90877', city:'Chennai',   gender:'F', patchType:'Indian Remy', base:'Crown Patch', vendor:'Remy Co.', attach:'Glue',     cycle:2, lastService:'2026-08-05', joined:'2025-12-03', packageId:'P-3',  notes:'Colour-matched patch — keep a spare in stock. Hairline thinning, handle with care.' },
    { id:'C-1005', name:'Vikram Singh',   phone:'+91 98101 23456', city:'New Delhi', gender:'M', patchType:'European',   base:'Full Cap',   vendor:'HairPro',  attach:'Tape-in',  cycle:4, lastService:'2026-07-16', joined:'2025-06-11', packageId:'P-2',  notes:'Travels frequently — needs flexible rescheduling without penalty.' },
    { id:'C-1006', name:'Sneha Kulkarni', phone:'+91 99220 55671', city:'Pune',      gender:'F', patchType:'European',   base:'Crown Patch', vendor:'Luxe Locks', attach:'Clip',    cycle:3, lastService:'2026-07-31', joined:'2026-02-22', packageId:null, notes:'Uses the patch 4 days a week. No complaints; prefers clip.' },
    { id:'C-1007', name:'Arjun Reddy',    phone:'+91 98490 11223', city:'Hyderabad', gender:'M', patchType:'Indian Remy', base:'Full Cap',   vendor:'Remy Co.', attach:'Tape-in',  cycle:2, lastService:'2026-08-01', joined:'2025-10-08', packageId:'P-1',  notes:'Full coverage patch. Active swimmer — books a refit every 2 weeks.' },
    { id:'C-1008', name:'Neha Kapoor',    phone:'+91 98860 77890', city:'Bengaluru', gender:'F', patchType:'Synthetic',   base:'Toupee',      vendor:'HairPro',  attach:'Glue',     cycle:4, lastService:'2026-08-11', joined:'2026-03-30', packageId:'P-2',  notes:'Asked for a denser toupee on next replacement. Consider upgrade quote.' },
    { id:'C-1009', name:'Karan Malhotra', phone:'+91 98721 44556', city:'Chandigarh',gender:'M', patchType:'European',   base:'Full Cap',   vendor:'Luxe Locks', attach:'Clip',    cycle:3, lastService:'2026-06-28', joined:'2025-07-27', packageId:null, notes:'Reschedules repeatedly — follow up on WhatsApp before the visit.' },
    { id:'C-1010', name:'Divya Pillai',   phone:'+91 94470 33421', city:'Trivandrum',gender:'F', patchType:'Indian Remy', base:'Crown Patch', vendor:'Remy Co.', attach:'Glue',     cycle:2, lastService:'2026-08-08', joined:'2026-01-19', packageId:null, notes:'' },
    { id:'C-1011', name:'Farhan Qureshi', phone:'+91 98390 66543', city:'Lucknow',   gender:'M', patchType:'Synthetic',   base:'Crown Patch', vendor:'HairPro',  attach:'Tape-in',  cycle:4, lastService:'2026-08-04', joined:'2025-09-23', packageId:null, notes:'Patch used for a receding hairline. Tape-in preferred.' },
    { id:'C-1012', name:'Meera Desai',    phone:'+91 98250 88765', city:'Surat',     gender:'F', patchType:'European',   base:'Full Cap',   vendor:'Remy Co.', attach:'Glue',     cycle:3, lastService:'2026-06-10', joined:'2025-05-05', packageId:null, notes:'Complained of itching — switched to air-touch base. Outstanding dues to follow up.' }
  ];

  /* ---------------- Staff & technicians ---------------- */
  var technicians = [
    { id:'T-01', name:'Meghna Verma',   role:'Senior Technician',   phone:'+91 99870 11223', joined:'2024-03', rating:4.9, completed:286, onTime:97 },
    { id:'T-02', name:'Sandeep Rao',    role:'Technician',          phone:'+91 98450 55678', joined:'2024-11', rating:4.7, completed:214, onTime:93 },
    { id:'T-03', name:'Kavita Joshi',   role:'Trainee Technician',  phone:'+91 90040 33112', joined:'2026-01', rating:4.4, completed:87,  onTime:88 }
  ];
  var staff = [
    { id:'S-01', name:'Ritu Sharma', role:'Front Desk', phone:'+91 98110 77890', joined:'2025-02' },
    { id:'S-02', name:'Imran Khan',  role:'Front Desk', phone:'+91 96500 22334', joined:'2025-09' }
  ];
  var owner = { id:'U-01', name:'Neeraj Gupta', role:'Owner / Admin', phone:'+91 98200 10001', joined:'2025-01' };

  /* ---------------- Appointments ---------------- */
  function R(ch, db){ return { channel: ch, daysBefore: db }; }
  var appointments = [
    // Past — completed
    { id:'A-5200', clientId:'C-1002', techId:'T-02', date:'2026-08-10', time:'10:30', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5201', clientId:'C-1001', techId:'T-01', date:'2026-07-24', time:'11:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5202', clientId:'C-1004', techId:'T-02', date:'2026-08-05', time:'10:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('SMS',1) },
    { id:'A-5203', clientId:'C-1005', techId:'T-01', date:'2026-07-16', time:'12:00', service:'New Patch',  dur:90, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5204', clientId:'C-1007', techId:'T-03', date:'2026-08-01', time:'11:30', service:'Refit',      dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5205', clientId:'C-1006', techId:'T-01', date:'2026-07-31', time:'15:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('Email',2) },
    { id:'A-5206', clientId:'C-1008', techId:'T-03', date:'2026-08-11', time:'10:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5207', clientId:'C-1010', techId:'T-02', date:'2026-08-08', time:'09:30', service:'Cleaning',   dur:45, status:'completed', reminder:R('SMS',1) },
    { id:'A-5208', clientId:'C-1012', techId:'T-01', date:'2026-06-10', time:'11:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',2) },
    { id:'A-5209', clientId:'C-1009', techId:'T-02', date:'2026-06-28', time:'10:30', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5210', clientId:'C-1011', techId:'T-03', date:'2026-08-04', time:'12:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5211', clientId:'C-1003', techId:'T-01', date:'2026-07-28', time:'14:00', service:'Refit',      dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5212', clientId:'C-1004', techId:'T-01', date:'2026-07-30', time:'11:00', service:'Replacement',dur:75, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5213', clientId:'C-1012', techId:'T-02', date:'2026-06-11', time:'10:00', service:'Consultation',dur:45, status:'noshow',    reminder:R('SMS',1) },
    // Today — 2026-08-13
    { id:'A-5301', clientId:'C-1011', techId:'T-02', date:'2026-08-13', time:'09:00', service:'Cleaning',   dur:45, status:'completed', reminder:R('WhatsApp',1) },
    { id:'A-5302', clientId:'C-1003', techId:'T-03', date:'2026-08-13', time:'09:30', service:'Refit',      dur:45, status:'noshow',    reminder:R('WhatsApp',1) },
    { id:'A-5303', clientId:'C-1002', techId:'T-02', date:'2026-08-13', time:'10:30', service:'Refit',      dur:45, status:'inprogress',reminder:R('WhatsApp',1) },
    { id:'A-5304', clientId:'C-1005', techId:'T-01', date:'2026-08-13', time:'11:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('SMS',1) },
    { id:'A-5305', clientId:'C-1001', techId:'T-01', date:'2026-08-13', time:'12:15', service:'Cleaning',   dur:60, status:'scheduled', reminder:R('WhatsApp',2) },
    { id:'A-5306', clientId:'C-1004', techId:'T-02', date:'2026-08-13', time:'14:00', service:'Replacement',dur:75, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5307', clientId:'C-1007', techId:'T-03', date:'2026-08-13', time:'15:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5308', clientId:'C-1006', techId:'T-01', date:'2026-08-13', time:'16:15', service:'Refit',      dur:45, status:'scheduled', reminder:R('Email',2) },
    // This week & beyond
    { id:'A-5309', clientId:'C-1008', techId:'T-01', date:'2026-08-14', time:'10:00', service:'Consultation',dur:45, status:'scheduled', reminder:R('Email',2) },
    { id:'A-5310', clientId:'C-1010', techId:'T-02', date:'2026-08-14', time:'11:00', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5311', clientId:'C-1009', techId:'T-03', date:'2026-08-14', time:'12:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('SMS',1) },
    { id:'A-5312', clientId:'C-1001', techId:'T-01', date:'2026-08-14', time:'17:00', service:'Refit',      dur:45, status:'scheduled', reminder:R('WhatsApp',2) },
    { id:'A-5313', clientId:'C-1007', techId:'T-02', date:'2026-08-15', time:'10:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5314', clientId:'C-1012', techId:'T-01', date:'2026-08-15', time:'11:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5315', clientId:'C-1003', techId:'T-03', date:'2026-08-17', time:'10:00', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5316', clientId:'C-1005', techId:'T-01', date:'2026-08-17', time:'11:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('SMS',1) },
    { id:'A-5317', clientId:'C-1006', techId:'T-02', date:'2026-08-18', time:'10:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5318', clientId:'C-1002', techId:'T-02', date:'2026-08-18', time:'12:00', service:'Refit',      dur:45, status:'scheduled', reminder:R('WhatsApp',2) },
    { id:'A-5319', clientId:'C-1004', techId:'T-01', date:'2026-08-19', time:'10:00', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5320', clientId:'C-1008', techId:'T-03', date:'2026-08-19', time:'11:00', service:'Refit',      dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5321', clientId:'C-1009', techId:'T-02', date:'2026-08-21', time:'11:30', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5322', clientId:'C-1010', techId:'T-01', date:'2026-08-21', time:'10:00', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('SMS',1) },
    { id:'A-5323', clientId:'C-1003', techId:'T-01', date:'2026-08-25', time:'10:30', service:'Refit',      dur:45, status:'scheduled', reminder:R('WhatsApp',1) },
    { id:'A-5324', clientId:'C-1011', techId:'T-02', date:'2026-09-01', time:'11:00', service:'Cleaning',   dur:45, status:'scheduled', reminder:R('WhatsApp',1) }
  ];

  /* ---------------- Invoices ---------------- */
  function INV(id, date, clientId, items, status, paid){
    var total = items.reduce(function(s,i){ return s + i.amount; }, 0);
    return { id:id, date:date, clientId:clientId, items:items, total:total, paid:paid||0, status:status, apptId:null };
  }
  var invoices = [
    INV('INV-1041','2026-06-10','C-1012',[{label:'Cleaning',amount:1200}],'pending',0),
    INV('INV-1042','2026-06-28','C-1009',[{label:'Cleaning',amount:1200}],'pending',0),
    INV('INV-1043','2026-07-16','C-1005',[{label:'European Full Cap patch',amount:21000},{label:'Application & fitting',amount:2500}],'paid',23500),
    INV('INV-1044','2026-07-24','C-1001',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1045','2026-07-28','C-1003',[{label:'Refit',amount:800}],'partial',400),
    INV('INV-1046','2026-07-30','C-1004',[{label:'Indian Remy Crown Patch',amount:14000},{label:'Replacement service',amount:1500}],'paid',15500),
    INV('INV-1047','2026-07-31','C-1006',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1048','2026-08-01','C-1007',[{label:'Refit',amount:800}],'paid',800),
    INV('INV-1049','2026-08-04','C-1011',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1050','2026-08-05','C-1004',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1051','2026-08-06','C-1010',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1052','2026-08-08','C-1002',[{label:'Cleaning',amount:1200}],'partial',600),
    INV('INV-1053','2026-08-10','C-1005',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1054','2026-08-11','C-1008',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1055','2026-08-12','C-1001',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1056','2026-08-07','C-1003',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1057','2026-08-09','C-1006',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1058','2026-08-13','C-1007',[{label:'Cleaning',amount:1200}],'paid',1200),
    INV('INV-1059','2026-08-13','C-1004',[{label:'Refit',amount:800}],'pending',0),
    INV('INV-1060','2026-08-13','C-1012',[{label:'Consultation',amount:500}],'pending',0)
  ];

  /* ---------------- Inventory ---------------- */
  var inventory = [
    { id:'SKU-1001', type:'Indian Remy', base:'Crown Patch', vendor:'Remy Co.',    batch:'B-2611', qty:14, thr:8,  cost:9600,  received:'2026-07-18' },
    { id:'SKU-1002', type:'Indian Remy', base:'Full Cap',    vendor:'Remy Co.',    batch:'B-2612', qty:22, thr:10, cost:12500, received:'2026-08-02' },
    { id:'SKU-1003', type:'European',    base:'Crown Patch', vendor:'HairPro',     batch:'B-2204', qty:4,  thr:8,  cost:14800, received:'2026-07-28' },
    { id:'SKU-1004', type:'European',    base:'Full Cap',    vendor:'HairPro',     batch:'B-2205', qty:9,  thr:6,  cost:19800, received:'2026-07-15' },
    { id:'SKU-1005', type:'Synthetic',   base:'Toupee',      vendor:'Luxe Locks',  batch:'B-1809', qty:3,  thr:6,  cost:3400,  received:'2026-07-20' },
    { id:'SKU-1006', type:'Synthetic',   base:'Crown Patch', vendor:'Luxe Locks',  batch:'B-1811', qty:18, thr:10, cost:4200,  received:'2026-07-20' },
    { id:'SKU-1007', type:'Indian Remy', base:'Toupee',      vendor:'Remy Co.',    batch:'B-2613', qty:2,  thr:5,  cost:7800,  received:'2026-07-15' },
    { id:'SKU-1008', type:'European',    base:'Toupee',      vendor:'HairPro',     batch:'B-2206', qty:7,  thr:5,  cost:11200, received:'2026-06-30' },
    { id:'SKU-1009', type:'Supplies',    base:'Adhesive & Care Kit', vendor:'Luxe Locks', batch:'ACC-01', qty:40, thr:20, cost:250, received:'2026-07-25' },
    { id:'SKU-1010', type:'Supplies',    base:'Cleaning Solutions',  vendor:'HairPro',    batch:'ACC-02', qty:12, thr:15, cost:180, received:'2026-07-02' }
  ];

  var purchases = [
    { id:'PR-01', date:'2026-08-02', vendor:'Remy Co.',   item:'Indian Remy Full Cap ×12', qty:12, cost:150000 },
    { id:'PR-02', date:'2026-07-28', vendor:'HairPro',    item:'European Crown Patch ×6',  qty:6,  cost:88800  },
    { id:'PR-03', date:'2026-07-20', vendor:'Luxe Locks', item:'Synthetic Toupee ×10',     qty:10, cost:34000  },
    { id:'PR-04', date:'2026-07-15', vendor:'Remy Co.',   item:'Indian Remy Toupee ×8',    qty:8,  cost:62400  },
    { id:'PR-05', date:'2026-07-02', vendor:'HairPro',    item:'Cleaning Solutions ×20',   qty:20, cost:3600   }
  ];

  var packages = [
    { id:'P-1', name:'6-Month Maintenance Plan', price:9999,  period:'6 months', svc:6,  desc:'Six cleanings / refits over six months with priority slots and a free wash each visit.', members:['C-1002','C-1007'] },
    { id:'P-2', name:'Annual Care Plan',          price:17999, period:'12 months',svc:12, desc:'Twelve services, priority booking, quarterly deep-clean and one complimentary styling session.', members:['C-1005','C-1008'] },
    { id:'P-3', name:'Patch Replacement Plan',    price:24999, period:'12 months',svc:1,  desc:'One replacement patch of equal value plus maintenance for twelve months.', members:['C-1004'] }
  ];

  return {
    clients: clients,
    technicians: technicians,
    staff: staff,
    owner: owner,
    appointments: appointments,
    invoices: invoices,
    inventory: inventory,
    purchases: purchases,
    packages: packages
  };
})();
