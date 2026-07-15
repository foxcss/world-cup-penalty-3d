# Arcade UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页、选队页与比赛 HUD 升级为统一的桌面优先街机贴纸风，并增加每场一个不影响胜负概率的赛场任务。

**Architecture:** Three.js 游戏主体继续保留在 `index.html`。纯赛场任务状态机拆到 `game-missions.js`，由页面模块导入并通过 `node:test` 独立验证；视觉与 DOM 渲染仍在 `index.html` 内，避免重构现有动画和输入系统。

**Tech Stack:** HTML/CSS、原生 ES Modules、Three.js 0.160、Node.js `node:test`

---

### Task 1: 赛场任务状态机

**Files:**
- Create: `game-missions.js`
- Create: `tests/game-missions.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatchMission, updateMission } from '../game-missions.js';

test('createMatchMission uses the injected random source', () => {
  assert.equal(createMatchMission(() => 0).type, 'combo2');
  assert.equal(createMatchMission(() => 0.99).type, 'captain_goal');
});

test('curve goal only completes the curve mission', () => {
  const mission = createMatchMission(() => 0.3);
  assert.equal(updateMission(mission, { kind:'goal', curve:0.6 }).complete, true);
});

test('combo, save and captain events complete matching missions', () => {
  assert.equal(updateMission(createMatchMission(() => 0), { kind:'goal', combo:2 }).complete, true);
  assert.equal(updateMission(createMatchMission(() => 0.6), { kind:'save' }).complete, true);
  assert.equal(updateMission(createMatchMission(() => 0.99), { kind:'goal', captain:true }).complete, true);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/game-missions.test.mjs`

Expected: FAIL，提示找不到 `game-missions.js`。

- [ ] **Step 3: 实现最小状态机**

```js
export const MISSION_TYPES = ['combo2', 'curve_goal', 'save', 'captain_goal'];

export function createMatchMission(random = Math.random) {
  const index = Math.min(MISSION_TYPES.length - 1, Math.floor(random() * MISSION_TYPES.length));
  return { type: MISSION_TYPES[index], progress:0, complete:false };
}

export function updateMission(mission, event) {
  if (!mission || mission.complete) return mission;
  const complete =
    (mission.type === 'combo2' && event.kind === 'goal' && event.combo >= 2) ||
    (mission.type === 'curve_goal' && event.kind === 'goal' && Math.abs(event.curve || 0) >= 0.35) ||
    (mission.type === 'save' && event.kind === 'save') ||
    (mission.type === 'captain_goal' && event.kind === 'goal' && event.captain === true);
  return complete ? { ...mission, progress:1, complete:true } : mission;
}
```

- [ ] **Step 4: 运行测试并确认通过**

Run: `node --test tests/game-missions.test.mjs`

Expected: 3 tests PASS。

### Task 2: 首页与选队页语义结构

**Files:**
- Modify: `index.html:288-314`

- [ ] **Step 1: 用新的首页结构替换居中堆叠布局**

新增 `.menu-shell`、`.menu-copy`、`.menu-poster`、`.menu-features`，保留 `menuTitle`、`feat1..4`、`langSel`、`btnStart` ID，确保现有多语言与加载状态无需迁移。

- [ ] **Step 2: 用英雄选队结构替换 `#roster` 网格容器**

```html
<div class="select-shell">
  <nav id="roster" class="team-rail" aria-label="Teams"></nav>
  <section id="teamHero" class="team-hero" aria-live="polite"></section>
  <aside class="team-sheet">
    <div id="teamStats"></div>
    <div id="teamSquad"></div>
    <div id="selCount"></div>
    <button class="bigbtn" id="btnKickoff" disabled></button>
  </aside>
</div>
```

- [ ] **Step 3: 改写 `buildTeams()` 与 `refreshTeams()`**

`buildTeams()` 只生成 8 个带 `button` 语义的球队导航项；`refreshTeams()` 同步选中态，并根据 `pickedTeam` 渲染 `teamHero`、`teamStats` 和 `teamSquad`。首次进入选队页默认选择 `TEAMS[0]`，减少一次无意义点击。

- [ ] **Step 4: 增加键盘切队**

在 `SELECT` 状态下监听 `ArrowUp/ArrowLeft` 与 `ArrowDown/ArrowRight`，循环更新 `pickedTeam` 并调用 `refreshTeams()`；保留空格用于局内操作。

### Task 3: 统一街机视觉系统

**Files:**
- Modify: `index.html:16-252`

- [ ] **Step 1: 增加设计 token**

```css
:root {
  --ink:#10182b; --navy:#071426; --panel:#101f38;
  --gold:#ffd83d; --green:#55ed8b; --coral:#ff526b;
  --sky:#6dd4ff; --paper:#fff9e9; --line:3px solid var(--ink);
  --hard-shadow:6px 6px 0 var(--ink);
}
```

- [ ] **Step 2: 重做首页与选队 CSS**

桌面端首页为两栏海报，选队为 `220px minmax(360px,1fr) 320px` 三栏；小于 820px 时改为单栏并让球队导航横向滚动。按钮、球队项、语言项均提供至少 44px 高度及 `:focus-visible`。

- [ ] **Step 3: 重做 HUD CSS**

比分、阶段、风力、声音和任务卡使用同一深色玻璃面板、粗描边和硬阴影；保留已有 ID 和显示逻辑。操作按钮与力度/弧线控件统一为街机面板。

- [ ] **Step 4: 增加 reduced-motion**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms!important; animation-iteration-count:1!important; transition-duration:.01ms!important; }
}
```

### Task 4: 接入赛场任务 UI 与结算

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 导入任务模块并扩展状态**

```js
import { createMatchMission, updateMission } from './game-missions.js';
// G 新增 mission:null, missionCompleted:0
```

- [ ] **Step 2: 增加任务 HUD 和结算统计 DOM**

新增 `missionCard`、`missionTitle`、`missionText`，并在 `endStats` 增加 `stMissions`/`kMissions`。多语言字典增加四种任务文本、任务标题、完成提示和结算标签。

- [ ] **Step 3: 在 `nextMatch()` 生成并渲染任务**

每场调用 `createMatchMission()`；`renderMission()` 根据 `G.mission.type` 写入多语言文本并切换 `.complete`。

- [ ] **Step 4: 在赛果路径更新任务**

玩家进球后发送 `{ kind:'goal', curve:G.curve, combo:G.combo + 1, captain:player.isStar }`；玩家扑救后发送 `{ kind:'save' }`。若状态由未完成变为完成，`missionCompleted++`，刷新 HUD 并延迟显示任务完成贴纸。

- [ ] **Step 5: 重开时清理任务 UI**

`startCup()` 重置累计数，`btnAgain` 隐藏任务卡；最终结算写入 `stMissions`。

### Task 5: 验证与视觉验收

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README**

将“单文件”改为“零构建静态 Three.js 游戏”，并在玩法中加入赛场任务说明。

- [ ] **Step 2: 跑自动检查**

Run: `node --test tests/game-missions.test.mjs`

Expected: PASS。

Run: `node --check game-missions.js`

Expected: 无输出、退出码 0。

Run: `git diff --check`

Expected: 无输出、退出码 0。

- [ ] **Step 3: 浏览器桌面验收**

Run: `python3 -m http.server 8612`

打开 `http://localhost:8612/`，检查首页、选队、开赛和任务 HUD；控制台无错误，1440×900 下无重叠。

- [ ] **Step 4: 浏览器窄屏验收**

在 390×844 检查无横向滚动，球队导航可横向滚动，开始按钮、语言按钮和局内操作按钮均可点击。

