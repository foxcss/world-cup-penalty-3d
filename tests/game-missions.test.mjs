import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatchMission, updateMission } from '../game-missions.js';

test('createMatchMission picks the first mission at the low random boundary', () => {
  assert.equal(createMatchMission(() => 0).type, 'combo2');
});

test('createMatchMission picks the last mission at the high random boundary', () => {
  assert.equal(createMatchMission(() => 0.99).type, 'captain_goal');
});

test('a curved goal completes the curve mission', () => {
  const mission = createMatchMission(() => 0.3);
  assert.equal(updateMission(mission, { kind:'goal', curve:0.6 }).complete, true);
});

test('a straight goal does not complete the curve mission', () => {
  const mission = createMatchMission(() => 0.3);
  assert.equal(updateMission(mission, { kind:'goal', curve:0.2 }).complete, false);
});

test('two consecutive goals complete the combo mission', () => {
  const firstGoal = updateMission(createMatchMission(() => 0), { kind:'goal' });
  assert.equal(firstGoal.progress, 1);
  assert.equal(updateMission(firstGoal, { kind:'goal' }).complete, true);
});

test('a miss resets combo mission progress', () => {
  const firstGoal = updateMission(createMatchMission(() => 0), { kind:'goal' });
  const missed = updateMission(firstGoal, { kind:'miss' });
  assert.equal(missed.progress, 0);
  assert.equal(updateMission(missed, { kind:'goal' }).complete, false);
});

test('a save completes the save mission', () => {
  const mission = createMatchMission(() => 0.6);
  assert.equal(updateMission(mission, { kind:'save' }).complete, true);
});

test('a captain goal completes the captain mission', () => {
  const mission = createMatchMission(() => 0.99);
  assert.equal(updateMission(mission, { kind:'goal', captain:true }).complete, true);
});

test('a completed mission stays complete without creating a new object', () => {
  const mission = { type:'save', progress:1, complete:true };
  assert.equal(updateMission(mission, { kind:'goal' }), mission);
});
