import { Modules, ModuleConnections } from './data.js';

class PuzzleSystem {
    constructor() {
        this.grid = document.getElementById('puzzleGrid');
        this.tiles = [];
        this.connections = [];
        this.activeTile = null;
        this.init();
    }

    init() {
        if (!this.grid) return;

        this.setupTiles();
        this.setupConnections();
        this.setupEventListeners();
        this.animateEntrance();
    }

    setupTiles() {
        this.tiles = Array.from(this.grid.querySelectorAll('.puzzle-tile'));

        this.tiles.forEach((tile, index) => {
            const tileId = tile.dataset.tile;
            const module = Modules[tileId];

            if (module) {
                // Добавляем данные модуля
                tile.dataset.connections = JSON.stringify(module.connections);
                tile.dataset.stats = JSON.stringify(module.stats);

                // Устанавливаем задержку для анимации
                tile.style.setProperty('--animation-delay', `${index * 0.1}s`);
            }
        });
    }

    setupConnections() {
        // Создаем контейнер для коннекторов
        const connectionsContainer = document.createElement('div');
        connectionsContainer.className = 'puzzle-connections-container';
        connectionsContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        `;
        this.grid.appendChild(connectionsContainer);

        // Создаем визуальные связи между плитками
        ModuleConnections.forEach(connection => {
            const fromTile = this.grid.querySelector(`[data-tile="${connection.from}"]`);
            const toTile = this.grid.querySelector(`[data-tile="${connection.to}"]`);

            if (fromTile && toTile) {
                this.createConnection(fromTile, toTile, connection.strength);
            }
        });
    }

    createConnection(fromTile, toTile, strength) {
        const connection = document.createElement('div');
        connection.className = 'puzzle-connection';
        connection.dataset.from = fromTile.dataset.tile;
        connection.dataset.to = toTile.dataset.tile;
        connection.dataset.strength = strength;

        connection.style.cssText = `
            position: absolute;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 0;
        `;

        this.updateConnectionPosition(connection, fromTile, toTile);
        this.grid.appendChild(connection);
        this.connections.push(connection);
    }

    updateConnectionPosition(connection, fromTile, toTile) {
        const fromRect = fromTile.getBoundingClientRect();
        const toRect = toTile.getBoundingClientRect();
        const gridRect = this.grid.getBoundingClientRect();

        const fromCenter = {
            x: fromRect.left + fromRect.width / 2 - gridRect.left,
            y: fromRect.top + fromRect.height / 2 - gridRect.top
        };

        const toCenter = {
            x: toRect.left + toRect.width / 2 - gridRect.left,
            y: toRect.top + toRect.height / 2 - gridRect.top
        };

        // Рассчитываем угол и расстояние
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Устанавливаем стили для линии
        connection.style.width = `${distance}px`;
        connection.style.height = '2px';
        connection.style.left = `${fromCenter.x}px`;
        connection.style.top = `${fromCenter.y}px`;
        connection.style.transform = `rotate(${angle}deg)`;
        connection.style.transformOrigin = '0 0';

        // Градиент в зависимости от силы связи
        const strength = parseFloat(connection.dataset.strength);
        const opacity = strength * 0.3;
        connection.style.background = `linear-gradient(90deg, 
            rgba(168, 50, 66, ${opacity}) 0%,
            rgba(168, 50, 66, ${opacity * 0.5}) 100%)`;
    }

    setupEventListeners() {
        // События для плиток
        this.tiles.forEach(tile => {
            tile.addEventListener('mouseenter', (e) => this.handleTileHover(e));
            tile.addEventListener('mouseleave', () => this.handleTileLeave());
            tile.addEventListener('focus', (e) => this.handleTileHover(e));
            tile.addEventListener('blur', () => this.handleTileLeave());

            // Клик для навигации
            tile.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToModule(tile.dataset.tile);
            });
        });

        // Ресайз окна
        window.addEventListener('resize', () => this.updateAllConnections());

        // Навигация с клавиатуры
        this.grid.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const activeElement = document.activeElement;
                if (activeElement.classList.contains('puzzle-tile')) {
                    e.preventDefault();
                    this.navigateToModule(activeElement.dataset.tile);
                }
            }
        });
    }

    handleTileHover(event) {
        const tile = event.currentTarget;
        const tileId = tile.dataset.tile;

        if (this.activeTile === tileId) return;
        this.activeTile = tileId;

        // Подсвечиваем связанные плитки
        this.highlightConnections(tileId);

        // Показываем связи
        this.showConnections(tileId);

        // Обновляем робота-проводника
        this.updateRobotAssistant(tileId);

        // Добавляем визуальный эффект
        tile.classList.add('puzzle-tile--active');
    }

    handleTileLeave() {
        this.activeTile = null;

        // Снимаем подсветку
        this.tiles.forEach(tile => {
            tile.classList.remove('puzzle-tile--active', 'connected');
        });

        // Скрываем связи
        this.hideAllConnections();

        // Сбрасываем робота-проводника
        this.resetRobotAssistant();
    }

    highlightConnections(tileId) {
        const module = Modules[tileId];
        if (!module) return;

        module.connections.forEach(connId => {
            const connectedTile = this.grid.querySelector(`[data-tile="${connId}"]`);
            if (connectedTile) {
                connectedTile.classList.add('connected');
            }
        });
    }

    showConnections(tileId) {
        this.connections.forEach(conn => {
            if (conn.dataset.from === tileId || conn.dataset.to === tileId) {
                conn.style.opacity = '1';
            }
        });
    }

    hideAllConnections() {
        this.connections.forEach(conn => {
            conn.style.opacity = '0';
        });
    }

    updateAllConnections() {
        this.connections.forEach(conn => {
            const fromTile = this.grid.querySelector(`[data-tile="${conn.dataset.from}"]`);
            const toTile = this.grid.querySelector(`[data-tile="${conn.dataset.to}"]`);

            if (fromTile && toTile) {
                this.updateConnectionPosition(conn, fromTile, toTile);
            }
        });
    }

    updateRobotAssistant(tileId) {
        const module = Modules[tileId];
        if (!module || !window.robotAssistant) return;

        const hint = `Модуль "${module.title}". ${module.connections.length} связанных направлений.`;
        window.robotAssistant.showHint(hint);
        window.robotAssistant.setStatus('ACTIVE');
    }

    resetRobotAssistant() {
        if (window.robotAssistant) {
            window.robotAssistant.showHint('Наведите на модуль для просмотра связей');
            window.robotAssistant.setStatus('IDLE');
        }
    }

    navigateToModule(moduleId) {
        const module = Modules[moduleId];
        if (!module) return;

        // Анимация перехода
        this.tiles.forEach(tile => {
            if (tile.dataset.tile !== moduleId) {
                tile.style.opacity = '0.5';
                tile.style.transform = 'scale(0.95)';
            }
        });

        // Эффект на активной плитке
        const activeTile = this.grid.querySelector(`[data-tile="${moduleId}"]`);
        if (activeTile) {
            activeTile.style.transform = 'scale(1.1)';
            activeTile.style.zIndex = '10';
        }

        // Обновляем робота
        if (window.robotAssistant) {
            window.robotAssistant.setStatus('LOADING');
            window.robotAssistant.blinkEyes();
        }

        // Имитация загрузки
        setTimeout(() => {
            // В реальном приложении здесь будет переход на страницу модуля
            console.log(`Навигация к модулю: ${module.title}`);

            // Сброс анимации
            setTimeout(() => {
                this.tiles.forEach(tile => {
                    tile.style.opacity = '';
                    tile.style.transform = '';
                });

                if (activeTile) {
                    activeTile.style.transform = '';
                    activeTile.style.zIndex = '';
                }

                if (window.robotAssistant) {
                    window.robotAssistant.setStatus('ACTIVE');
                }
            }, 500);
        }, 800);
    }

    animateEntrance() {
        this.tiles.forEach((tile, index) => {
            tile.style.opacity = '0';
            tile.style.transform = 'translateY(30px) scale(0.9)';

            setTimeout(() => {
                tile.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                tile.style.opacity = '1';
                tile.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        });

        // Постепенное появление связей
        setTimeout(() => {
            this.connections.forEach((conn, index) => {
                setTimeout(() => {
                    conn.style.opacity = '0.3';
                }, index * 50);
            });
        }, 500);
    }

    // Публичные методы для взаимодействия с другими компонентами
    getActiveModule() {
        return this.activeTile ? Modules[this.activeTile] : null;
    }

    getModuleStats(moduleId) {
        return Modules[moduleId]?.stats || null;
    }

    getAllModules() {
        return Object.values(Modules);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.puzzleSystem = new PuzzleSystem();
});

// Экспорт для использования в других модулях
export default PuzzleSystem;