# 🎮 小游戏网站 - Rust游戏平台

一个功能完整的在线小游戏平台，使用Rust构建高性能后端，提供现代化的Web游戏体验。

## 🌟 项目亮点

### 核心功能
- 🦀 **Rust高性能后端**：基于tiny_http的轻量级HTTP服务器
- 🎨 **现代化响应式UI**：完美适配桌面和移动端
- 🎯 **经典猜数字游戏**：完整的游戏逻辑和用户体验
- 🏎️ **赛车起跑反应游戏**：多人竞速反应游戏 (开发中)
- 👥 **多人游戏支持**：实时对战模式
- 📊 **实时游戏统计**：进度跟踪、历史记录、成就系统
- 🔄 **完整API支持**：RESTful设计，JSON数据格式
- 🌐 **零依赖部署**：单文件可执行，跨平台支持

### 技术架构
- **后端**：Rust + tiny_http + serde_json + 线程安全状态管理
- **前端**：HTML5 + CSS3 + JavaScript ES6+ + 响应式设计
- **通信**：RESTful API + JSON + CORS跨域支持
- **部署**：Release模式编译，生产级性能

## 📁 项目结构

```
guess_number/
├── src/main.rs              # 完整的Rust后端服务器
├── static/
│   ├── index.html           # 网站首页
│   ├── guess-number.html    # 猜数游戏页面
│   ├── racing-game.html   # 赛车起跑反应游戏页面 (待开发)
│   ├── racing-game.js     # 赛车游戏逻辑 (待开发)
│   ├── styles.css         # 响应式样式系统
│   ├── script.js          # 网站交互逻辑
│   └── guess-number.js    # 游戏核心逻辑
├── docs/
│   ├── API_DOCUMENTATION.md    # 完整API文档
│   └── RACING_GAME_SPEC.md    # 赛车游戏开发文档
├── postman_collection.json     # Postman测试集合
├── test_api.bat            # Windows测试脚本
├── Cargo.toml              # Rust依赖配置
└── README.md               # 项目说明文档
```

## 🚀 快速开始

### 运行项目

**方法1：开发模式（推荐）**
```bash
cargo run
# 访问：http://localhost:8082
```

**方法2：生产模式**
```bash
cargo build --release
./target/release/guess_number
# 访问：http://localhost:8082
```

**方法3：Windows测试**
```bash
test_api.bat  # 自动测试所有API端点
```

### 访问地址
- **网站首页**：http://localhost:8082
- **猜数游戏**：http://localhost:8082/guess-number.html
- **移动端**：http://localhost:8082（响应式设计）

## 🎯 游戏功能

### 猜数字游戏
1. **智能范围提示**：实时显示当前猜测范围
2. **进度追踪**：记录猜测历史和统计信息
3. **成就系统**：根据表现解锁成就
4. **游戏重置**：随时开始新游戏
5. **响应式体验**：完美适配所有设备

### 网站功能
- **游戏中心**：展示所有可用游戏
- **排行榜**：查看最佳玩家记录
- **关于页面**：项目介绍和联系方式
- **移动优化**：触摸友好的界面设计

## 🔧 API文档

### 可用端点
| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 网站首页 |
| `/guess-number.html` | GET | 猜数游戏页面 |
| `/api/info` | GET | 获取游戏状态 |
| `/api/guess` | POST | 提交数字猜测 |
| `/api/reset` | POST | 重置游戏 |
| `/api/games` | GET | 获取游戏列表 |
| `/api/leaderboard` | GET | 获取排行榜 |
| `/api/racing/create` | POST | 创建游戏房间 |
| `/api/racing/start/{game_id}` | POST | 开始游戏 |
| `/api/racing/ready` | POST | 玩家准备 |
| `/api/racing/react` | POST | 记录反应时间 |
| `/api/racing/status/{game_id}` | GET | 获取游戏状态 |
| `WebSocket /racing/{game_id}` | WS | 实时通信

### 完整API文档
详见 [API_DOCUMENTATION.md](API_DOCUMENTATION.md) 文件，包含：
- 详细的端点说明
- 请求/响应示例
- 错误处理机制
- 测试用例和工具

### 快速测试
**使用Postman**：
1. 导入 `postman_collection.json`
2. 所有端点已配置完成
3. 一键测试所有功能

**使用cURL**：
```bash
# 获取游戏信息
curl http://localhost:8082/api/info

# 提交猜测
curl -X POST http://localhost:8082/api/guess \
  -H "Content-Type: application/json" \
  -d '{"guess": 50}'

# 重置游戏
curl -X POST http://localhost:8082/api/reset
```

## 🛠️ 开发环境

### 系统要求
- **Rust**：1.70+（推荐最新稳定版）
- **浏览器**：Chrome 60+、Firefox 55+、Safari 12+、Edge 79+
- **操作系统**：Windows、macOS、Linux（跨平台支持）

### 开发设置
```bash
# 克隆项目（如果有版本控制）
git clone [项目地址]
cd guess_number

# 安装依赖
cargo build

# 开发模式运行
cargo run

# 生产构建
cargo build --release
```

## 📊 性能特性

### 后端优化
- **Release模式**：生产级性能编译
- **内存安全**：Rust的内存安全保证
- **并发安全**：线程安全的游戏状态管理
- **轻量级**：最小运行时依赖

### 前端优化
- **响应式设计**：自适应所有屏幕尺寸
- **现代CSS**：Grid和Flexbox布局
- **性能优化**：最小化重绘和重排
- **移动优先**：触摸友好的交互设计

## 🎯 浏览器兼容性

| 浏览器 | 最低版本 | 支持状态 |
|--------|----------|----------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 12+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| 移动端浏览器 | - | ✅ 完全支持 |

## 🚀 扩展计划

### 赛车起跑反应游戏 (开发中)
- [ ] 信号灯动画系统
- [ ] 多人实时对战
- [ ] WebSocket通信
- [ ] 积分排行榜
- [ ] 音效和震动反馈

### 即将推出的功能
- [ ] **更多游戏**：2048、扫雷、井字棋等
- [ ] **难度系统**：简单/中等/困难模式
- [ ] **用户系统**：保存游戏进度和成就
- [ ] **实时对战**：多人游戏模式
- [ ] **主题商店**：自定义界面主题
- [ ] **音效系统**：游戏音效和背景音乐

### 技术升级
- [ ] **WebSocket**：实时通信支持
- [ ] **数据库**：持久化存储
- [ ] **缓存系统**：Redis性能优化
- [ ] **监控**：应用性能监控
- [ ] **日志**：结构化日志系统

## 📚 学习资源

### 文档资料
- [API文档](API_DOCUMENTATION.md) - 完整的API说明
- [Postman集合](postman_collection.json) - API测试工具
- [代码注释](src/main.rs) - 详细的代码注释

### 开发工具
- **IDE推荐**：VS Code + Rust插件
- **调试工具**：浏览器开发者工具
- **测试工具**：Postman、cURL、test_api.bat

## 📝 许可证

MIT License - 详见LICENSE文件

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📞 联系方式

- **项目地址**：`c:\Users\ck091\guess_number`
- **服务器端口**：8082
- **技术栈**：Rust + Web技术栈