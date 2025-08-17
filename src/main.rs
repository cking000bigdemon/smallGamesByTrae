use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tiny_http::{Header, Method, Response, Server, StatusCode};

mod database;

use database::{GameDatabase, SyncDatabaseManager};

use rand::Rng;

// 游戏状态枚举
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GameState {
    Waiting,
    Countdown,
    Ready,
    Racing,
    Finished,
    GameOver,
}

// 玩家数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: u8,
    pub name: String,
    pub score: i32,
    pub key: String,
    pub is_ready: bool,
}

// 回合结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundResult {
    pub round: u8,
    pub player_results: Vec<PlayerRoundResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerRoundResult {
    pub player_id: u8,
    pub reaction_time: Option<f64>,
    pub is_false_start: bool,
    pub rank: Option<u8>,
    pub points: i32,
}

// 游戏房间
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RacingGame {
    pub game_id: String,
    pub game_state: GameState,
    pub players: Vec<Player>,
    pub current_round: u8,
    pub max_rounds: u8,
    pub round_results: Vec<RoundResult>,
    #[serde(skip)]
    pub green_light_time: Option<Instant>,
    pub reacted_players: Vec<u8>,
    #[serde(skip)]
    pub player_reactions: HashMap<u8, f64>, // 存储玩家反应时间
}

impl RacingGame {
    pub fn new(player_count: u8, round_count: u8, player_names: Vec<String>) -> Self {
        let players: Vec<Player> = (1..=player_count)
            .map(|i| Player {
                id: i,
                name: player_names.get((i-1) as usize).cloned().unwrap_or_else(|| format!("玩家{}", i)),
                score: 0,
                key: match i {
                    1 => " ".to_string(),
                    2 => "Enter".to_string(),
                    3 => "a".to_string(),
                    4 => "l".to_string(),
                    _ => " ".to_string(),
                },
                is_ready: false,
            })
            .collect();

        Self {
            game_id: format!("game_{}", rand::thread_rng().gen::<u32>()),
            game_state: GameState::Waiting,
            players,
            current_round: 0,
            max_rounds: round_count,
            round_results: Vec::new(),
            green_light_time: None,
            reacted_players: Vec::new(),
            player_reactions: HashMap::new(),
        }
    }

    pub fn start_round(&mut self) {
        self.game_state = GameState::Countdown;
        self.green_light_time = None;
        self.reacted_players.clear();
        self.player_reactions.clear();
    }

    pub fn trigger_green_light(&mut self) {
        self.game_state = GameState::Racing;
        self.green_light_time = Some(Instant::now());
    }

    pub fn record_reaction(&mut self, player_id: u8, reaction_time: f64) -> Result<PlayerRoundResult, String> {
        println!("Debug: record_reaction called with player_id={}, reaction_time={}", player_id, reaction_time);
        println!("Debug: game_state={:?}, reacted_players={:?}", self.game_state, self.reacted_players);
        
        if self.game_state != GameState::Racing {
            return Err(format!("游戏不在起跑状态，当前状态: {:?}", self.game_state));
        }

        // 检查玩家是否存在
        if !self.players.iter().any(|p| p.id == player_id) {
            return Err(format!("玩家ID {} 不存在，有效玩家ID: {:?}", 
                player_id, self.players.iter().map(|p| p.id).collect::<Vec<_>>()));
        }

        if self.reacted_players.contains(&player_id) {
            return Err(format!("玩家 {} 已反应，已反应玩家: {:?}", player_id, self.reacted_players));
        }

        // 检查是否抢跑（反应时间小于100ms）
        let is_false_start = reaction_time < 100.0;

        self.reacted_players.push(player_id);
        self.player_reactions.insert(player_id, reaction_time);

        Ok(PlayerRoundResult {
            player_id,
            reaction_time: if is_false_start { None } else { Some(reaction_time) },
            is_false_start,
            rank: None,
            points: 0,
        })
    }

    pub fn finish_round(&mut self) -> RoundResult {
        self.game_state = GameState::Finished;
        self.current_round += 1;

        let mut player_results: Vec<PlayerRoundResult> = self.players
            .iter()
            .map(|player| {
                // 检查玩家是否有反应记录
                let _has_reacted = self.reacted_players.contains(&player.id);
                let reaction_time = self.player_reactions.get(&player.id).copied();
                
                // 检查是否抢跑（反应时间小于100ms）
                let is_false_start = reaction_time.map(|t| t < 100.0).unwrap_or(false);
                
                // 计算基础积分
                let points = if is_false_start {
                    -5  // 抢跑扣5分
                } else {
                    match reaction_time {
                        Some(time) => {
                            if time < 200.0 { 15 }      // 极快反应
                            else if time < 300.0 { 12 } // 快速反应
                            else if time < 400.0 { 10 } // 正常反应
                            else if time < 500.0 { 8 }  // 较慢反应
                            else { 5 }                  // 最慢反应
                        }
                        None => 0  // 未反应得0分
                    }
                };

                PlayerRoundResult {
                    player_id: player.id,
                    reaction_time: if is_false_start { None } else { reaction_time },
                    is_false_start,
                    rank: None,  // 将在后面计算
                    points,
                }
            })
            .collect();

        // 计算排名 - 只对有效反应的玩家排序
        let mut valid_results: Vec<&mut PlayerRoundResult> = player_results
            .iter_mut()
            .filter(|r| !r.is_false_start && r.reaction_time.is_some())
            .collect();

        valid_results.sort_by(|a, b| {
            a.reaction_time.partial_cmp(&b.reaction_time).unwrap()
        });

        // 为有效反应的玩家设置排名和额外积分
        for (index, result) in valid_results.iter_mut().enumerate() {
            result.rank = Some((index + 1) as u8);
            // 根据排名给额外奖励积分
            result.points += match index {
                0 => 10,  // 第1名额外+10
                1 => 7,   // 第2名额外+7
                2 => 5,   // 第3名额外+5
                _ => 3,   // 其他名次额外+3
            };
        }

        // 更新玩家总积分
        for result in &player_results {
            if let Some(player) = self.players.iter_mut().find(|p| p.id == result.player_id) {
                player.score += result.points;
            }
        }

        let round_result = RoundResult {
            round: self.current_round,
            player_results,
        };

        self.round_results.push(round_result.clone());

        // 检查游戏是否结束
        if self.current_round >= self.max_rounds {
            self.game_state = GameState::GameOver;
        } else {
            self.game_state = GameState::Waiting;
        }

        round_result
    }
}

// API请求结构
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateGameRequest {
    pub player_count: u8,
    pub round_count: u8,
    pub player_names: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameResponse {
    pub game_id: String,
    pub game_state: GameState,
    pub players: Vec<Player>,
    pub current_round: u8,
    pub max_rounds: u8,
    pub round_results: Vec<RoundResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReactionRequest {
    pub game_id: String,
    pub player_id: u8,
    pub reaction_time: f64,
}

// 全局游戏存储
pub struct GameStateStorage {
    games: Arc<Mutex<HashMap<String, RacingGame>>>,
}

impl GameStateStorage {
    pub fn new() -> Self {
        Self {
            games: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_game(&self, req: CreateGameRequest) -> GameResponse {
        let mut games = self.games.lock().unwrap();
        let game = RacingGame::new(req.player_count, req.round_count, req.player_names);
        let game_id = game.game_id.clone();
        let response = GameResponse {
            game_id: game_id.clone(),
            game_state: game.game_state.clone(),
            players: game.players.clone(),
            current_round: game.current_round,
            max_rounds: game.max_rounds,
            round_results: game.round_results.clone(),
        };
        games.insert(game_id, game);
        response
    }

    pub fn start_game(&self, game_id: &str) -> Option<GameResponse> {
        let mut games = self.games.lock().unwrap();
        games.get_mut(game_id).map(|game| {
            game.start_round();
            GameResponse {
                game_id: game_id.to_string(),
                game_state: game.game_state.clone(),
                players: game.players.clone(),
                current_round: game.current_round,
                max_rounds: game.max_rounds,
                round_results: game.round_results.clone(),
            }
        })
    }

    pub fn record_reaction(&self, game_id: &str, player_id: u8, reaction_time: f64) -> Result<PlayerRoundResult, String> {
        let mut games = self.games.lock().unwrap();
        if let Some(game) = games.get_mut(game_id) {
            game.record_reaction(player_id, reaction_time)
        } else {
            Err("游戏未找到".to_string())
        }
    }

    pub fn trigger_green_light(&self, game_id: &str) -> Option<GameResponse> {
        let mut games = self.games.lock().unwrap();
        games.get_mut(game_id).map(|game| {
            game.trigger_green_light();
            GameResponse {
                game_id: game_id.to_string(),
                game_state: game.game_state.clone(),
                players: game.players.clone(),
                current_round: game.current_round,
                max_rounds: game.max_rounds,
                round_results: game.round_results.clone(),
            }
        })
    }

    pub fn finish_round(&self, game_id: &str) -> Option<RoundResult> {
        let mut games = self.games.lock().unwrap();
        games.get_mut(game_id).map(|game| game.finish_round())
    }

    pub fn get_game(&self, game_id: &str) -> Option<GameResponse> {
        let games = self.games.lock().unwrap();
        games.get(game_id).map(|game| GameResponse {
            game_id: game_id.to_string(),
            game_state: game.game_state.clone(),
            players: game.players.clone(),
            current_round: game.current_round,
            max_rounds: game.max_rounds,
            round_results: game.round_results.clone(),
        })
    }
}



// 猜数字游戏相关结构
#[derive(Debug, Serialize, Deserialize)]
struct GuessResponse {
    message: String,
    attempts: u32,
    correct: bool,
    range: (u32, u32),
}

#[derive(Debug, Serialize, Deserialize)]
struct GameInfo {
    range: (u32, u32),
    max_attempts: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct GameListResponse {
    games: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LeaderboardEntry {
    name: String,
    score: u32,
    attempts: u32,
    date: String,
}

// 猜数字游戏状态
struct GuessGameState {
    target_number: u32,
    attempts: u32,
    max_attempts: u32,
    min_number: u32,
    max_number: u32,
}

impl GuessGameState {
    fn new() -> Self {
        let mut rng = rand::thread_rng();
        Self {
            target_number: rng.gen_range(1..=100),
            attempts: 0,
            max_attempts: 10,
            min_number: 1,
            max_number: 100,
        }
    }

    fn reset(&mut self) {
        let mut rng = rand::thread_rng();
        self.target_number = rng.gen_range(1..=100);
        self.attempts = 0;
    }

    fn guess(&mut self, number: u32) -> GuessResponse {
        self.attempts += 1;
        
        if number == self.target_number {
            let response = GuessResponse {
                message: format!("🎉 恭喜你！数字就是 {}！", self.target_number),
                attempts: self.attempts,
                correct: true,
                range: (self.min_number, self.max_number),
            };
            self.reset();
            return response;
        } else if number < self.target_number {
            self.min_number = number.max(self.min_number);
            GuessResponse {
                message: format!("太小了！试试 {} 到 {} 之间的数字", self.min_number + 1, self.max_number),
                attempts: self.attempts,
                correct: false,
                range: (self.min_number, self.max_number),
            }
        } else {
            self.max_number = number.min(self.max_number);
            GuessResponse {
                message: format!("太大了！试试 {} 到 {} 之间的数字", self.min_number, self.max_number - 1),
                attempts: self.attempts,
                correct: false,
                range: (self.min_number, self.max_number),
            }
        }
    }
}

// 辅助函数：从JSON字符串中提取值 - 移除未使用的函数
// 移除未使用的函数
// fn extract_json_value(_json_str: &str, key: &str) -> Option<String> {
//     None
// }
fn main() -> std::io::Result<()> {
    println!("🎮 小游戏服务器启动中...");
    println!("🌐 访问 http://localhost:8082 开始游戏");
    println!("🏎️ 赛车游戏API已就绪");

    // 初始化数据库
    let db_manager = Arc::new(SyncDatabaseManager::new());

    let server = Server::http("0.0.0.0:8082").unwrap();
    let game_state = Arc::new(Mutex::new(GuessGameState::new()));
    let racing_storage = Arc::new(Mutex::new(GameStateStorage::new()));

    for mut request in server.incoming_requests() {
        let game_state = game_state.clone();
        let racing_storage = racing_storage.clone();
        let db_manager = db_manager.clone();

        let response = match (request.method(), request.url()) {
            (Method::Get, "/api/info") => {
                let state = game_state.lock().unwrap();
                let info = GameInfo {
                    range: (state.min_number, state.max_number),
                    max_attempts: state.max_attempts,
                };
                Response::from_string(serde_json::to_string(&info).unwrap())
                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
            }
            (Method::Get, url) if url.starts_with("/api/guess/") => {
                let number_str = url.trim_start_matches("/api/guess/");
                if let Ok(number) = number_str.parse::<u32>() {
                    let mut state = game_state.lock().unwrap();
                    let response = state.guess(number);
                    Response::from_string(serde_json::to_string(&response).unwrap())
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                } else {
                    Response::from_string("{\"error\": \"无效的数字\"}")
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                        .with_status_code(StatusCode::from(400))
                }
            }
            (Method::Post, "/api/reset") => {
                let mut state = game_state.lock().unwrap();
                state.reset();
                let info = GameInfo {
                    range: (state.min_number, state.max_number),
                    max_attempts: state.max_attempts,
                };
                Response::from_string(serde_json::to_string(&info).unwrap())
                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
            }
            (Method::Get, "/api/games") => {
                let games = vec!["猜数字游戏".to_string(), "赛车起跑反应".to_string()];
                let response = GameListResponse { games };
                Response::from_string(serde_json::to_string(&response).unwrap())
                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
            }
            (Method::Get, "/api/leaderboard") => {
                let limit = request
                    .url()
                    .split('?')
                    .nth(1)
                    .and_then(|query| {
                        query
                            .split('&')
                            .find(|param| param.starts_with("limit="))
                            .and_then(|param| param[6..].parse::<i64>().ok())
                    })
                    .unwrap_or(10);
                
                let db = db_manager.clone();
                        match db.get_leaderboard(limit) {
                    Ok(leaderboard) => {
                        Response::from_string(serde_json::to_string(&leaderboard).unwrap())
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                    }
                    Err(e) => {
                        Response::from_string(&format!("{{\"error\": \"获取排行榜失败: {}\"}}", e))
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            .with_status_code(StatusCode::from(500))
                    }
                }
            }
            (Method::Post, "/api/racing/create") => {
                let mut content = String::new();
                request.as_reader().read_to_string(&mut content).unwrap();
                let req: CreateGameRequest = serde_json::from_str(&content).unwrap_or_else(|_| {
                    CreateGameRequest {
                        player_count: 2,
                        round_count: 3,
                        player_names: vec!["玩家1".to_string(), "玩家2".to_string()],
                    }
                });
                let storage = racing_storage.lock().unwrap();
                let response = storage.create_game(req);
                Response::from_string(serde_json::to_string(&response).unwrap())
                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
            }
            (Method::Post, url) if url.starts_with("/api/racing/start/") => {
                let game_id = url.trim_start_matches("/api/racing/start/");
                let storage = racing_storage.lock().unwrap();
                if let Some(response) = storage.start_game(game_id) {
                    Response::from_string(serde_json::to_string(&response).unwrap())
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                } else {
                    Response::from_string("{\"error\": \"游戏未找到\"}")
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                        .with_status_code(StatusCode::from(404))
                }
            }
            (Method::Post, url) if url.starts_with("/api/racing/trigger/") => {
                let game_id = url.trim_start_matches("/api/racing/trigger/");
                let storage = racing_storage.lock().unwrap();
                if let Some(response) = storage.trigger_green_light(game_id) {
                    Response::from_string(serde_json::to_string(&response).unwrap())
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                } else {
                    Response::from_string("{\"error\": \"游戏未找到\"}")
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                        .with_status_code(StatusCode::from(404))
                }
            }
            (Method::Post, "/api/racing/react") => {
                let mut content = String::new();
                request.as_reader().read_to_string(&mut content).unwrap();
                println!("收到反应记录请求: {}", content);
                
                // 使用serde_json正确解析JSON
                match serde_json::from_str::<ReactionRequest>(&content) {
                    Ok(req) => {
                        println!("解析成功: game_id={}, player_id={}, reaction_time={}", req.game_id, req.player_id, req.reaction_time);
                        let storage = racing_storage.lock().unwrap();
                        match storage.record_reaction(&req.game_id, req.player_id, req.reaction_time) {
                            Ok(result) => {
                                Response::from_string(serde_json::to_string(&result).unwrap())
                                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            }
                            Err(error) => {
                                Response::from_string(&format!("{{\"error\": \"{}\"}}", error))
                                    .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                                    .with_status_code(StatusCode::from(400))
                            }
                        }
                    }
                    Err(e) => {
                        println!("JSON解析错误: {}", e);
                        Response::from_string(&format!("{{\"error\": \"请求格式错误: {}\"}}", e))
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            .with_status_code(StatusCode::from(400))
                    }
                }
            }
            (Method::Post, url) if url.starts_with("/api/racing/finish/") => {
                let game_id = url.trim_start_matches("/api/racing/finish/");
                let storage = racing_storage.lock().unwrap();
                if let Some(result) = storage.finish_round(game_id) {
                    Response::from_string(serde_json::to_string(&result).unwrap())
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                } else {
                    Response::from_string("{\"error\": \"游戏未找到\"}")
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                        .with_status_code(StatusCode::from(404))
                }
            }
            (Method::Get, url) if url.starts_with("/api/racing/status/") => {
                let game_id = url.trim_start_matches("/api/racing/status/");
                let storage = racing_storage.lock().unwrap();
                if let Some(response) = storage.get_game(game_id) {
                    Response::from_string(serde_json::to_string(&response).unwrap())
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                } else {
                    Response::from_string("{\"error\": \"游戏未找到\"}")
                        .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                        .with_status_code(StatusCode::from(404))
                }
            }
            (Method::Get, "/") | (Method::Get, "/index.html") => {
                let file = std::fs::read("./static/index.html").unwrap();
                Response::from_data(file).with_header(Header::from_bytes("Content-Type", "text/html").unwrap())
            }
            (Method::Post, "/api/database/save") => {
                let mut content = String::new();
                request.as_reader().read_to_string(&mut content).unwrap();
                
                #[derive(Deserialize)]
                struct SaveRequest {
                    game_id: String,
                    player_name: String,
                    score: i32,
                    reaction_time: Option<f64>,
                }
                
                match serde_json::from_str::<SaveRequest>(&content) {
                    Ok(req) => {
                        let game_id = req.game_id.clone();
            let player_name = req.player_name.clone();
            let score = req.score;
            let reaction_time = req.reaction_time;
            let db = db_manager.clone();
            let _ = db.save_game_record(&game_id, &player_name, score, reaction_time);
            
            Response::from_string("游戏记录已保存")
                .with_header(Header::from_str("Content-Type: text/plain; charset=utf-8").unwrap())
                    }
                    Err(e) => {
                        Response::from_string(&format!("{{\"error\": \"请求格式错误: {}\"}}", e))
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            .with_status_code(StatusCode::from(400))
                    }
                }
            }
            (Method::Get, url) if url.starts_with("/api/database/player/") => {
                let player_name = url.trim_start_matches("/api/database/player/");
                let limit = request
                    .url()
                    .split('?')
                    .nth(1)
                    .and_then(|query| {
                        query
                            .split('&')
                            .find(|param| param.starts_with("limit="))
                            .and_then(|param| param[6..].parse::<i64>().ok())
                    })
                    .unwrap_or(10);
                
                let db = db_manager.clone();
                        match db.get_player_history(player_name, limit) {
                    Ok(records) => {
                        Response::from_string(serde_json::to_string(&records).unwrap())
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                    }
                    Err(e) => {
                        Response::from_string(&format!("{{\"error\": \"获取玩家历史记录失败: {}\"}}", e))
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            .with_status_code(StatusCode::from(500))
                    }
                }
            }
            (Method::Get, "/api/database/stats") => {
                let db = db_manager.clone();
                match db.get_stats() {
                    Ok((total_records, total_players)) => {
                        let stats = serde_json::json!({
                            "total_records": total_records,
                            "total_players": total_players,
                            "status": "connected"
                        });
                        Response::from_string(serde_json::to_string(&stats).unwrap())
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                    }
                    Err(e) => {
                        Response::from_string(&format!("{{\"error\": \"获取数据库统计失败: {}\"}}", e))
                            .with_header(Header::from_bytes("Content-Type", "application/json").unwrap())
                            .with_status_code(StatusCode::from(500))
                    }
                }
            }
            (Method::Get, url) => {
                let current_dir = std::env::current_dir().unwrap();
                let file_path = current_dir.join("static").join(url.trim_start_matches('/'));
                println!("尝试访问文件: {}", file_path.display());
                match std::fs::read(&file_path) {
                    Ok(file) => {
                        let content_type = match url.split('.').last() {
                            Some("html") => "text/html",
                            Some("css") => "text/css",
                            Some("js") => "application/javascript",
                            Some("json") => "application/json",
                            _ => "text/plain",
                        };
                        Response::from_data(file).with_header(Header::from_bytes("Content-Type", content_type).unwrap())
                    },
                    Err(e) => {
                        println!("文件访问错误 {}: {}", file_path.display(), e);
                        Response::from_string("404 Not Found")
                            .with_status_code(StatusCode::from(404))
                    }
                }
            }
            _ => {
                Response::from_string("404 Not Found")
                    .with_status_code(StatusCode::from(404))
            }
        };

        request.respond(response).unwrap();
    }
    Ok(())
}