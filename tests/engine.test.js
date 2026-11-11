import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  BINS, DAYS, POLICY_DEFS, WORKERS,
  createGame, configure, startShift, getOrder, getShelf, doWork, chooseEvent, nextShift,
  comparePolicies, serializeState, deserializeState, validateState, reportText,
} from '../engine.js';

const defaultEvents = ['test', 'rotate', 'coordinate', 'guarantee', 'document'];
const correctAction = (order, overrides = {}) => ({
  bin: order.bin, pack: (order.requiresBox ?? order.fragile) ? 'box' : 'mailer',
  inspect: true, pace: 'steady', rest: false, quantity: order.quantity ?? 1, ...overrides,
});

function finish(state, { event, action = () => ({}) } = {}) {
  let s = state.phase === 'plan' ? startShift(state) : state;
  while (s.phase === 'work') {
    if (s.shift.event && !s.shift.event.resolved) {
      s = chooseEvent(s, event ?? defaultEvents[s.day]);
    } else {
      const order = getOrder(s);
      s = doWork(s, correctAction(order, action(s, order)));
    }
  }
  return s;
}

function dayPlan(day, seed = 3008) {
  let state = createGame(seed);
  while (state.day < day) state = nextShift(finish(state));
  return state;
}

function atOrder(state, index, event = defaultEvents[state.day]) {
  let s = state.phase === 'plan' ? startShift(state) : state;
  while (s.shift.index < index) {
    if (s.shift.event && !s.shift.event.resolved) s = chooseEvent(s, event);
    s = doWork(s, correctAction(getOrder(s)));
  }
  if (index >= 3 && s.shift.event && !s.shift.event.resolved) s = chooseEvent(s, event);
  return s;
}

test('a five-shift run is deterministic, complete and preserves accounting identities', () => {
  function run() {
    let s = createGame(3008);
    for (let day = 0; day < 5; day += 1) {
      s = finish(s);
      assert.equal(s.shift.raw, 6);
      assert.equal(s.shift.shipped + s.shift.defects, 6);
      assert.equal(s.shift.onTime + s.shift.late, s.shift.shipped);
      assert.equal(s.shift.result.metTarget, s.shift.onTime >= s.shift.target);
      assert.equal(s.shift.result.rate, Math.round(s.shift.shipped / s.shift.minutes * 6000) / 100);
      s = nextShift(s);
    }
    return s;
  }
  const a = run();
  const b = run();
  assert.deepEqual(a, b);
  assert.equal(a.phase, 'debrief');
  assert.equal(a.history.length, 5);
  assert.equal(a.metrics.raw, 30);
  assert.equal(a.metrics.raw, a.metrics.shipped + a.metrics.defects);
  assert.equal(a.metrics.wages, Math.round(a.history.reduce((n, r) => n + r.wages, 0) * 100) / 100);
  assert.equal(a.metrics.minutes, Math.round(a.history.reduce((n, r) => n + r.minutes, 0) * 100) / 100);
});

test('operations are immutable and reject duplicate finalization or premature progress', () => {
  const plan = createGame();
  const saved = structuredClone(plan);
  const working = startShift(plan);
  const workingCopy = structuredClone(working);
  const after = doWork(working, correctAction(getOrder(working)));
  assert.deepEqual(plan, saved);
  assert.deepEqual(working, workingCopy);
  assert.equal(after.shift.index, 1);
  assert.throws(() => nextShift(working), /report/);
  assert.throws(() => startShift(working), /plan/);
  const done = finish(working);
  assert.throws(() => doWork(done, correctAction(done.shift.orders[0])), /work/);
  assert.throws(() => startShift(done), /plan/);
  const debrief = (() => {
    let s = nextShift(done);
    while (s.phase !== 'debrief') s = nextShift(finish(s));
    return s;
  })();
  assert.throws(() => nextShift(debrief), /report/);
});

test('locked policies and invalid staffing cannot enter the model', () => {
  const state = createGame();
  assert.throws(() => configure(state, { division: 'specialist' }), /unlocks later/);
  assert.throws(() => configure(state, { method: 'magic' }), /Invalid method/);
  assert.throws(() => configure(state, { imaginary: 'yes' }), /Unknown policy/);
  assert.throws(() => configure(state, {}, { nia: 'pick', mateo: 'pick', jules: 'pick' }), /different worker/);
  assert.throws(() => configure(state, {}, { nia: 'pick', mateo: 'pack' }), /each worker/);
  assert.deepEqual(configure(state, state.policies, state.assignment), state);
  const specialist = configure(dayPlan(1), { division: 'specialist' });
  assert.equal(specialist.policies.division, 'specialist');
});

test('the interruption stops work and requires exactly one valid response', () => {
  const interrupted = atOrder(createGame(), 2);
  const s = doWork(interrupted, correctAction(getOrder(interrupted)));
  assert.equal(s.shift.index, 3);
  assert.equal(getOrder(s), null);
  assert.equal(s.shift.event.resolved, false);
  assert.throws(() => doWork(s, correctAction(s.shift.orders[3])), /Resolve/);
  assert.throws(() => chooseEvent(s, 'nonexistent'), /responses/);
  const resolved = chooseEvent(s, 'test');
  assert.equal(resolved.shift.minutes, Math.round((s.shift.minutes + 3) * 100) / 100);
  assert.equal(resolved.shift.event.resolved, true);
  assert.ok(getOrder(resolved));
  assert.throws(() => chooseEvent(resolved, 'follow'), /no unresolved/);
});

test('inspection corrects a bad choice with real rework time; unchecked errors cannot count as good output', () => {
  const state = startShift(createGame(7));
  const order = getOrder(state);
  const wrongBin = BINS.find((bin) => bin !== order.bin);
  const unchecked = doWork(state, correctAction(order, { bin: wrongBin, inspect: false }));
  const checked = doWork(state, correctAction(order, { bin: wrongBin, inspect: true }));
  const rightChecked = doWork(state, correctAction(order, { inspect: true }));
  assert.equal(unchecked.shift.shipped, 0);
  assert.equal(unchecked.shift.defects, 1);
  assert.equal(checked.shift.shipped, 1);
  assert.equal(checked.shift.defects, 0);
  assert.equal(checked.shift.reworked, 1);
  assert.ok(checked.shift.minutes > rightChecked.shift.minutes);
  assert.ok(checked.shift.actions[0].interceptedIssues.includes('Wrong storage bin'));
  assert.ok(unchecked.shift.actions[0].escapedIssues.includes('Wrong storage bin'));
});

test('a suspect item requires replacement and inspection time is charged', () => {
  const state = atOrder(createGame(3008), 4);
  const order = getOrder(state);
  assert.equal(order.damaged, true);
  const unchecked = doWork(state, correctAction(order, { inspect: false }));
  const checked = doWork(state, correctAction(order, { inspect: true }));
  assert.equal(unchecked.shift.actions[4].good, false);
  assert.equal(checked.shift.actions[4].good, true);
  assert.equal(checked.shift.actions[4].intercepted, true);
  assert.ok(checked.shift.actions[4].minutes > unchecked.shift.actions[4].minutes);
});

test('final batch inspection does not prevent new wrong-bin or packing errors', () => {
  const state = atOrder(dayPlan(4), 4, 'document');
  const order = getOrder(state);
  assert.equal(order.damaged, true);
  const wrongBin = BINS.find((b) => b !== order.bin);
  const s = doWork(state, correctAction(order, { inspect: false, bin: wrongBin }));
  const outcome = s.shift.actions[4];
  assert.equal(outcome.intercepted, true);
  assert.equal(outcome.good, false);
  assert.ok(outcome.interceptedIssues.includes('Damaged item needs replacement'));
  assert.ok(outcome.escapedIssues.includes('Wrong storage bin'));
});

test('quality and deadline attainment are distinct, and every recovery consumes time', () => {
  const s = finish(createGame(44), { action: () => ({ rest: true }) });
  assert.equal(s.shift.shipped, 6);
  assert.equal(s.shift.result.quality, 100);
  assert.ok(s.shift.minutes > s.shift.budget);
  assert.ok(s.shift.late > 0);
  assert.ok(s.shift.onTime < s.shift.shipped);
  assert.equal(s.shift.result.metTarget, s.shift.onTime >= s.shift.target);
  const before = startShift(createGame(44));
  const noRest = doWork(before, correctAction(getOrder(before)));
  const rest = doWork(before, correctAction(getOrder(before), { rest: true }));
  assert.ok(rest.shift.minutes > noRest.shift.minutes);
  assert.ok(rest.metrics.fatigue < noRest.metrics.fatigue);
});

test('rushing spends fatigue for shorter operation time', () => {
  const s = startShift(createGame(9));
  const steady = doWork(s, correctAction(getOrder(s), { inspect: false }));
  const rush = doWork(s, correctAction(getOrder(s), { inspect: false, pace: 'rush' }));
  assert.ok(rush.shift.minutes < steady.shift.minutes);
  assert.ok(rush.metrics.fatigue > steady.metrics.fatigue);
});

test('training and a validated worker improvement persist across shifts', () => {
  let s = configure(createGame(), { training: 'train', method: 'study' });
  s = startShift(s);
  assert.equal(s.shift.minutes, 9);
  assert.equal(s.capabilities.trained, true);
  assert.equal(s.capabilities.studied, true);
  s = nextShift(finish(s, { event: 'test' }));
  assert.equal(s.capabilities.workerTip, true);
  s = configure(s, { training: 'brief' });
  s = startShift(s);
  assert.equal(s.capabilities.trained, true);
  assert.equal(s.shift.setup.length, 0);
  assert.equal(s.shift.minutes, 0);
});

test('matching specialist skills changes actual processing time', () => {
  const base = configure(dayPlan(1, 3008), { division: 'specialist' });
  const good = startShift(base);
  const poor = startShift(configure(base, {}, { nia: 'check', mateo: 'pick', jules: 'pack' }));
  const a = doWork(good, correctAction(getOrder(good)));
  const b = doWork(poor, correctAction(getOrder(poor)));
  assert.ok(a.shift.minutes < b.shift.minutes);
  assert.deepEqual(a.shift.actions[0].workers, { pick: 'nia', pack: 'mateo', check: 'jules' });
});

test('authorized lateral contact really reduces the relay delay', () => {
  const base = dayPlan(2);
  const chain = atOrder(configure(base, { authority: 'chain' }), 2);
  const gangplank = atOrder(configure(base, { authority: 'gangplank' }), 2);
  const a = doWork(chain, correctAction(getOrder(chain)));
  const b = doWork(gangplank, correctAction(getOrder(gangplank)));
  const resolvedA = chooseEvent(a, 'coordinate');
  const resolvedB = chooseEvent(b, 'coordinate');
  assert.equal(Math.round((resolvedA.shift.minutes - a.shift.minutes) * 10) / 10, 4);
  assert.equal(Math.round((resolvedB.shift.minutes - b.shift.minutes) * 10) / 10, 2.5);
  assert.equal(resolvedB.shift.event.resolved, true);
});

test('published criteria protect equal treatment while documentation still costs real time', () => {
  const base = dayPlan(2);
  const informal = atOrder(configure(base, { rules: 'discretion' }), 2);
  const formal = atOrder(configure(base, { rules: 'formal' }), 2);
  const a = doWork(informal, correctAction(getOrder(informal)));
  const b = doWork(formal, correctAction(getOrder(formal)));
  assert.ok(b.shift.minutes > a.shift.minutes, 'Written records should cost time during routine work.');
  const ra = chooseEvent(a, 'escalate');
  const rb = chooseEvent(b, 'escalate');
  assert.equal(Math.round((ra.shift.minutes - a.shift.minutes) * 10) / 10, 5);
  assert.equal(Math.round((rb.shift.minutes - b.shift.minutes) * 10) / 10, 4);
  assert.equal(rb.metrics.trust - b.metrics.trust, (ra.metrics.trust - a.metrics.trust) + 4);
  assert.match(rb.shift.event.outcome, /prevented preferential treatment/);
  const bypass = chooseEvent(b, 'bypass');
  assert.ok(bypass.metrics.trust < b.metrics.trust, 'A written policy cannot protect anyone when it is bypassed.');
  assert.equal(bypass.capabilities.unloggedException, true);
});

test('unrecorded exceptions impose a later cost, not an immediate invented injury', () => {
  let s = dayPlan(2);
  s = nextShift(finish(s, { event: 'bypass' }));
  s = nextShift(finish(s));
  const working = startShift(s);
  assert.equal(working.shift.setup.find((x) => x.label.includes('unrecorded')).minutes, 3);
  assert.equal(working.phase, 'work');
  assert.equal(working.metrics.raw, 24);
});

function optimizedDay3(incentive) {
  let state = createGame(3008);
  for (let day = 0; day < 3; day += 1) {
    const policies = { method: 'study', training: 'train' };
    if (day >= 1) policies.division = 'specialist';
    if (day >= 2) policies.authority = 'gangplank';
    state = configure(state, policies);
    state = nextShift(finish(state, { action: (s, order) => ({ inspect: order.damaged, pace: 'steady' }) }));
  }
  return configure(state, { incentive });
}

test('only actual above-target performance ratchets, and a guarantee prevents it', () => {
  const base = optimizedDay3('ratchet');
  const high = finish(base, { event: 'flexible', action: () => ({ pace: 'rush' }) });
  assert.ok(high.shift.onTime > high.shift.target, `Need an above-target fixture, got ${high.shift.onTime}/${high.shift.target}.`);
  assert.equal(high.capabilities.ratchetTarget, high.shift.target + 1);
  assert.equal(high.capabilities.ratchetRate, 2.5);
  const next = startShift(nextShift(high));
  assert.equal(next.shift.target, 6);
  assert.ok(next.metrics.trust < high.metrics.trust);
  const protectedRun = finish(base, { event: 'guarantee', action: () => ({ pace: 'rush' }) });
  assert.equal(protectedRun.capabilities.ratchetTarget, 0);
  assert.equal(protectedRun.capabilities.ratchetRate, 3);
  const weak = finish(base, { event: 'flexible', action: () => ({ rest: true }) });
  assert.ok(weak.shift.onTime <= weak.shift.target);
  assert.equal(weak.capabilities.ratchetTarget, 0);
  const stable = finish(optimizedDay3('piece'), { event: 'flexible', action: () => ({ pace: 'rush' }) });
  assert.equal(stable.capabilities.ratchetTarget, 0);
  assert.equal(stable.shift.result.pieceRate, 3);
  assert.equal(stable.shift.wages, 18 + stable.shift.shipped * 3);
});

test('comparison replays the same starting state and actions and does not mutate the actual run', () => {
  const state = finish(dayPlan(4));
  const original = structuredClone(state);
  const identical = comparePolicies(state, {});
  assert.deepEqual(identical.actual, identical.alternative);
  const comparison = comparePolicies(state, { rules: 'formal' });
  assert.deepEqual(comparison.actual.actions.map((a) => a.input), comparison.alternative.actions.map((a) => a.input));
  assert.deepEqual(comparison.actual.baseline.metrics, comparison.alternative.baseline.metrics);
  assert.equal(comparison.actual.eventChoice, comparison.alternative.eventChoice);
  assert.equal(comparison.alternative.policies.rules, 'formal');
  assert.deepEqual(state, original);
  assert.equal(comparison.changes.length, 1);
  assert.match(comparison.assumptions, /model projections/);
});

test('every phase, interrupted or resumed, round-trips as a compact replay', () => {
  const states = [];
  let s = configure(createGame(9001), { method: 'study', training: 'train' });
  states.push(s);
  for (let day = 0; day < 5; day += 1) {
    s = startShift(s);
    states.push(s);
    for (let i = 0; i < 6; i += 1) {
      if (i === 3) { s = chooseEvent(s, defaultEvents[day]); states.push(s); }
      s = doWork(s, correctAction(getOrder(s)));
      states.push(s);
    }
    s = nextShift(s);
    states.push(s);
  }
  for (const state of states) {
    const text = serializeState(state);
    assert.ok(text.length < 2000, `Replay unexpectedly large: ${text.length}.`);
    assert.deepEqual(deserializeState(text), state);
    assert.equal(validateState(state), true);
  }
});

test('untrusted saved games are validated and stats are recomputed', () => {
  const good = JSON.parse(serializeState(startShift(createGame())));
  const variants = [
    '', '{', 'null', '[]', JSON.stringify({ ...good, v: 99 }),
    JSON.stringify({ ...good, seed: -1 }), JSON.stringify({ ...good, phase: 'invalid' }),
    JSON.stringify({ ...good, phase: 'debrief' }),
    JSON.stringify({ ...good, runs: [{ ...good.runs[0], a: [0, 0, 2] }] }),
    JSON.stringify({ ...good, runs: [{ ...good.runs[0], p: [0, 0, 1, 0, 0, 0] }] }),
    JSON.stringify({ ...good, runs: [{ ...good.runs[0], w: [[99, 0, 0, 0, 0]] }] }),
    JSON.stringify({ ...good, runs: [{ ...good.runs[0], w: [[1, 'true', 0, 0, 0]] }] }),
    JSON.stringify({ ...good, runs: [{ ...good.runs[0], e: 'test' }] }),
    JSON.stringify({ ...good, runs: [good.runs[0], good.runs[0]] }),
    ' '.repeat(12001),
  ];
  for (const value of variants) assert.throws(() => deserializeState(value));
  const data = { ...good, metrics: { wages: 999999 }, html: '<script>alert(1)</script>' };
  const rebuilt = deserializeState(JSON.stringify(data));
  assert.equal(rebuilt.metrics.wages, 0);
  assert.equal('html' in rebuilt, false);
  const tampered = startShift(createGame());
  tampered.metrics.wages = 999;
  assert.equal(validateState(tampered), false);
});

test('many scenarios preserve finite, bounded metrics through repeated high-pressure choices', () => {
  for (let seed = 0; seed < 24; seed += 1) {
    let s = createGame(seed);
    for (let day = 0; day < 5; day += 1) {
      s = finish(s, { event: ['follow', 'stretch', 'bypass', 'flexible', 'continue'][day], action: (_, order) => ({ inspect: false, pace: 'rush', pack: 'mailer', bin: BINS[(BINS.indexOf(order.bin) + seed % 3) % BINS.length] }) });
      assert.ok(Object.values(s.metrics).every(Number.isFinite));
      assert.ok(s.metrics.fatigue >= 0 && s.metrics.fatigue <= 100);
      assert.ok(s.metrics.trust >= 0 && s.metrics.trust <= 100);
      assert.equal(s.metrics.raw, s.metrics.shipped + s.metrics.defects);
      assert.ok(s.shift.minutes > 0);
      assert.ok(s.shift.onTime <= s.shift.shipped);
      s = nextShift(s);
    }
  }
});

test('the submission record includes actual decisions, evidence and a clear submission boundary', () => {
  const result = reportText(finish(createGame()));
  assert.match(result, /Good orders on time/);
  assert.match(result, /Policies:/);
  assert.match(result, /Staffing:/);
  assert.match(result, /6\/6 orders inspected/);
  assert.match(result, /good orders per simulated hour/);
  assert.match(result, /Test the suggestion together/);
  assert.match(result, /fictional/);
  assert.match(result, /does not send work to an instructor/);
  assert.equal(POLICY_DEFS.length, 6);
  assert.equal(WORKERS.length, 3);
  assert.equal(DAYS.length, 5);
});

test('model 3 shelf is stable within a shift with exactly one target SKU and close-code distractors', () => {
  for (let seed = 0; seed < 12; seed += 1) {
    let s = createGame(seed);
    for (let day = 0; day < 5; day += 1) {
      s = startShift(s);
      const shelf = getShelf(s);
      assert.equal(shelf.length, 9);
      assert.equal(new Set(shelf.map((entry) => entry.bin)).size, 9);
      assert.equal(new Set(shelf.map((entry) => entry.sku)).size, 9);
      assert.ok(shelf.every((entry) => typeof entry.icon === 'string' && /^#[0-9a-f]{6}$/i.test(entry.color)));
      if (day > 0) {
        assert.equal(new Set(shelf.map((entry) => entry.item)).size, 3);
        for (const family of [0, 1, 2]) {
          const variants = shelf.filter((entry) => entry.family === family);
          assert.equal(variants.length, 3);
          assert.equal(new Set(variants.map((entry) => entry.item)).size, 1);
          assert.equal(new Set(variants.map((entry) => entry.icon)).size, 1);
        }
      }
      for (let index = 0; index < 6; index += 1) {
        if (index === 3) s = chooseEvent(s, defaultEvents[day]);
        const order = getOrder(s);
        const matching = shelf.filter((entry) => entry.sku === order.sku);
        assert.equal(matching.length, 1);
        assert.equal(matching[0].bin, order.bin);
        assert.equal(matching[0].item, order.item);
        assert.equal(matching[0].fragile, order.fragile);
        const signature = order.sku.split('-')[1].split('').sort().join('');
        assert.equal(shelf.filter((entry) => entry.sku !== order.sku && entry.sku.split('-')[1].split('').sort().join('') === signature).length, 2);
        s = doWork(s, correctAction(order));
        assert.deepEqual(getShelf(s), shelf);
      }
      s = nextShift(s);
    }
  }
});

test('quantity difficulty progresses, stays within capacity rules and preserves good-order accounting', () => {
  let s = createGame(3008);
  for (let day = 0; day < 5; day += 1) {
    s = startShift(s);
    const quantities = new Set(s.shift.orders.map((order) => order.quantity));
    assert.deepEqual([...quantities].sort(), day === 0 ? [1] : day === 1 ? [1, 2] : [1, 2, 3]);
    for (const order of s.shift.orders) assert.equal(order.requiresBox, order.fragile || order.quantity === 3);
    s = finish(s);
    assert.equal(s.shift.shipped, 6);
    assert.equal(s.shift.defects, 0);
    assert.equal(s.shift.raw, 6, 'Productivity counts completed orders, not the number of units inside them.');
    s = nextShift(s);
  }
});

test('wrong quantities can escape or be caught and reworked; additional picked units consume time', () => {
  const s = startShift(createGame(3008));
  const order = getOrder(s);
  assert.equal(order.quantity, 1);
  const right = doWork(s, correctAction(order, { inspect: false }));
  const wrong = doWork(s, correctAction(order, { quantity: 2, inspect: false }));
  const caught = doWork(s, correctAction(order, { quantity: 2, inspect: true }));
  assert.equal(wrong.shift.actions[0].good, false);
  assert.ok(wrong.shift.actions[0].escapedIssues.some((issue) => issue.includes('Incorrect quantity')));
  assert.equal(caught.shift.actions[0].good, true);
  assert.ok(caught.shift.actions[0].interceptedIssues.some((issue) => issue.includes('requested 1, packed 2')));
  assert.equal(Math.round((wrong.shift.minutes - right.shift.minutes) * 100) / 100, 0.15);
  assert.ok(caught.shift.minutes > wrong.shift.minutes);
  for (const quantity of [undefined, null, 0, 4, -1, 1.5, '2', NaN]) {
    assert.throws(() => doWork(s, correctAction(order, { quantity })), /quantity/);
  }
});

test('three nonfragile units require a box, while two fit in a mailer', () => {
  let s = dayPlan(3, 3008);
  s = startShift(s);
  const index = s.shift.orders.findIndex((order) => !order.fragile && order.quantity === 3);
  assert.ok(index >= 0, 'The fixture should contain the quantity-based packaging challenge.');
  s = atOrder(s, index);
  const order = getOrder(s);
  const mailer = doWork(s, correctAction(order, { pack: 'mailer', inspect: false }));
  const box = doWork(s, correctAction(order, { pack: 'box', inspect: false }));
  assert.ok(mailer.shift.actions[index].escapedIssues.includes('Mailer capacity is 2; three items need a box'));
  assert.equal(box.shift.actions[index].issues.includes('Mailer capacity is 2; three items need a box'), false);
  const corrected = doWork(s, correctAction(order, { pack: 'mailer', inspect: true }));
  assert.equal(corrected.shift.actions[index].good, true);
  assert.ok(corrected.shift.actions[index].interceptedIssues.includes('Mailer capacity is 2; three items need a box'));
  let t = startShift(dayPlan(1, 3008));
  const twoIndex = t.shift.orders.findIndex((candidate) => !candidate.fragile && candidate.quantity === 2);
  assert.ok(twoIndex >= 0);
  t = atOrder(t, twoIndex);
  const two = doWork(t, correctAction(getOrder(t), { pack: 'mailer', inspect: false }));
  assert.equal(two.shift.actions[twoIndex].issues.some((issue) => issue.includes('capacity')), false);
});

test('model-3 replays use strict six-value actions, including the exact picked quantity', () => {
  let s = startShift(createGame(3008));
  s = doWork(s, correctAction(getOrder(s), { quantity: 2 }));
  const data = JSON.parse(serializeState(s));
  assert.equal(data.v, 3);
  assert.equal(data.runs[0].w[0].length, 6);
  assert.equal(data.runs[0].w[0][5], 2);
  assert.deepEqual(deserializeState(JSON.stringify(data)), s);
  for (const bad of [0, 4, 1.5, '1', null]) {
    const altered = structuredClone(data);
    altered.runs[0].w[0][5] = bad;
    assert.throws(() => deserializeState(JSON.stringify(altered)), /quantity/);
  }
  const short = structuredClone(data);
  short.runs[0].w[0].pop();
  assert.throws(() => deserializeState(JSON.stringify(short)), /order decision/);
  const hybrid = structuredClone(data);
  hybrid.v = 2;
  assert.throws(() => deserializeState(JSON.stringify(hybrid)), /order decision/);
});

test('a deployed model-2 snapshot preserves its entire state and original five-value action semantics', () => {
  // Captured from the deployed v2 engine before any v3 generation/accounting changes.
  const golden = '{"v":2,"seed":3008,"phase":"debrief","runs":[{"p":[1,1,0,0,0,0],"a":[0,1,2],"w":[[3,1,1,0,0],[4,0,1,0,0],[0,1,1,0,0],[4,1,1,0,0],[0,1,1,0,0],[3,1,1,0,0]],"e":"test"},{"p":[1,1,1,0,0,0],"a":[0,1,2],"w":[[0,1,1,0,0],[2,1,1,0,0],[0,1,1,0,0],[6,0,1,0,0],[2,0,1,0,0],[5,0,1,0,0]],"e":"rotate"},{"p":[1,1,1,1,1,0],"a":[0,1,2],"w":[[0,0,1,0,0],[0,1,1,0,0],[2,0,1,0,0],[5,1,1,0,0],[1,0,1,0,0],[3,0,1,0,0]],"e":"coordinate"},{"p":[1,1,1,1,1,2],"a":[0,1,2],"w":[[2,1,1,1,0],[5,1,1,1,0],[1,0,1,1,0],[7,1,1,1,0],[0,0,1,1,0],[2,0,1,1,0]],"e":"flexible"},{"p":[1,1,1,1,1,2],"a":[0,1,2],"w":[[6,0,1,1,1],[8,1,1,1,0],[2,1,1,1,0],[4,0,1,1,0],[6,1,1,1,0],[5,1,1,1,0]],"e":"document"}],"plan":null}';
  const state = deserializeState(golden);
  assert.equal(state.version, 2);
  assert.equal(createHash('sha256').update(JSON.stringify(state)).digest('hex'), 'b610b1a74502fbdfa9906944baaef27ddfdc7379510f2788281eab850be8bc0c');
  assert.equal(serializeState(state), golden);
  assert.equal(validateState(state), true);
  assert.match(reportText(state), /model 2/);
  const active = startShift(createGame(3008, 2));
  assert.equal(getOrder(active).bin, 'B1');
  assert.equal('quantity' in getOrder(active), false);
  const action = { bin: 'B1', pack: 'box', inspect: true, pace: 'steady', rest: false };
  const after = doWork(active, action);
  assert.deepEqual(after.shift.actions[0].input, action);
  assert.equal(JSON.parse(serializeState(after)).runs[0].w[0].length, 5);
  assert.deepEqual(deserializeState(serializeState(after)), after);
  assert.equal(getShelf(active).filter((entry) => entry.bin === 'B1').length, 1);
});
