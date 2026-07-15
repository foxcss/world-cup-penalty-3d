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

test('a two-goal combo completes the combo mission', () => {
  const mission = createMatchMission(() => 0);
  assert.equal(updateMission(mission, { kind:'goal', combo:2 }).complete, true);
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
