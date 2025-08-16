// 网站交互逻辑
class GameWebsite {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModals();
        this.setupAnimations();
        this.setupScrollEffects();
        this.setupGameCards();
    }

    // 导航功能
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        
        // 平滑滚动到锚点
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // 更新活动状态
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });

        // 滚动时更新导航状态
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === current) {
                    link.classList.add('active');
                }
            });
        });

        // 移动端菜单切换
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }
    }

    // 模态框功能
    setupModals() {
        const modal = document.getElementById('gameModal');
        const closeBtn = document.querySelector('.close-btn');
        const gameFrame = document.getElementById('game-frame');
        
        // 打开游戏模态框
        document.querySelectorAll('.btn-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const gameName = btn.getAttribute('data-game');
                const gameTitle = btn.getAttribute('data-title') || gameName;
                
                // 设置游戏标题
                const modalTitle = document.querySelector('.modal-header h2');
                if (modalTitle) {
                    modalTitle.textContent = gameTitle;
                }
                
                // 加载游戏
                this.loadGame(gameName, gameFrame);
                
                // 显示模态框
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        // 关闭模态框
        const closeModal = () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            gameFrame.src = '';
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }

    // 加载游戏
    loadGame(gameName, frame) {
        const gameUrls = {
            'guess-number': '/guess-number.html',
            'racing-game': '/racing-game.html',
            'memory': '/memory.html',
            'puzzle': '/puzzle.html',
            'snake': '/snake.html'
        };

        const url = gameUrls[gameName] || '/guess-number.html';
        frame.src = url;
    }

    // 动画效果
    setupAnimations() {
        // 滚动显示动画
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        document.querySelectorAll('.game-card, .stat-item').forEach(el => {
            observer.observe(el);
        });

        // 浮动图标动画
        this.setupFloatingIcons();
    }

    // 浮动图标效果
    setupFloatingIcons() {
        const icons = document.querySelectorAll('.floating-game-icons .game-icon');
        
        icons.forEach((icon, index) => {
            // 添加随机移动
            setInterval(() => {
                const x = (Math.random() - 0.5) * 10;
                const y = (Math.random() - 0.5) * 10;
                icon.style.transform = `translate(${x}px, ${y}px)`;
            }, 2000 + index * 500);
        });
    }

    // 滚动效果
    setupScrollEffects() {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            const currentScrollY = window.scrollY;
            
            // 导航栏滚动效果
            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            // 隐藏/显示导航栏
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.classList.add('hidden');
            } else {
                navbar.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
        });
    }

    // 游戏卡片交互
    setupGameCards() {
        const gameCards = document.querySelectorAll('.game-card');
        
        gameCards.forEach(card => {
            // 鼠标悬停效果
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
            
            // 键盘导航
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const playBtn = card.querySelector('.btn-play');
                    if (playBtn) playBtn.click();
                }
            });
        });
    }

    // 工具方法
    smoothScrollTo(element, duration = 1000) {
        const targetPosition = element.offsetTop - 80;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }

    ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
}

// 全局游戏打开函数
function openGame(gameName) {
    const gameUrls = {
        'guess-number': '/guess-number.html',
        'racing-game': '/racing-game.html'
    };
    
    const url = gameUrls[gameName];
    if (url) {
        window.location.href = url;
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GameWebsite();
    });
} else {
    new GameWebsite();
}

// 添加CSS动画类
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .navbar.scrolled {
        background: rgba(15, 23, 42, 0.95);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    
    .navbar.hidden {
        transform: translateY(-100%);
    }
    
    .game-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .game-card:hover {
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
    }
    
    .nav-menu.active {
        display: flex;
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: rgba(15, 23, 42, 0.95);
        flex-direction: column;
        padding: 1rem;
        gap: 1rem;
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;
document.head.appendChild(style);

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 使用防抖优化滚动事件
const debouncedScroll = debounce(() => {
    // 滚动相关逻辑
}, 16);

window.addEventListener('scroll', debouncedScroll);

// 预加载游戏资源
const gamePreloader = {
    games: {
        'guess-number': {
            url: '/guess-number.html',
            loaded: false,
            priority: 'high'
        }
    },
    
    preload(gameName) {
        if (this.games[gameName] && !this.games[gameName].loaded) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = this.games[gameName].url;
            document.head.appendChild(link);
            this.games[gameName].loaded = true;
        }
    },
    
    preloadHighPriority() {
        Object.keys(this.games).forEach(game => {
            if (this.games[game].priority === 'high') {
                this.preload(game);
            }
        });
    }
};

// 页面加载后预加载高优先级游戏
document.addEventListener('DOMContentLoaded', () => {
    gamePreloader.preloadHighPriority();
});

// 添加键盘快捷键支持
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 打开搜索（如果有）
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 搜索功能可以在这里添加
    }
    
    // ESC 关闭所有模态框
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
});

// 添加页面可见性检测
let hiddenTime = 0;
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        hiddenTime = Date.now();
    } else {
        const awayTime = Date.now() - hiddenTime;
        if (awayTime > 30000) { // 离开超过30秒
            console.log('用户返回，可以刷新游戏状态');
        }
    }
});

// 添加错误处理
window.addEventListener('error', (e) => {
    console.error('网站错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});

// 导出到全局作用域（如果需要）
window.GameWebsite = GameWebsite;