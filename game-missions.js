export const MISSION_TYPES = ['combo2', 'curve_goal', 'save', 'captain_goal'];

export function createMatchMission(random = Math.random) {
  const index = Math.min(MISSION_TYPES.length - 1, Math.floor(random() * MISSION_TYPES.length));
  return { type: MISSION_TYPES[index], progress:0, complete:false };
}

export function updateMission(mission, event) {
  if (!mission || mission.complete) return mission;

  if (mission.type === 'combo2') {
    if (event.kind === 'miss')
      return mission.progress === 0 ? mission : { ...mission, progress:0 };
    if (event.kind === 'goal') {
      const progress = mission.progress + 1;
      return { ...mission, progress, complete:progress >= 2 };
    }
    return mission;
  }

  const complete =
    (mission.type === 'curve_goal' && event.kind === 'goal' && Math.abs(event.curve || 0) >= 0.35) ||
    (mission.type === 'save' && event.kind === 'save') ||
    (mission.type === 'captain_goal' && event.kind === 'goal' && event.captain === true);

  return complete ? { ...mission, progress:1, complete:true } : mission;
}
