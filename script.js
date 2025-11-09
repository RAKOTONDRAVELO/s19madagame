/* S19 School Planner — Main JS (vanilla) */

const STORAGE_KEY = 's19_school_planner_v1';
let state = {
  profile: {name: '', class: ''},
  slots: [], // {id, title, day, start, end, teacher, room, color}
  todos: [], // {id, text, done, date}
  settings: {theme: 'auto', reminder: '15'}
};

// Helpers
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));

// Init
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) state = JSON.parse(raw);
  }catch(e){console.warn('Load failed', e)}
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderStats();
}

// Theme
function applyTheme(t){
  if(t==='auto'){
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }else{
    document.documentElement.setAttribute('data-theme', t);
  }
}

// Render functions
function renderNav(){
  qsa('.nav-btn').forEach(btn => btn.addEventListener('click',()=>{
    qsa('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    showView(btn.dataset.view);
  }));
}

function showView(name){
  qsa('.view').forEach(v=>v.classList.add('hidden'));
  qs('#view-'+name).classList.remove('hidden');
}

function renderSchedule(){
  const grid = qs('#schedule-grid');
  grid.innerHTML = '';
  const days = ['Lun','Mar','Mer','Jeu','Ven','Sam'];
  for(let d=0; d<days.length; d++){
    const col = document.createElement('div');
    col.className = 'schedule-column';
    const header = document.createElement('h3'); header.textContent = days[d];
    col.appendChild(header);
    const cell = document.createElement('div'); cell.className='schedule-cell';
    const slots = state.slots.filter(s=>s.day===d);
    if(slots.length===0) cell.innerHTML='<em>Aucun cours</em>';
    else slots.forEach(s=>{
      const el = document.createElement('div');
      el.style.borderLeft = '4px solid '+(s.color||'#2563eb');
      el.style.paddingLeft='8px';
      el.innerHTML = `<strong>${s.title}</strong><div class="muted">${s.start} - ${s.end} • ${s.teacher||''} ${s.room? '• '+s.room : ''}</div>`;
      cell.appendChild(el);
    });
    col.appendChild(cell);
    grid.appendChild(col);
  }
}

function renderTodos(){
  const list = qs('#todo-list'); list.innerHTML = '';
  state.todos.forEach(t=>{
    const li = document.createElement('li'); li.className='todo-item';
    const left = document.createElement('div'); left.innerHTML = `<input type="checkbox" data-id="${t.id}" ${t.done? 'checked':''}/> <strong>${t.text}</strong>`;
    const right = document.createElement('div'); right.innerHTML = `<button data-id="${t.id}" class="del-t">✖</button>`;
    li.appendChild(left); li.appendChild(right);
    list.appendChild(li);
  });
  // bind
  qsa('#todo-list input[type="checkbox"]').forEach(cb=>cb.addEventListener('change', (e)=>{
    const id = e.target.dataset.id; state.todos = state.todos.map(t=> t.id===id? {...t, done:e.target.checked} : t); save(); renderTodos();
  }));
  qsa('.del-t').forEach(b=>b.addEventListener('click',()=>{ const id=b.dataset.id; state.todos=state.todos.filter(t=>t.id!==id); save(); renderTodos(); }));
}

function renderAgenda(dateStr){
  const container = qs('#agenda-items'); container.innerHTML='';
  const date = dateStr? new Date(dateStr) : new Date();
  const day = date.getDay(); // 0 Sun .. 6 Sat
  // map to our 0..5 (Mon..Sat)
  const dIndex = day===0?6:day-1; // Sunday becomes 6 (non-used)
  const items = state.slots.filter(s=>s.day===dIndex).concat(state.todos.filter(t=> t.date===dateStr));
  if(items.length===0) container.innerHTML='<em>Aucune entrée pour ce jour.</em>';
  else items.forEach(it=>{
    const el = document.createElement('div'); el.className='card'; el.style.marginBottom='8px';
    if(it.title) el.innerHTML = `<strong>${it.title}</strong><div class="muted">${it.start||''} ${it.end? '- '+it.end : ''}</div>`;
    else el.innerHTML = `<strong>${it.text}</strong>`;
    container.appendChild(el);
  });
}

function renderStats(){
  qs('#stat-total-courses').textContent = state.slots.length;
  qs('#stat-tasks').textContent = state.todos.length;
  // approximate free hours: assume 8h/day * 6 days = 48 - sum durations
  const totalHours = state.slots.reduce((acc,s)=>{
    try{
      const a = Number(s.start.split(':')[0]) + Number(s.start.split(':')[1])/60;
      const b = Number(s.end.split(':')[0]) + Number(s.end.split(':')[1])/60;
      return acc + Math.max(0,b-a);
    }catch(e){return acc}
  },0);
  const free = Math.max(0,48 - Math.round(totalHours));
  qs('#stat-free-hours').textContent = free;
}

// CRUD
function addSlot(payload){ state.slots.push({...payload,id:uid()}); save(); renderSchedule(); }
function addTodo(text,date){ state.todos.push({id:uid(),text,done:false,date:date||null}); save(); renderTodos(); }

// Quick bindings
function bindUI(){
  // profile
  qs('#student-name').value = state.profile.name || '';
  qs('#student-class').value = state.profile.class || '';
  qs('#student-name').addEventListener('input', e=>{ state.profile.name=e.target.value; save(); });
  qs('#student-class').addEventListener('change', e=>{ state.profile.class=e.target.value; save(); });

  // nav
  renderNav();

  // quick add
  qs('#quick-add-btn').addEventListener('click', ()=>{
    const title = qs('#quick-title').value.trim(); const time = qs('#quick-time').value;
    if(!title) return alert('Entrez un titre');
    addTodo(title, null);
    qs('#quick-title').value=''; qs('#quick-time').value='';
    alert('Ajouté!');
  });

  // add slot modal
  qs('#add-slot').addEventListener('click', ()=>{
    openModalSlot();
  });

  // todo
  qs('#todo-add').addEventListener('click', ()=>{
    const t = qs('#todo-input').value.trim(); if(!t) return; addTodo(t); qs('#todo-input').value='';
  });

  // agenda date
  qs('#agenda-date').valueAsDate = new Date(); qs('#agenda-date').addEventListener('change', e=> renderAgenda(e.target.value));

  // export/import
  qs('#export-btn').addEventListener('click', ()=> exportJSON());
  qs('#export-json').addEventListener('click', ()=> exportJSON());
  qs('#import-json').addEventListener('click', ()=> qs('#import-file').click());
  qs('#import-file').addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = () => { try{ state = JSON.parse(reader.result); save(); init(); alert('Importé!'); }catch(er){alert('Fichier invalide')} }; reader.readAsText(f);
  });

  // theme toggle
  qs('#theme-toggle').addEventListener('click', ()=>{
    const current = state.settings.theme==='auto'? (document.documentElement.getAttribute('data-theme')||'light') : state.settings.theme;
    const next = current==='dark'? 'light':'dark'; state.settings.theme = next; applyTheme(next); save();
  });

  // help
  qs('#help-btn').addEventListener('click', ()=>openHelp());

  // export file
  qs('#export-btn').addEventListener('click', exportJSON);
}

// Modal helpers
function openModalSlot(){
  const m = qs('#modal'); m.classList.remove('hidden'); m.innerHTML = `<div class="dialog"><h3>Nouveau cours</h3>
    <label>Titre <input id="m-title" /></label>
    <label>Jour <select id="m-day"><option value="0">Lundi</option><option value="1">Mardi</option><option value="2">Mercredi</option><option value="3">Jeudi</option><option value="4">Vendredi</option><option value="5">Samedi</option></select></label>
    <label>Début <input id="m-start" type="time" /></label>
    <label>Fin <input id="m-end" type="time" /></label>
    <label>Professeur <input id="m-teacher" /></label>
    <label>Salle <input id="m-room" /></label>
    <label>Couleur <input id="m-color" type="color" value="#2563eb" /></label>
    <div style="display:flex;gap:8px;margin-top:10px"><button id="m-save">Enregistrer</button><button id="m-cancel">Annuler</button></div>
  </div>`;

  qs('#m-cancel').addEventListener('click', ()=>{ qs('#modal').classList.add('hidden'); qs('#modal').innerHTML=''; });
  qs('#m-save').addEventListener('click', ()=>{
    const title = qs('#m-title').value.trim(); if(!title) return alert('Titre requis');
    const payload = {
      title, day: Number(qs('#m-day').value), start: qs('#m-start').value||'08:00', end: qs('#m-end').value||'09:00', teacher: qs('#m-teacher').value, room: qs('#m-room').value, color: qs('#m-color').value
    };
    addSlot(payload); qs('#modal').classList.add('hidden'); qs('#modal').innerHTML='';
  });
}

function openHelp(){
  const m = qs('#modal'); m.classList.remove('hidden'); m.innerHTML = `<div class="dialog"><h3>Aide rapide</h3>
  <ul>
    <li>Ajoute des cours via "+ Nouveau cours".</li>
    <li>Utilise la To-Do pour les devoirs et tâches.</li>
    <li>Exporter / Importer pour sauvegarder ou transférer ton planning.</li>
    <li>Le mode sombre / clair est dans Paramètres ou le bouton en haut.</li>
  </ul>
  <div style="text-align:right;margin-top:8px"><button id="h-close">Fermer</button></div></div>`;
  qs('#h-close').addEventListener('click', ()=>{ qs('#modal').classList.add('hidden'); qs('#modal').innerHTML=''; });
}

// Export JSON
function exportJSON(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 's19_school_planner_export.json'; a.click(); URL.revokeObjectURL(url);
}

// Init app
function init(){
  applyTheme(state.settings.theme||'auto');
  renderSchedule(); renderTodos(); renderAgenda(new Date().toISOString().slice(0,10)); renderStats(); bindUI();
  // show default view
  showView('schedule');
}

// Service worker register
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>console.warn('SW install failed'));
}

load(); init();
