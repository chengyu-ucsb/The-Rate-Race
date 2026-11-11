/**
 * The Rate Race, model version 3, with exact version-2 replay support.
 * A deterministic teaching model, NOT an estimate of a real workplace.
 * All time, pay, fatigue and trust coefficients are invented for discussion.
 * No DOM, network, random global state, wall clock or browser storage is used.
 */

export const MODEL_VERSION = 3;
export const BINS = Object.freeze(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3']);
export const WORKERS = Object.freeze([
  { id: 'nia', name: 'Nia', role: 'Experienced picker', skills: { pick: 5, pack: 3, check: 3 } },
  { id: 'mateo', name: 'Mateo', role: 'Careful packer', skills: { pick: 3, pack: 5, check: 3 } },
  { id: 'jules', name: 'Jules', role: 'Quality specialist', skills: { pick: 3, pack: 3, check: 5 } },
]);

export const POLICY_DEFS = Object.freeze([
  { id: 'method', label: 'Work method', theory: 'Taylor · studying the task', unlockDay: 0, options: [
    { id: 'local', label: 'Worker methods', description: 'Workers choose familiar methods. No setup study; more task time, but easier adaptation to unfamiliar orders.' },
    { id: 'study', label: 'Study and standardize', description: 'Invest 5 simulated minutes once to study several trials. Routine picking and packing become faster. A novel order still needs adaptation.' },
  ] },
  { id: 'training', label: 'Preparation', theory: 'Taylor · selection and training', unlockDay: 0, options: [
    { id: 'brief', label: 'Quick briefing', description: 'Start immediately with existing skills. Workers may need to correct more slips.' },
    { id: 'train', label: 'Teach and practice', description: 'Invest 4 simulated minutes once. Training improves skills and reduces execution slips throughout the week.' },
  ] },
  { id: 'division', label: 'Division of work', theory: 'Fayol · specialization and coordination', unlockDay: 1, options: [
    { id: 'whole', label: 'Whole orders', description: 'Each worker completes a whole order. Switching tasks takes time, but an absence is easier to absorb.' },
    { id: 'specialist', label: 'Specialist stations', description: 'Assign people to picking, packing and checking. Matching expertise saves time; an absent specialist can create a bottleneck.' },
  ] },
  { id: 'authority', label: 'Communication route', theory: 'Fayol · scalar chain and gangplank', unlockDay: 2, options: [
    { id: 'chain', label: 'Through the supervisor', description: 'Exceptions travel up and down the chain. Responsibility is clear; resolving a cross-department problem takes longer.' },
    { id: 'gangplank', label: 'Authorized direct contact', description: 'Supervisors authorize a direct call between departments and receive the result. Lateral contact remains accountable.' },
  ] },
  { id: 'rules', label: 'Decision rules', theory: 'Weber · rules, expertise and records', unlockDay: 2, options: [
    { id: 'discretion', label: 'Case-by-case decisions', description: 'Keep routine paperwork light. A disputed priority needs extra explanation because there is no common published criterion.' },
    { id: 'formal', label: 'Written criteria and records', description: 'Add 0.35 minutes of documentation per order. Applying the same published criteria can protect the queue from favoritism and make exceptions easier to justify.' },
  ] },
  { id: 'incentive', label: 'Pay and targets', theory: 'Taylor and digital management · incentives', unlockDay: 3, options: [
    { id: 'hourly', label: 'Time-based pay', description: 'Team pay follows simulated work time. Targets stay published; rushing brings no piece bonus.' },
    { id: 'piece', label: 'Stable piece rate', description: 'A published 3-credit payment for each good order, plus 18 base credits. A credible promise encourages effort without a moving quota.' },
    { id: 'ratchet', label: 'Moving target', description: 'An initial speed incentive, but exceeding the quota raises the next one and reduces the piece rate. Trust can fall. This is a contrast to Taylor’s stable standard.' },
  ] },
]);

export const DAYS = Object.freeze([
  { title: 'Find a method', focus: 'Study, select, train', brief: 'Six orders, three people, and a new operation. Decide how the team will learn the job before you handle its first orders.', target: 4, budget: 40 },
  { title: 'Build the line', focus: 'Specialize and coordinate', brief: 'The order volume is familiar. Decide whether to divide the work into stations, then keep the line moving when someone becomes unavailable.', target: 4, budget: 36 },
  { title: 'Who can decide?', focus: 'Authority and written rules', brief: 'Two departments will need to coordinate. Decide how messages travel and which decisions need a record.', target: 4, budget: 35 },
  { title: 'Set the rate', focus: 'Incentives and the moving target', brief: 'Management wants more good orders before dispatch. Decide what workers can rely on when they put in extra effort.', target: 5, budget: 34 },
  { title: 'When the routine breaks', focus: 'Adaptation and comparison', brief: 'A mixed, fragile shipment tests the system you built. Finish the week, then compare one policy change using the same orders and decisions.', target: 5, budget: 34 },
]);

export const TIME_STUDY = Object.freeze([
  { method: 'local', label: 'Worker methods', description: 'Observed routine process, before training and shift conditions.', trials: [5.3, 5.8, 5.5], mean: 5.53, allowance: 0.8, standard: 6.33 },
  { method: 'study', label: 'Tested sequence', description: 'Several trials of a proposed sequence, with an allowance for normal variation.', trials: [4.7, 5.1, 4.8], mean: 4.87, allowance: 0.8, standard: 5.67 },
]);

export const MODEL_ASSUMPTIONS = Object.freeze([
  'The warehouse, workers, orders, pay credits and numerical effects are fictional teaching assumptions, not measured findings.',
  'There is no real-time speed test. Only submitted choices advance simulated time; reading and discussion never consume the shift clock.',
  'Quality-correct orders and on-time orders are separate measures. A fast defective shipment does not meet the good-order target.',
  'Training persists after it is purchased. A tested method needs one setup study; workers can still contribute improvements.',
  'Formal rules add recording time. In the disputed-priority event, applying published criteria costs less investigation time and protects equal treatment; existing records also help resolve the final quality exception. An authorized gangplank does not remove hierarchy.',
  'Only the moving-target policy can raise a quota after actual above-target output. Stable piece rates remain 3 credits per good order.',
  'Comparisons replay the same work inputs and event responses under an alternative policy. They are model projections, not experiments on people.',
  'In model 3, shelf locations stay fixed within a shift. Similar product variants have distinct SKUs; requested quantities and package capacity must both be checked. Older model-2 links retain their original direct-bin tasks and calculations.',
]);

const STATIONS = ['pick', 'pack', 'check'];
const PHASES = ['plan', 'work', 'report', 'debrief'];
const DEFAULT_POLICIES = Object.fromEntries(POLICY_DEFS.map((p) => [p.id, p.options[0].id]));
const DEFAULT_ASSIGNMENT = { nia: 'pick', mateo: 'pack', jules: 'check' };
const ITEMS = [
  { item: 'Notebook set', fragile: false }, { item: 'Glass water bottle', fragile: true },
  { item: 'Cotton tote', fragile: false }, { item: 'Ceramic mug', fragile: true },
  { item: 'Charging cable', fragile: false }, { item: 'Desk lamp', fragile: true },
  { item: 'Canvas pencil case', fragile: false }, { item: 'Glass food container', fragile: true },
  { item: 'Wool socks', fragile: false },
];
const ITEM_ICONS = ['notebook', 'bottle', 'tote', 'mug', 'cable', 'lamp', 'pouch', 'container', 'socks'];
const SHELF_PREFIXES = ['HX', 'QF', 'MX', 'VX', 'GX'];
const SKU_SUFFIXES = ['218', '281', '812', '324', '342', '432', '615', '651', '561'];
const FAMILY_COLORS = ['#e8926c', '#70c9bb', '#a99cdb'];
const SHIFT_FAMILIES = [null,
  [{ item: 'Notebook set', fragile: false, icon: 'notebook' }, { item: 'Glass water bottle', fragile: true, icon: 'bottle' }, { item: 'Charging cable', fragile: false, icon: 'cable' }],
  [{ item: 'Cotton tote', fragile: false, icon: 'tote' }, { item: 'Ceramic mug', fragile: true, icon: 'mug' }, { item: 'Desk lamp', fragile: true, icon: 'lamp' }],
  [{ item: 'Canvas pencil case', fragile: false, icon: 'pouch' }, { item: 'Glass food container', fragile: true, icon: 'container' }, { item: 'Wool socks', fragile: false, icon: 'socks' }],
  [{ item: 'Glass gift set', fragile: true, icon: 'bottle' }, { item: 'Ceramic gift set', fragile: true, icon: 'mug' }, { item: 'Notebook gift set', fragile: false, icon: 'notebook' }],
];

const clone = (x) => JSON.parse(JSON.stringify(x));
const round = (n) => Math.round(n * 100) / 100;
const bound = (n, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const plain = (o) => o !== null && typeof o === 'object' && !Array.isArray(o) && Object.getPrototypeOf(o) === Object.prototype;
const fail = (text) => { throw new Error(text); };
const requireThat = (ok, message) => { if (!ok) fail(message); };

/** Stable per-order draws; changing one decision never consumes another order's draw. */
function draw(seed, day, order, salt = 0) {
  let value = ((seed >>> 0) ^ Math.imul(day + 1, 0x9e3779b9) ^ Math.imul(order + 1, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967296;
}

function checkPolicies(policies, day, requireAll = true) {
  requireThat(plain(policies), 'Policies must be an object.');
  requireThat(Object.keys(policies).every((k) => POLICY_DEFS.some((p) => p.id === k)), 'Unknown policy.');
  for (const def of POLICY_DEFS) {
    if (!(def.id in policies)) {
      requireThat(!requireAll, `Missing policy: ${def.id}.`);
      continue;
    }
    requireThat(def.options.some((o) => o.id === policies[def.id]), `Invalid ${def.id} policy.`);
    requireThat(day >= def.unlockDay || policies[def.id] === DEFAULT_POLICIES[def.id], `${def.label} unlocks later.`);
  }
}

function checkAssignment(assignment) {
  requireThat(plain(assignment), 'Worker assignments must be an object.');
  const ids = WORKERS.map((w) => w.id);
  requireThat(Object.keys(assignment).length === ids.length && Object.keys(assignment).every((id) => ids.includes(id)), 'Assign each worker exactly once.');
  requireThat(ids.every((id) => STATIONS.includes(assignment[id])) && new Set(Object.values(assignment)).size === 3, 'Each station needs one different worker.');
}

function checkAction(action, version) {
  requireThat(plain(action), 'A work action must be an object.');
  requireThat(BINS.includes(action.bin), 'Choose a valid storage bin.');
  requireThat(['box', 'mailer'].includes(action.pack), 'Choose a box or mailer.');
  requireThat(['steady', 'rush'].includes(action.pace), 'Choose a steady or rushed pace.');
  requireThat(typeof action.inspect === 'boolean' && typeof action.rest === 'boolean', 'Inspection and recovery choices must be true or false.');
  const checked = { bin: action.bin, pack: action.pack, inspect: action.inspect, pace: action.pace, rest: action.rest };
  if (version === 3) {
    requireThat(Number.isInteger(action.quantity) && action.quantity >= 1 && action.quantity <= 3, 'Choose a quantity from 1 to 3.');
    checked.quantity = action.quantity;
  }
  return checked;
}

function stateShell(state, phase) {
  requireThat(plain(state) && [2, MODEL_VERSION].includes(state.version) && PHASES.includes(state.phase), 'This is not a compatible game state.');
  requireThat(Number.isInteger(state.day) && state.day >= 0 && state.day < DAYS.length, 'Invalid shift.');
  requireThat(Number.isInteger(state.seed) && state.seed >= 0 && state.seed <= 0xffffffff, 'Invalid scenario seed.');
  if (phase) requireThat(state.phase === phase, `This action is only available during ${phase}.`);
}

export function policyLabel(id, value) {
  return POLICY_DEFS.find((p) => p.id === id)?.options.find((o) => o.id === value)?.label ?? String(value);
}

export function createGame(seed = 3008, version = MODEL_VERSION) {
  requireThat(Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff, 'Use a whole-number scenario seed from 0 to 4294967295.');
  requireThat([2, MODEL_VERSION].includes(version), 'Use a supported model version.');
  return {
    version, seed, day: 0, phase: 'plan',
    policies: { ...DEFAULT_POLICIES }, assignment: { ...DEFAULT_ASSIGNMENT },
    metrics: { raw: 0, shipped: 0, defects: 0, reworked: 0, late: 0, minutes: 0, fatigue: 15, trust: 65, wages: 0 },
    capabilities: { trained: false, studied: false, workerTip: false, localTip: false, unloggedException: false, ratchetTarget: 0, ratchetRate: 3, targetChanged: false },
    history: [], shift: null,
  };
}

/** Returns a new state. Partial policy changes are accepted; assignments must be a permutation. */
export function configure(state, policies = {}, assignment = state.assignment) {
  stateShell(state, 'plan');
  checkPolicies(policies, state.day, false);
  checkAssignment(assignment);
  const next = clone(state);
  next.policies = { ...next.policies, ...policies };
  next.assignment = { ...assignment };
  return next;
}

// Retain this generator unchanged so old replay links produce the same orders.
function ordersV2(seed, day) {
  return Array.from({ length: 6 }, (_, index) => {
    const itemIndex = Math.floor(draw(seed, day, index, 1) * ITEMS.length);
    const chosen = ITEMS[itemIndex];
    // The final shift deliberately includes more non-routine, fragile work.
    const fragile = day === 4 ? index % 3 !== 0 : chosen.fragile;
    const damaged = index === 4 || (day === 4 && index === 2);
    return {
      id: `D${day + 1}-${String(index + 1).padStart(2, '0')}`,
      bin: BINS[Math.floor(draw(seed, day, index, 2) * BINS.length)],
      item: day === 4 ? (fragile ? ['Glass gift set', 'Ceramic gift set'][index % 2] : ['Cotton gift bag', 'Notebook gift set'][index % 2]) : chosen.item,
      fragile, damaged,
      condition: damaged ? 'Scuffed seal: inspect and replace if damaged.' : 'Seal intact.',
      workerId: WORKERS[(day + index) % WORKERS.length].id,
    };
  });
}

function shelfFor(seed, day) {
  const positions = BINS.map((_, index) => index);
  for (let i = positions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(draw(seed, day, i, 31) * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  return BINS.map((bin, index) => {
    const catalogIndex = positions[index];
    const family = Math.floor(catalogIndex / 3);
    const product = day === 0 ? { ...ITEMS[catalogIndex], icon: ITEM_ICONS[catalogIndex] } : SHIFT_FAMILIES[day][family];
    return {
      bin, sku: `${SHELF_PREFIXES[day]}-${SKU_SUFFIXES[catalogIndex]}`,
      item: product.item, icon: product.icon, color: FAMILY_COLORS[family],
      fragile: product.fragile, family,
    };
  });
}

function ordersV3(seed, day) {
  const shelf = shelfFor(seed, day);
  const quantityOffset = Math.floor(draw(seed, day, 0, 37) * 3);
  return Array.from({ length: 6 }, (_, index) => {
    const family = day === 4 ? (index % 3 === 0 ? 2 : index % 2) : index % 3;
    const candidates = day === 0 ? shelf : shelf.filter((entry) => entry.family === family);
    const product = candidates[Math.floor(draw(seed, day, index, 2) * candidates.length)];
    const quantity = day === 0 ? 1 : day === 1 ? 1 + (index + seed % 2) % 2 : 1 + (index + Math.floor(index / 3) + quantityOffset) % 3;
    const damaged = index === 4 || (day === 4 && index === 2);
    return {
      id: `D${day + 1}-${String(index + 1).padStart(2, '0')}`,
      bin: product.bin, sku: product.sku, item: product.item,
      icon: product.icon, color: product.color,
      quantity, requiresBox: product.fragile || quantity === 3,
      fragile: product.fragile, damaged,
      condition: damaged ? 'Scuffed seal: inspect and replace if damaged.' : 'Seal intact.',
      workerId: WORKERS[(day + index) % WORKERS.length].id,
    };
  });
}

/** A fixed, deterministic nine-bin inventory for the current model-3 shift. */
export function getShelf(state) {
  stateShell(state);
  if (state.version === 3) return shelfFor(state.seed, state.day);
  // Model 2 did not have a fixed inventory: retain its direct-bin task semantics.
  const order = state.shift?.orders[Math.min(state.shift.index, 5)] ?? ordersV2(state.seed, state.day)[0];
  return BINS.map((bin) => ({
    bin, sku: bin, item: bin === order.bin ? order.item : 'Storage bin',
    icon: bin === order.bin ? (ITEM_ICONS[ITEMS.findIndex((item) => item.item === order.item)] ?? 'notebook') : 'notebook',
    color: '#a99cdb',
  }));
}

function baselineOf(state) {
  return clone({
    version: state.version, seed: state.seed, day: state.day, phase: 'plan',
    policies: state.policies, assignment: state.assignment,
    metrics: state.metrics, capabilities: state.capabilities,
  });
}

function spend(state, minutes) {
  state.shift.minutes = round(state.shift.minutes + minutes);
  state.metrics.minutes = round(state.metrics.minutes + minutes);
}

function feeling(state, key, delta) {
  state.metrics[key] = round(bound(state.metrics[key] + delta));
}

export function startShift(state) {
  stateShell(state, 'plan');
  checkPolicies(state.policies, state.day);
  checkAssignment(state.assignment);
  const next = clone(state);
  const day = DAYS[next.day];
  next.phase = 'work';
  next.shift = {
    index: 0, orders: next.version === 2 ? ordersV2(next.seed, next.day) : ordersV3(next.seed, next.day), minutes: 0,
    raw: 0, shipped: 0, defects: 0, reworked: 0, late: 0, onTime: 0, wages: 0,
    target: next.policies.incentive === 'ratchet' ? Math.max(day.target, next.capabilities.ratchetTarget) : day.target,
    budget: day.budget, actions: [], event: null, result: null,
    baseline: baselineOf(state), setup: [], reasons: [],
    effects: { absence: 0, coordinated: false, adapted: false, batchChecked: false, lockTarget: false },
  };
  if (next.policies.method === 'study' && !next.capabilities.studied) {
    spend(next, 5);
    next.capabilities.studied = true;
    next.shift.setup.push({ label: 'Time study', minutes: 5 });
    next.shift.reasons.push('You spent 5 minutes studying several trials before standardizing the routine.');
  }
  if (next.policies.training === 'train' && !next.capabilities.trained) {
    spend(next, 4);
    next.capabilities.trained = true;
    next.shift.setup.push({ label: 'Practice and training', minutes: 4 });
    next.shift.reasons.push('Four minutes of practice improved skills for this shift and later shifts.');
  }
  if (next.policies.incentive === 'piece') feeling(next, 'trust', 3);
  if (next.policies.incentive === 'ratchet' && next.capabilities.targetChanged) {
    feeling(next, 'trust', -10);
    next.shift.reasons.push('The previously raised quota reduced trust before this shift began.');
  }
  next.capabilities.targetChanged = false;
  if (next.day === 4 && next.capabilities.unloggedException) {
    spend(next, 3);
    next.shift.setup.push({ label: 'Reconstruct an unrecorded exception', minutes: 3 });
    next.shift.reasons.push('An unrecorded earlier exception took 3 minutes to reconstruct.');
  }
  return next;
}

/** Null at an unresolved interruption, between shifts, or after the week. */
export function getOrder(state) {
  stateShell(state);
  if (state.phase !== 'work' || (state.shift.event && !state.shift.event.resolved)) return null;
  return state.shift.orders[state.shift.index] ? clone(state.shift.orders[state.shift.index]) : null;
}

function workerFor(state, station, order) {
  if (state.policies.division === 'whole') return WORKERS.find((w) => w.id === order.workerId);
  return WORKERS.find((w) => state.assignment[w.id] === station);
}

function skillFactor(state, worker, station) {
  const skill = Math.min(5, worker.skills[station] + (state.capabilities.trained ? 0.8 : 0));
  return 1 - (skill - 3) * 0.065;
}

function eventFor(state) {
  const { day, policies } = state;
  const events = [
    {
      id: 'worker-knowledge', title: 'A better route?',
      body: 'Nia notices a shelf sequence that could reduce walking. The team already has instructions. Who gets to change the method?',
      options: [
        { id: 'test', label: 'Test the suggestion together', description: 'Use 3 minutes now. If validated, the shorter picking route benefits every later order. The approved method changes.' },
        { id: 'local', label: 'Let Nia try it locally', description: 'Use 1 minute. Trust improves; the shortcut helps only while workers complete whole orders using their own methods.' },
        { id: 'follow', label: 'Keep the current instructions', description: 'No extra time now. Preserve a consistent method, but leave the proposed improvement untested.' },
      ],
    },
    {
      id: 'bottleneck', title: 'One station goes quiet',
      body: policies.division === 'specialist' ? 'Your packing specialist is called away. Work can pile up between the stations even when the other workers are fast.' : 'One colleague is called away. Because workers complete whole orders, the others can cover more easily, but the interruption still needs a response.',
      options: [
        { id: 'rotate', label: 'Teach someone to cover', description: 'Spend 3 minutes handing over. Existing training makes the remaining work easier to absorb.' },
        { id: 'wait', label: 'Wait for a replacement', description: 'Spend 4.5 minutes now. The station then resumes normally; the team gets a short recovery.' },
        { id: 'stretch', label: 'Stretch the remaining crew', description: 'Start immediately. Add fatigue and repeated handoff time for the rest of this shift.' },
      ],
    },
    {
      id: 'conflicting-orders', title: 'Two instructions, one order',
      body: 'Sales wants a favored account’s order moved ahead of everyone else. Your supervisor says to keep the queue. Who can settle the disagreement, and does the same criterion apply to every account?',
      options: [
        { id: 'escalate', label: 'Send the decision up the chain', description: `Spend ${(policies.authority === 'chain' ? 4 : 3) + (policies.rules === 'discretion' ? 1 : 0)} minutes getting one accountable instruction. ${policies.rules === 'formal' ? 'Apply the same published criterion to every account; equal treatment adds trust.' : 'Include 1 minute to assemble a case-by-case justification.'}` },
        { id: 'coordinate', label: 'Arrange an authorized direct call', description: `Spend ${(policies.authority === 'gangplank' ? 1.5 : 3) + (policies.rules === 'discretion' ? 1 : 0)} minutes agreeing on one instruction with both supervisors informed. ${policies.rules === 'formal' ? 'Published criteria protect the queue from preferential treatment.' : 'Include 1 minute to assemble a case-by-case justification.'}` },
        { id: 'bypass', label: 'Act without documenting approval', description: 'No delay now. An unresolved record will take time to reconstruct in the final shift.' },
      ],
    },
    {
      id: 'rate-promise', title: 'What does extra effort buy?',
      body: policies.incentive === 'ratchet' ? 'The crew asks whether beating today’s target will raise tomorrow’s quota. A moving standard can make withholding effort understandable.' : 'The crew asks whether the published target and pay terms will survive a strong shift. A credible commitment matters as well as the size of the incentive.',
      options: [
        { id: 'guarantee', label: 'Guarantee the published terms', description: 'Spend 1 minute making the promise explicit. Trust improves and this shift cannot trigger a higher quota tomorrow.' },
        { id: 'discuss', label: 'Discuss the standard with the crew', description: 'Spend 3 minutes hearing concerns. Trust improves; the selected target policy still applies.' },
        { id: 'flexible', label: 'Reserve management’s right to revise', description: 'No discussion time. Trust falls; a quota rises only if you selected a moving target and actually exceed it.' },
      ],
    },
    {
      id: 'novel-demand', title: 'The batch does not fit the routine',
      body: 'The remaining gift orders are unusually fragile and one seal is suspect. A familiar method needs a justified exception. What can the organization learn from it?',
      options: [
        { id: 'document', label: 'Use criteria to inspect the batch', description: 'Written records make the decision take 2 minutes; case-by-case explanation takes 4. Damaged stock is replaced. Later picking or packing errors still need an order check.' },
        { id: 'adapt', label: 'Authorize a revised handling method', description: 'A standardized routine takes 3 minutes to revise; worker methods take 1.5. The remaining special orders become easier to handle.' },
        { id: 'continue', label: 'Keep processing individual orders', description: 'No meeting time. The original packaging and inspection requirements still apply to every order.' },
      ],
    },
  ];
  return { ...events[day], resolved: false, choice: null };
}

export function chooseEvent(state, choiceId) {
  stateShell(state, 'work');
  requireThat(state.shift.event && !state.shift.event.resolved, 'There is no unresolved event.');
  requireThat(state.shift.event.options.some((o) => o.id === choiceId), 'Choose one of this event’s responses.');
  const next = clone(state);
  const event = next.shift.event;
  const e = next.shift.effects;
  const p = next.policies;
  let note = '';
  if (next.day === 0) {
    if (choiceId === 'test') { spend(next, 3); feeling(next, 'trust', 6); next.capabilities.workerTip = true; note = 'Testing Nia’s suggestion cost 3 minutes and reduced picking time on subsequent orders.'; }
    if (choiceId === 'local') { spend(next, 1); feeling(next, 'trust', 3); next.capabilities.localTip = true; note = 'Nia’s local shortcut is useful when workers keep whole orders and choose their own methods.'; }
    if (choiceId === 'follow') { feeling(next, 'trust', -3); note = 'The method stayed consistent, but the worker’s proposed improvement was not tested.'; }
  } else if (next.day === 1) {
    if (choiceId === 'rotate') { spend(next, 3); feeling(next, 'fatigue', 2); feeling(next, 'trust', 2); e.absence = p.division === 'specialist' ? (next.capabilities.trained ? 0.15 : 0.55) : 0.1; note = 'A handover restored the flow. Earlier training reduced the cost of covering a specialist station.'; }
    if (choiceId === 'wait') { spend(next, 4.5); feeling(next, 'fatigue', -5); note = 'Waiting cost 4.5 minutes, restored the station and gave the crew some recovery.'; }
    if (choiceId === 'stretch') { feeling(next, 'fatigue', 8); feeling(next, 'trust', -4); e.absence = p.division === 'specialist' ? 1.1 : 0.35; note = 'Covering without a handover added fatigue and handoff time to every remaining order.'; }
  } else if (next.day === 2) {
    const justificationTime = p.rules === 'discretion' ? 1 : 0;
    if (choiceId === 'escalate') { spend(next, (p.authority === 'chain' ? 4 : 3) + justificationTime); feeling(next, 'trust', 1); note = 'A recorded instruction resolved the conflict through the formal chain of responsibility.'; }
    if (choiceId === 'coordinate') { spend(next, (p.authority === 'gangplank' ? 1.5 : 3) + justificationTime); feeling(next, 'trust', 3); e.coordinated = true; note = 'Authorized lateral contact resolved the problem while keeping both supervisors informed.'; }
    if (choiceId !== 'bypass' && p.rules === 'formal') { feeling(next, 'trust', 4); note += ' Applying the same published criterion prevented preferential treatment and added 4 trust.'; }
    if (choiceId !== 'bypass' && p.rules === 'discretion') note += ' Without a published criterion, assembling a justification took an extra minute.';
    if (choiceId === 'bypass') { next.capabilities.unloggedException = true; feeling(next, 'trust', -4); note = 'Acting without a record saved time now but left a later reconstruction cost.'; }
  } else if (next.day === 3) {
    if (choiceId === 'guarantee') { spend(next, 1); feeling(next, 'trust', 9); e.lockTarget = true; note = 'A published guarantee protected tomorrow’s quota and increased trust.'; }
    if (choiceId === 'discuss') { spend(next, 3); feeling(next, 'trust', 6); feeling(next, 'fatigue', -2); note = 'Discussion increased trust without changing the selected incentive policy.'; }
    if (choiceId === 'flexible') { feeling(next, 'trust', -9); note = 'Reserving the right to revise terms cost trust even before any quota actually rose.'; }
  } else {
    if (choiceId === 'document') { spend(next, p.rules === 'formal' ? 2 : 4); feeling(next, 'trust', 4); e.batchChecked = true; note = 'The batch was checked against explicit criteria. Existing written records reduced the time needed to justify the exception.'; }
    if (choiceId === 'adapt') { spend(next, p.method === 'study' ? 3 : 1.5); feeling(next, 'trust', 4); e.adapted = true; note = 'An authorized method revision reduced the handling penalty on the remaining unfamiliar orders.'; }
    if (choiceId === 'continue') { feeling(next, 'trust', -2); note = 'The original routine continued; individual packaging and inspection decisions still determined quality.'; }
  }
  event.resolved = true;
  event.choice = choiceId;
  event.outcome = note;
  next.shift.reasons.push(note);
  return next;
}

/**
 * The action clock measures modelled operations, never mouse speed.
 * Base operation minutes: pick 2.4; pack 1.8 mailer / 2.35 box;
 * inspect 1.35. A study reduces routine pick+pack to 84% of baseline.
 * Skills, task switching, fatigue, incentive credibility, and events then
 * change these operations. Recovery is 3 minutes; intercepted errors are
 * reworked for 1.6 minutes plus 0.35 for each additional issue.
 * In model 3, each additional picked unit costs 0.15 simulated minutes.
 * Mailers hold at most two nonfragile units; a third unit requires a box.
 */
export function doWork(state, action) {
  stateShell(state, 'work');
  requireThat(!state.shift.event || state.shift.event.resolved, 'Resolve the interruption before continuing work.');
  const input = checkAction(action, state.version);
  const next = clone(state);
  const shift = next.shift;
  const order = shift.orders[shift.index];
  requireThat(Boolean(order), 'This shift has no remaining orders.');
  const before = { minutes: shift.minutes, fatigue: next.metrics.fatigue, trust: next.metrics.trust };
  const reasons = [];
  if (input.rest) { spend(next, 3); feeling(next, 'fatigue', -12); reasons.push('Recovery: +3 minutes, −12 fatigue before work.'); }
  const picker = workerFor(next, 'pick', order);
  const packer = workerFor(next, 'pack', order);
  const checker = workerFor(next, 'check', order);
  let picking = 2.4 * skillFactor(next, picker, 'pick');
  let packing = (input.pack === 'box' ? 2.35 : 1.8) * skillFactor(next, packer, 'pack');
  if (next.capabilities.workerTip) picking -= 0.35;
  else if (next.capabilities.localTip && next.policies.method === 'local' && next.policies.division === 'whole') picking -= 0.2;
  if (next.policies.method === 'study') { picking *= 0.84; packing *= 0.84; }
  let workTime = picking + packing + (next.policies.division === 'whole' ? 0.55 : 0.12);
  workTime *= 1 + Math.max(0, next.metrics.fatigue - 15) / 150;
  // Low trust models withholding discretionary effort; it is not moral failure.
  workTime *= 1 + Math.max(0, 50 - next.metrics.trust) / 200;
  if (next.policies.incentive === 'piece' && next.metrics.trust >= 50) workTime *= 0.94;
  if (next.policies.incentive === 'ratchet' && next.metrics.trust >= 45) workTime *= 0.89;
  if (input.pace === 'rush') workTime *= 0.79;
  workTime += shift.effects.absence;
  if (next.day === 4 && order.fragile && !shift.effects.adapted) workTime += next.policies.method === 'study' ? 0.9 : 0.35;
  if (input.inspect) workTime += 1.35 * skillFactor(next, checker, 'check');
  if (next.policies.rules === 'formal') workTime += 0.35;
  if (next.version === 3) workTime += (input.quantity - 1) * 0.15;
  const issues = [];
  if (input.bin !== order.bin) issues.push('Wrong storage bin');
  if (order.fragile && input.pack !== 'box') issues.push('Fragile item needs a box');
  if (next.version === 3) {
    if (input.quantity !== order.quantity) issues.push(`Incorrect quantity: requested ${order.quantity}, packed ${input.quantity}`);
    if (!order.fragile && (order.quantity === 3 || input.quantity === 3) && input.pack !== 'box') issues.push('Mailer capacity is 2; three items need a box');
  }
  if (order.damaged) issues.push('Damaged item needs replacement');
  const slipRisk = bound(0.085 - (next.capabilities.trained ? 0.055 : 0) + Math.max(0, next.metrics.fatigue - 30) * 0.0025 + (input.pace === 'rush' ? 0.14 : 0), 0, 0.65);
  if (draw(next.seed, next.day, shift.index, 7) < slipRisk) issues.push('Execution slip in handling');
  const interceptedIssues = input.inspect ? issues : issues.filter((issue) => shift.effects.batchChecked && issue === 'Damaged item needs replacement');
  const escapedIssues = issues.filter((issue) => !interceptedIssues.includes(issue));
  const intercepted = interceptedIssues.length > 0;
  if (intercepted) {
    workTime += 1.6 + Math.max(0, interceptedIssues.length - 1) * 0.35;
    reasons.push(`Check caught and corrected: ${interceptedIssues.join('; ')}.`);
  }
  const good = escapedIssues.length === 0;
  spend(next, round(workTime));
  const onTime = good && shift.minutes <= shift.budget;
  const late = good && !onTime;
  const fatigueCost = (input.pace === 'rush' ? 6 : 2.6) + (next.policies.division === 'specialist' ? 0.4 : 0) + (next.policies.incentive === 'hourly' ? 0 : 0.35) - (next.capabilities.trained ? 0.5 : 0);
  feeling(next, 'fatigue', fatigueCost);
  shift.raw += 1;
  next.metrics.raw += 1;
  if (good) { shift.shipped += 1; next.metrics.shipped += 1; }
  else { shift.defects += 1; next.metrics.defects += 1; reasons.push(`Escaped quality problem: ${escapedIssues.join('; ')}.`); }
  if (intercepted) { shift.reworked += 1; next.metrics.reworked += 1; }
  if (onTime) shift.onTime += 1;
  if (late) { shift.late += 1; next.metrics.late += 1; reasons.push('Quality was acceptable, but dispatch was after the shift deadline.'); }
  const outcome = {
    orderId: order.id, input, minutes: round(shift.minutes - before.minutes),
    completedAt: shift.minutes, good, onTime, late, intercepted, issues, interceptedIssues, escapedIssues,
    fatigueDelta: round(next.metrics.fatigue - before.fatigue), reasons,
    workers: { pick: picker.id, pack: packer.id, check: checker.id },
  };
  shift.actions.push(outcome);
  shift.index += 1;
  if (shift.index === 3) shift.event = eventFor(next);
  if (shift.index === 6) finishShift(next);
  return next;
}

function finishShift(state) {
  const s = state.shift;
  const p = state.policies;
  const metTarget = s.onTime >= s.target;
  const rate = p.incentive === 'ratchet' ? state.capabilities.ratchetRate : 3;
  s.wages = p.incentive === 'hourly' ? round(s.minutes) : round(18 + s.shipped * rate);
  state.metrics.wages = round(state.metrics.wages + s.wages);
  if (p.incentive === 'ratchet' && !s.effects.lockTarget && s.onTime > s.target && s.target < 6) {
    state.capabilities.ratchetTarget = s.target + 1;
    state.capabilities.ratchetRate = round(Math.max(2, rate - 0.5));
    state.capabilities.targetChanged = true;
    s.reasons.push(`Above-target output raised the next moving quota to ${s.target + 1} and lowered its piece rate to ${state.capabilities.ratchetRate} credits. This is rate-busting, not Taylor’s recommended stable incentive.`);
  } else if (p.incentive === 'ratchet') {
    s.reasons.push(s.effects.lockTarget ? 'Your guarantee prevented a quota increase despite the moving-target policy.' : 'The moving target did not rise: this shift did not exceed the current quota.');
  } else if (p.incentive === 'piece') {
    s.reasons.push('Every good order earned the published 3-credit piece payment. Beating a quota did not cut that rate.');
  }
  if (p.division === 'specialist') s.reasons.push('Station speed reflected who was assigned to each job; the fastest individual did not automatically make the whole system fastest.');
  if (s.defects) s.reasons.push(`${s.defects} dispatched order${s.defects === 1 ? '' : 's'} had an unresolved quality problem and did not count toward the good-order target.`);
  if (s.late) s.reasons.push(`${s.late} good order${s.late === 1 ? '' : 's'} arrived after the deadline; quality and timeliness are separate outcomes.`);
  s.reasons.push(metTarget ? `The crew delivered ${s.onTime} good orders by the ${s.budget}-minute deadline, meeting the target of ${s.target}.` : `The crew delivered ${s.onTime} good orders by the ${s.budget}-minute deadline against a target of ${s.target}.`);
  const before = s.baseline.metrics;
  const result = {
    day: state.day, title: DAYS[state.day].title,
    policies: clone(state.policies), assignment: clone(state.assignment),
    raw: s.raw, shipped: s.shipped, defects: s.defects, reworked: s.reworked,
    late: s.late, onTime: s.onTime, minutes: s.minutes, target: s.target, budget: s.budget,
    metTarget, quality: s.raw ? Math.round(s.shipped / s.raw * 100) : 0,
    wages: s.wages, pieceRate: p.incentive === 'hourly' ? null : rate,
    rate: s.minutes ? round(s.shipped / s.minutes * 60) : 0,
    fatigue: state.metrics.fatigue, trust: state.metrics.trust,
    changes: { fatigue: round(state.metrics.fatigue - before.fatigue), trust: round(state.metrics.trust - before.trust) },
    reasons: clone(s.reasons), actions: clone(s.actions),
    eventChoice: s.event?.choice ?? null, event: clone(s.event),
    baseline: clone(s.baseline), setup: clone(s.setup),
  };
  s.result = result;
  state.history.push(clone(result));
  state.phase = 'report';
}

export function nextShift(state) {
  stateShell(state, 'report');
  const next = clone(state);
  if (next.day === DAYS.length - 1) { next.phase = 'debrief'; return next; }
  next.day += 1;
  next.phase = 'plan';
  next.shift = null;
  feeling(next, 'fatigue', -12);
  return next;
}

function compactRun(resultOrShift) {
  const baseline = resultOrShift.baseline;
  return {
    p: POLICY_DEFS.map((d) => d.options.findIndex((o) => o.id === baseline.policies[d.id])),
    a: WORKERS.map((w) => STATIONS.indexOf(baseline.assignment[w.id])),
    w: resultOrShift.actions.map(({ input: a }) => {
      const tuple = [BINS.indexOf(a.bin), a.pack === 'box' ? 1 : 0, a.inspect ? 1 : 0, a.pace === 'rush' ? 1 : 0, a.rest ? 1 : 0];
      if (baseline.version === 3) tuple.push(a.quantity);
      return tuple;
    }),
    e: resultOrShift.event?.choice ?? resultOrShift.eventChoice ?? null,
  };
}

/** Compact replay, not a trusted snapshot. Decoding always recomputes outcomes. */
export function serializeState(state) {
  stateShell(state);
  const runs = state.history.map(compactRun);
  if (state.phase === 'work') runs.push(compactRun(state.shift));
  const plan = state.phase === 'plan' ? {
    p: POLICY_DEFS.map((d) => d.options.findIndex((o) => o.id === state.policies[d.id])),
    a: WORKERS.map((w) => STATIONS.indexOf(state.assignment[w.id])),
  } : null;
  return JSON.stringify({ v: state.version, seed: state.seed, phase: state.phase, runs, plan });
}

function parsePlan(plan, day) {
  requireThat(plain(plan), 'Invalid plan data.');
  requireThat(Array.isArray(plan.p) && plan.p.length === POLICY_DEFS.length, 'Invalid policy list.');
  requireThat(plan.p.every((n, i) => Number.isInteger(n) && n >= 0 && n < POLICY_DEFS[i].options.length), 'Invalid policy option.');
  requireThat(Array.isArray(plan.a) && plan.a.length === WORKERS.length && plan.a.every((n) => Number.isInteger(n) && n >= 0 && n < STATIONS.length) && new Set(plan.a).size === 3, 'Invalid station assignments.');
  const policies = Object.fromEntries(POLICY_DEFS.map((d, i) => [d.id, d.options[plan.p[i]].id]));
  const assignment = Object.fromEntries(WORKERS.map((w, i) => [w.id, STATIONS[plan.a[i]]]));
  checkPolicies(policies, day);
  return { policies, assignment };
}

/** Accepts only a small replay schema. Arbitrary HTML, stats and unknown phases are rejected. */
export function deserializeState(text) {
  requireThat(typeof text === 'string' && text.length <= 12000, 'The saved game link is too large or invalid.');
  let data;
  try { data = JSON.parse(text); } catch { fail('The saved game link could not be read.'); }
  requireThat(plain(data) && [2, MODEL_VERSION].includes(data.v), 'This saved game belongs to a different model version.');
  requireThat(PHASES.includes(data.phase), 'Invalid saved phase.');
  requireThat(Array.isArray(data.runs) && data.runs.length <= DAYS.length, 'Invalid number of shifts.');
  let state = createGame(data.seed, data.v);
  for (let i = 0; i < data.runs.length; i += 1) {
    const run = data.runs[i];
    const plan = parsePlan(run, i);
    requireThat(Array.isArray(run.w) && run.w.length <= 6, 'Invalid number of orders.');
    requireThat(run.e === null || (typeof run.e === 'string' && run.e.length <= 30), 'Invalid event response.');
    if (i < data.runs.length - 1) requireThat(run.w.length === 6, 'An earlier shift is incomplete.');
    state = configure(state, plan.policies, plan.assignment);
    state = startShift(state);
    for (let j = 0; j < run.w.length; j += 1) {
      if (j === 3) {
        requireThat(run.e !== null, 'Resolve the event before completing more orders.');
        state = chooseEvent(state, run.e);
      }
      const tuple = run.w[j];
      requireThat(Array.isArray(tuple) && tuple.length === (data.v === 2 ? 5 : 6) && Number.isInteger(tuple[0]) && tuple[0] >= 0 && tuple[0] < BINS.length && tuple.slice(1, 5).every((v) => v === 0 || v === 1), 'Invalid order decision.');
      if (data.v === 3) requireThat(Number.isInteger(tuple[5]) && tuple[5] >= 1 && tuple[5] <= 3, 'Invalid picked quantity.');
      const action = { bin: BINS[tuple[0]], pack: tuple[1] ? 'box' : 'mailer', inspect: Boolean(tuple[2]), pace: tuple[3] ? 'rush' : 'steady', rest: Boolean(tuple[4]) };
      if (data.v === 3) action.quantity = tuple[5];
      state = doWork(state, action);
    }
    if (run.w.length === 3 && run.e !== null) state = chooseEvent(state, run.e);
    if (run.w.length < 3) requireThat(run.e === null, 'The event has not happened yet.');
    if (i < data.runs.length - 1) state = nextShift(state);
  }
  if (data.phase === 'plan') {
    requireThat(data.runs.length < DAYS.length, 'The week is already complete.');
    if (data.runs.length) state = nextShift(state);
    const plan = parsePlan(data.plan, data.runs.length);
    state = configure(state, plan.policies, plan.assignment);
  } else {
    requireThat(data.plan === null, 'Unexpected extra plan.');
    requireThat(data.runs.length > 0, 'The saved shift is missing.');
    if (data.phase === 'debrief') {
      requireThat(data.runs.length === DAYS.length && state.phase === 'report', 'Complete all five shifts before the debrief.');
      state = nextShift(state);
    }
  }
  requireThat(state.phase === data.phase, 'Saved progress does not match its phase.');
  return state;
}

/** Returns true for an authentic, internally consistent replayable state. */
export function validateState(state) {
  try {
    const rebuilt = deserializeState(serializeState(state));
    // Reconstructible authoritative fields must agree; presentation additions do not matter.
    return ['version', 'seed', 'day', 'phase', 'policies', 'assignment', 'metrics', 'capabilities', 'history', 'shift']
      .every((key) => JSON.stringify(state[key]) === JSON.stringify(rebuilt[key]));
  } catch { return false; }
}

export function comparePolicies(state, overrides) {
  stateShell(state);
  requireThat(['report', 'debrief'].includes(state.phase) && state.history.length > 0, 'Finish a shift before comparing its policies.');
  checkPolicies(overrides, state.day, false);
  const actual = state.history[state.history.length - 1];
  const baseline = clone(actual.baseline);
  let alternative = { ...baseline, history: [], shift: null };
  alternative = configure(alternative, overrides, baseline.assignment);
  alternative = startShift(alternative);
  for (let i = 0; i < actual.actions.length; i += 1) {
    if (i === 3) alternative = chooseEvent(alternative, actual.eventChoice);
    alternative = doWork(alternative, actual.actions[i].input);
  }
  return {
    actual: clone(actual), alternative: clone(alternative.shift.result),
    changes: Object.keys(overrides).filter((id) => baseline.policies[id] !== overrides[id]).map((id) => ({ id, from: policyLabel(id, baseline.policies[id]), to: policyLabel(id, overrides[id]) })),
    assumptions: 'Same starting fatigue, trust, training, orders, work choices and event response. Only the selected policy changes. These are model projections, not measured causal effects.',
  };
}

export function reportText(state) {
  stateShell(state);
  const lines = ['THE RATE RACE · SHIFT RECORD', `Scenario ${state.seed} · model ${state.version}`, '', 'All figures are fictional model outcomes. Reading time does not affect the shift clock.', ''];
  for (const r of state.history) {
    const inspections = r.actions.filter((a) => a.input.inspect).length;
    const rushes = r.actions.filter((a) => a.input.pace === 'rush').length;
    const recoveries = r.actions.filter((a) => a.input.rest).length;
    lines.push(`SHIFT ${r.day + 1}: ${r.title}`, `Good orders on time: ${r.onTime}/${r.target} target. Good orders total: ${r.shipped}/${r.raw}. Defective: ${r.defects}. Late good orders: ${r.late}.`, `Simulated time: ${r.minutes}/${r.budget} minutes. Rate: ${r.rate} good orders per simulated hour. Quality: ${r.quality}%. Team pay: ${r.wages} credits. Fatigue: ${r.fatigue}/100. Trust: ${r.trust}/100.`, `Work choices: ${inspections}/${r.raw} orders inspected; ${rushes}/${r.raw} rushed; ${recoveries} recovery breaks; ${r.reworked} orders reworked after a check.`, `Policies: ${POLICY_DEFS.map((p) => `${p.label}: ${policyLabel(p.id, r.policies[p.id])}`).join('; ')}.`, `Staffing: ${WORKERS.map((w) => `${w.name}: ${r.assignment[w.id]}`).join('; ')}.`, `Event: ${r.event?.title ?? ''}. Response: ${r.event?.options.find((o) => o.id === r.eventChoice)?.label ?? ''}.`, ...r.reasons.map((reason) => `• ${reason}`), '');
  }
  lines.push('REFLECT', '1. Identify one rule that improved output or consistency and one cost it created. Use a number and a decision from your shift record.', '2. Explain a decision using Taylor, Fayol or Weber. Distinguish the original idea from its implementation in this model.', '3. Who could contribute knowledge, authorize an exception and challenge a target? What did the communication route make easier or harder?', '', 'Submission: copy this record into your course submission and add your reflection. This game does not send work to an instructor.');
  return lines.join('\n');
}
