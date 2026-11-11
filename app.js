import { WORKERS, POLICY_DEFS, DAYS, BINS, TIME_STUDY, createGame, configure, startShift, getOrder, doWork, chooseEvent, nextShift, reportText, comparePolicies, serializeState, deserializeState } from './engine.js';

const $ = (selector, root = document) => root.querySelector(selector);
const main = $('#main');
const dialog = $('#dialog');
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const stationNames = {pick: 'Pick', pack: 'Pack', check: 'Check'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n, digits = 1) => Number(n ?? 0).toLocaleString('en-US', {maximumFractionDigits: digits});
const label = (key, value) => POLICY_DEFS.find(p => p.id === key)?.options.find(o => o.id === value)?.label ?? value;
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
let game = null;
let input = blankInput();
let toastTimer;
let comparison = null;
let lastFocus;
let invalidLink = false;
const studied = new Set();

function blankInput() { return {bin: null, pack: 'mailer', inspect: true, pace: 'steady', rest: false}; }
function announce(message) { $('#announcer').textContent = message; }
function toast(message) {
  const node = $('#toast'); node.textContent = message; node.hidden = false; announce(message);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { node.hidden = true; }, 4500);
}
function encode(text) { return btoa(Array.from(new TextEncoder().encode(text), c => String.fromCharCode(c)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function decode(text) { return new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))); }
function snapshotURL() {
  const url = new URL(location.href); url.hash = game ? `run=${encode(serializeState(game))}` : ''; return url.href;
}
function persist() {
  if (!game) return;
  try { history.replaceState(null, '', snapshotURL()); }
  catch { toast('This browser could not update the resume link. Use Keep a link to copy your current run.'); }
}
function loadLink() {
  if (!location.hash.startsWith('#run=')) return;
  try {
    if (location.hash.length > 40000) throw new Error('Link too long');
    game = deserializeState(decode(location.hash.slice(5)));
  } catch { game = null; invalidLink = true; }
}
function openDialog(title, body) {
  lastFocus = document.activeElement;
  $('#dialog-title').textContent = title; $('#dialog-body').innerHTML = body;
  if (!dialog.open) dialog.showModal();
  $('#close-dialog').focus();
}
function closeDialog() { dialog.close(); (lastFocus?.isConnected ? lastFocus : main).focus({preventScroll:true}); }
$('#close-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom) closeDialog(); } });

function stationIcon(type) {
  const shapes = {
    pick: '<path d="M8 8h48v42H8zM8 24h48M8 40h48M24 8v42M40 8v42"/><path d="M11 12h10v8H11zM27 28h10v8H27zM43 12h10v8H43z" fill="currentColor" opacity=".6"/>',
    pack: '<path d="m8 21 24-12 24 12v28L32 61 8 49Z"/><path d="m8 21 24 12 24-12M32 33v28M20 15l24 12v13"/>',
    check: '<path d="M16 10h32v45H16zM25 10V5h14v5"/><path d="m24 33 6 6 12-15" stroke-width="3"/>'
  };
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${shapes[type]}</svg>`;
}
function floorArt() {
  return `<div class="floor-art" aria-label="Warehouse illustration: picking, packing, and quality inspection connected by a conveyor">
    <div class="floor-top"><span>SWIFTLINE / FLOOR 02</span><span><i class="live-dot"></i>SHIFT READY</span></div>
    <div class="floor-scene"><div class="floor-label"><span>ONE WORKPLACE.</span><span>YOUR OPERATING SYSTEM.</span></div><div class="floor-nodes">${Object.entries(stationNames).map(([key, name],i)=>`<div class="floor-node"><span class="station-number">0${i+1}</span>${stationIcon(key)}<strong>${name.toUpperCase()}</strong></div>`).join('')}</div><div class="conveyor" aria-hidden="true"><i class="parcel"></i><i class="parcel"></i><i class="parcel"></i></div></div>
    <div class="floor-quote"><b class="quote-icon" aria-hidden="true">“</b><div>The instructions are clear. But do they work?<span>A QUESTION FOR THE WHOLE SHIFT</span></div></div>
    <div class="hero-stats"><div><strong>05</strong><span>SHIFTS TO RUN</span></div><div><strong>03</strong><span>PEOPLE TO ORGANIZE</span></div><div><strong>06</strong><span>POLICIES TO TEST</span></div></div>
  </div>`;
}
function intro() {
  return `${invalidLink ? '<div class="note-box red" role="alert">That run link is incomplete or uses an unsupported version. Your link has not been overwritten. You can start a new week below.</div>' : ''}
  <section class="hero"><div><span class="pill"><span class="dot"></span>Classical management, in motion</span><h1>The Rate<br><span>Race.</span></h1><p class="intro">Run the shift. Live with the rules.</p><p class="subtle">Set the method, organize the crew, and work the floor. Can you build an efficient operation that still works when something changes?</p><div class="hero-actions"><button class="button primary" data-action="begin">Start your week ${arrow}</button><button class="button secondary" data-global="help">Take a quick tour</button></div><div class="hero-meta"><span>5 SHIFTS</span><span>PLAY AT YOUR OWN PACE</span><span>SOLO OR IN PAIRS</span></div></div>${floorArt()}</section>
  <section class="three-steps" aria-label="How the game works"><div class="step-card"><span class="step-number">01 /</span><div><h3>Design the system</h3><p>Decide how people learn, who does what, and which rules govern the work.</p></div></div><div class="step-card"><span class="step-number">02 /</span><div><h3>Work inside it</h3><p>Pick, pack, and inspect orders. Respond when the standard plan meets an exception.</p></div></div><div class="step-card"><span class="step-number">03 /</span><div><h3>Make your case</h3><p>Compare the same work under a different policy. Explain the results with evidence.</p></div></div></section>
  <p class="bottom-note">Built for COMM 3008. All people, events, and numbers are fictional teaching examples. There is no countdown and no single winning score. <a class="teacher-link" href="https://github.com/chengyu-ucsb/The-Rate-Race/blob/main/docs/instructor-guide.md">Instructor guide ↗</a></p>`;
}
function progress() {
  return `<div class="progress-row"><ol class="week-progress" aria-label="Week progress">${dayNames.map((d,i)=>`<li class="${i<game.day||game.phase==='debrief'?'done':i===game.day?'current':''}" ${i===game.day&&game.phase!=='debrief'?'aria-current="step"':''}>${d.slice(0,3).toUpperCase()}${i<game.day||game.phase==='debrief'?' ✓':''}</li>`).join('')}</ol><span class="mode-label">${game.phase==='debrief'?'WEEK COMPLETE':'SIMULATED TIME · NO COUNTDOWN'}</span></div>`;
}
function heading(kicker, title, description, tag = '') {
  return `<div class="page-heading"><div><span class="eyebrow red">${esc(kicker)}</span><h1 tabindex="-1" id="page-title">${esc(title)}</h1><p>${esc(description)}</p></div>${tag?`<span class="phase-tag">${esc(tag)}</span>`:''}</div>`;
}
function policyFields(policies = game.policies) {
  return POLICY_DEFS.filter(p=>p.unlockDay<=game.day).map(p=>`<fieldset class="policy-group"><legend>${esc(p.label)}<span class="theory-tag">${esc(p.theory)}</span></legend><div class="policy-options">${p.options.map(o=>`<label class="policy-option"><input type="radio" name="policy-${p.id}" id="policy-${p.id}-${o.id}" value="${o.id}" data-policy="${p.id}" ${policies[p.id]===o.id?'checked':''}><strong>${esc(o.label)}</strong><small>${esc(o.description)}</small></label>`).join('')}</div></fieldset>`).join('');
}
function crew() {
  return `<section class="panel"><div class="panel-head"><h2>Put skills to work</h2><span class="eyebrow">QUALIFICATIONS / 5</span></div><p class="hint">Assign one person to each station. Changing a station swaps its current worker. In whole-order work, everyone completes all three tasks.</p>${WORKERS.map((w,i)=>`<div class="person"><span class="avatar ${['','red','amber'][i]}">${esc(w.name.slice(0,2).toUpperCase())}</span><div><strong>${esc(w.name)}</strong><div class="skills">${Object.entries(w.skills).map(([k,v])=>`<span>${stationNames[k]} <b>${v}</b></span>`).join('')}</div></div><label class="sr-only" for="assignment-${w.id}">${esc(w.name)} station</label><select data-worker="${w.id}" id="assignment-${w.id}" aria-label="${esc(w.name)} station">${Object.entries(stationNames).map(([id,n])=>`<option value="${id}" ${game.assignment[w.id]===id?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')}</section>`;
}
function smallFloor() {
  return `<div class="mini-floor">${Object.entries(stationNames).map(([k,v],i)=>{const worker=WORKERS.find(w=>game.assignment[w.id]===k);return `<div class="mini-station"><span class="eyebrow">0${i+1} / ${v}</span><strong>${game.policies.division==='whole'?'Whole crew':esc(worker?.name)}</strong><span>${game.policies.division==='whole'?'Whole orders':`Skill ${worker?.skills[k]}/5`}</span></div>`;}).join('')}</div><p class="operating-note">${game.policies.division==='whole'?'Each person owns a complete order. You switch among workers as orders arrive.':'Specialists hand off work. Task time depends on the assigned skills; covering an absence adds handoff delays.'}</p>`;
}
function wellbeing() {
  return `<section class="panel dark"><span class="eyebrow">THE PEOPLE BEHIND THE RATE</span><div class="status-grid"><div><strong>${fmt(game.metrics.fatigue,0)}<small>/ 100 fatigue</small></strong></div><div><strong>${fmt(game.metrics.trust,0)}<small>/ 100 trust</small></strong></div><div><strong>${fmt(game.metrics.wages)}<small>pay credits so far</small></strong></div><div><strong>${game.metrics.shipped}<small>good orders so far</small></strong></div></div><p class="hint">Fatigue can slow later work. Trust affects cooperation. These are simplified model assumptions.</p></section>`;
}
function plan() {
  const d = DAYS[game.day];
  const locked = POLICY_DEFS.filter(p=>p.unlockDay>game.day);
  const target = game.policies.incentive==='ratchet' ? Math.max(d.target,game.capabilities.ratchetTarget) : d.target;
  return progress()+heading(`${dayNames[game.day]} / Plan the shift`, d.title, d.brief, `01 / PLAN`)+`
    <div class="two-column"><div class="stack"><section class="panel"><div class="panel-head"><h2>Your operating rules</h2><button class="button text small" data-action="study">Open time study ↗</button></div>${policyFields()}${locked.length?`<p class="locked-note">Coming later: ${locked.map(p=>esc(p.label)).join(' · ')}. New decisions open as the week gets more complicated.</p>`:''}</section>${game.day>=1?crew():''}<div class="action-bar"><p class="hint">Once the shift opens, work under this plan. Revise it tomorrow. Reading and discussion never use shift time.</p><button class="button primary" data-action="start-shift">Open the shift ${arrow}</button></div></div>
    <aside class="stack side-stack sticky-side"><section class="panel contract"><span class="eyebrow">TODAY'S BRIEF</span><span class="big-number">${target}<span style="font-size:18px;letter-spacing:0"> / 6</span></span><strong>good orders, on time</strong><p class="hint">${d.budget} simulated minutes for this batch, including setup, rework, and interruptions. The moving-target policy can raise the quota after strong performance.</p><div class="divider"></div><span class="eyebrow">${esc(d.focus)}</span></section><section class="panel"><div class="panel-head"><h3>The floor</h3></div>${smallFloor()}</section>${wellbeing()}</aside></div>`;
}
function strip() {
  const s=game.shift;
  return `<div class="metrics-strip" aria-label="Current shift metrics"><div class="metric"><strong>${s.onTime}<span style="font-size:13px;color:var(--muted)"> / ${s.target}</span></strong><small>Good orders on time</small></div><div class="metric"><strong class="${s.minutes>s.budget?'red':''}">${fmt(s.minutes)}<span style="font-size:12px;color:var(--muted)"> / ${s.budget}</span></strong><small>Simulated minutes used</small></div><div class="metric"><strong>${s.defects}</strong><small>Defects sent out</small></div><div class="metric"><strong>${fmt(game.metrics.fatigue,0)}<span style="font-size:12px;color:var(--muted)"> / 100</span></strong><small>Crew fatigue</small></div></div>`;
}
function ledger() {
  const actions=game.shift.actions;
  return `<section class="panel"><div class="panel-head"><h3>Shift record</h3><span class="eyebrow">${actions.length} / 6 ORDERS</span></div>${actions.length?`<ol class="ledger">${actions.slice().reverse().map((a,i)=>`<li><span class="log-icon ${!a.good?'bad':''}" aria-hidden="true">${!a.good?'!':'✓'}</span><div><strong>Order ${actions.length-i}</strong> · ${!a.good?'Defect shipped':a.late?'Good, but late':'Good and on time'}<small>${fmt(a.minutes)} min${a.intercepted?' · reworked':''}${a.late?' · late':''}</small></div></li>`).join('')}</ol>`:'<p class="hint">Your decisions leave a record here. Each dispatch moves the simulated clock.</p>'}</section>`;
}
function currentRules() {
  return `<section class="panel"><div class="panel-head"><h3>On this shift</h3><span class="eyebrow">THE PLAN</span></div>${smallFloor()}<div class="divider"></div><p class="side-note"><strong>${esc(label('method',game.policies.method))}</strong>${esc(label('training',game.policies.training))}</p><div class="divider"></div><p class="side-note"><strong>${esc(label('authority',game.policies.authority))}</strong>${esc(label('rules',game.policies.rules))} · ${esc(label('incentive',game.policies.incentive))}</p></section>`;
}
function eventView() {
  const ev=game.shift.event;
  return `<section class="message-card"><span class="eyebrow">INCOMING / EXCEPTION REPORT</span><h2 id="event-title" tabindex="-1">${esc(ev.title)}</h2><p class="body">${esc(ev.body)}</p><div class="event-options">${ev.options.map(o=>`<button class="event-option" data-event="${o.id}"><strong>${esc(o.label)}<span aria-hidden="true">↗</span></strong><small>${esc(o.description)}</small></button>`).join('')}</div></section>`;
}
function work() {
  const s=game.shift;
  const order=getOrder(game);
  const ev=s.event&&!s.event.resolved;
  const title=ev?'The plan meets an exception.':'Work the floor.';
  return progress()+heading(`${dayNames[game.day]} / ${DAYS[game.day].title}`, title, ev?'Choose how the organization will respond. The clock waits while you decide.':'Read the ticket, select a bin, choose packaging, and decide how to check the work.', '02 / OPERATE')+strip()+`
  <div class="two-column work-columns"><div class="stack">${ev?eventView():`<form class="panel workbench" id="order-form"><div class="workbench-top"><strong>DISPATCH DESK / ORDER ${s.index+1} OF 6</strong><div class="ticket-progress" aria-hidden="true">${Array.from({length:6},(_,i)=>`<span class="${i<s.index?'complete':''}"></span>`).join('')}</div></div><div class="order-ticket"><div><span class="eyebrow">${esc(order.id)}</span><h2>${esc(order.item)}</h2><div class="ticket-meta"><span class="ticket-chip">${order.fragile?'FRAGILE · BOX REQUIRED':'STANDARD · EITHER PACK'}</span><span class="ticket-chip ${order.damaged?'damage':''}">${esc(order.condition)}</span></div></div><div class="ticket-bin"><span>LOCATION</span>${esc(order.bin)}</div></div><div class="workbench-body"><div class="work-grid"><section aria-labelledby="bin-label"><h3 class="control-label" id="bin-label"><span class="number">01</span>Select the item location</h3><div class="bin-grid" role="group" aria-label="Warehouse bins">${BINS.map(b=>`<button type="button" class="bin-button" data-bin="${b}" aria-pressed="${input.bin===b}">${b}</button>`).join('')}</div><p class="hint" id="bin-hint">Match the location on the ticket. Arrow keys also move between bins.</p></section><section aria-label="Packaging and work choices"><fieldset class="policy-group"><legend class="control-label"><span><span class="number">02</span>Choose packaging</span></legend><div class="pack-options"><label class="pack-option">${stationIcon('pack')}<input type="radio" name="pack" value="box" ${input.pack==='box'?'checked':''}> Rigid box</label><label class="pack-option"><svg viewBox="0 0 40 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 6h32v22H4zM4 6l16 12L36 6"/></svg><input type="radio" name="pack" value="mailer" ${input.pack==='mailer'?'checked':''}> Mailer</label></div></fieldset><span class="control-label"><span class="number">03</span>Decide how to work</span><label class="check-option"><input type="checkbox" name="inspect" ${input.inspect?'checked':''}><span>Inspect before dispatch<small>Find and rework mistakes or damage. Takes simulated time.</small></span></label><label class="check-option"><input type="checkbox" name="rest" ${input.rest?'checked':''}><span>Take a recovery break first<small>Uses shift time; reduces fatigue before this order.</small></span></label><div class="pace-row"><label class="sr-only" for="pace">Work pace</label><select id="pace" name="pace"><option value="steady" ${input.pace==='steady'?'selected':''}>Steady pace</option><option value="rush" ${input.pace==='rush'?'selected':''}>Rush · faster, more fatigue</option></select></div></section></div></div><div class="workbench-footer"><p class="hint" id="dispatch-hint">Select a bin to dispatch. Your real-world clicking speed does not affect the result.</p><button class="button primary" id="dispatch-button" type="submit" ${!input.bin?'disabled':''}>Dispatch order <span aria-hidden="true">→</span></button></div></form>`}
  ${s.event?.resolved?`<div class="note-box"><strong>Decision recorded:</strong> ${esc(s.event.options.find(o=>o.id===s.event.choice)?.label??s.event.choice)}. Your shift report will include the consequences.</div>`:''}</div><aside class="stack side-stack">${currentRules()}${ledger()}</aside></div>`;
}
function statsCards(r) {
  return `<div class="report-grid"><div class="report-stat ${r.metTarget?'good':'accent'}"><strong>${r.onTime} / ${r.target}</strong><small>Good orders on time</small></div><div class="report-stat"><strong>${fmt(r.minutes)} min</strong><small>${r.budget}-minute batch budget</small></div><div class="report-stat"><strong>${r.defects}</strong><small>Defects shipped · ${r.reworked} reworked</small></div><div class="report-stat"><strong>${fmt(r.wages)}</strong><small>Pay credits this shift</small></div></div>`;
}
function report() {
  const r=game.shift.result;
  return progress()+heading(`${dayNames[game.day]} / Shift report`, r.metTarget?'The batch made its target.':'The target tells only part of the story.', `${r.shipped} good orders out of ${r.raw} processed. ${r.late} order${r.late===1?' was':'s were'} late. What in your system produced that result?`, '03 / REVIEW')+statsCards(r)+`
    <div class="two-column section-gap"><div class="stack"><section class="panel"><div class="panel-head"><h2>What changed the result</h2><span class="eyebrow">YOUR DECISIONS</span></div><ul class="reasons">${r.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul><div class="divider"></div><p class="side-note"><strong>Actual rate: ${fmt(r.rate)} good orders per simulated hour</strong>Calculated from good output divided by all shift time, including setup and interruptions.</p><div class="divider"></div><p class="side-note"><strong>Notice the difference</strong>Good output, output per minute, fatigue, trust, and pay tell different stories. A faster batch is not automatically a better workplace.</p></section>${comparisonPanel(false)}<div class="action-bar"><p class="hint">${game.day<4?'Fatigue and trust carry into the next shift. You can revise your plan with what you learned.':'Take your five shifts into the debrief. Use your evidence to explain what the model shows and leaves out.'}</p><button class="button primary" data-action="next">${game.day<4?'Plan '+dayNames[game.day+1]:'Open your debrief'} ${arrow}</button></div></div><aside class="stack side-stack">${wellbeing()}<section class="panel"><h3>One question to carry</h3><p class="hint">${esc(dailyQuestion(game.day))}</p></section></aside></div>`;
}
function dailyQuestion(day) {
  return ['Who developed the method, and who had to follow it? Did training change the cost of standardization?','Did the strongest specialist assignment help the whole operation, or just one station?','Did authority and written rules help someone resolve the exception? What did that coordination cost?','Why would someone hold back effort when a target can move? How does a stable rate change that calculation?','Which part of your design handled the unfamiliar work well? What would you change without losing its advantages?'][day];
}
function comparisonPanel(full = true) {
  const defs=POLICY_DEFS.filter(p=>p.unlockDay<=game.day);
  return `<section class="panel"><div class="panel-head"><h2>Change one rule. Keep the work.</h2><span class="eyebrow">CONTROLLED REPLAY</span></div><p class="hint">Replay ${dayNames[game.day]}'s exact orders, dispatch choices, and event response under a different policy. Starting fatigue and trust stay the same. ${full?'This is a model projection, not evidence about real workplaces.':''}</p><div class="comparison-controls"><label for="compare-policy">Policy to change<select id="compare-policy">${defs.map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('')}</select></label><label for="compare-option">Alternative rule<select id="compare-option"></select></label><button class="button secondary small" data-action="compare">Compare results ↗</button></div><div id="comparison-output" role="status" aria-live="polite"></div></section>`;
}
function conceptCards() {
  return `<div class="concept-grid"><article class="concept-card"><span class="eyebrow red">THE METHOD</span><h3>Frederick Taylor</h3><p>Study the work, establish a method, select and train workers, and divide planning from execution. A stable, announced piece rate differs from raising the target after someone performs well.</p><cite>Miller (2015), pp. 26–28.</cite></article><article class="concept-card"><span class="eyebrow red">THE STRUCTURE</span><h3>Henri Fayol</h3><p>Divide work and coordinate responsibility. The scalar chain clarifies authority; an authorized lateral “gangplank” can shorten a detour. Initiative, equity, and team spirit also belong to his approach.</p><cite>Miller (2015), pp. 19–22.</cite></article><article class="concept-card"><span class="eyebrow red">THE AUTHORITY</span><h3>Max Weber</h3><p>Authority attaches to an office and its rules. Written standards and relevant qualifications support consistency and limit favoritism. An ideal type is an analytical model, not a claim of moral perfection.</p><cite>Miller (2015), pp. 24–25.</cite></article></div>`;
}
function historyTable() {
  return `<div class="table-wrap"><table><caption class="sr-only">Your five shifts</caption><thead><tr><th scope="col">Shift</th><th scope="col" class="num">On time / target</th><th scope="col" class="num">Good / processed</th><th scope="col" class="num">Minutes</th><th scope="col" class="num">Defects</th><th scope="col" class="num">Fatigue</th><th scope="col" class="num">Trust</th><th scope="col" class="num">Pay</th></tr></thead><tbody>${game.history.map(r=>`<tr><th scope="row">${dayNames[r.day]}</th><td class="num">${r.onTime} / ${r.target}</td><td class="num">${r.shipped} / ${r.raw}</td><td class="num">${fmt(r.minutes)}</td><td class="num">${r.defects}</td><td class="num">${fmt(r.fatigue,0)}</td><td class="num">${fmt(r.trust,0)}</td><td class="num">${fmt(r.wages)}</td></tr>`).join('')}</tbody></table></div>`;
}
function evidenceLog() {
  return game.history.map(r=>`<details class="log-details"><summary>${dayNames[r.day]} · ${esc(r.title)}</summary><div><p class="hint">${POLICY_DEFS.filter(p=>p.unlockDay<=r.day).map(p=>`${esc(p.label)}: ${esc(label(p.id,r.policies[p.id]))}`).join(' · ')}</p><ul class="reasons">${r.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></details>`).join('');
}
function debrief() {
  const m=game.metrics;
  const hits=game.history.filter(r=>r.metTarget).length;
  return progress()+heading('Your week / The debrief', 'Who set the pace?', 'You built an organization, then worked inside it. Now use your results to explain what its rules made possible, what they constrained, and why.')+`
    <div class="report-grid"><div class="report-stat accent"><strong>${m.shipped} / ${m.raw}</strong><small>Good orders / all processed</small></div><div class="report-stat"><strong>${hits} / 5</strong><small>Shifts that met the target</small></div><div class="report-stat"><strong>${fmt(m.minutes)} min</strong><small>Total simulated time</small></div><div class="report-stat"><strong>${fmt(m.wages)}</strong><small>Total crew pay credits</small></div></div>
    <section class="panel section-gap"><div class="panel-head"><h2>Your week in evidence</h2><span class="eyebrow">SCENARIO ${game.seed}</span></div>${historyTable()}<p class="hint">Quality-correct orders can still be late. Pay is a fictional teaching unit. Fatigue and trust use 0–100 scales; lower fatigue and higher trust are favorable.</p></section>
    <div class="section-gap">${comparisonPanel()}</div><section class="section-gap" aria-label="Connect the experience to theory">${conceptCards()}</section>
    <section class="panel section-gap"><div class="panel-head"><h2>Make an argument from your run</h2><span class="eyebrow">REFLECT / TRANSFER</span></div><ol class="reflection-list"><li><strong>Explain one result.</strong>Choose a decision, name the relevant theorist, and cite two numbers or events from your week. Explain how the decision could have produced the result.</li><li><strong>Follow a message.</strong>Who noticed an issue? Who could authorize a response? Did the message travel up, down, or across the organization? What did that route change?</li><li><strong>Revise the design.</strong>Use the controlled replay to propose one change. Name a benefit, a cost, and something this simplified model cannot establish.</li></ol><div class="note-box">Write your reflection in your course's usual submission space. This game does not collect names, send grades, or submit work. Copy the results below as evidence.</div><div class="hero-actions no-print"><button class="button primary" data-action="copy-report">Copy my results ↗</button><button class="button secondary" data-action="print">Print result sheet</button><button class="button secondary" data-global="share">Keep a run link</button></div></section>
    <section class="panel section-gap"><div class="panel-head"><h2>Open the decision record</h2><span class="eyebrow">TRACE THE OUTCOME</span></div>${evidenceLog()}</section>
    <section class="panel section-gap"><div class="panel-head"><h2>Where the model comes from</h2><button class="button text small no-print" data-global="model">How the model works ↗</button></div><p class="side-note">The theories inform the questions and mechanics. The numbers are design assumptions, not estimates from research. A successful strategy here is a claim about this model, not proof about real people.</p><ul class="source-list"><li>Miller, K. (2015). <em>Organizational communication: Approaches and processes</em> (7th ed.), Chapter 2, pp. 18–32. The core course source for the machine metaphor, Taylor, Fayol, Weber, and communication patterns.</li><li>COMM 3008, Week 2 mini-lectures and <em>Principles of the Classical Organization</em> handout. Course framing and the distinction between formal authority and communication in practice.</li><li>Schumpeter. (2015). <em>Digital Taylorism.</em> The Economist. Historical commentary for the extension to continuous metrics and monitoring. The assigned 2015 <em>Inside Amazon</em> report concerns corporate work; it is not a source of warehouse rate estimates.</li></ul></section><div class="action-bar no-print"><p class="hint">Try a new week with the same scenario to test a different overall design.</p><button class="button secondary" data-action="restart">Start another week ↗</button></div>`;
}

function render({scroll = true, focus = null} = {}) {
  $('#share-button').hidden = !game;
  main.innerHTML = !game ? intro() : game.phase === 'plan' ? plan() : game.phase === 'work' ? work() : game.phase === 'report' ? report() : debrief();
  if ($('#compare-policy')) fillCompareOptions();
  if (comparison && $('#comparison-output')) renderComparison();
  if (scroll) { window.scrollTo({top:0,behavior:'instant'}); $('#page-title')?.focus({preventScroll:true}); }
  if (focus) $(focus)?.focus({preventScroll:true});
}
function updateGame(next, {resetWork = true} = {}) {
  game=next; comparison=null; if(resetWork) input=blankInput(); persist(); render();
}
function begin() { invalidLink=false; updateGame(createGame(game?.seed ?? 3008)); }
function collectWorkInput() {
  const form=$('#order-form');
  if(!form) return;
  input.pack=$('input[name="pack"]:checked',form).value;
  input.inspect=$('input[name="inspect"]',form).checked;
  input.rest=$('input[name="rest"]',form).checked;
  input.pace=$('select[name="pace"]',form).value;
}
function fillCompareOptions() {
  const key=$('#compare-policy').value;
  const p=POLICY_DEFS.find(d=>d.id===key);
  $('#compare-option').innerHTML=p.options.filter(o=>o.id!==game.policies[key]).map(o=>`<option value="${o.id}">${esc(o.label)}</option>`).join('');
}
function renderComparison() {
  const out=$('#comparison-output'); if(!out||!comparison) return;
  const {before, after, key, option}=comparison;
  const rows=[['Good orders on time','onTime',0],['Good orders overall','shipped',0],['Minutes','minutes',1],['Good orders / simulated hour','rate',1],['Defects sent out','defects',0],['Fatigue at end','fatigue',1],['Trust at end','trust',1],['Crew pay credits','wages',1]];
  out.innerHTML=`<p class="side-note"><strong>${esc(label(key,game.policies[key]))} → ${esc(label(key,option))}</strong>Same starting conditions and choices, different rule. Your actual run stays unchanged.</p><div class="table-wrap section-gap"><table><thead><tr><th>Measure</th><th class="num">Your run</th><th class="num">Replay</th><th class="num">Change</th></tr></thead><tbody>${rows.map(([name,field,digits])=>{const diff=after[field]-before[field];return `<tr><th scope="row">${name}</th><td class="num">${fmt(before[field],digits)}</td><td class="num">${fmt(after[field],digits)}</td><td class="num">${diff>0?'+':''}${fmt(diff,digits)}</td></tr>`;}).join('')}</tbody></table></div><p class="hint">Only the selected policy changes. People do not adapt their choices in this replay, and earlier training stays learned. A zero difference can be a meaningful result. Long-term effects and real-world causal claims require other evidence.</p>`;
}
function share() {
  if(!game) return;
  const link=snapshotURL();
  openDialog('Keep this point in your week.', `<p>This link contains your policies, completed orders, and choices. Open it on another device to continue from the last completed action. Unsubmitted form selections and comparison tables are not included.</p><label class="sr-only" for="share-text">Your run link</label><textarea id="share-text" class="share-field" readonly spellcheck="false">${esc(link)}</textarea><button class="button primary" data-dialog="copy-link">Copy run link ↗</button><p class="hint" style="margin-top:16px">Keep the link in Canvas, a message to yourself, or a synced note. It is a snapshot, not an account that synchronizes later changes. Copy a new link after continuing. Anyone with the link can see the run; it contains no name or written reflection.</p>`);
}
async function copyText(text, success) {
  try { await navigator.clipboard.writeText(text); toast(success); }
  catch { openDialog('Copy your text', `<p>Select and copy the text below.</p><textarea class="share-field" id="copy-fallback" readonly>${esc(text)}</textarea>`); $('#copy-fallback').focus(); $('#copy-fallback').select(); }
}
function study() {
  openDialog('Study the work before setting a rule.', `<p>Compare two methods on the same three practice orders. These are fictional worked examples, not a test of your clicking speed. The allowance includes recovery and normal variation.</p><div class="trial-row">${TIME_STUDY.map((t,i)=>`<button class="button secondary small" data-trial="${i}">Test ${esc(t.label)}</button>`).join('')}</div><div id="study-results" class="time-study"></div><p class="hint">The fastest single observation is not a defensible standard. A repeatable method, training, and a realistic allowance matter. Selecting a method is management's decision; workers then carry it out.</p>`);
  renderStudy();
}
function renderStudy() {
  $('#study-results').innerHTML=studied.size?`<div class="table-wrap"><table><thead><tr><th>Method</th><th>Trial minutes</th><th class="num">Average</th><th class="num">Allowance</th><th class="num">Standard</th></tr></thead><tbody>${[...studied].sort().map(i=>{const t=TIME_STUDY[i];return `<tr><th scope="row">${esc(t.label)}</th><td>${t.trials.map(n=>fmt(n)).join(' / ')}</td><td class="num">${fmt(t.mean)}</td><td class="num">${fmt(t.allowance)}</td><td class="num">${fmt(t.standard)}</td></tr>`;}).join('')}</tbody></table></div><div class="note-box section-gap">A lower time per order leaves more capacity, but setting up the method and training people also take time. Check the shift report for both costs.</div><div class="hero-actions">${game?.phase==='plan'?'<button class="button primary small" data-dialog="adopt-study">Use the studied method</button>':''}<button class="button secondary small" data-dialog="close">Back to the plan</button></div>`:'<div class="note-box">Choose a method above to reveal its trial record. Then compare the full set of observations.</div>';
}
function help() {
  openDialog('One week. Three things to do.', `<div class="stack"><section><span class="eyebrow red">01 / BEFORE EACH SHIFT</span><h3>Make a plan</h3><p>Choose the operating rules. New choices open over the week: method and training, specialization, authority and written rules, then pay. Read the skill ratings when assigning specialists.</p></section><section><span class="eyebrow red">02 / ON THE FLOOR</span><h3>Process six orders</h3><p>Match the bin on the ticket. Use a rigid box for fragile goods; standard goods can use either package. Decide whether to inspect, take a recovery break, or rush. Inspection can catch and rework problems before they leave.</p><p>After three orders, respond to an exception. Your decision changes the operation. There is no real-time countdown; each action has a simulated time cost.</p></section><section><span class="eyebrow red">03 / AFTER THE SHIFT</span><h3>Use the evidence</h3><p>Compare good output, lateness, fatigue, trust, and pay. Try one alternative policy on the same work. In pairs, switch who plans and who operates after each shift.</p></section></div><div class="note-box section-gap">Reading, discussion, and opening a dialog never use shift time. Keyboard and touch work throughout. Keep a run link if you want to continue on another device.</div>`);
}
function model() {
  openDialog('A model you can question.', `<p>The engine uses fixed rules so the same orders and choices produce the same outcome. Good output, simulated time, fatigue, trust, and pay are separate measures.</p><h3>What the rules represent</h3><ul class="source-list"><li>A studied method reduces routine work time after setup. Training takes time up front.</li><li>Specialization changes task costs according to the assigned workers' skills and coordination costs.</li><li>Inspections use time but catch and rework wrong picks, inappropriate packaging, and damage.</li><li>Rushing saves task time and increases fatigue. Breaks use time and support recovery.</li><li>Formal rules and the communication route affect how exceptions get resolved.</li><li>A stable piece rate follows an announced rule. A moving target responds to prior performance and can change cooperation.</li></ul><h3>What it cannot establish</h3><p>These coefficients are teaching assumptions, not research estimates. Real employees differ, learn, negotiate, and resist in ways this model cannot capture. Its trust and fatigue scales are not validated psychological measures.</p><p class="section-gap"><a href="https://github.com/chengyu-ucsb/The-Rate-Race/blob/main/engine.js">Read the model formulas on GitHub ↗</a></p>`);
}
function concepts() {
  openDialog('Three approaches. Different questions.', conceptCards()+`<h3>Follow the communication</h3><p>Classical organizations emphasize formal, task-focused communication, often through written instructions and downward authority. Upward reports and authorized lateral exchanges can still matter. Track who knows something, who can decide, and what happens while a message travels.</p><h3>What “digital Taylorism” adds</h3><p>Continuous measurement and moving targets extend questions about managerial control into digital systems. They do not define everything Taylor, Fayol, or Weber proposed.</p><p class="hint">Source: Miller, <em>Organizational Communication: Approaches and Processes</em>, 7th ed. (2015), Chapter 2, especially pp. 19–28 and 30–32.</p>`);
}
function guarded(action) {
  try { action(); } catch(error) { console.error('Game action failed:', error); toast('That action could not be completed. Your current run is intact.'); }
}
document.addEventListener('click', event=>{
  if(event.target.closest('.skip-link')) {event.preventDefault();main.focus();return;}
  const global=event.target.closest('[data-global]');
  if(global) { ({help,concepts,share,model})[global.dataset.global]?.(); return; }
  const bin=event.target.closest('[data-bin]');
  if(bin) { input.bin=bin.dataset.bin; document.querySelectorAll('[data-bin]').forEach(b=>b.setAttribute('aria-pressed',String(b===bin))); $('#dispatch-button').disabled=false; $('#dispatch-hint').textContent=`Bin ${input.bin} selected. Check packaging and inspection before dispatch.`; return; }
  const ev=event.target.closest('[data-event]');
  if(ev) { guarded(()=>{updateGame(chooseEvent(game,ev.dataset.event));announce('Response recorded. Continue the shift.');}); return; }
  const trial=event.target.closest('[data-trial]');
  if(trial) { studied.add(Number(trial.dataset.trial));renderStudy();announce('Trial results added to the comparison table.');return; }
  const db=event.target.closest('[data-dialog]');
  if(db) {
    if(db.dataset.dialog==='copy-link') copyText($('#share-text').value,'Run link copied. Keep it somewhere you can access later.');
    if(db.dataset.dialog==='close') closeDialog();
    if(db.dataset.dialog==='adopt-study') guarded(()=>{game=configure(game,{...game.policies,method:'study'},game.assignment);persist();closeDialog();render();toast('Studied method selected. Decide how to train the crew.');});
    if(db.dataset.dialog==='restart') {closeDialog();begin();}
    return;
  }
  const action=event.target.closest('[data-action]'); if(!action) return;
  guarded(()=>{
    switch(action.dataset.action) {
      case 'begin': begin();break;
      case 'start-shift': updateGame(startShift(game));break;
      case 'next': updateGame(nextShift(game));break;
      case 'study': study();break;
      case 'compare': { const key=$('#compare-policy').value;const option=$('#compare-option').value;const result=comparePolicies(game,{[key]:option});comparison={before:result.actual,after:result.alternative,key,option};renderComparison();announce('Comparison ready. Your run is unchanged.');break; }
      case 'copy-report': copyText(reportText(game)+(comparison?`\n\nCONTROLLED REPLAY\nChanged ${comparison.key} to ${comparison.option}. Same choices; model projection only.\nOriginal: ${comparison.before.shipped} good orders; ${comparison.before.minutes} minutes.\nAlternative: ${comparison.after.shipped} good orders; ${comparison.after.minutes} minutes.`:''),'Result record copied. Paste it into your course submission.');break;
      case 'print': window.print();break;
      case 'restart': openDialog('Start another week?', '<p>Keep your current run link if you want to revisit these results. A new week uses the same scenario, so you can try a different design.</p><div class="hero-actions"><button class="button primary" data-dialog="restart">Start a fresh week</button><button class="button secondary" data-global="share">Keep my current link</button></div>');break;
    }
  });
});
document.addEventListener('change',event=>{
  const target=event.target;
  if(target.dataset.policy) guarded(()=>{game=configure(game,{...game.policies,[target.dataset.policy]:target.value},game.assignment);persist();render({scroll:false,focus:'#'+target.id});});
  else if(target.dataset.worker) guarded(()=>{
    const assignment={...game.assignment};const old=assignment[target.dataset.worker];const other=Object.keys(assignment).find(id=>id!==target.dataset.worker&&assignment[id]===target.value);assignment[target.dataset.worker]=target.value;if(other)assignment[other]=old;
    game=configure(game,game.policies,assignment);persist();render({scroll:false,focus:'#'+target.id});
  });
  else if(target.id==='compare-policy') fillCompareOptions();
  else if(target.closest('#order-form')) collectWorkInput();
});
document.addEventListener('submit',event=>{
  if(event.target.id!=='order-form') return;event.preventDefault();
  if(!input.bin||game.phase!=='work'||!getOrder(game))return;
  guarded(()=>{collectWorkInput();const next=doWork(game,{...input});updateGame(next);const s=game.shift;announce(`Order processed. ${s.onTime} good orders on time. ${fmt(s.minutes)} minutes used.${s.event&&!s.event.resolved?' An exception needs your response.':''}`);});
});
document.addEventListener('keydown',event=>{
  if(!event.target.matches('[data-bin]'))return;
  const dirs={ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3};if(!(event.key in dirs))return;
  event.preventDefault();const list=[...document.querySelectorAll('[data-bin]')];const index=list.indexOf(event.target);list[(index+dirs[event.key]+list.length)%list.length].focus();
});
window.addEventListener('hashchange',()=>{if(location.hash && !location.hash.startsWith('#run='))return;game=null;invalidLink=false;comparison=null;input=blankInput();loadLink();render();});
window.addEventListener('beforeprint',()=>{document.querySelectorAll('.log-details').forEach(d=>{d.dataset.wasOpen=String(d.open);d.open=true;});});
window.addEventListener('afterprint',()=>{document.querySelectorAll('.log-details').forEach(d=>{d.open=d.dataset.wasOpen==='true';});});
loadLink();render({scroll:false});
