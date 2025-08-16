class GuessNumberGame {
    constructor() {
        this.targetNumber = 0;
        this.attempts = 0;
        this.guesses = [];
        this.gameStartTime = null;
        this.gameTimer = null;
        this.isGameActive = false;
        this.bestScore = this.loadBestScore();
        
        this.initializeElements();
        this.bindEvents();
        this.startNewGame();
    }

    initializeElements() {
        this.elements = {
            guessInput: document.getElementById('guessInput'),
            guessBtn: document.getElementById('guessBtn'),
            resetBtn: document.getElementById('resetBtn'),
            newGameBtn: document.getElementById('newGameBtn'),
            backToHomeBtn: document.getElementById('backToHomeBtn'),
            retryConnectionBtn: document.getElementById('retryConnectionBtn'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            
            attempts: document.getElementById('attempts'),
            gameTime: document.getElementById('gameTime'),
            bestScore: document.getElementById('bestScore'),
            result: document.getElementById('result'),
            hint: document.getElementById('hint'),
            resultIcon: document.getElementById('resultIcon'),
            resultCard: document.getElementById('resultCard'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            historyList: document.getElementById('historyList'),
            historyCount: document.getElementById('historyCount'),
            
            loadingOverlay: document.getElementById('loadingOverlay'),
            errorOverlay: document.getElementById('errorOverlay'),
            achievements: document.getElementById('achievements'),
            achievementText: document.getElementById('achievementText')
        };
    }

    bindEvents() {
        this.elements.guessBtn.addEventListener('click', () => this.makeGuess());
        this.elements.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        this.elements.resetBtn.addEventListener('click', () => this.startNewGame());
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.backToHomeBtn.addEventListener('click', () => this.returnToHome());
        this.elements.retryConnectionBtn.addEventListener('click', () => this.retryConnection());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // 输入验证
        this.elements.guessInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value && (value < 1 || value > 100)) {
                e.target.classList.add('invalid');
            } else {
                e.target.classList.remove('invalid');
            }
        });

        // 焦点管理
        this.elements.guessInput.addEventListener('focus', () => {
            this.elements.guessInput.select();
        });
    }

    startNewGame() {
        this.showLoading();
        
        // 重置游戏状态
        this.targetNumber = Math.floor(Math.random() * 100) + 1;
        this.attempts = 0;
        this.guesses = [];
        this.gameStartTime = Date.now();
        this.isGameActive = true;

        // 重置UI
        this.elements.guessInput.value = '';
        this.elements.guessInput.disabled = false;
        this.elements.guessBtn.disabled = false;
        this.elements.attempts.textContent = '0';
        this.elements.result.textContent = '开始游戏吧！';
        this.elements.hint.textContent = '输入数字后点击提交';
        this.elements.resultIcon.innerHTML = '<i class="fas fa-info-circle"></i>';
        this.elements.resultCard.className = 'result-card';
        this.elements.newGameBtn.style.display = 'none';
        this.elements.resetBtn.style.display = 'inline-block';
        this.elements.progressText.textContent = '新游戏开始！';
        this.elements.progressFill.style.width = '0%';
        
        this.updateHistoryDisplay();
        this.startTimer();
        this.hideLoading();
        
        // 自动聚焦输入框
        setTimeout(() => this.elements.guessInput.focus(), 100);
    }

    makeGuess() {
        if (!this.isGameActive) return;

        const guess = parseInt(this.elements.guessInput.value);
        
        // 验证输入
        if (!guess || guess < 1 || guess > 100) {
            this.showResult('请输入1-100之间的数字！', 'error');
            this.elements.guessInput.classList.add('invalid');
            setTimeout(() => this.elements.guessInput.classList.remove('invalid'), 1000);
            return;
        }

        this.attempts++;
        this.guesses.push({
            number: guess,
            timestamp: Date.now(),
            result: this.getGuessResult(guess)
        });

        this.elements.attempts.textContent = this.attempts;
        this.elements.guessInput.value = '';

        // 更新进度条
        const progress = Math.min((this.attempts / 10) * 100, 100);
        this.elements.progressFill.style.width = progress + '%';

        // 检查猜测结果
        if (guess === this.targetNumber) {
            this.handleWin();
        } else {
            this.handleHint(guess);
        }

        this.updateHistoryDisplay();
        this.elements.guessInput.focus();
    }

    getGuessResult(guess) {
        if (guess === this.targetNumber) return 'win';
        if (guess < this.targetNumber) return 'low';
        return 'high';
    }

    handleWin() {
        this.isGameActive = false;
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        this.stopTimer();
        this.showResult(`🎉 恭喜！答案就是 ${this.targetNumber}`, 'success');
        this.elements.hint.textContent = `用了 ${this.attempts} 次猜测，耗时 ${this.formatTime(gameTime)}`;
        this.elements.newGameBtn.style.display = 'inline-block';
        this.elements.resetBtn.style.display = 'none';
        this.elements.guessInput.disabled = true;
        this.elements.guessBtn.disabled = true;
        this.elements.progressText.textContent = '游戏胜利！';
        this.elements.progressFill.style.width = '100%';

        // 更新最佳记录
        if (!this.bestScore || this.attempts < this.bestScore) {
            this.bestScore = this.attempts;
            this.saveBestScore();
            this.elements.bestScore.textContent = this.bestScore;
            this.showAchievement(`新纪录！${this.attempts}次猜测`);
        }

        // 检查特殊成就
        this.checkSpecialAchievements();
    }

    handleHint(guess) {
        const difference = Math.abs(guess - this.targetNumber);
        let hint, className;

        if (difference <= 5) {
            hint = guess < this.targetNumber ? '非常接近！再大一点！' : '非常接近！再小一点！';
            className = 'very-close';
        } else if (difference <= 10) {
            hint = guess < this.targetNumber ? '接近了！再大一点！' : '接近了！再小一点！';
            className = 'close';
        } else if (difference <= 20) {
            hint = guess < this.targetNumber ? '有点远！再大一点！' : '有点远！再小一点！';
            className = 'far';
        } else {
            hint = guess < this.targetNumber ? '太远了！再大一点！' : '太远了！再小一点！';
            className = 'very-far';
        }

        this.showResult(hint, className);
    }

    showResult(message, type) {
        this.elements.result.textContent = message;
        this.elements.resultCard.className = `result-card ${type}`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            'very-close': '<i class="fas fa-fire"></i>',
            close: '<i class="fas fa-thermometer-half"></i>',
            far: '<i class="fas fa-snowflake"></i>',
            'very-far': '<i class="fas fa-icicles"></i>'
        };
        
        this.elements.resultIcon.innerHTML = icons[type] || '<i class="fas fa-info-circle"></i>';
    }

    checkSpecialAchievements() {
        const achievements = [];
        
        if (this.attempts === 1) {
            achievements.push('一击必中！');
        } else if (this.attempts <= 3) {
            achievements.push('天才！');
        } else if (this.attempts <= 5) {
            achievements.push('优秀！');
        } else if (this.attempts >= 20) {
            achievements.push('坚持不懈！');
        }

        achievements.forEach(achievement => this.showAchievement(achievement));
    }

    showAchievement(text) {
        this.elements.achievementText.textContent = text;
        this.elements.achievements.style.display = 'block';
        this.elements.achievements.classList.add('show');
        
        setTimeout(() => {
            this.elements.achievements.classList.remove('show');
            setTimeout(() => {
                this.elements.achievements.style.display = 'none';
            }, 300);
        }, 2000);
    }

    updateHistoryDisplay() {
        this.elements.historyCount.textContent = this.guesses.length;
        
        if (this.guesses.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-search"></i>
                    <p>还没有猜测记录</p>
                    <small>开始游戏后这里会显示你的猜测历史</small>
                </div>
            `;
            return;
        }

        const historyHTML = this.guesses.map((guess, index) => `
            <div class="history-item ${guess.result}">
                <div class="history-number">${guess.number}</div>
                <div class="history-result">
                    <span class="history-attempt">第 ${index + 1} 次</span>
                    <span class="history-hint">${this.getHistoryHint(guess)}</span>
                </div>
                <div class="history-time">${this.formatTime(guess.timestamp - this.gameStartTime)}</div>
            </div>
        `).join('');

        this.elements.historyList.innerHTML = historyHTML;
    }

    getHistoryHint(guess) {
        switch (guess.result) {
            case 'win': return '✅ 正确！';
            case 'low': return '↗️ 太小了';
            case 'high': return '↙️ 太大了';
            default: return '';
        }
    }

    clearHistory() {
        if (this.guesses.length === 0) return;
        
        this.guesses = [];
        this.updateHistoryDisplay();
        this.showResult('历史记录已清空', 'info');
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            if (!this.isGameActive) return;
            
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.elements.gameTime.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatTime(timestamp) {
        const seconds = Math.floor(timestamp / 1000);
        return this.formatTime(seconds);
    }

    returnToHome() {
        window.location.href = 'index.html';
    }

    retryConnection() {
        this.hideError();
        this.startNewGame();
    }

    loadBestScore() {
        const saved = localStorage.getItem('guessNumber_bestScore');
        return saved ? parseInt(saved) : null;
    }

    saveBestScore() {
        localStorage.setItem('guessNumber_bestScore', this.bestScore);
    }

    showLoading() {
        this.elements.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    showError() {
        this.elements.errorOverlay.style.display = 'flex';
    }

    hideError() {
        this.elements.errorOverlay.style.display = 'none';
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new GuessNumberGame();
});

// 防止页面刷新时的数据丢失
window.addEventListener('beforeunload', (e) => {
    // 如果游戏正在进行中，提示用户
    if (window.game && window.game.isGameActive) {
        e.preventDefault();
        e.returnValue = '';
    }
});