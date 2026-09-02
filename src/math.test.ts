import { buildReminderBody, computeDailyTarget } from './math';
import type { Contribution, MockSpend } from './types';

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const emptyC: Contribution[] = [];
const emptyS: MockSpend[] = [];

{
  const r = computeDailyTarget({
    goalCents: 100_00,
    contributions: emptyC,
    mockSpends: emptyS,
    groupId: 'g1',
    tripDate: '2026-09-12',
    memberCount: 2,
    now: new Date('2026-09-02T12:00:00'),
  });
  assert(r.dailyTarget === 500, 'expected 500 got ' + r.dailyTarget);
  assert(r.status === 'on_track', 'on_track');
}

{
  const r = computeDailyTarget({
    goalCents: 100_00,
    contributions: [{ id: 'c', groupId: 'g1', userId: 'u', amountCents: 100_00, createdAt: '2026-09-01T00:00:00.000Z' }],
    mockSpends: emptyS,
    groupId: 'g1',
    tripDate: '2026-09-12',
    memberCount: 2,
    now: new Date('2026-09-02T12:00:00'),
  });
  assert(r.dailyTarget === 0 && r.status === 'goal_reached', 'reached');
  assert(r.copy === 'Goal reached', 'goal msg');
}

{
  const r = computeDailyTarget({
    goalCents: 100_00,
    contributions: [{ id: 'c', groupId: 'g1', userId: 'u', amountCents: 20_00, createdAt: '2026-09-01T00:00:00.000Z' }],
    mockSpends: emptyS,
    groupId: 'g1',
    tripDate: '2026-08-01',
    memberCount: 2,
    now: new Date('2026-09-02T12:00:00'),
  });
  assert(r.status === 'past_due', 'past_due');
  assert(r.dailyTarget === 80_00, 'past due target ' + r.dailyTarget);
  assert(r.copy.includes('Trip date passed'), 'past due copy');
}

{
  const r = computeDailyTarget({
    goalCents: 100_00,
    contributions: [{ id: 'c', groupId: 'g1', userId: 'u', amountCents: 40_00, createdAt: '2026-09-01T00:00:00.000Z' }],
    mockSpends: [{ id: 's', groupId: 'g1', amountCents: 10_00, createdAt: '2026-09-01T00:00:00.000Z' }],
    groupId: 'g1',
    tripDate: '2026-09-05',
    memberCount: 2,
    now: new Date('2026-09-02T12:00:00'),
  });
  assert(r.pot === 30_00, 'pot');
  assert(r.dailyTarget === 1167, 'ceil ' + r.dailyTarget);
}

console.log('src/math.test.ts OK');

{
  const body = buildReminderBody({
    status: 'on_track',
    dailyTarget: 12_00,
    copy: 'Deposit $12 today',
  });
  assert(body === 'Deposit $12 today', 'on_track reminder');
}

{
  const body = buildReminderBody({
    status: 'past_due',
    dailyTarget: 80_00,
    copy: 'Trip date passed — $80 still to go',
  });
  assert(
    body === 'Trip date passed — $80 still to go; Catch up — deposit $80',
    'past_due reminder ' + body
  );
}

{
  const body = buildReminderBody({
    status: 'goal_reached',
    dailyTarget: 0,
    copy: 'Goal reached',
  });
  assert(body === null, 'goal_reached suppresses reminder');
}

console.log('src/notifications reminder copy OK');
