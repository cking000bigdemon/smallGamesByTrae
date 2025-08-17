use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// 游戏记录结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRecord {
    pub id: String,
    pub game_id: String,
    pub player_name: String,
    pub score: i32,
    pub reaction_time: Option<f64>,
    pub created_at: String,
}

// 游戏数据库 trait
pub trait GameDatabase {
    fn save_game_record(&self, game_id: &str, player_name: &str, score: i32, reaction_time: Option<f64>) -> Result<(), String>;
    fn get_leaderboard(&self, limit: i64) -> Result<Vec<GameRecord>, String>;
    fn get_player_history(&self, player_name: &str, limit: i64) -> Result<Vec<GameRecord>, String>;
    fn get_stats(&self) -> Result<(i64, i64), String>;
    fn is_connected(&self) -> bool;
}

// 内存数据库实现
pub struct InMemoryDatabase {
    records: Mutex<Vec<GameRecord>>,
}

impl InMemoryDatabase {
    pub fn new() -> Self {
        Self {
            records: Mutex::new(Vec::new()),
        }
    }
}

impl GameDatabase for InMemoryDatabase {
    fn save_game_record(&self, game_id: &str, player_name: &str, score: i32, reaction_time: Option<f64>) -> Result<(), String> {
        let mut records = self.records.lock().map_err(|e| e.to_string())?;
        
        let record = GameRecord {
            id: format!("record_{}", records.len() + 1),
            game_id: game_id.to_string(),
            player_name: player_name.to_string(),
            score,
            reaction_time,
            created_at: "2024-01-01T00:00:00Z".to_string(),
        };
        
        records.push(record);
        Ok(())
    }

    fn get_leaderboard(&self, limit: i64) -> Result<Vec<GameRecord>, String> {
        let records = self.records.lock().map_err(|e| e.to_string())?;
        let mut sorted_records = records.clone();
        
        sorted_records.sort_by(|a, b| b.score.cmp(&a.score));
        sorted_records.truncate(limit as usize);
        Ok(sorted_records)
    }

    fn get_player_history(&self, player_name: &str, limit: i64) -> Result<Vec<GameRecord>, String> {
        let records = self.records.lock().map_err(|e| e.to_string())?;
        let mut player_records: Vec<GameRecord> = records
            .iter()
            .filter(|r| r.player_name == player_name)
            .cloned()
            .collect();
        
        player_records.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        player_records.truncate(limit as usize);
        Ok(player_records)
    }

    fn get_stats(&self) -> Result<(i64, i64), String> {
        let records = self.records.lock().map_err(|e| e.to_string())?;
        let total_games = records.len() as i64;
        let unique_players = records
            .iter()
            .map(|r| &r.player_name)
            .collect::<std::collections::HashSet<_>>()
            .len() as i64;
        
        Ok((total_games, unique_players))
    }

    fn is_connected(&self) -> bool {
        true
    }
}

// 同步数据库管理器
pub struct SyncDatabaseManager {
    inner: InMemoryDatabase,
}

impl SyncDatabaseManager {
    pub fn new() -> Self {
        Self {
            inner: InMemoryDatabase::new(),
        }
    }
}

impl GameDatabase for SyncDatabaseManager {
    fn save_game_record(&self, game_id: &str, player_name: &str, score: i32, reaction_time: Option<f64>) -> Result<(), String> {
        self.inner.save_game_record(game_id, player_name, score, reaction_time)
    }

    fn get_leaderboard(&self, limit: i64) -> Result<Vec<GameRecord>, String> {
        self.inner.get_leaderboard(limit)
    }

    fn get_player_history(&self, player_name: &str, limit: i64) -> Result<Vec<GameRecord>, String> {
        self.inner.get_player_history(player_name, limit)
    }

    fn get_stats(&self) -> Result<(i64, i64), String> {
        self.inner.get_stats()
    }

    fn is_connected(&self) -> bool {
        self.inner.is_connected()
    }
}