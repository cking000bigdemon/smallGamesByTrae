// 赛车起跑反应游戏主逻辑
class RacingGame {
    constructor() {
        this.gameId = null;
        this.gameState = null;
        this.players = [];
        this.currentRound = 0;
        this.maxRounds = 5;
        this.countdownInterval = null;
        this.gameInterval = null;
        this.isGameActive = false;
        
        // 按键映射
        this.keyMappings = {
            ' ': 1,    // 玩家1 - 空格键
            'Enter': 2, // 玩家2 - 回车键
            'a': 3,    // 玩家3 - A键
            'l': 4     // 玩家4 - L键
        };
        
        this.playerColors = {
            1: 'red',
            2: 'blue',
            3: 'green',
            4: 'yellow'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePlayerInputs();
    }

    setupEventListeners() {
        // 监听玩家数量变化
        document.getElementById('player-count').addEventListener('change', (e) => {
            this.updatePlayerInputs();
        });

        // 监听键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 防止页面刷新时表单提交
        document.addEventListener('submit', (e) => e.preventDefault());
    }

    updatePlayerInputs() {
        const playerCount = parseInt(document.getElementById('player-count').value);
        const playerNamesDiv = document.getElementById('player-names');
        
        playerNamesDiv.innerHTML = '';
        
        for (let i = 1; i <= playerCount; i++) {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>玩家${i}名称:</label>
                <input type="text" id="player${i}-name" value="玩家${i}" maxlength="10">
            `;
            playerNamesDiv.appendChild(div);
        }
    }

    async createGame() {
        const playerCount = parseInt(document.getElementById('player-count').value);
        const roundCount = parseInt(document.getElementById('round-count').value);
        
        const playerNames = [];
        for (let i = 1; i <= playerCount; i++) {
            const name = document.getElementById(`player${i}-name`).value.trim() || `玩家${i}`;
            playerNames.push(name);
        }

        try {
            const response = await fetch('/api/racing/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player_count: playerCount,
                    round_count: roundCount,
                    player_names: playerNames
                })
            });

            const gameData = await response.json();
            this.gameId = gameData.game_id;
            this.gameState = gameData.game_state;
            this.players = gameData.players;
            this.maxRounds = gameData.max_rounds;
            
            this.showGameInterface();
            this.renderPlayers();
            this.updateStatus('游戏已创建，等待开始...', 'waiting');
            
            document.getElementById('start-btn').style.display = 'inline-block';
            
        } catch (error) {
            console.error('创建游戏失败:', error);
            alert('创建游戏失败，请重试');
        }
    }

    showGameInterface() {
        document.getElementById('game-setup').style.display = 'none';
        document.getElementById('game-interface').style.display = 'block';
    }

    renderPlayers() {
        const playersGrid = document.getElementById('players-grid');
        playersGrid.innerHTML = '';

        this.players.forEach(player => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${this.playerColors[player.id]}`;
            playerCard.id = `player-${player.id}`;
            
            playerCard.innerHTML = `
                <div class="color-indicator"></div>
                <h4>${player.name}</h4>
                <p>按键: <span class="key-display">${this.getKeyDisplay(player.key)}</span></p>
                <p>积分: <span id="score-${player.id}">${player.score}</span></p>
                <p>反应时间: <span id="reaction-${player.id}">-</span>ms</p>
                <div id="status-${player.id}" class="player-status">准备中</div>
            `;
            
            playersGrid.appendChild(playerCard);
        });
    }

    getKeyDisplay(key) {
        const keyMap = {
            ' ': '空格键',
            '\r': '回车键',
            'a': 'A键',
            'l': 'L键'
        };
        return keyMap[key] || key;
    }

    async startGame() {
        if (!this.gameId) return;

        try {
            const response = await fetch(`/api/racing/start/${this.gameId}`, {
                method: 'POST'
            });
            
            const gameData = await response.json();
            this.updateGameState(gameData);
            
            this.startCountdown();
            
        } catch (error) {
            console.error('开始游戏失败:', error);
        }
    }

    async startCountdown() {
        this.isGameActive = true;
        this.updateStatus('红灯倒计时...', 'countdown');
        document.getElementById('start-btn').style.display = 'none';

        // 关键：调用后端API重置游戏状态
        try {
            const response = await fetch(`/api/racing/start/${this.gameId}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                console.error('重置游戏状态失败:', response.status);
                return;
            }
            
            const gameData = await response.json();
            this.updateGameState(gameData);
            
        } catch (error) {
            console.error('调用start API失败:', error);
            return;
        }

        let step = 0;
        this.countdownInterval = setInterval(() => {
            if (step < 5) {
                document.getElementById(`light-${step}`).classList.add('active');
                step++;
            } else {
                clearInterval(this.countdownInterval);
                this.startRandomDelay();
            }
        }, 1000);
    }

    startRandomDelay() {
        this.updateStatus('准备就绪，等待起跑信号...', 'ready');
        
        // 随机延迟1.5-5秒
        const delay = Math.random() * 3500 + 1500;
        
        setTimeout(() => {
            this.startRacing();
        }, delay);
    }

    async startRacing() {
        if (!this.isGameActive) return;

        this.updateStatus('绿灯亮起！起跑！', 'racing');
        
        // 切换所有灯为绿色
        for (let i = 0; i < 5; i++) {
            const light = document.getElementById(`light-${i}`);
            light.classList.remove('red', 'active');
            light.classList.add('green', 'active');
        }

        // 通知后端绿灯已亮起
        try {
            await fetch(`/api/racing/trigger/${this.gameId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('触发绿灯失败:', error);
        }

        // 记录绿灯亮起时间
        this.greenLightTime = Date.now();
        this.gameState = 'racing';
        
        // 设置超时结束本轮
        setTimeout(() => {
            this.finishRound();
        }, 3000);
    }

    handleKeyPress(event) {
        if (!this.isGameActive || this.gameState !== 'racing') return;
        
        const playerId = this.keyMappings[event.key];
        if (!playerId) return;

        // 阻止默认行为（防止空格键滚动页面）
        event.preventDefault();

        // 防止重复提交
        if (this.reactedPlayers && this.reactedPlayers.has(playerId)) return;
        
        if (!this.reactedPlayers) {
            this.reactedPlayers = new Set();
        }
        this.reactedPlayers.add(playerId);

        const reactionTime = Date.now() - this.greenLightTime;
        this.recordReaction(playerId, reactionTime);
    }

    async recordReaction(playerId, reactionTime) {
        try {
            console.log('准备发送反应数据:', {
                game_id: this.gameId,
                player_id: playerId,
                reaction_time: reactionTime,
                gameState: this.gameState,
                isGameActive: this.isGameActive
            });
            
            const response = await fetch('/api/racing/react', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: this.gameId,
                    player_id: playerId,
                    reaction_time: reactionTime
                })
            });
            
            console.log('反应API响应状态:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('反应API错误响应:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('反应API成功响应:', result);
            
            // 更新玩家显示
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                document.getElementById(`reaction-${playerId}`).textContent = reactionTime.toFixed(0);
                document.getElementById(`status-${playerId}`).textContent = 
                    reactionTime < 0 ? '抢跑！' : `${reactionTime.toFixed(0)}ms`;
                document.getElementById(`status-${playerId}`).className = 
                    reactionTime < 0 ? 'false-start' : '';
            }

            // 检查是否所有玩家都已反应
            if (this.reactedPlayers.size === this.players.length) {
                this.finishRound();
            }
            
        } catch (error) {
            console.error('记录反应失败:', error);
            // 从已反应集合中移除失败的玩家，允许重试
            if (this.reactedPlayers) {
                this.reactedPlayers.delete(playerId);
            }
        }
    }

    async finishRound() {
        try {
            const response = await fetch(`/api/racing/finish/${this.gameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('获取回合结果失败');
            }

            const roundResult = await response.json();
            
            // 获取游戏状态以检查是否结束
            const statusResponse = await fetch(`/api/racing/status/${this.gameId}`);
            const gameData = await statusResponse.json();
            
            // 直接检查当前回合数是否达到最大回合数
            const isGameOver = gameData.current_round >= gameData.max_rounds;
            
            // 更新玩家积分
            if (roundResult && roundResult.player_results && 
                Array.isArray(roundResult.player_results) && 
                roundResult.player_results.length > 0) {
                
                // 更新玩家积分
                roundResult.player_results.forEach(result => {
                    const player = this.players.find(p => p.id === result.player_id);
                    if (player) {
                        player.score = result.points + (player.score || 0);
                    }
                });
                
                // 显示回合结果
                this.showRoundResults(roundResult);
            } else {
                console.log('没有有效玩家反应，显示默认结果');
                this.showDefaultRoundResults();
            }
            
            // 重置信号灯
            this.resetLights();
            
            if (isGameOver) {
                // 游戏结束
                this.updateStatus('游戏结束！', 'finished');
                setTimeout(() => {
                    this.showFinalResults();
                }, 1000);
            } else {
                // 继续下一轮
                document.getElementById('next-round-btn').style.display = 'inline-block';
            }
            
        } catch (error) {
            console.error('结束回合失败:', error);
            this.showErrorResults('获取回合结果失败，请重试');
        }
    }

    // 优化默认回合结果显示
    showDefaultRoundResults() {
        const resultsDiv = document.getElementById('round-results');
        const resultsList = document.getElementById('results-list');
        
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = '';

        // 显示友好的提示信息
        const infoRow = document.createElement('div');
        infoRow.className = 'info-message';
        infoRow.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #666;">
                <strong>本轮结束</strong><br>
                <small>没有玩家做出有效反应</small>
            </div>
        `;
        resultsList.appendChild(infoRow);

        // 显示当前玩家的状态
        if (this.players && Array.isArray(this.players)) {
            this.players.forEach((player, index) => {
                const row = document.createElement('div');
                row.className = 'result-row';
                row.innerHTML = `
                    <div>
                        <span class="rank-badge">${index + 1}</span>
                        <strong>${player.name}</strong>
                    </div>
                    <div>
                        <span class="reaction-time">未反应</span>
                        <span>积分: ${player.score || 0}</span>
                    </div>
                `;
                resultsList.appendChild(row);
            });
        }
    }

    // 添加错误结果显示
    showErrorResults(errorMessage) {
        const resultsDiv = document.getElementById('round-results');
        const resultsList = document.getElementById('results-list');
        
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = `<div class="error">${errorMessage}</div>`;
    }

    showRoundResults(roundResult) {
        const resultsDiv = document.getElementById('round-results');
        const resultsList = document.getElementById('results-list');
        
        resultsDiv.style.display = 'block';
        resultsList.innerHTML = '';

        // 确保player_results存在且是数组
        if (!roundResult || !roundResult.player_results || !Array.isArray(roundResult.player_results)) {
            console.error('无效的回合结果数据:', roundResult);
            resultsList.innerHTML = '<div class="error">无法显示回合结果</div>';
            return;
        }

        // 按排名排序
        const sortedResults = [...roundResult.player_results].sort((a, b) => {
            if (!a || !b) return 0;
            if (a.rank === null) return 1;
            if (b.rank === null) return -1;
            return a.rank - b.rank;
        });

        sortedResults.forEach((result, index) => {
            if (!result || typeof result.player_id === 'undefined') {
                console.warn('跳过无效的结果:', result);
                return;
            }
            
            const player = this.players.find(p => p.id === result.player_id);
            if (!player) {
                console.warn('找不到玩家:', result.player_id);
                return;
            }

            const row = document.createElement('div');
            row.className = 'result-row';
            
            const rank = result.rank ? result.rank : '-';
            const reaction = result.reaction_time ? `${result.reaction_time.toFixed(0)}ms` : 
                           result.is_false_start ? '抢跑' : '未反应';
            
            row.innerHTML = `
                <div>
                    <span class="rank-badge">${rank}</span>
                    <strong>${player.name}</strong>
                </div>
                <div>
                    <span class="reaction-time">${reaction}</span>
                    <span>积分: ${player.score}</span>
                </div>
            `;
            
            resultsList.appendChild(row);
        });

        // 更新玩家卡片显示
        this.players.forEach(player => {
            const scoreEl = document.getElementById(`score-${player.id}`);
            if (scoreEl) scoreEl.textContent = player.score;
        });
    }

    showFinalResults() {
        const leaderboard = document.getElementById('final-leaderboard');
        const leaderboardList = document.getElementById('leaderboard-list');
        
        leaderboard.style.display = 'block';
        leaderboardList.innerHTML = '';

        // 按最终积分排序
        const sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);

        sortedPlayers.forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'result-row';
            row.innerHTML = `
                <div>
                    <span class="rank-badge">${index + 1}</span>
                    <strong>${player.name}</strong>
                </div>
                <div>
                    <span>最终积分: ${player.score}</span>
                </div>
            `;
            leaderboardList.appendChild(row);
        });
    }

    nextRound() {
        this.currentRound++;
        this.reactedPlayers = new Set(); // 关键：重置已反应玩家集合
        document.getElementById('next-round-btn').style.display = 'none';
        document.getElementById('round-results').style.display = 'none';
        
        // 重置玩家状态显示 - 添加空值检查
        if (this.players && Array.isArray(this.players)) {
            this.players.forEach(player => {
                if (player && player.id) {
                    const reactionEl = document.getElementById(`reaction-${player.id}`);
                    const statusEl = document.getElementById(`status-${player.id}`);
                    
                    if (reactionEl) reactionEl.textContent = '-';
                    if (statusEl) {
                        statusEl.textContent = '准备中';
                        statusEl.className = 'player-status';
                    }
                }
            });
        }

        this.startCountdown();
    }

    resetLights() {
        for (let i = 0; i < 5; i++) {
            const light = document.getElementById(`light-${i}`);
            if (light) {
                light.className = 'light red';
            }
        }
    }

    resetGame() {
        // 停止所有计时器
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }
        
        this.isGameActive = false;
        this.gameId = null;
        this.players = [];
        this.currentRound = 0;
        this.reactedPlayers = new Set();
        
        // 重置界面 - 添加空值检查
        const setupEl = document.getElementById('game-setup');
        const interfaceEl = document.getElementById('game-interface');
        const resultsEl = document.getElementById('round-results');
        const leaderboardEl = document.getElementById('final-leaderboard');
        
        if (setupEl) setupEl.style.display = 'block';
        if (interfaceEl) interfaceEl.style.display = 'none';
        if (resultsEl) resultsEl.style.display = 'none';
        if (leaderboardEl) leaderboardEl.style.display = 'none';
        
        this.resetLights();
    }

    updateStatus(message, type) {
        const statusDisplay = document.getElementById('status-display');
        if (statusDisplay) {
            statusDisplay.textContent = message;
            statusDisplay.className = `status-display status-${type}`;
        }
    }

    updateGameState(gameData) {
        if (!gameData) {
            console.error('无效的gameData:', gameData);
            return;
        }
        
        this.gameState = gameData.game_state;
        this.players = gameData.players || [];
        this.currentRound = gameData.current_round || 0;
        
        // 更新玩家显示 - 确保players存在且是数组
        if (this.players && Array.isArray(this.players)) {
            this.players.forEach(player => {
                if (player && player.id) {
                    const scoreEl = document.getElementById(`score-${player.id}`);
                    if (scoreEl) scoreEl.textContent = player.score || 0;
                }
            });
        }
    }
}

// 全局游戏实例
let racingGame = new RacingGame();

// 简化全局函数调用
function createGame() {
    racingGame.createGame();
}

function startGame() {
    racingGame.startGame();
}

function nextRound() {
    racingGame.nextRound();
}

function resetGame() {
    racingGame.resetGame();
}

function playerReady() {
    // 可以扩展玩家准备功能
    console.log('玩家已准备');
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏎️ 赛车起跑反应游戏已加载');
});