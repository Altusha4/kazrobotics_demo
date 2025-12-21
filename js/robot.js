import { SystemStatus, Modules, systemStats } from './data.js';

class RobotAssistant {
    constructor() {
        this.robot = document.getElementById('robotGuide');
        if (!this.robot) return;

        this.eyes = this.robot.querySelectorAll('[data-eye]');
        this.status = this.robot.querySelector('[data-status]');
        this.hint = this.robot.querySelector('[data-hint]');
        this.modulesCount = this.robot.querySelector('[data-modules-count]');
        this.onlineCount = this.robot.querySelector('[data-online-count]');

        this.currentStatus = 'IDLE';
        this.isActive = false;
        this.mousePosition = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.startSystemMonitoring();
        this.animateEntrance();
    }

    setupElements() {
        // Инициализируем счетчики
        if (this.modulesCount) {
            this.modulesCount.textContent = Object.keys(Modules).length;
        }

        if (this.onlineCount) {
            this.onlineCount.textContent = systemStats.onlineUsers;
        }

        // Устанавливаем начальный статус
        this.setStatus('ACTIVE');
    }

    setupEventListeners() {
        // Слежение за курсором
        document.addEventListener('mousemove', (e) => {
            this.mousePosition = { x: e.clientX, y: e.clientY };
            this.followCursor();
        });

        // Слежение за активным элементом
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('puzzle-tile')) {
                this.lookAtElement(e.target);
            }
        });

        // Системные события
        window.addEventListener('online', () => this.setStatus('ACTIVE'));
        window.addEventListener('offline', () => this.setStatus('ERROR'));

        // Видимость страницы
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.setStatus('IDLE');
            } else {
                this.setStatus('ACTIVE');
            }
        });
    }

    startSystemMonitoring() {
        // Мониторинг активности системы
        setInterval(() => {
            this.updateOnlineCount();
        }, 30000); // Каждые 30 секунд

        // Случайные подсказки
        setInterval(() => {
            if (!this.isActive && Math.random() > 0.7) {
                this.showRandomHint();
            }
        }, 60000); // Каждую минуту
    }

    followCursor() {
        if (!this.eyes.length || !this.isActive) return;

        const rect = this.robot.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;

        const dx = this.mousePosition.x - centerX;
        const dy = this.mousePosition.y - centerY;
        const distance = Math.min(15, Math.hypot(dx, dy) / 20);
        const angle = Math.atan2(dy, dx);

        this.eyes.forEach(eye => {
            eye.style.transform = `translate(${Math.cos(angle) * distance}px, 
                                            ${Math.sin(angle) * distance}px)`;
        });
    }

    lookAtElement(element) {
        const rect = element.getBoundingClientRect();
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        this.mousePosition = { x: targetX, y: targetY };
        this.followCursor();

        // Показываем подсказку о элементе
        const title = element.querySelector('.puzzle-tile__title')?.textContent;
        if (title) {
            this.showHint(`Сфокусировано: ${title}`);
        }
    }

    setStatus(status) {
        if (this.currentStatus === status) return;

        const state = SystemStatus[status];
        if (!state) return;

        this.currentStatus = status;
        this.isActive = status === 'ACTIVE' || status === 'LOADING';

        if (this.status) {
            const dot = this.status.querySelector('.status-dot');
            const text = this.status.querySelector('.status-text');
            const icon = this.status.querySelector('.status-icon');

            if (dot) dot.style.backgroundColor = state.color;
            if (text) text.textContent = state.text;
            if (icon) icon.textContent = state.icon;
        }

        // Анимация для определенных статусов
        switch (status) {
            case 'LOADING':
                this.startLoadingAnimation();
                break;
            case 'ERROR':
                this.shakeHead();
                break;
            case 'ACTIVE':
                this.blinkEyes(3, 100);
                break;
        }

        // Логирование статуса
        console.log(`🤖 ${state.text}`);
    }

    showHint(message, duration = 3000) {
        if (!this.hint) return;

        this.hint.textContent = message;
        this.hint.style.opacity = '1';

        clearTimeout(this.hintTimeout);
        this.hintTimeout = setTimeout(() => {
            this.hint.style.opacity = '0.5';
        }, duration);
    }

    showRandomHint() {
        const hints = [
            "Изучите все модули системы",
            "Наведите на плитку для просмотра связей",
            "Регистрируйтесь, чтобы получить доступ ко всем возможностям",
            "Следите за календарём мероприятий",
            "Присоединяйтесь к исследовательским проектам"
        ];

        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        this.showHint(randomHint);
    }

    blinkEyes(times = 1, interval = 150) {
        if (!this.eyes.length) return;

        let count = 0;
        const blink = () => {
            this.eyes.forEach(eye => {
                eye.style.transform = 'scaleY(0.1)';
                setTimeout(() => {
                    eye.style.transform = 'scaleY(1)';
                }, interval / 2);
            });

            count++;
            if (count < times) {
                setTimeout(blink, interval);
            }
        };

        blink();
    }

    shakeHead() {
        if (!this.robot) return;

        this.robot.style.animation = 'none';
        setTimeout(() => {
            this.robot.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                this.robot.style.animation = '';
            }, 500);
        }, 10);
    }

    startLoadingAnimation() {
        if (!this.eyes.length) return;

        this.eyes.forEach(eye => {
            eye.style.animation = 'eye-pulse 1s ease-in-out infinite';
        });

        // Останавливаем анимацию через 3 секунды
        setTimeout(() => {
            this.eyes.forEach(eye => {
                eye.style.animation = '';
            });
        }, 3000);
    }

    updateOnlineCount() {
        if (!this.onlineCount) return;

        // Имитация изменения онлайн-статистики
        const current = parseInt(this.onlineCount.textContent);
        const change = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const newValue = Math.max(100, current + change);

        // Плавное обновление счетчика
        this.animateCounter(this.onlineCount, current, newValue, 1000);
    }

    animateCounter(element, start, end, duration) {
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const value = Math.floor(start + (end - start) * progress);
            element.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    animateEntrance() {
        if (!this.robot) return;

        this.robot.style.opacity = '0';
        this.robot.style.transform = 'translateY(20px) scale(0.95)';

        setTimeout(() => {
            this.robot.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            this.robot.style.opacity = '1';
            this.robot.style.transform = 'translateY(0) scale(1)';

            // Приветствие
            setTimeout(() => {
                this.showHint('Добро пожаловать в KazRobotics!', 4000);
                this.blinkEyes(2);
            }, 500);
        }, 300);
    }

    // Публичные методы для взаимодействия с другими компонентами
    showSystemMessage(message, type = 'info') {
        const colors = {
            info: '#3498db',
            success: '#2ecc71',
            warning: '#f39c12',
            error: '#e74c3c'
        };

        console.log(`🤖 ${type.toUpperCase()}: ${message}`);

        // В будущем можно добавить toast-уведомления
        if (type === 'error') {
            this.setStatus('ERROR');
            this.showHint(message);
        }
    }

    celebrate() {
        this.setStatus('ACTIVE');
        this.blinkEyes(5, 80);
        this.showHint('Отлично! Действие выполнено успешно!');

        // Анимация праздника
        if (this.robot) {
            this.robot.style.animation = 'celebrate 1s ease';
            setTimeout(() => {
                this.robot.style.animation = '';
            }, 1000);
        }
    }

    // Методы для обновления данных
    updateModuleStats(moduleId) {
        const module = Modules[moduleId];
        if (!module) return;

        const stats = module.stats;
        const message = `${module.title}: ${Object.entries(stats)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`;

        this.showHint(message, 4000);
    }
}

// CSS анимации для робота
const robotStyles = document.createElement('style');
robotStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes celebrate {
        0%, 100% { transform: translateY(0) scale(1); }
        25% { transform: translateY(-10px) scale(1.05); }
        50% { transform: translateY(0) scale(1); }
        75% { transform: translateY(-5px) scale(1.02); }
    }
`;
document.head.appendChild(robotStyles);

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.robotAssistant = new RobotAssistant();
});

// Экспорт для использования в других модулях
export default RobotAssistant;