# 造物跑酷 Make It Run

> 群核科技 Aholo 全球 3D AI 黑客松参赛作品（单人）

把身边的物品交给 **Aholo Lux3D**，生成专属 3D 跑者，冲进由生成资产构成的跑酷世界。

- 在线试玩：https://oowpc.github.io/aholo-runner/
- 玩家角色：照片 → Lux3D 图生 3D → 导出 GLB
- 三个主题的障碍物与收集物：Lux3D 文生 3D → 导出 GLB
- 游戏内「造物档案」展示每个资产的提示词、用途与生成状态

## 玩法

| 操作 | 键盘 | 手机 |
|---|---|---|
| 换道 | ← → / A D | 左右滑动 |
| 跳跃 | 空格 / ↑ / W | 上滑或点按 |
| 翻滚 | ↓ / S | 下滑 |
| 暂停 | Esc | 右上角暂停按钮 |

躲开列车、跳过低障碍、翻滚穿过闸门，收集金币；撞击后结束，距离计入本地最佳纪录。

## 本地运行

```bash
npm install
npm run dev
npm run build
npm run preview
```

## 接入 Aholo Lux3D 资产

把导出的 GLB 放到 `public/models/`，文件名如下；启动时会自动加载并替换程序化占位模型，缺失时回退占位模型，不影响运行。

| 用途 | 文件名 |
|---|---|
| 玩家角色（图生 3D） | `player_plush.glb` |
| 雪地小屋 · 跳跃障碍 | `snow_obstacle_pine.glb` / `snow_obstacle_pile.glb` / `snow_obstacle_fence.glb` |
| 雪地小屋 · 金币 | `snow_pickup_ice.glb` |
| 古村探险 · 跳跃障碍 | `village_obstacle_lantern.glb` / `village_obstacle_well.glb` / `village_obstacle_basket.glb` |
| 古村探险 · 金币 | `village_pickup_coin.glb` |
| 赛博玩具城 · 跳跃障碍 | `toy_obstacle_blocks.glb` / `toy_obstacle_duck.glb` / `toy_obstacle_rocket.glb` |
| 赛博玩具城 · 金币 | `toy_pickup_gear.glb` |

建议：单模型 ≤ 20k 三角面、贴图 ≤ 1024、单文件 ≤ 2MB。导入后可在「造物档案」中把对应条目的 `generated` 改为 `true` 并补充截图。

## 技术栈

- Vite 8 + TypeScript + Three.js
- 固定步长游戏循环、对象生成/回收、程序化音效（Web Audio）
- 无后端；GitHub Pages 自动构建部署（`.github/workflows/deploy.yml`）

## 目录

```
src/
  data/      主题与资产元数据
  game/      游戏循环、玩家、赛道、障碍、模型加载、音效
  ui/        菜单、HUD、造物档案
public/models/  Lux3D 导出的 GLB
```

## 素材与声明

当前占位模型、粒子与音效均由代码生成，无第三方素材。接入的 Lux3D 生成资产按赛事规则使用。
