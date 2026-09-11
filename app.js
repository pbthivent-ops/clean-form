/* CLEAN FORM — local-first street workout journal */
const CF = (() => {
  const BASE = { total: 29257842.5, pull: 201321, dips: 103934, push: 125310, aus: 7810, mu: 1798, oad: 188, oag: 4 };
  const LIBRARIES = {
    pull: { title: 'PULL / TRACTIONS', icon: 'pull', items: ['Pull-Up classique', 'Chin-Up', 'Pull-Up lesté', 'Muscle-Up', 'One Arm Pull-Up', 'Archer Pull-Up', 'Typewriter'] },
    push: { title: 'PUSH / POUSSÉE', icon: 'push', items: ['Dips', 'Dips lestés', 'Push-Up', 'Pompes explosives', 'Handstand Push-Up', 'Pseudo Planche Push-Up'] },
    static: { title: 'STATIC / FIGURES', icon: 'static', items: ['Tuck Front Lever', 'Advanced Tuck Front Lever', 'Front Lever straddle', 'Front Lever', 'Tuck Planche', 'Straddle Planche', 'Back Lever', 'Human Flag'] }
  };
  const DEFAULT_PROFILES = [{ id: 'cb', name: 'chef_blade', initials: 'CB', weight: 70, mode: 'PULL' }, { id: 'noa', name: 'Noa', initials: 'NO', weight: 64, mode: 'MIXTE' }];
  const state = {
    tab: 'home', filter: 'Toutes', library: 'pull', goalView: 'principales', draft: null, feelingTarget: null,
    profiles: JSON.parse(localStorage.getItem('cf-profiles') || 'null') || DEFAULT_PROFILES,
    activeProfile: localStorage.getItem('cf-active-profile') || 'cb',
    completed: JSON.parse(localStorage.getItem('cf-sessions') || '[]')
  };
  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = n => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.max(0, n));
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const today = () => new Date(`${todayISO()}T12:00:00`);
  const dateFR = iso => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${iso}T12:00:00`));
  const esc = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const profile = () => state.profiles.find(item => item.id === state.activeProfile) || state.profiles[0];
  const icon = (name, size = 22) => {
    const paths = {
      home: '<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z"/><path d="M9 21v-6h6v6"/>',
      train: '<path d="M4 7v10M20 7v10M2 10h4m12 0h4M7 12h10M7 8v8m10-8v8"/>',
      history: '<path d="M4 5v5h5M5 10a8 8 0 1 0 3-5.5"/><path d="M12 8v5l3 2"/>',
      quest: '<path d="m12 3 2.7 5.4 6 .9-4.3 4.2 1 5.9-5.4-2.8-5.4 2.8 1-5.9-4.3-4.2 6-.9z"/>',
      more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
      pull: '<path d="M4 5h16M7 5v5m10-5v5M7 10c0 5 2 8 5 8s5-3 5-8"/><path d="M9 18v3m6-3v3"/>',
      push: '<path d="M4 16h16M6 16l2-7h8l2 7M10 9V5m4 4V5M3 20h18"/>',
      static: '<path d="M4 18h16M6 17l4-7 3 3 5-7M6 9h3m2-5 2 2"/>',
      group: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.6-4 3-6 5-6s4.5 2 5 6M14 20c.3-2.8 1.7-4.5 3.6-4.5 1.7 0 3 1.5 3.4 4.5"/>',
      chart: '<path d="M4 20V4M4 20h17M8 17v-4m4 4V8m4 9V5m4 12v-7"/>',
      weight: '<path d="M5 7h14l2 14H3zM9 7V5a3 3 0 0 1 6 0v2M8 13h8"/>',
      people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.8-4 3-6 6-6s5.2 2 6 6M17 6c2 0 3 1.5 3 3.2M17 14c2.3.2 3.7 2 4 4.5"/>',
      trash: '<path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14M10 11v6m4-6v6"/>',
      chevron: '<path d="m9 5 7 7-7 7"/>',
      trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v5m-4 3h8"/>'
    };
    return `<svg class="icon icon-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.more}</svg>`;
  };

  function contribution(set) {
    if (set.static || set.failed) return { kg: 0, key: null, reps: 0 };
    const name = set.exercise.toLowerCase(); const reps = Number(set.sets) * Number(set.reps);
    const resistance = Number(set.band || 0); const load = Number(set.load || 0) - resistance;
    let base = 70; let key = 'pull';
    if (name.includes('dip')) { base = 60; key = 'dips'; }
    else if (name.includes('push') || name.includes('pompe') || name.includes('handstand')) { base = 42; key = 'push'; }
    else if (name.includes('muscle')) { base = 70; key = 'mu'; }
    else if (name.includes('one arm')) { base = 70; key = name.includes('gauche') ? 'oag' : 'oad'; }
    else if (name.includes('archer')) { base = 35; key = 'aus'; }
    return { kg: Math.max(0, base + load) * reps, key, reps };
  }
  function totals() {
    const value = { ...BASE };
    state.completed.filter(session => session.profileId === state.activeProfile).forEach(session => session.sets.forEach(set => {
      const calc = contribution(set); if (calc.key) { value[calc.key] += calc.reps; value.total += calc.kg; }
    }));
    return value;
  }
  function historic() { return (window.CLEAN_FORM_HISTORY || []).map(item => ({ ...item, historic: true })); }
  function sessions() { return [...state.completed.filter(session => session.profileId === state.activeProfile), ...historic()].sort((a, b) => b.date.localeCompare(a.date)); }
  function progress(value, target) { return Math.min(100, Math.max(0, value / target * 100)); }
  function createDraft(group = false) { return { id: crypto.randomUUID(), profileId: state.activeProfile, date: todayISO(), location: 'On Air', city: '', kind: 'Force', role: 'Séance primaire', group, sets: [], note: '', feeling: '' }; }
  function ensureDraft() { if (!state.draft) state.draft = createDraft(); return state.draft; }
  function save() { localStorage.setItem('cf-sessions', JSON.stringify(state.completed)); localStorage.setItem('cf-profiles', JSON.stringify(state.profiles)); localStorage.setItem('cf-active-profile', state.activeProfile); }

  function logoStamp() { return '<img class="watermark" src="assets/clean-form-logo.png" alt="" />'; }
  function navIcon(name, text) { return `<button data-tab="${name}" class="${state.tab === name ? 'active' : ''}">${icon(name === 'train' ? 'train' : name === 'goals' ? 'quest' : name)}<span>${text}</span></button>`; }
  function home() {
    const t = totals(); const p = profile(); const sessionCount = sessions().length;
    return `<section class="welcome"><div><p class="eyebrow">CLEAN FORM · TON TABLEAU</p><h1>Reste propre.<br><em>Reste fort.</em></h1><p class="muted">Salut ${esc(p.name)}. Une progression lisible, un mouvement précis.</p></div>${logoStamp()}</section>
      <section class="hero card">${logoStamp()}<div class="row"><span class="pill">VOLUME TOTAL</span><span class="pill green">+2,8 % CE MOIS</span></div><div class="total">${fmt(t.total)} <small>kg soulevés</small></div><div class="progress orange-progress"><span style="width:${progress(t.total, 30000000)}%"></span></div><div class="row muted mono"><span>${fmt(t.total)} / 30 M kg</span><span>Palier Shiva</span></div></section>
      <section class="snapshot card"><div class="section-head compact"><div><p class="eyebrow">RÉPARTITION</p><h2>Reps & charge</h2></div><button class="link" data-tab="more">Analyses ${icon('chevron', 15)}</button></div><div class="snapshot-grid"><div class="bar-box"><div class="repBars"><span style="height:38%"></span><span style="height:61%"></span><span style="height:49%"></span><span style="height:84%"></span><span style="height:70%"></span><span class="last" style="height:100%"></span></div><small>6 dernières séances · reps</small></div><div class="donut" style="--pull:44;--dips:31"><div><b>44%</b><small>pull</small></div></div></div><div class="legend"><span><i class="dot orange-dot"></i>Pull 44%</span><span><i class="dot green-dot"></i>Push 31%</span><span><i class="dot white-dot"></i>Static 25%</span></div></section>
      <div class="stats icon-stats"><div class="stat card">${icon('pull')}<strong>${fmt(t.pull)}</strong><span>Tractions</span></div><div class="stat card">${icon('push')}<strong>${fmt(t.dips)}</strong><span>Dips</span></div><div class="stat card">${icon('static')}<strong>${fmt(t.mu)}</strong><span>Muscle-up</span></div></div>
      <div class="section-head"><div><p class="eyebrow">LANCER</p><h2>Ta séance</h2></div></div>
      <button class="workout-card card action" data-action="new-session"><span class="workout-icon">${icon('train')}</span><span class="grow"><h3>Set & Reps</h3><p>Force, puissance, volume</p></span>${icon('chevron')}</button>
      <button class="workout-card card action" data-action="new-group"><span class="workout-icon green-icon">${icon('group')}</span><span class="grow"><h3>Session avec les collocs</h3><p>Circuits, EMOM et défis d’équipe</p></span>${icon('chevron')}</button>
      <div class="section-head"><div><p class="eyebrow">OBJECTIFS ACTIFS</p><h2>En ligne de mire</h2></div><button class="link" data-tab="goals">Voir tout</button></div>
      <div class="grid-2"><button class="goal-card card quest-detail" data-action="quest-detail" data-quest="centurion"><span class="goal-icon">${icon('trophy')}</span><strong>Centurion</strong><p>Traction lestée +100 kg</p><div class="mini-progress"><span style="width:65%"></span></div></button><button class="goal-card card quest-detail" data-action="quest-detail" data-quest="onearm"><span class="goal-icon">${icon('pull')}</span><strong>One Arm</strong><p>5 reps à droite · 1 à gauche</p><div class="mini-progress orange-fill"><span style="width:45%"></span></div></button></div>
      <p class="foot-note">${sessionCount} séances indexées · tes données restent sur cet appareil</p>`;
  }

  function libraryCard(key) {
    const item = LIBRARIES[key]; const active = state.library === key;
    return `<button class="library-card ${active ? 'active' : ''}" data-action="select-library" data-library="${key}"><span class="library-icon">${icon(item.icon)}</span><span><b>${item.title}</b><small>${key === 'static' ? 'Figures & intermédiaires' : 'Exercices classés par mouvement'}</small></span>${icon('chevron')}</button>`;
  }
  function exercisePicker() {
    const library = LIBRARIES[state.library];
    return `<section class="library panel"><div class="library-head"><div><p class="eyebrow">${state.library === 'static' ? 'FIGURES DE STREET' : 'DOSSIER SET & REPS'}</p><h2>${library.title}</h2></div><span class="library-icon">${icon(library.icon)}</span></div><div class="exercise-chips">${library.items.map(item => `<button data-action="select-exercise" data-exercise="${esc(item)}">${esc(item)}<span>+</span></button>`).join('')}</div></section>`;
  }
  function lastTuesday() {
    if (today().getDay() !== 2) return '';
    const previous = sessions().find(item => new Date(`${item.date}T12:00:00`).getDay() === 2);
    return `<button class="last-session card" data-tab="history"><span class="workout-icon">${icon('history')}</span><span class="grow"><b>Dernier mardi</b><p>${previous ? `${previous.kind} · ${dateFR(previous.date)}` : 'Pas encore de séance mardi'}</p></span>${icon('chevron')}</button>`;
  }
  function groupIdeas() {
    return `<section class="suggestions"><div class="section-head compact"><div><p class="eyebrow">SUGGESTIONS</p><h2>Circuit collocs</h2></div></div><div class="suggestion-row"><button data-action="load-circuit" data-circuit="emom"><b>EMOM 12’</b><span>5 pull-up · 8 dips · 12 squats</span></button><button data-action="load-circuit" data-circuit="ladder"><b>Échelle 1→10</b><span>Pull-up + push-up, en duo</span></button><button data-action="load-circuit" data-circuit="static"><b>Figure relay</b><span>Front lever / planche · holds</span></button></div></section>`;
  }
  function train() {
    const d = ensureDraft(); const selected = d.sets.length ? d.sets.map((set, index) => setLine(set, index)).join('') : '<div class="empty">Choisis un exercice, puis ajoute tes séries. Les charges et les élastiques sont comptés distinctement.</div>';
    return `<div class="session-top"><button data-action="cancel-draft">‹ Annuler</button><span class="pill orange">EN COURS</span><button class="finish" data-action="finish">Terminer</button></div><p class="eyebrow">${d.group ? 'MODE GROUPE · CIRCUITS' : 'TRAINNING · MENU DU JOUR'}</p><h1>Voici le menu du jour,<br><em>Chef.</em></h1>${lastTuesday()}
      <div class="mode-switch">${['Force', 'Puissance', 'Volume'].map(mode => `<button class="${d.kind === mode ? 'active' : ''}" data-action="set-kind" data-kind="${mode}"><b>${mode === 'Force' ? '1' : mode === 'Puissance' ? '2' : '3'}</b>${mode}</button>`).join('')}</div>
      <section class="folder-panel card"><p class="eyebrow">CHOISIS TA BASE</p><div class="library-list">${libraryCard('pull')}${libraryCard('push')}${libraryCard('static')}</div></section>${exercisePicker()}
      ${d.group ? groupIdeas() : ''}
      <section class="set-form card"><div class="section-head compact"><div><p class="eyebrow">AJOUTER UNE SÉRIE</p><h2>${esc(d.selectedExercise || LIBRARIES[state.library].items[0])}</h2></div><button class="link" data-action="toggle-static">${d.isStatic ? 'Mode hold' : 'Mode reps'}</button></div>
        <div class="form-grid"><label>Séries<input id="sets" type="number" min="1" max="20" value="3" /></label><label>${d.isStatic ? 'Secondes' : 'Reps'}<input id="reps" type="number" min="1" max="120" value="${d.isStatic ? 10 : 5}" /></label><label>Note<input id="detail" maxlength="35" placeholder="optionnel" /></label></div>
        <div class="load-control"><div><span>${icon('weight')}</span><b>Leste</b><small id="loadValue">+0 kg</small></div><input id="loadRange" type="range" min="0" max="100" value="0" /><div class="range-labels"><span>0 kg</span><span>+100 kg</span></div></div>
        <div class="load-control band"><div><span>${icon('pull')}</span><b>Délestage élastique</b><small id="bandValue">0 kg</small></div><input id="bandRange" type="range" min="0" max="60" value="0" /><div class="range-labels"><span>sans</span><span>−60 kg</span></div></div>
        <label class="check-line"><input id="failed" type="checkbox" /> No rep / série ratée</label><button class="primary wide" data-action="add-set">Ajouter la série ${icon('chevron', 17)}</button></section>
      <h2 class="sets-title">Ta séance <span>${d.sets.length}</span></h2>${selected}
      <div class="session-footer"><button class="secondary" data-action="save-draft">Sauvegarder</button><button class="primary" data-action="finish">Terminer la séance</button></div>`;
  }
  function setLine(set, index) {
    const calc = contribution(set); const data = [set.sets + ' × ' + set.reps + (set.static ? ' s' : ' reps'), set.load ? '+' + set.load + ' kg' : '', set.band ? 'élastique −' + set.band + ' kg' : '', set.detail, set.failed ? 'No rep' : ''].filter(Boolean).join(' · ');
    return `<article class="set-line card"><span class="set-num">${String(index + 1).padStart(2, '0')}</span><span class="set-symbol">${icon(set.static ? 'static' : set.exercise.toLowerCase().includes('dip') || set.exercise.toLowerCase().includes('push') ? 'push' : 'pull')}</span><div class="set-main"><b>${esc(set.exercise)}</b><p>${esc(data)}</p></div><span class="set-load">${calc.kg ? fmt(calc.kg) + ' kg' : 'hold'}</span><button class="danger" data-action="remove-set" data-id="${set.id}" aria-label="Supprimer cette série">${icon('trash', 18)}</button></article>`;
  }

  function history() {
    const all = sessions(); const matching = state.filter === 'Toutes' ? all : all.filter(item => (item.kind || '').includes(state.filter));
    const groups = matching.reduce((output, item) => { const date = new Date(`${item.date}T12:00:00`); const month = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date); (output[month] ||= []).push(item); return output; }, {});
    return `<p class="eyebrow">JOURNAL D’ORIGINE · ARCHIVÉ</p><h1>Historique</h1><p class="muted">Tout est rangé par <b>mois</b>, semaine et jour. Tu peux supprimer une séance ajoutée par erreur.</p><div class="history-filter">${['Toutes', 'Force', 'Puissance', 'Volume'].map(filter => `<button class="${state.filter === filter ? 'active' : ''}" data-action="filter" data-filter="${filter}">${filter}</button>`).join('')}</div><section class="summary card"><div>${icon('history', 30)}<div><span class="eyebrow">ARCHIVES 2026</span><b>${all.length} séances</b></div></div><p>Journal complet, nouvelles séances et notes de ressenti.</p></section>
      <div class="history-tree">${Object.entries(groups).map(([month, items]) => `<details open><summary><span><i>MOIS</i>${month}</span><b>${items.length}</b></summary><div class="week-label">SEMAINE ${weekNumber(items[0].date)} · ${items.length} séance${items.length > 1 ? 's' : ''}</div>${items.map(historyItem).join('')}</details>`).join('') || '<div class="empty">Aucune séance dans ce filtre.</div>'}</div>`;
  }
  function weekNumber(iso) { const date = new Date(`${iso}T12:00:00`); const start = new Date(date.getFullYear(), 0, 1); return Math.ceil(((date - start) / 86400000 + start.getDay() + 1) / 7); }
  function historyItem(item) {
    const lines = item.raw || (item.sets || []).map(set => `${set.exercise} · ${set.sets}×${set.reps}${set.load ? ' +' + set.load + 'kg' : ''}${set.band ? ' / élastique −' + set.band + 'kg' : ''}`);
    return `<article class="history-item card"><div class="history-date"><b>${new Date(`${item.date}T12:00:00`).getDate()}</b><span>${new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(new Date(`${item.date}T12:00:00`)).replace('.', '')}</span></div><div class="grow"><span class="date">${esc(item.kind || 'Séance libre')} · ${esc(item.location || 'Libre')}</span><h3>${item.role ? esc(item.role.replace('Séance ', '')) : 'Séance enregistrée'}</h3><p>${lines.slice(0, 2).map(esc).join(' · ')}</p><details><summary>Voir le journal</summary><div class="details">${esc(lines.join('\n'))}</div></details></div>${item.historic ? '<span class="pill">ARCHIVE</span>' : `<button class="delete-session" data-action="delete-session" data-id="${item.id}" aria-label="Supprimer la séance">${icon('trash', 17)}</button>`}</article>`;
  }

  const quests = {
    centurion: { title: 'Centurion', icon: 'trophy', type: 'Quête principale', now: 65, goal: 100, copy: 'Passe la barre mythique des +100 kg à la traction lestée.', milestones: ['3 plaques · +60 kg', 'Garde royale · +80 kg', 'Centurion · +100 kg'] },
    onearm: { title: 'One Arm Protocol', icon: 'pull', type: 'Quête principale', now: 45, goal: 100, copy: 'Construis ta traction à un bras : stabilité, contrôle, puis volume.', milestones: ['Archer stable', 'Négative contrôlée', '5 reps propres'] },
    shiva: { title: 'Statue de Shiva', icon: 'weight', type: 'Quête secondaire', now: 97, goal: 100, copy: '30 millions de kilos cumulés. Un monument bâti série après série.', milestones: ['25 M · Fondation', '29 M · Dernière ligne', '30 M · Shiva'] }
  };
  function questCard(id) { const quest = quests[id]; return `<button class="achievement card quest-detail" data-quest="${id}"><span class="badge">${icon(quest.icon)}</span><span class="grow"><small>${quest.type}</small><h3>${quest.title}</h3><p>${quest.copy}</p><div class="mini-progress"><span style="width:${quest.now}%"></span></div></span><b>${quest.now}%</b>${icon('chevron')}</button>`; }
  function goals() {
    const t = totals(); const landmarkProgress = Math.round(progress(t.total, 30000000));
    return `<p class="eyebrow">MODE SUCCÈS · À LA MANIÈRE D’UN JEU</p><h1>Quêtes & ligues</h1><p class="muted">Des objectifs principaux, des challenges secondaires et les paliers à débloquer.</p><div class="quest-tabs"><button class="${state.goalView === 'principales' ? 'active' : ''}" data-action="goal-view" data-view="principales">Principales</button><button class="${state.goalView === 'secondaires' ? 'active' : ''}" data-action="goal-view" data-view="secondaires">Secondaires</button></div>
      ${state.goalView === 'principales' ? `<section class="league card">${logoStamp()}<p class="eyebrow">LIGUE ACTUELLE</p><div><span class="league-medal">${icon('trophy', 36)}</span><div><h2>Division Clean</h2><p>2 victoires de suite · 680 LP</p></div></div><div class="progress"><span style="width:68%"></span></div><small>Prochain rang : <b>Olympien</b></small></section>${questCard('centurion')}${questCard('onearm')}<div class="section-head"><div><p class="eyebrow">PALIERS</p><h2>Street lifting</h2></div></div><div class="milestone-grid"><span>✓ 3 plaques<br><small>+60 kg</small></span><span>◉ Garde royale<br><small>+80 kg</small></span><span>◇ Centurion<br><small>+100 kg</small></span></div>` : `<section class="secondary-quests">${questCard('shiva')}<article class="achievement card quest-detail" data-quest="shiva"><span class="badge">${icon('quest')}</span><span class="grow"><small>QUÊTE SECONDAIRE</small><h3>Roi du mardi</h3><p>4 séances le mardi ce mois-ci</p><div class="mini-progress orange-fill"><span style="width:50%"></span></div></span><b>2/4</b></article><article class="achievement card"><span class="badge">${icon('static')}</span><span class="grow"><small>CHALLENGE</small><h3>Le gardien des holds</h3><p>60 secondes cumulées au front lever</p><div class="mini-progress"><span style="width:38%"></span></div></span><b>38%</b></article></section>`}
      <dialog class="quest-dialog" id="questDetail"></dialog><p class="foot-note">Volume actuel : ${fmt(t.total)} kg · Shiva : ${landmarkProgress}%</p>`;
  }
  function questDetail(id) { const q = quests[id]; if (!q) return; const dialog = $('#questDetail'); dialog.innerHTML = `<form method="dialog"><div class="sheet-handle"></div><span class="dialog-icon">${icon(q.icon, 32)}</span><p class="eyebrow">${q.type}</p><h2>${q.title}</h2><p class="muted">${q.copy}</p><div class="large-progress"><b>${q.now}%</b><div class="progress"><span style="width:${q.now}%"></span></div><span>Objectif : ${q.goal}%</span></div><p class="eyebrow">MONUMENTS & PALIERS</p><ol class="milestones">${q.milestones.map((m, index) => `<li class="${index === q.milestones.length - 1 ? 'locked' : ''}"><i>${index + 1}</i>${m}</li>`).join('')}</ol><button class="primary wide">Fermer</button></form>`; dialog.showModal(); }

  function more() {
    const p = profile(); const logged = state.completed.filter(item => item.profileId === state.activeProfile); const total = logged.reduce((sum, session) => sum + session.sets.reduce((inner, set) => inner + contribution(set).kg, 0), 0); const pull = Math.round(progress(totals().pull, 300000));
    return `<p class="eyebrow">PROFIL, CALCULS & DONNÉES</p><h1>Plus</h1><section class="profile-card card">${logoStamp()}<button data-action="open-profiles" class="avatar">${esc(p.initials)}</button><div><h2>${esc(p.name)}</h2><p>${p.weight} kg · ${esc(p.mode)} · Street workout</p></div><button class="link" data-action="open-profiles">Modifier</button></section>
      <section class="settings card"><div class="settings-row"><span>${icon('weight')}</span><div><b>Poids du corps</b><p>Pour tes prochaines charges relatives</p></div><label><input id="bodyWeight" type="number" min="35" max="150" value="${p.weight}" /> kg</label></div><div class="settings-row"><span>${icon('train')}</span><div><b>Mode activé</b><p>Organisation du menu de séance</p></div><select id="profileMode"><option ${p.mode === 'PULL' ? 'selected' : ''}>PULL</option><option ${p.mode === 'PUSH' ? 'selected' : ''}>PUSH</option><option ${p.mode === 'MIXTE' ? 'selected' : ''}>MIXTE</option></select></div></section>
      <section class="analysis card"><div class="section-head compact"><div><p class="eyebrow">ELLE CALCULE</p><h2>Charge relative</h2></div><span class="pill green">ACTIF</span></div><div class="analysis-content"><div class="pieChart"><b>${pull}%</b><small>pull</small></div><div><b>${fmt(total)} kg</b><p>Volume ajouté à ton profil</p><div class="percent-bars"><span><i>Pull</i><b>44%</b><em style="width:44%"></em></span><span><i>Push</i><b>31%</b><em style="width:31%"></em></span><span><i>Static</i><b>25%</b><em style="width:25%"></em></span></div></div></div></section>
      <div class="section-head"><div><p class="eyebrow">SESSIONS ENREGISTRÉES</p><h2>Dernières séances</h2></div><button class="link" data-tab="history">Historique</button></div><div class="compact-history">${logged.slice(0, 3).map(item => `<button data-tab="history"><span>${icon('history')}</span><b>${dateFR(item.date)}</b><small>${item.kind} · ${item.sets.length} exercices</small>${icon('chevron')}</button>`).join('') || '<div class="empty">Aucune séance personnelle enregistrée.</div>'}</div>
      <div class="section-head"><div><p class="eyebrow">SAUVEGARDE</p><h2>Tes données</h2></div></div><button class="workout-card card action" data-action="export"><span class="workout-icon">↓</span><span class="grow"><h3>Exporter pour Notes</h3><p>Journal lisible, entraînement par entraînement</p></span>${icon('chevron')}</button><button class="workout-card card action danger-action" data-action="reset"><span class="workout-icon">${icon('trash')}</span><span class="grow"><h3>Effacer les nouvelles données</h3><p>Les archives d’origine restent conservées</p></span>${icon('chevron')}</button>`;
  }

  function render() { const view = { home, train, history, goals, more }[state.tab]; $('#screen').innerHTML = view(); $('.profile').textContent = profile().initials; document.querySelectorAll('.tabbar [data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === state.tab)); bind(); }
  function bind() {
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { state.tab = button.dataset.tab; render(); }));
    document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', onAction));
    ['loadRange', 'bandRange'].forEach(id => { const input = $('#' + id); if (input) input.addEventListener('input', () => { $('#' + (id === 'loadRange' ? 'loadValue' : 'bandValue')).textContent = `${id === 'loadRange' ? '+' : '−'}${input.value} kg`; }); });
    const weight = $('#bodyWeight'); if (weight) weight.addEventListener('change', () => { profile().weight = Math.max(35, Number(weight.value) || 70); save(); render(); });
    const mode = $('#profileMode'); if (mode) mode.addEventListener('change', () => { profile().mode = mode.value; save(); });
  }
  function addCircuit(name) {
    const d = ensureDraft(); const sets = name === 'static' ? [{ exercise: 'Tuck Front Lever', sets: 4, reps: 10, static: true }, { exercise: 'Tuck Planche', sets: 4, reps: 8, static: true }] : name === 'ladder' ? [{ exercise: 'Pull-Up classique', sets: 1, reps: 10 }, { exercise: 'Push-Up', sets: 1, reps: 20 }] : [{ exercise: 'Pull-Up classique', sets: 4, reps: 5 }, { exercise: 'Dips', sets: 4, reps: 8 }];
    d.sets.push(...sets.map(set => ({ id: crypto.randomUUID(), load: 0, band: 0, detail: name === 'emom' ? 'EMOM 12 min' : 'Circuit collocs', failed: false, ...set }))); render();
  }
  function onAction(event) {
    const action = event.currentTarget.dataset.action;
    if (action === 'new-session' || action === 'new-group') { state.draft = createDraft(action === 'new-group'); state.tab = 'train'; render(); }
    if (action === 'cancel-draft') { state.draft = null; state.tab = 'home'; render(); }
    if (action === 'set-kind') { ensureDraft().kind = event.currentTarget.dataset.kind; render(); }
    if (action === 'select-library') { state.library = event.currentTarget.dataset.library; render(); }
    if (action === 'select-exercise') { ensureDraft().selectedExercise = event.currentTarget.dataset.exercise; render(); }
    if (action === 'toggle-static') { const d = ensureDraft(); d.isStatic = !d.isStatic; render(); }
    if (action === 'load-circuit') addCircuit(event.currentTarget.dataset.circuit);
    if (action === 'add-set') { const d = ensureDraft(); d.sets.push({ id: crypto.randomUUID(), exercise: d.selectedExercise || LIBRARIES[state.library].items[0], sets: Number($('#sets').value), reps: Number($('#reps').value), load: Number($('#loadRange').value), band: Number($('#bandRange').value), detail: $('#detail').value.trim(), static: d.isStatic, failed: $('#failed').checked }); render(); }
    if (action === 'remove-set') { const d = ensureDraft(); d.sets = d.sets.filter(set => set.id !== event.currentTarget.dataset.id); render(); }
    if (action === 'save-draft') { localStorage.setItem('cf-draft', JSON.stringify(ensureDraft())); alert('Séance gardée en cours sur cet appareil.'); }
    if (action === 'finish') finish();
    if (action === 'filter') { state.filter = event.currentTarget.dataset.filter; render(); }
    if (action === 'delete-session') { if (confirm('Supprimer cette séance enregistrée ? Cette action ne peut pas être annulée.')) { state.completed = state.completed.filter(item => item.id !== event.currentTarget.dataset.id); save(); render(); } }
    if (action === 'goal-view') { state.goalView = event.currentTarget.dataset.view; render(); }
    if (action === 'quest-detail') questDetail(event.currentTarget.dataset.quest);
    if (action === 'open-profiles') openProfiles();
    if (action === 'add-profile') addProfile();
    if (action === 'export') exportNotes();
    if (action === 'reset' && confirm('Effacer uniquement les séances ajoutées dans CLEAN FORM ?')) { state.completed = []; save(); render(); }
  }
  function finish() { if (!state.draft?.sets.length) return alert('Ajoute au moins une série ou un mouvement avant de terminer.'); state.feelingTarget = state.draft; $('#feelingDialog').showModal(); }
  function saveFeeling() { const dialog = $('#feelingDialog'); if (!state.feelingTarget) return; state.feelingTarget.feeling = dialog.returnValue === 'close' ? '' : dialog.returnValue; state.feelingTarget.note = $('#feelingNote').value.trim(); state.completed.push(state.feelingTarget); state.draft = null; state.feelingTarget = null; save(); state.tab = 'history'; render(); }
  function openProfiles() { const dialog = $('#profileDialog'); $('#profileChoices').innerHTML = state.profiles.map(item => `<button type="button" class="profile-choice ${item.id === state.activeProfile ? 'active' : ''}" data-id="${item.id}"><span>${esc(item.initials)}</span><b>${esc(item.name)}</b><small>${item.weight} kg · ${item.mode}</small></button>`).join(''); dialog.showModal(); dialog.querySelectorAll('.profile-choice').forEach(button => button.addEventListener('click', () => { state.activeProfile = button.dataset.id; save(); dialog.close(); render(); })); }
  function addProfile() { const input = $('#newProfileName'); const name = input.value.trim(); if (!name) return; const initials = name.split(/\s+/).map(word => word[0]).join('').slice(0, 2).toUpperCase(); const id = crypto.randomUUID(); state.profiles.push({ id, name, initials, weight: 70, mode: 'MIXTE' }); state.activeProfile = id; save(); $('#profileDialog').close(); render(); }
  function exportNotes() { const list = state.completed.filter(item => item.profileId === state.activeProfile); if (!list.length) return alert('Ajoute une séance pour créer ton export.'); const text = list.map(session => `${dateFR(session.date)}\n${session.kind} · ${session.location}\n${session.sets.map(set => `${set.exercise} : ${set.sets}×${set.reps}${set.load ? ' +' + set.load + 'kg' : ''}${set.band ? ' / élastique −' + set.band + 'kg' : ''}`).join('\n')}${session.note ? '\nNote : ' + session.note : ''}`).join('\n\n'); const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); const link = document.createElement('a'); link.href = url; link.download = 'CLEAN-FORM-journal.txt'; link.click(); URL.revokeObjectURL(url); }
  function init() { $('.brand').addEventListener('click', () => { state.tab = 'home'; render(); }); $('#feelingDialog').addEventListener('close', saveFeeling); render(); }
  return { init };
})();
CF.init();
