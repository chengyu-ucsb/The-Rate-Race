import { WORKERS, POLICY_DEFS, DAYS, BINS, TIME_STUDY, getShelf, createGame, configure, startShift, getOrder, doWork, chooseEvent, nextShift, reportText, comparePolicies, serializeState, deserializeState } from './engine.js?v=3';
import { productIcon, crewPortrait, warehouseScene, packagePreview, uiIcon, chapterArt } from './visuals.js?v=4';

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

function blankInput() { return {bin: null, quantity: 1, pack: 'mailer', inspect: false, pace: 'steady', rest: false}; }
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
  return `<div class="floor-art"><div class="floor-top"><span class="scene-brand">${uiIcon('box')} Swiftline</span><span class="scene-live"><i class="live-dot"></i> The floor is yours</span></div><div class="hero-warehouse">${warehouseScene({completed:2,total:6})}</div><div class="scene-bottom"><div class="avatar-stack">${WORKERS.map(w=>crewPortrait(w.id,40)).join('')}</div><div><strong>Three people. Different strengths.</strong><span>What kind of operation will you build?</span></div></div><div class="scene-stamp">5 shifts<br><strong>One system.</strong></div></div>`;
}

function intro() {
  const themes=['Find a method','Build the line','Who can decide?','Set the rate','Break the routine'];
  return `${invalidLink ? '<div class="note-box red" role="alert">That run link is incomplete or uses an unsupported version. Your link has not been overwritten. You can start a new week below.</div>' : ''}
  <section class="hero"><div class="hero-copy"><span class="pill">${uiIcon('spark',16)} Classical management, in play</span><h1>The Rate<br><span>Race.</span></h1><p class="intro">You set the rules.<br>Then you work inside them.</p><p class="subtle">A busy warehouse. A crew with ideas. Five shifts to discover what your decisions really do.</p><div class="hero-actions"><button class="button primary" data-action="begin">Start your week ${uiIcon('arrowRight')}</button><button class="button secondary" data-global="help">How it works</button></div><div class="hero-meta"><span>${uiIcon('clock',16)} Play at your own pace</span><span>${uiIcon('people',16)} Solo or in pairs</span></div></div>${floorArt()}</section>
  <section class="week-preview" aria-labelledby="week-preview-title"><div class="section-heading"><div><span class="eyebrow">Your week on the floor</span><h2 id="week-preview-title">A new challenge every shift.</h2></div><p>Keep what works. Rethink what doesn’t.</p></div><div class="chapter-cards">${themes.map((title,i)=>`<article class="chapter-card"><span class="chapter-day">${dayNames[i]}</span>${chapterArt(i)}<h3>${title}</h3></article>`).join('')}</div></section>
  <section class="three-steps" aria-label="How the game works">${[['settings','Plan the shift','Choose the method, roles, and rules.'],['box','Work the line','Match stock, pack orders, and handle surprises.'],['chart','Read the results','Try another policy. Explain what changed.']].map(([icon,title,text])=>`<div class="step-card"><span class="step-icon">${uiIcon(icon,24)}</span><div><h3>${title}</h3><p>${text}</p></div></div>`).join('')}</section><p class="bottom-note">Built for COMM 3008. Fictional people, events, and numbers. No countdown and no single winning score. <a class="teacher-link" href="https://github.com/chengyu-ucsb/The-Rate-Race/blob/main/docs/instructor-guide.md">Instructor guide ↗</a></p>`;
}

function progress() {
  const phase=game.phase==='plan'?0:game.phase==='work'?1:2;
  return `<div class="progress-row"><ol class="week-progress" aria-label="Week progress">${dayNames.map((d,i)=>`<li class="${i<game.day||game.phase==='debrief'?'done':i===game.day?'current':''}" ${i===game.day&&game.phase!=='debrief'?'aria-current="step"':''}><span>${d.slice(0,3)}</span>${i<game.day||game.phase==='debrief'?uiIcon('check',14):''}</li>`).join('')}</ol><ol class="phase-progress" aria-label="Shift stages">${['Plan','Work','Review'].map((name,i)=>`<li class="${i===phase?'current':i<phase?'done':''}" ${i===phase?'aria-current="step"':''}><span>${i<phase?uiIcon('check',12):i+1}</span>${name}</li>`).join('')}</ol></div>`;
}

function heading(kicker, title, description, tag = '') {
  return `<div class="page-heading"><div><span class="eyebrow red">${esc(kicker)}</span><h1 tabindex="-1" id="page-title">${esc(title)}</h1><p>${esc(description)}</p></div>${tag?`<span class="phase-tag">${esc(tag)}</span>`:''}</div>`;
}
function policyFields(policies = game.policies, include = () => true) {
  return POLICY_DEFS.filter(p=>p.unlockDay<=game.day&&include(p)).map(p=>`<fieldset class="policy-group"><legend>${esc(p.label)}<span class="theory-tag">${esc(p.theory)}</span></legend><div class="policy-options">${p.options.map(o=>`<label class="policy-option"><span class="option-title"><input type="radio" name="policy-${p.id}" id="policy-${p.id}-${o.id}" value="${o.id}" data-policy="${p.id}" ${policies[p.id]===o.id?'checked':''}><strong>${esc(o.label)}</strong></span><small>${esc(o.description)}</small></label>`).join('')}</div></fieldset>`).join('');
}

function crew() {
  return `<section class="panel"><div class="panel-head"><h2>Assign the crew</h2><span class="eyebrow">Skill / 5</span></div><p class="hint">Assign one person to each station. Changing a station swaps its current worker. In whole-order work, everyone completes all three tasks.</p>${WORKERS.map((w,i)=>`<div class="person"><span class="crew-avatar">${crewPortrait(w.id,44)}</span><div><strong>${esc(w.name)}</strong><div class="skills">${Object.entries(w.skills).map(([k,v])=>`<span>${stationNames[k]} <b>${v}</b></span>`).join('')}</div></div><label class="sr-only" for="assignment-${w.id}">${esc(w.name)} station</label><select data-worker="${w.id}" id="assignment-${w.id}" aria-label="${esc(w.name)} station">${Object.entries(stationNames).map(([id,n])=>`<option value="${id}" ${game.assignment[w.id]===id?'selected':''}>${n}</option>`).join('')}</select></div>`).join('')}</section>`;
}
function smallFloor() {
  return `<div class="mini-floor">${Object.entries(stationNames).map(([k,v],i)=>{const worker=WORKERS.find(w=>game.assignment[w.id]===k);return `<div class="mini-station"><span class="eyebrow">0${i+1} / ${v}</span><span class="station-portrait">${crewPortrait(worker?.id,36)}</span><strong>${game.policies.division==='whole'?'Whole crew':esc(worker?.name)}</strong><span>${game.policies.division==='whole'?'Whole orders':`Skill ${worker?.skills[k]}/5`}</span></div>`;}).join('')}</div><p class="operating-note">${game.policies.division==='whole'?'Each person owns a complete order. You switch among workers as orders arrive.':'Specialists hand off work. Task time depends on the assigned skills; covering an absence adds handoff delays.'}</p>`;
}
function wellbeing() {
  return `<section class="panel dark"><span class="eyebrow">Crew status</span><div class="status-grid"><div><strong>${fmt(game.metrics.fatigue,0)}<small>/ 100 fatigue</small></strong></div><div><strong>${fmt(game.metrics.trust,0)}<small>/ 100 trust</small></strong></div><div><strong>${fmt(game.metrics.wages)}<small>pay credits so far</small></strong></div><div><strong>${game.metrics.shipped}<small>good orders so far</small></strong></div></div><p class="hint">Fatigue can slow later work. Trust affects cooperation. These are simplified model assumptions.</p></section>`;
}
function plan() {
  const d=DAYS[game.day];
  const fresh=POLICY_DEFS.filter(p=>p.unlockDay===game.day);
  const previous=POLICY_DEFS.filter(p=>p.unlockDay<game.day);
  const target=game.policies.incentive==='ratchet'?Math.max(d.target,game.capabilities.ratchetTarget):d.target;
  return progress()+`<section class="chapter-heading"><div><span class="eyebrow red">${dayNames[game.day]} · Plan the shift</span><h1 id="page-title" tabindex="-1">${esc(d.title)}</h1><p>${esc(d.brief)}</p></div><div class="chapter-visual">${chapterArt(game.day)}</div></section>
  <div class="plan-layout"><div class="stack"><section class="panel decisions-panel"><div class="panel-head"><div><span class="eyebrow">${fresh.length?'New decisions':'Your operating system'}</span><h2>${fresh.length?'Decide for today':'Review your plan'}</h2></div>${game.day===0?`<button class="button secondary small" data-action="study">${uiIcon('clock',18)} Open time study</button>`:''}</div>${fresh.length?policyFields(game.policies,p=>p.unlockDay===game.day):'<p class="hint">The stock is changing. Review the rules you have built and decide whether they still fit.</p>'}${previous.length?`<details class="settings-details" id="previous-settings-${game.day}" ${!fresh.length?'open':''}><summary><span class="settings-summary-label"><span>${uiIcon('settings',20)} Your current plan</span><small class="settings-snapshot">${previous.map(p=>esc(label(p.id,game.policies[p.id]))).join(' · ')}</small></span><span class="details-action">Edit settings</span></summary><div class="details-body">${policyFields(game.policies,p=>p.unlockDay<game.day)}<button class="button text small" data-action="study">Revisit the time study ↗</button></div></details>`:''}</section>
  ${game.day>=1?`<details class="panel crew-details" id="crew-settings-${game.day}" ${game.policies.division==='specialist'?'open':''}><summary><span>${uiIcon('people',22)} Crew & assignments</span><span class="details-action">${game.policies.division==='specialist'?'Assign specialists':'View skills'}</span></summary><div class="details-body">${crew()}</div></details>`:''}
  <div class="action-bar"><p class="hint">Reading and discussion use no shift time. Your choices take effect when you start.</p><button class="button primary" data-action="start-shift">Start shift ${uiIcon('arrowRight')}</button></div></div>
  <aside class="stack plan-aside"><section class="goal-card"><span class="eyebrow">Today’s target</span><div class="goal-number">${target}<span> / 6</span></div><h3>good orders, on time</h3><div class="goal-time">${uiIcon('clock',20)} ${d.budget} simulated minutes</div><p>Setup, rework, and interruptions all use time. Reading never does.</p></section><section class="panel crew-intro"><span class="eyebrow">Crew strengths</span><div class="crew-row">${WORKERS.map(w=>`<div>${crewPortrait(w.id,62)}<strong>${esc(w.name)}</strong><span>${w.id==='nia'?'Picking':w.id==='mateo'?'Packing':'Quality'}</span></div>`).join('')}</div><p class="hint">Different strengths. One shared target.</p></section>${wellbeing()}</aside></div>`;
}

function strip() {
  const s=game.shift;
  return `<section class="shift-status" aria-label="Current shift metrics"><div class="shift-name"><span class="eyebrow">${dayNames[game.day]} · ${esc(DAYS[game.day].title)}</span><h1 id="page-title" tabindex="-1">${s.event&&!s.event.resolved?'A decision on the floor':'On the dispatch floor'}</h1>${taskProgress()}</div><div class="status-item ${s.minutes>s.budget?'over-budget':''}"><span>${uiIcon('clock',18)} Simulated time</span><strong>${fmt(s.minutes)} <small>/ ${s.budget} min</small></strong><div class="status-track"><i style="width:${Math.min(100,s.minutes/s.budget*100)}%"></i></div></div><div class="status-item"><span>${uiIcon('box',18)} On-time orders</span><strong>${s.onTime} <small>/ ${s.target} target</small></strong><div class="status-track"><i style="width:${Math.min(100,s.onTime/s.target*100)}%"></i></div></div><div class="status-item"><span>${uiIcon('people',18)} Crew fatigue</span><strong>${fmt(game.metrics.fatigue,0)} <small>/ 100</small></strong><span class="status-note">No real-time countdown</span></div></section>`;
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
  return `<section class="message-card"><span class="eyebrow">Exception report</span><h2 id="event-title" tabindex="-1">${esc(ev.title)}</h2><p class="body">${esc(ev.body)}</p><div class="event-options">${ev.options.map(o=>`<button class="event-option" data-event="${o.id}"><strong>${esc(o.label)}<span aria-hidden="true">↗</span></strong><small>${esc(o.description)}</small></button>`).join('')}</div></section>`;
}
function dispatchFeedback() {
  const a=game.shift.actions.at(-1);if(!a)return '';
  const title=!a.good?'A problem reached dispatch.':a.intercepted?'Caught, fixed, and sent.':a.late?'Correct order. Missed deadline.':'Right first time.';
  const detail=a.reasons.length?a.reasons.join(' '):'No rework was needed.';
  return `<div class="dispatch-feedback ${!a.good?'issue':a.intercepted?'rework':'clear'}"><span class="feedback-mark">${uiIcon(!a.good?'info':a.intercepted?'settings':'check',20)}</span><div><strong>${title}</strong><span class="feedback-outcome">${a.good?(a.late?'Good order · late':'Good order · on time'):'Defect shipped'}</span><details class="receipt-details"><summary>What happened</summary><p>${esc(detail)}</p></details></div><span class="feedback-time">+${fmt(a.minutes)}<small>sim min</small></span></div>`;
}

function taskProgress() {
  const s=game.shift;
  return `<div class="order-progress"><span>${s.index} of 6 dispatched</span><div class="order-dots" aria-hidden="true">${Array.from({length:6},(_,i)=>`<i class="${i<s.index?'sent':i===s.index?'next':''}">${i<s.index?uiIcon('check',11):''}</i>`).join('')}</div></div>`;
}

function routeMap() {
  const direct=game.policies.authority==='gangplank';
  return `<div class="route-map"><span class="route-node">Crew</span><span class="route-arrow" aria-hidden="true">${direct?'↔':'↑'}</span><span class="route-node ${direct?'authorized':''}">${direct?'Other department':'Supervisor'}</span><span class="route-arrow" aria-hidden="true">${direct?'↗':'↓'}</span><span class="route-node">${direct?'Report back':'Other department'}</span></div><p class="hint">${direct?'Direct contact is authorized. Supervisors receive the result.':'Information travels through the chain before the departments can act.'}</p>`;
}
function work() {
  const s=game.shift, order=getOrder(game), ev=s.event&&!s.event.resolved;
  const shelf=order?getShelf(game):[];
  const sender=['nia','mateo','jules','nia','jules'][game.day];
  return progress()+strip()+`${ev?`<div class="exception-layout"><aside class="exception-person"><span class="eyebrow">Message from the floor</span>${crewPortrait(sender,112)}<h3>${esc(WORKERS.find(w=>w.id===sender).name)}</h3><p>${['Picking','Packing','Quality','Crew representative','Quality'][game.day]}</p><div class="exception-scene">${chapterArt(game.day)}</div>${game.day===2?routeMap():''}</aside>${eventView()}</div>`:`${dispatchFeedback()}<form class="workbench" id="order-form"><div class="workbench-top"><span>${uiIcon('box',19)} Order ${s.index+1} of 6</span><span class="work-live"><i class="live-dot"></i> Your move</span></div>
  <div class="order-ticket"><div class="ticket-product">${productIcon(order.icon??'gift',72)}<div><span class="eyebrow">Customer order · ${esc(order.id)}</span><h2>${esc(order.item)}</h2><div class="ticket-meta"><span class="ticket-chip ${order.fragile?'fragile':''}">${order.fragile?'Fragile':'Standard goods'}</span><span class="ticket-chip ${order.damaged?'damage':''}">${esc(order.condition)}</span></div></div></div><div class="ticket-match"><div class="ticket-target"><span>${game.version>=3?'Match this SKU':'Location'}</span><strong>${esc(game.version>=3?order.sku:order.bin)}</strong></div><div class="ticket-quantity"><span>Quantity</span><strong>${order.quantity??1}<small>${(order.quantity??1)===1?'unit':'units'}</small></strong></div></div></div>
  <div class="work-grid"><section class="shelf-area" aria-labelledby="bin-label"><div class="task-step-head"><div><span class="step-label">Pick</span><h3 id="bin-label">${game.version>=3?'Match the stock code':'Find the storage bin'}</h3></div>${uiIcon('scan',25)}</div><div class="bin-grid shelf-grid" role="group" aria-label="Warehouse inventory">${shelf.map(item=>`<button type="button" class="bin-button stock-bin" data-bin="${item.bin}" aria-label="Bin ${item.bin}, ${esc(item.item)}, SKU ${esc(item.sku)}" aria-pressed="${input.bin===item.bin}"><span class="stock-location">${item.bin}</span><span class="stock-picture">${productIcon(item.icon,60)}</span><strong>${esc(item.sku)}</strong><small>${esc(item.item)}</small><span class="selection-mark" aria-hidden="true">${uiIcon('check',14)}</span></button>`).join('')}</div><p class="hint" id="bin-hint">${game.version>=3?'Similar items have different codes. Match every character.':'Match the location on the order ticket.'} <span class="keyboard-hint">Arrow keys move between bins.</span></p></section>
  <section class="packing-bay" aria-labelledby="packing-title"><div class="task-step-head"><div><span class="step-label">Pack</span><h3 id="packing-title">Build your parcel</h3><p class="packing-reference">Order: ${esc(game.version>=3?order.sku:order.bin)} · ${order.quantity??1} ${(order.quantity??1)===1?'unit':'units'} · ${order.fragile?'Fragile':'Nonfragile'}</p></div>${uiIcon('box',25)}</div><div class="parcel-display"><div id="pack-preview" class="pack-preview">${packagePreview({kind:input.pack,quantity:input.quantity,fragile:order.fragile,packed:Boolean(input.bin)})}</div><div><span class="eyebrow">Your selection</span><strong id="picked-stock">Choose an item</strong><span id="parcel-caption">${input.quantity} ${input.quantity===1?'unit':'units'} · ${input.pack==='box'?'Rigid box':'Mailer'}</span></div></div>
  <div class="quantity-row"><span class="control-label">Quantity</span><div class="quantity-buttons" role="group" aria-label="Units in parcel">${[1,2,3].map(n=>`<button type="button" data-quantity="${n}" aria-label="${n} ${n===1?'unit':'units'}" aria-pressed="${input.quantity===n}" ${game.version<3&&n!==1?'disabled':''}>${n}</button>`).join('')}</div></div><fieldset class="policy-group packaging-group"><legend class="control-label">Packaging</legend><div class="pack-options"><label class="pack-option"><input type="radio" name="pack" value="mailer" ${input.pack==='mailer'?'checked':''}><span>Mailer<small>1–2 nonfragile units</small></span></label><label class="pack-option"><input type="radio" name="pack" value="box" ${input.pack==='box'?'checked':''}><span>Rigid box<small>Fragile or 3 units</small></span></label></div></fieldset>
  <div class="check-controls"><label class="check-option"><input type="checkbox" name="inspect" ${input.inspect?'checked':''}><span>Inspect and fix<small>Catch mistakes. Rework uses time.</small></span></label><label class="check-option"><input type="checkbox" name="rest" ${input.rest?'checked':''}><span>Take a recovery break<small>3 minutes to reduce fatigue.</small></span></label></div><div class="pace-row"><label class="control-label" for="pace">Work pace</label><select id="pace" name="pace"><option value="steady" ${input.pace==='steady'?'selected':''}>Steady pace</option><option value="rush" ${input.pace==='rush'?'selected':''}>Rush · faster, more fatigue</option></select></div><div class="dispatch-actions"><button class="button primary dispatch-button" id="dispatch-button" type="submit" ${!input.bin?'disabled':''}>Dispatch order ${uiIcon('arrowRight')}</button><p class="hint" id="dispatch-hint">Choose an item to prepare this order.</p></div></section></div></form>`}
  ${s.event?.resolved?`<div class="event-recap">${uiIcon('info',18)}<p><strong>Your earlier decision:</strong> ${esc(s.event.outcome)}</p></div>`:''}<details class="shift-notes" id="shift-notes-${game.day}"><summary><span>${uiIcon('settings',20)} Shift plan & order log</span><span class="details-action">View details</span></summary><div class="notes-grid">${currentRules()}${ledger()}${wellbeing()}</div></details>`;
}

function statsCards(r) {
  return `<div class="report-grid"><div class="report-stat ${r.metTarget?'good':'accent'}"><span>${uiIcon('box',20)} On-time target</span><strong>${r.onTime}<small> / ${r.target}</small></strong><p>good orders by the deadline</p></div><div class="report-stat"><span>${uiIcon('clock',20)} Shift time</span><strong>${fmt(r.minutes)}<small> min</small></strong><p>${r.budget}-minute budget</p></div><div class="report-stat"><span>${uiIcon('settings',20)} Quality</span><strong>${r.defects}<small> defects</small></strong><p>${r.reworked} orders reworked</p></div><div class="report-stat"><span>${uiIcon('people',20)} Crew pay</span><strong>${fmt(r.wages)}</strong><p>credits earned this shift</p></div></div>`;
}

function report() {
  const r=game.shift.result;
  return progress()+heading(`${dayNames[game.day]} · Shift report`,r.metTarget?'The batch made its target.':'There’s more to the result.',`${r.shipped} good orders out of ${r.raw}. ${r.late} arrived late. What did your rules make possible?`)+statsCards(r)+`
  <div class="report-layout section-gap"><section class="panel outcome-panel"><div class="panel-head"><h2>Six orders. Here’s how they landed.</h2></div><div class="order-outcomes">${r.actions.map((a,i)=>`<div class="order-outcome ${!a.good?'defect':a.late?'late':'ontime'}"><span>Order ${i+1}</span>${uiIcon(!a.good?'info':a.late?'clock':'check',24)}<strong>${!a.good?'Defect':a.late?'Late':'On time'}</strong><small>${a.intercepted?'Reworked':'No rework'}</small></div>`).join('')}</div><p class="hint">A good order can still be late. A corrected order still uses time.</p><details class="report-reasons" id="report-reasons-${game.day}"><summary>What shaped this result</summary><ul class="reasons">${r.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul><p class="side-note"><strong>Rate: ${fmt(r.rate)} good orders per simulated hour</strong>Includes setup, rework, and interruptions.</p></details></section><aside class="reflection-card"><span class="eyebrow">Pause & reflect</span>${chapterArt(game.day)}<h3>One question to carry.</h3><p>${esc(dailyQuestion(game.day))}</p></aside></div>
  <div class="section-gap">${comparisonPanel(false)}</div><details class="shift-notes" id="report-crew-${game.day}"><summary><span>${uiIcon('people',20)} Crew status & week totals</span><span class="details-action">View details</span></summary><div class="details-body">${wellbeing()}</div></details><div class="action-bar"><p class="hint">${game.day<4?'Fatigue and trust carry forward. Take what you learned into the next shift.':'Bring the evidence from all five shifts into your reflection.'}</p><button class="button primary" data-action="next">${game.day<4?'Plan '+dayNames[game.day+1]:'Open your debrief'} ${uiIcon('arrowRight')}</button></div>`;
}

function dailyQuestion(day) {
  return ['Who developed the method, and who had to follow it? Did training change the cost of standardization?','Did the strongest specialist assignment help the whole operation, or just one station?','Did authority and written rules help someone resolve the exception? What did that coordination cost?','Why would someone hold back effort when a target can move? How does a stable rate change that calculation?','Which part of your design handled the unfamiliar work well? What would you change without losing its advantages?'][day];
}
function comparisonPanel(full = true) {
  const defs=POLICY_DEFS.filter(p=>p.unlockDay<=game.day);
  return `<section class="panel"><div class="panel-head"><h2>Try another policy</h2><span class="eyebrow">CONTROLLED REPLAY</span></div><p class="hint">Same orders and choices. One policy changes. Replay ${dayNames[game.day]} with the same starting fatigue and trust. ${full?'This is a model projection, not evidence about real workplaces.':''}</p><div class="comparison-controls"><label for="compare-policy">Policy to change<select id="compare-policy">${defs.map(p=>`<option value="${p.id}">${esc(p.label)}</option>`).join('')}</select></label><label for="compare-option">Alternative rule<select id="compare-option"></select></label><button class="button secondary small" data-action="compare">Compare results ↗</button></div><div id="comparison-output" role="status" aria-live="polite"></div></section>`;
}
function conceptCards() {
  return `<div class="concept-grid"><article class="concept-card"><span class="eyebrow red">THE METHOD</span><h3>Frederick Taylor</h3><p>Study the work, establish a method, select and train workers, and divide planning from execution. A stable, announced piece rate differs from raising the target after someone performs well.</p><cite>Miller (2015), pp. 26–28.</cite></article><article class="concept-card"><span class="eyebrow red">THE STRUCTURE</span><h3>Henri Fayol</h3><p>Divide work and coordinate responsibility. The scalar chain clarifies authority; an authorized lateral “gangplank” can shorten a detour. Initiative, equity, and team spirit also belong to his approach.</p><cite>Miller (2015), pp. 19–22.</cite></article><article class="concept-card"><span class="eyebrow red">THE AUTHORITY</span><h3>Max Weber</h3><p>Authority attaches to an office and its rules. Written standards and relevant qualifications support consistency and limit favoritism. An ideal type is an analytical model, not a claim of moral perfection.</p><cite>Miller (2015), pp. 24–25.</cite></article></div>`;
}
function weekVisual() {
  return `<section class="panel section-gap"><div class="panel-head"><h2>Orders by shift</h2><span class="eyebrow">SIX ORDERS PER SHIFT</span></div><div class="outcome-chart" role="img" aria-label="Each shift has six orders, separated into good and on time, good but late, and defective. Exact values follow in the table.">${game.history.map(r=>`<div class="outcome-row"><strong>${dayNames[r.day].slice(0,3)}</strong><div class="outcome-bar">${[['ontime',r.onTime],['late',r.late],['defect',r.defects]].filter(([,n])=>n>0).map(([type,n])=>`<span class="outcome-segment ${type}" style="width:${n/6*100}%">${n}</span>`).join('')}</div><span class="outcome-total">${fmt(r.minutes)} min</span></div>`).join('')}</div><div class="chart-legend"><span><i></i>Good + on time</span><span><i class="late"></i>Good + late</span><span><i class="defect"></i>Defect shipped</span></div></section>`;
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
    ${weekVisual()}<section class="panel section-gap"><div class="panel-head"><h2>Your week in evidence</h2><span class="eyebrow">SCENARIO ${game.seed}</span></div>${historyTable()}<p class="hint">Quality-correct orders can still be late. Pay is a fictional teaching unit. Fatigue and trust use 0–100 scales; lower fatigue and higher trust are favorable.</p></section>
    <div class="section-gap">${comparisonPanel()}</div><section class="section-gap" aria-label="Connect the experience to theory">${conceptCards()}</section>
    <section class="panel section-gap"><div class="panel-head"><h2>Explain your decisions</h2><span class="eyebrow">REFLECT / TRANSFER</span></div><ol class="reflection-list"><li><strong>Explain one result.</strong>Choose a decision, name the relevant theorist, and cite two numbers or events from your week. Explain how the decision could have produced the result.</li><li><strong>Follow a message.</strong>Who noticed an issue? Who could authorize a response? Did the message travel up, down, or across the organization? What did that route change?</li><li><strong>Revise the design.</strong>Use the controlled replay to propose one change. Name a benefit, a cost, and something this simplified model cannot establish.</li></ol><div class="note-box">Write your reflection in your course's usual submission space. This game does not collect names, send grades, or submit work. Copy the results below as evidence.</div><div class="hero-actions no-print"><button class="button primary" data-action="copy-report">Copy my results ↗</button><button class="button secondary" data-action="print">Print result sheet</button><button class="button secondary" data-global="share">Keep a run link</button></div></section>
    <section class="panel section-gap"><div class="panel-head"><h2>Open the decision record</h2><span class="eyebrow">TRACE THE OUTCOME</span></div>${evidenceLog()}</section>
    <section class="panel section-gap"><div class="panel-head"><h2>Where the model comes from</h2><button class="button text small no-print" data-global="model">How the model works ↗</button></div><p class="side-note">The theories inform the questions and mechanics. The numbers are design assumptions, not estimates from research. A successful strategy here is a claim about this model, not proof about real people.</p><ul class="source-list"><li>Miller, K. (2015). <em>Organizational communication: Approaches and processes</em> (7th ed.), Chapter 2, pp. 18–32. The core course source for the machine metaphor, Taylor, Fayol, Weber, and communication patterns.</li><li>COMM 3008, Week 2 mini-lectures and <em>Principles of the Classical Organization</em> handout. Course framing and the distinction between formal authority and communication in practice.</li><li>Schumpeter. (2015). <em>Digital Taylorism.</em> The Economist. Historical commentary for the extension to continuous metrics and monitoring. The assigned 2015 <em>Inside Amazon</em> report concerns corporate work; it is not a source of warehouse rate estimates.</li></ul></section><div class="action-bar no-print"><p class="hint">Try a new week with the same scenario to test a different overall design.</p><button class="button secondary" data-action="restart">Start another week ↗</button></div>`;
}

function render({scroll = true, focus = null} = {}) {
  const disclosures=[...main.querySelectorAll('details[id]')].map(el=>[el.id,el.open]);
  $('#share-button').hidden = !game;
  main.dataset.phase=game?.phase??'intro';
  main.innerHTML = !game ? intro() : game.phase === 'plan' ? plan() : game.phase === 'work' ? work() : game.phase === 'report' ? report() : debrief();
  for(const [id,open] of disclosures){const el=document.getElementById(id);if(el)el.open=open;}
  if ($('#compare-policy')) fillCompareOptions();
  if (comparison && $('#comparison-output')) renderComparison();
  if (scroll) { window.scrollTo({top:0,behavior:'instant'}); $('#page-title')?.focus({preventScroll:true}); }
  if (focus) $(focus)?.focus({preventScroll:true});
}
function updateGame(next, {resetWork = true, focusWorkbench = false} = {}) {
  game=next; comparison=null; if(resetWork) input=blankInput(); persist();
  const keepWorking=focusWorkbench&&game.phase==='work';render({scroll:!keepWorking});
  if(keepWorking){const target=$('#event-title')??$('.order-ticket');target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});($('.dispatch-feedback')??target)?.scrollIntoView({block:'start',behavior:'instant'});}
}
function begin() { invalidLink=false; updateGame(createGame(game?.seed ?? 3008)); }
function collectWorkInput() {
  const form=$('#order-form');
  if(!form) return;
  input.pack=$('input[name="pack"]:checked',form).value;
  input.inspect=$('input[name="inspect"]',form).checked;
  input.rest=$('input[name="rest"]',form).checked;
  input.pace=$('select[name="pace"]',form).value;
  const preview=$('#pack-preview');const order=getOrder(game);if(preview&&order)preview.innerHTML=packagePreview({kind:input.pack,quantity:input.quantity,fragile:order.fragile,packed:Boolean(input.bin)});
  const chosen=getShelf(game).find(item=>item.bin===input.bin);
  if($('#picked-stock'))$('#picked-stock').textContent=chosen?`${chosen.sku} · ${chosen.item}`:'Choose an item';
  if($('#parcel-caption'))$('#parcel-caption').textContent=`${input.quantity} ${input.quantity===1?'unit':'units'} · ${input.pack==='box'?'Rigid box':'Mailer'}`;
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
  openDialog('One week. Three things to do.', `<div class="stack"><section><span class="eyebrow red">01 / BEFORE EACH SHIFT</span><h3>Make a plan</h3><p>Choose the operating rules. New choices open over the week: method and training, specialization, authority and written rules, then pay. Read the skill ratings when assigning specialists.</p></section><section><span class="eyebrow red">02 / ON THE FLOOR</span><h3>Process six orders</h3><p>Find the exact SKU on the shelves. Look-alike products can have different codes. Pick the requested quantity, then use a box for fragile goods or three-unit parcels. A mailer holds one or two nonfragile units. Choose whether to inspect, take a recovery break, or rush. Inspection catches and reworks problems at a time cost.</p><p>After three orders, respond to an exception. Your decision changes the operation. There is no real-time countdown; each action has a simulated time cost.</p></section><section><span class="eyebrow red">03 / AFTER THE SHIFT</span><h3>Use the evidence</h3><p>Compare good output, lateness, fatigue, trust, and pay. Try one alternative policy on the same work. In pairs, switch who plans and who operates after each shift.</p></section></div><div class="note-box section-gap">Reading, discussion, and opening a dialog never use shift time. Keyboard and touch work throughout. Keep a run link if you want to continue on another device.</div>`);
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
  const qty=event.target.closest('[data-quantity]');
  if(qty) { input.quantity=Number(qty.dataset.quantity);document.querySelectorAll('[data-quantity]').forEach(b=>b.setAttribute('aria-pressed',String(b===qty)));collectWorkInput();return;}
  const bin=event.target.closest('[data-bin]');
  if(bin) { input.bin=bin.dataset.bin; document.querySelectorAll('[data-bin]').forEach(b=>b.setAttribute('aria-pressed',String(b===bin))); $('#dispatch-button').disabled=false; $('#dispatch-hint').textContent=`Bin ${input.bin} selected. Check the code, quantity, and packaging.`;collectWorkInput();return; }
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
  if(target.dataset.policy) guarded(()=>{game=configure(game,{...game.policies,[target.dataset.policy]:target.value},game.assignment);persist();render({scroll:false,focus:'#'+target.id});if(target.dataset.policy==='division'&&target.value==='specialist'){const assignments=$(`#crew-settings-${game.day}`);if(assignments)assignments.open=true;}});
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
  guarded(()=>{collectWorkInput();const next=doWork(game,{...input});updateGame(next,{focusWorkbench:true});const s=game.shift;announce(`Order processed. ${s.onTime} good orders on time. ${fmt(s.minutes)} minutes used.${s.event&&!s.event.resolved?' An exception needs your response.':''}`);});
});
document.addEventListener('keydown',event=>{
  if(!event.target.matches('[data-bin]'))return;
  const grid=event.target.closest('.bin-grid');
  const columns=getComputedStyle(grid).gridTemplateColumns.split(/\s+/).length;
  const dirs={ArrowRight:1,ArrowLeft:-1,ArrowDown:columns,ArrowUp:-columns};if(!(event.key in dirs))return;
  event.preventDefault();const list=[...document.querySelectorAll('[data-bin]')];const index=list.indexOf(event.target);list[(index+dirs[event.key]+list.length)%list.length].focus();
});
window.addEventListener('hashchange',()=>{if(location.hash && !location.hash.startsWith('#run='))return;game=null;invalidLink=false;comparison=null;input=blankInput();loadLink();render();});
window.addEventListener('beforeprint',()=>{document.querySelectorAll('main details').forEach(d=>{d.dataset.wasOpen=String(d.open);d.open=true;});});
window.addEventListener('afterprint',()=>{document.querySelectorAll('main details').forEach(d=>{d.open=d.dataset.wasOpen==='true';});});
loadLink();render({scroll:false});
