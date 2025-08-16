# 🏎️ 赛车起跑反应游戏开发文档

## 游戏概述

**游戏名称**: 赛车起跑反应  
**英文名称**: Racing Reaction Start  
**游戏类型**: 多人竞速反应游戏  
**核心玩法**: 模拟F1赛车起跑反应测试，考验玩家的反应速度和时机把握

## 游戏规则详解

### 信号灯系统
- **红灯阶段**: 5盏红灯，每隔1秒亮起一盏
- **红灯全亮**: 5盏红灯全部亮起后维持状态
- **绿灯转换**: 在随机时间(1.5-5秒)后，5盏红灯同时变为绿灯
- **起跑时机**: 绿灯亮起瞬间为最佳起跑时机

### 游戏流程
1. **准备阶段**: 玩家选择人数(1-4人)和轮数(3-10轮)
2. **信号灯倒计时**: 红灯依次亮起
3. **随机等待**: 红灯全亮后的随机等待时间
4. **绿灯亮起**: 起跑信号出现
5. **玩家反应**: 按下对应起跑键
6. **结果记录**: 计算反应时间并排名
7. **积分计算**: 根据排名获得积分
8. **多轮循环**: 重复2-7步直至完成所有轮次

### 反应时间计算
- **测量起点**: 绿灯亮起瞬间
- **测量终点**: 玩家按下起跑键时刻
- **时间单位**: 毫秒(ms)
- **有效范围**: 0-2000ms
- **抢跑定义**: 绿灯亮起前按键(反应时间<0ms)

## 多人游戏机制

### 玩家配置
| 玩家 | 起跑键 | 显示颜色 | 初始积分 |
|------|--------|----------|----------|
| 玩家1 | Space键 | 🔴红色 | 0分 |
| 玩家2 | Enter键 | 🔵蓝色 | 0分 |
| 玩家3 | A键 | 🟢绿色 | 0分 |
| 玩家4 | L键 | 🟡黄色 | 0分 |

### 积分系统

#### 基础积分规则
- **第1名**: 10分
- **第2名**: 7分  
- **第3名**: 5分
- **第4名**: 3分
- **参与分**: 1分(保底)

#### 特殊积分调整
- **最快反应奖励**: 额外+5分(反应时间<200ms)
- **抢跑惩罚**: -5分并失去本轮得分机会
- **完美起跑**: 连续3轮进入前2名，额外+10分

#### 积分计算示例
```
场景: 4人游戏第3轮
玩家A: 180ms (第1名) → 10 + 5(最快) = 15分
玩家B: 250ms (第2名) → 7分
玩家C: 抢跑 → -5分
玩家D: 380ms (第3名) → 5分
```

## 游戏状态管理

### 游戏状态机
```
enum GameState {
    Waiting,        // 等待玩家加入
    Countdown,      // 红灯倒计时
    Ready,         // 红灯全亮等待
    Racing,        // 绿灯亮起，可起跑
    Finished,      // 本轮结束
    GameOver      // 游戏结束
}
```

### 玩家数据结构
```rust
struct Player {
    id: u8,
    name: String,
    key: char,
    color: String,
    score: i32,
    reaction_times: Vec<f64>,
    is_ready: bool,
}

struct GameRound {
    round_number: u8,
    player_results: Vec<PlayerResult>,
    fastest_time: Option<f64>,
    penalties: Vec<Penalty>,
}
```

## 前端界面设计

### 游戏界面布局
```
┌─────────────────────────────────────────┐
│ 🏁 赛车起跑反应游戏                        │
├─────────────────────────────────────────┤
│ 信号灯区域    │   玩家状态区域               │
│ ┌─┐ ┌─┐     │   ┌─────────────┐           │
│ │🔴│ │🔴│     │   │ 玩家1: 0分   │ 红色      │
│ └─┘ └─┘     │   │ 玩家2: 0分   │ 蓝色      │
│ ┌─┐ ┌─┐     │   │ 玩家3: 0分   │ 绿色      │
│ │🔴│ │🔴│     │   │ 玩家4: 0分   │ 黄色      │
│ └─┘ └─┘     │   └─────────────┘           │
│ ┌─┐         │                             │
│ │🔴│         │   排行榜                    │
│ └─┘         │   ┌─────────────┐           │
│             │   │ 第1轮结果... │           │
│             │   └─────────────┘           │
├─────────────────────────────────────────┤
│ 控制面板: [开始游戏] [重置] [设置]        │
└─────────────────────────────────────────┘
```

### 响应式设计
- **桌面端**: 完整布局，信号灯居中
- **平板端**: 两栏布局，信号灯稍小
- **手机端**: 单栏布局，信号灯垂直排列

### 动画效果
- **红灯亮起**: 渐变点亮效果(300ms)
- **绿灯转换**: 闪烁后稳定(500ms)
- **按键反馈**: 按下时按钮缩放(100ms)
- **结果展示**: 滑动显示动画(800ms)

## API端点设计

### 游戏管理API

#### 创建游戏
```http
POST /api/racing/create
Content-Type: application/json

{
  "player_count": 2,
  "round_count": 5,
  "player_names": ["玩家1", "玩家2"]
}

Response:
{
  "game_id": "race_12345",
  "status": "waiting",
  "players": [...]
}
```

#### 开始游戏
```http
POST /api/racing/start/{game_id}
Response: { "status": "started" }
```

#### 玩家准备
```http
POST /api/racing/ready
{
  "game_id": "race_12345",
  "player_id": 1
}
```

#### 记录反应
```http
POST /api/racing/react
{
  "game_id": "race_12345",
  "player_id": 1,
  "reaction_time": 180.5,
  "is_false_start": false
}
```

#### 获取游戏状态
```http
GET /api/racing/status/{game_id}
Response: {
  "current_round": 3,
  "game_state": "racing",
  "players": [...],
  "light_status": "green",
  "round_results": [...]
}
```

### WebSocket实时通信
```javascript
// 客户端连接
const socket = new WebSocket('ws://localhost:8082/racing/{game_id}');

// 接收事件
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'light_change': updateLights(data.lights);
    case 'player_joined': addPlayer(data.player);
    case 'round_result': showResult(data.result);
  }
};
```

## 技术实现要点

### 随机时间算法
```rust
use rand::Rng;

fn get_random_delay() -> Duration {
    let mut rng = rand::thread_rng();
    let delay_ms = rng.gen_range(1500..=5000);
    Duration::from_millis(delay_ms)
}
```

### 防作弊机制
- **时间同步**: 服务器时间戳验证
- **输入验证**: 检测异常反应时间(<50ms或>2000ms)
- **重复提交**: 防止同一玩家多次提交
- **网络延迟补偿**: 计算网络延迟影响

### 性能优化
- **WebSocket连接池**: 管理多人实时连接
- **缓存策略**: 缓存游戏状态减少数据库查询
- **前端防抖**: 防止按键误触(50ms防抖)

## 测试用例

### 单元测试
```rust
#[test]
fn test_reaction_time_calculation() {
    let green_time = Instant::now();
    let press_time = green_time + Duration::from_millis(180);
    let reaction = calculate_reaction_time(green_time, press_time);
    assert_eq!(reaction, 180.0);
}

#[test]
fn test_false_start_detection() {
    let green_time = Instant::now();
    let press_time = green_time - Duration::from_millis(50);
    assert!(is_false_start(green_time, press_time));
}
```

### 集成测试
- 2人完整游戏流程测试
- 抢跑场景测试
- 网络延迟处理测试
- 并发玩家测试

## 扩展功能规划

### 第一阶段 (MVP)
- ✅ 基础信号灯系统
- ✅ 1-4人游戏支持
- ✅ 基础积分系统
- ✅ 实时结果显示

### 第二阶段
- 🔄 游戏历史记录
- 🔄 个人最佳时间追踪
- 🔄 音效和震动反馈
- 🔄 自定义按键绑定

### 第三阶段
- 🔄 在线排行榜
- 🔄 房间系统(邀请好友)
- 🔄 观战模式
- 🔄 成就系统

## 部署和监控

### 部署配置
```yaml
# docker-compose.yml
version: '3.8'
services:
  racing-game:
    build: .
    ports:
      - "8082:8082"
    environment:
      - RUST_LOG=info
      - MAX_PLAYERS=4
      - GAME_TIMEOUT=300
```

### 监控指标
- 平均反应时间
- 抢跑率统计
- 游戏完成率
- 玩家留存率
- WebSocket连接数

## 用户反馈收集

### 游戏内反馈
- 每轮结束后快速评分(1-5星)
- 游戏结束时详细反馈表单
- 一键报告问题功能

### 数据分析
- 反应时间分布图
- 玩家技能成长曲线
- 热门游戏配置统计
- 流失点分析

---

## 开发时间线

| 阶段 | 时间 | 主要任务 |
|------|------|----------|
| 第1周 | 设计+基础框架 | API设计、状态管理、基础UI |
| 第2周 | 核心功能 | 信号灯系统、反应计时、积分计算 |
| 第3周 | 多人支持 | WebSocket、玩家管理、实时同步 |
| 第4周 | 优化+测试 | 性能优化、测试用例、用户体验 |
| 第5周 | 扩展功能 | 历史记录、排行榜、音效 |

**项目负责人**: [待指定]  
**技术栈**: Rust + WebSocket + JavaScript  
**目标用户**: 反应训练爱好者、多人游戏玩家