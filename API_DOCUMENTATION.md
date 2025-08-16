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

1. **开始新游戏**
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

2. **获取游戏列表**
```bash
curl http://localhost:8082/api/games
```

3. **查看排行榜**
```bash
curl http://localhost:8082/api/leaderboard
```

---

## 测试工具

### Postman 集合
你可以使用以下Postman集合进行测试：

```json
{
  "info": {
    "name": "小游戏网站API",
    "description": "猜数字游戏API测试集合"
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

### cURL 测试脚本

```bash
#!/bin/bash
# 小游戏网站API测试脚本

echo "=== 小游戏网站API测试 ==="

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

echo "=== 测试完成 ==="
```

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