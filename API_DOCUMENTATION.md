# 小游戏网站 API 文档

## 项目概述
小游戏网站是一个基于Rust和Web技术构建的在线游戏平台，提供经典猜数字游戏功能。本API文档详细描述了所有可用的接口端点、请求格式和响应结构。

## 基础信息
- **Base URL**: `http://localhost:8082`
- **协议**: HTTP/1.1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **CORS**: 支持跨域请求

## 认证方式
当前版本为公开API，无需认证即可使用所有端点。

---

## API 端点

### 1. 获取游戏信息
获取当前游戏的状态信息，包括目标数字范围、已尝试次数等。

**端点信息**
- **URL**: `/api/info`
- **方法**: `GET`
- **描述**: 获取当前游戏状态

**请求示例**
```bash
curl -X GET http://localhost:8082/api/info
```

**响应示例**
```json
{
  "min_range": 1,
  "max_range": 100,
  "attempts": 0,
  "game_over": false,
  "elapsed_seconds": 15
}
```

**响应字段说明**
| 字段名 | 类型 | 描述 |
|--------|------|------|
| min_range | integer | 数字范围最小值 |
| max_range | integer | 数字范围最大值 |
| attempts | integer | 已尝试次数 |
| game_over | boolean | 游戏是否结束 |
| elapsed_seconds | integer | 游戏已进行时间（秒） |

---

### 2. 提交猜测
向游戏提交一个数字猜测，获取反馈结果。

**端点信息**
- **URL**: `/api/guess`
- **方法**: `POST`
- **描述**: 提交数字猜测

**请求格式**
- **Content-Type**: `application/json`

**请求示例**
```bash
curl -X POST http://localhost:8082/api/guess \
  -H "Content-Type: application/json" \
  -d '{"guess": 50}'
```

**请求体参数**
| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| guess | integer | 是 | 要猜测的数字（1-100） |

**响应示例**

**成功猜测**
```json
{
  "success": true,
  "message": "恭喜你猜对了！",
  "guess": 50,
  "attempts": 5,
  "game_over": true,
  "correct_number": 50
}
```

**猜测过大**
```json
{
  "success": true,
  "message": "太大了！",
  "guess": 75,
  "attempts": 3,
  "game_over": false
}
```

**猜测过小**
```json
{
  "success": true,
  "message": "太小了！",
  "guess": 25,
  "attempts": 2,
  "game_over": false
}
```

**响应字段说明**
| 字段名 | 类型 | 描述 |
|--------|------|------|
| success | boolean | 请求是否成功 |
| message | string | 反馈信息 |
| guess | integer | 用户猜测的数字 |
| attempts | integer | 当前总尝试次数 |
| game_over | boolean | 游戏是否结束 |
| correct_number | integer | 正确答案（仅游戏结束时返回） |

---

### 3. 重置游戏
重置当前游戏，生成新的目标数字。

**端点信息**
- **URL**: `/api/reset`
- **方法**: `POST`
- **描述**: 重置游戏状态

**请求示例**
```bash
curl -X POST http://localhost:8082/api/reset
```

**响应示例**
```json
{
  "success": true,
  "message": "游戏已重置",
  "new_range": "1-100",
  "attempts": 0
}
```

**响应字段说明**
| 字段名 | 类型 | 描述 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 成功提示信息 |
| new_range | string | 新的数字范围 |
| attempts | integer | 重置后的尝试次数（0） |

---

### 4. 获取游戏列表
获取平台提供的游戏列表。

**端点信息**
- **URL**: `/api/games`
- **方法**: `GET`
- **描述**: 获取可用游戏列表

**请求示例**
```bash
curl -X GET http://localhost:8082/api/games
```

**响应示例**
```json
[
  {
    "id": "guess-number",
    "name": "猜数字游戏",
    "description": "经典的猜数字游戏，挑战你的直觉和逻辑",
    "difficulty": "简单",
    "category": "益智",
    "image": "🎯",
    "url": "/guess-number.html"
  }
]
```

**响应字段说明**
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | string | 游戏唯一标识符 |
| name | string | 游戏名称 |
| description | string | 游戏描述 |
| difficulty | string | 难度等级 |
| category | string | 游戏类别 |
| image | string | 游戏图标 |
| url | string | 游戏页面链接 |

---

### 5. 获取排行榜
获取游戏排行榜信息。

**端点信息**
- **URL**: `/api/leaderboard`
- **方法**: `GET`
- **描述**: 获取排行榜数据

**请求示例**
```bash
curl -X GET http://localhost:8082/api/leaderboard
```

**响应示例**
```json
[
  {
    "player": "玩家1",
    "score": 950,
    "attempts": 5,
    "time": "2:30"
  },
  {
    "player": "玩家2",
    "score": 775,
    "attempts": 15,
    "time": "3:15"
  }
]
```

**响应字段说明**
| 字段名 | 类型 | 描述 |
|--------|------|------|
| player | string | 玩家名称 |
| score | integer | 得分 |
| attempts | integer | 完成游戏所用的尝试次数 |
| time | string | 完成时间 |

---

## 赛车游戏API端点

### 6. 创建赛车游戏
创建一个新的赛车起跑反应游戏房间。

**端点信息**
- **URL**: `/api/racing/create`
- **方法**: `POST`
- **描述**: 创建新的赛车游戏

**请求格式**
- **Content-Type**: `application/json`

**请求示例**
```bash
curl -X POST http://localhost:8082/api/racing/create \
  -H "Content-Type: application/json" \
  -d '{
    "player_count": 2,
    "round_count": 3,
    "player_names": ["张三", "李四"]
  }'
```

**请求体参数**
| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| player_count | integer | 是 | 玩家数量 (2-4) |
| round_count | integer | 是 | 游戏回合数 (1-5) |
| player_names | array[string] | 是 | 玩家名称列表 |

**响应示例**
```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "game_state": "Waiting",
  "players": [
    {"id": 1, "name": "张三", "score": 0, "key": " "},
    {"id": 2, "name": "李四", "score": 0, "key": "Enter"}
  ],
  "max_rounds": 3,
  "current_round": 0
}
```

---

### 7. 开始游戏回合
开始一个新的游戏回合，重置玩家状态。

**端点信息**
- **URL**: `/api/racing/start/{game_id}`
- **方法**: `POST`
- **描述**: 开始游戏回合

**请求示例**
```bash
curl -X POST http://localhost:8082/api/racing/start/550e8400-e29b-41d4-a716-446655440000
```

**响应示例**
```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "game_state": "Ready",
  "current_round": 1,
  "players": [
    {"id": 1, "name": "张三", "score": 0},
    {"id": 2, "name": "李四", "score": 0}
  ]
}
```

---

### 8. 触发绿灯信号
通知服务器绿灯已亮起，开始计时。

**端点信息**
- **URL**: `/api/racing/trigger/{game_id}`
- **方法**: `POST`
- **描述**: 触发绿灯信号

**请求示例**
```bash
curl -X POST http://localhost:8082/api/racing/trigger/550e8400-e29b-41d4-a716-446655440000
```

**响应示例**
```json
{
  "success": true,
  "message": "绿灯已亮起",
  "timestamp": 1640995200000
}
```

---

### 9. 记录玩家反应
记录玩家的反应时间。

**端点信息**
- **URL**: `/api/racing/react`
- **方法**: `POST`
- **描述**: 记录玩家反应时间

**请求格式**
- **Content-Type**: `application/json`

**请求示例**
```bash
curl -X POST http://localhost:8082/api/racing/react \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "550e8400-e29b-41d4-a716-446655440000",
    "player_id": 1,
    "reaction_time": 245
  }'
```

**请求体参数**
| 参数名 | 类型 | 必需 | 描述 |
|--------|------|------|------|
| game_id | string | 是 | 游戏ID |
| player_id | integer | 是 | 玩家ID (1-4) |
| reaction_time | integer | 是 | 反应时间（毫秒） |

**响应示例**
```json
{
  "success": true,
  "message": "反应时间已记录",
  "player_id": 1,
  "reaction_time": 245,
  "points": 100
}
```

**错误响应示例**
```json
{
  "error": "玩家1已反应，已反应玩家: [1, 2]",
  "code": 400
}
```

---

### 10. 结束游戏回合
结束当前回合，计算最终排名和积分。

**端点信息**
- **URL**: `/api/racing/finish/{game_id}`
- **方法**: `POST`
- **描述**: 结束当前回合

**请求示例**
```bash
curl -X POST http://localhost:8082/api/racing/finish/550e8400-e29b-41d4-a716-446655440000
```

**响应示例**
```json
{
  "round_complete": true,
  "player_results": [
    {
      "player_id": 1,
      "name": "张三",
      "reaction_time": 245,
      "rank": 1,
      "points": 100,
      "is_false_start": false
    },
    {
      "player_id": 2,
      "name": "李四",
      "reaction_time": 320,
      "rank": 2,
      "points": 75,
      "is_false_start": false
    }
  ],
  "game_over": false
}
```

---

### 11. 获取游戏状态
获取当前游戏的完整状态信息。

**端点信息**
- **URL**: `/api/racing/status/{game_id}`
- **方法**: `GET`
- **描述**: 获取游戏状态

**请求示例**
```bash
curl -X GET http://localhost:8082/api/racing/status/550e8400-e29b-41d4-a716-446655440000
```

**响应示例**
```json
{
  "game_id": "550e8400-e29b-41d4-a716-446655440000",
  "game_state": "GameOver",
  "current_round": 3,
  "max_rounds": 3,
  "players": [
    {
      "id": 1,
      "name": "张三",
      "score": 275,
      "has_reacted": true
    },
    {
      "id": 2,
      "name": "李四",
      "score": 225,
      "has_reacted": true
    }
  ],
  "reacted_players": [1, 2]
}
```

---

## 错误处理

### 错误响应格式
所有API错误都使用统一的错误响应格式：

```json
{
  "error": "错误描述信息",
  "code": 400
}
```

### 常见错误码
| 错误码 | 描述 | 示例场景 |
|--------|------|----------|
| 400 | 请求格式错误 | 无效的JSON格式 |
| 400 | 参数验证失败 | 猜测数字超出范围 |
| 404 | 资源不存在 | 访问不存在的端点 |
| 405 | 方法不允许 | 使用了不支持的HTTP方法 |
| 500 | 服务器内部错误 | 服务器处理异常 |

### 错误示例

**无效请求格式**
```json
{
  "error": "无效的请求格式",
  "code": 400
}
```

**数字范围错误**
```json
{
  "error": "猜测数字必须在1-100之间",
  "code": 400
}
```

---

## 使用示例

### 完整游戏流程示例

#### 猜数字游戏流程
```bash
# 获取游戏信息
curl http://localhost:8082/api/info

# 第一次猜测
curl -X POST http://localhost:8082/api/guess \
  -H "Content-Type: application/json" \
  -d '{"guess": 50}'

# 根据反馈继续猜测...

# 游戏结束后重置
curl -X POST http://localhost:8082/api/reset
```

#### 赛车游戏完整流程
```bash
# 1. 创建赛车游戏
curl -X POST http://localhost:8082/api/racing/create \
  -H "Content-Type: application/json" \
  -d '{
    "player_count": 2,
    "round_count": 3,
    "player_names": ["张三", "李四"]
  }'

# 2. 开始游戏回合
curl -X POST http://localhost:8082/api/racing/start/{game_id}

# 3. 触发绿灯信号
curl -X POST http://localhost:8082/api/racing/trigger/{game_id}

# 4. 记录玩家反应
curl -X POST http://localhost:8082/api/racing/react \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "{game_id}",
    "player_id": 1,
    "reaction_time": 245
  }'

# 5. 结束游戏回合
curl -X POST http://localhost:8082/api/racing/finish/{game_id}

# 6. 获取游戏状态
curl http://localhost:8082/api/racing/status/{game_id}
```

### 其他操作
```bash
# 获取游戏列表
curl http://localhost:8082/api/games

# 查看排行榜
curl http://localhost:8082/api/leaderboard
```

---

## 测试工具

### Postman 集合
你可以使用以下Postman集合进行测试：

#### 猜数字游戏集合
```json
{
  "info": {
    "name": "猜数字游戏API",
    "description": "经典猜数字游戏API测试集合"
  },
  "item": [
    {
      "name": "获取游戏信息",
      "request": {
        "method": "GET",
        "url": "http://localhost:8082/api/info"
      }
    },
    {
      "name": "提交猜测",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/guess",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"guess\": 50}"
        }
      }
    },
    {
      "name": "重置游戏",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/reset"
      }
    }
  ]
}
```

#### 赛车游戏完整集合
```json
{
  "info": {
    "name": "赛车起跑反应游戏API",
    "description": "多人赛车起跑反应游戏API测试集合"
  },
  "item": [
    {
      "name": "创建赛车游戏",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/racing/create",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"player_count\": 2,\n  \"round_count\": 3,\n  \"player_names\": [\"张三\", \"李四\"]\n}"
        }
      }
    },
    {
      "name": "开始游戏回合",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/racing/start/{{game_id}}"
      }
    },
    {
      "name": "触发绿灯信号",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/racing/trigger/{{game_id}}"
      }
    },
    {
      "name": "记录玩家反应",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/racing/react",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"game_id\": \"{{game_id}}\",\n  \"player_id\": 1,\n  \"reaction_time\": 245\n}"
        }
      }
    },
    {
      "name": "结束游戏回合",
      "request": {
        "method": "POST",
        "url": "http://localhost:8082/api/racing/finish/{{game_id}}"
      }
    },
    {
      "name": "获取游戏状态",
      "request": {
        "method": "GET",
        "url": "http://localhost:8082/api/racing/status/{{game_id}}"
      }
    }
  ]
}
```

### cURL 测试脚本

#### 猜数字游戏测试
```bash
#!/bin/bash
echo "=== 猜数字游戏API测试 ==="

# 1. 获取游戏信息
echo "1. 获取游戏信息..."
curl -s http://localhost:8082/api/info | jq .

# 2. 获取游戏列表
echo "2. 获取游戏列表..."
curl -s http://localhost:8082/api/games | jq .

# 3. 获取排行榜
echo "3. 获取排行榜..."
curl -s http://localhost:8082/api/leaderboard | jq .

# 4. 测试猜数字
echo "4. 测试猜数字..."
curl -s -X POST http://localhost:8082/api/guess \
  -H "Content-Type: application/json" \
  -d '{"guess": 50}' | jq .

echo "=== 猜数字游戏测试完成 ==="
```

#### 赛车游戏完整测试
```bash
#!/bin/bash
echo "=== 赛车起跑反应游戏完整测试 ==="

# 1. 创建游戏
echo "1. 创建赛车游戏..."
GAME_RESPONSE=$(curl -s -X POST http://localhost:8082/api/racing/create \
  -H "Content-Type: application/json" \
  -d '{"player_count": 2, "round_count": 3, "player_names": ["张三", "李四"]}')

echo "创建游戏响应:"
echo $GAME_RESPONSE | jq .

# 提取游戏ID
GAME_ID=$(echo $GAME_RESPONSE | jq -r '.game_id')
echo "游戏ID: $GAME_ID"

# 2. 开始回合
echo "2. 开始回合..."
curl -s -X POST http://localhost:8082/api/racing/start/$GAME_ID | jq .

# 3. 触发绿灯
echo "3. 触发绿灯信号..."
curl -s -X POST http://localhost:8082/api/racing/trigger/$GAME_ID | jq .

# 4. 记录反应
echo "4. 记录玩家反应..."
curl -s -X POST http://localhost:8082/api/racing/react \
  -H "Content-Type: application/json" \
  -d "{\"game_id\": \"$GAME_ID\", \"player_id\": 1, \"reaction_time\": 245}" | jq .

curl -s -X POST http://localhost:8082/api/racing/react \
  -H "Content-Type: application/json" \
  -d "{\"game_id\": \"$GAME_ID\", \"player_id\": 2, \"reaction_time\": 320}" | jq .

# 5. 结束回合
echo "5. 结束回合..."
curl -s -X POST http://localhost:8082/api/racing/finish/$GAME_ID | jq .

# 6. 获取最终状态
echo "6. 获取最终游戏状态..."
curl -s http://localhost:8082/api/racing/status/$GAME_ID | jq .

echo "=== 赛车游戏测试完成 ==="
```

---

## 故障排除

### 常见问题

#### 猜数字游戏
1. **端口被占用**
   - 错误信息: `error: could not compile due to previous error`
   - 解决方案: 修改 `src/main.rs` 中的端口或使用其他可用端口

2. **数据库连接失败**
   - 确保数据目录有写权限
   - 检查 `data/` 目录是否存在

3. **游戏状态异常**
   - 访问 `/api/reset` 重置游戏状态
   - 检查服务器日志获取详细错误信息

#### 赛车游戏
1. **400 Bad Request - 玩家已反应**
   - 原因: 玩家在当前回合已提交过反应时间
   - 解决方案: 确保每回合每个玩家只提交一次反应

2. **游戏未正确结束**
   - 原因: 前端状态同步问题
   - 解决方案: 刷新页面重新加载游戏状态

3. **多人游戏连接问题**
   - 确保所有玩家使用相同的游戏ID
   - 检查网络连接状态

### 调试技巧

#### 查看实时日志
```bash
# Windows (PowerShell)
tail -f data/games.log

# Linux/macOS
tail -f data/games.log
```

#### API测试工具推荐
1. **Postman** - 图形化API测试工具
2. **curl** - 命令行测试工具
3. **HTTPie** - 更友好的命令行工具

#### 性能监控
```bash
# 查看游戏统计
curl http://localhost:8082/api/info

# 查看游戏列表
curl http://localhost:8082/api/games

# 查看排行榜
curl http://localhost:8082/api/leaderboard
```

### 错误代码参考

| 错误代码 | 描述 | 解决方案 |
|---------|------|----------|
| 400 | 请求参数错误 | 检查JSON格式和必填字段 |
| 404 | 游戏不存在 | 确认游戏ID是否正确 |
| 409 | 游戏状态冲突 | 等待当前操作完成或重置游戏 |
| 500 | 服务器内部错误 | 检查服务器日志获取详情 |

---

## 版本信息
- **API版本**: v1.0.0
- **发布日期**: 2024年
- **服务器版本**: Rust后端
- **文档更新**: 2024年最新版

## 技术支持
如有问题或建议，请通过以下方式联系：
- 项目地址: `c:\Users\ck091\guess_number`
- 服务器端口: 8082
- 技术栈: Rust + Web技术