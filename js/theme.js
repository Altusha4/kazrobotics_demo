// theme.js
class ThemeManager {
    constructor() {
        this.themeToggle = document.querySelectorAll('.theme-toggle');
        this.currentTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.setupEventListeners();
        this.updateToggleButton();
    }

    setTheme(theme) {
        // Устанавливаем тему
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;

        // Обновляем мета-тег для мобильных устройств
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'light' ? '#ffffff' : '#171717';
        }

        // Обновляем робота-помощника
        if (window.robotAssistant) {
            window.robotAssistant.showHint(`Тема изменена: ${theme === 'light' ? 'Светлая' : 'Тёмная'}`);
        }

        // Отправляем событие для других компонентов
        document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        this.updateToggleButton();
    }

    updateToggleButton() {
        // Обновляем состояние кнопки переключения темы
        this.themeToggle.forEach(button => {
            const sunIcon = button.querySelector('.theme-toggle__icon--sun');
            const moonIcon = button.querySelector('.theme-toggle__icon--moon');

            if (this.currentTheme === 'light') {
                sunIcon.style.opacity = '1';
                sunIcon.style.transform = 'rotate(0deg)';
                moonIcon.style.opacity = '0';
                moonIcon.style.transform = 'rotate(-90deg)';
                button.setAttribute('aria-label', 'Включить тёмную тему');
            } else {
                sunIcon.style.opacity = '0';
                sunIcon.style.transform = 'rotate(90deg)';
                moonIcon.style.opacity = '1';
                moonIcon.style.transform = 'rotate(0deg)';
                button.setAttribute('aria-label', 'Включить светлую тему');
            }
        });
    }

    setupEventListeners() {
        // Обработчики для кнопок переключения темы
        this.themeToggle.forEach(button => {
            button.addEventListener('click', () => this.toggleTheme());
        });

        // Следим за системными настройками темы
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme);
                this.updateToggleButton();
            }
        });

        // Сохраняем тему при закрытии страницы
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('theme', this.currentTheme);
        });
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    isLightTheme() {
        return this.currentTheme === 'light';
    }

    // Метод для обновления компонентов при смене темы
    updateComponentsForTheme() {
        // Обновляем партнёрские логотипы
        const partnerLogos = document.querySelectorAll('.partner-card__logo');
        partnerLogos.forEach(logo => {
            const src = logo.getAttribute('src');
            if (src) {
                const isDarkLogo = src.includes('-dark.svg');
                const isLightLogo = src.includes('-light.svg');

                if (this.currentTheme === 'light' && isDarkLogo) {
                    logo.src = src.replace('-dark.svg', '-light.svg');
                } else if (this.currentTheme === 'dark' && isLightLogo) {
                    logo.src = src.replace('-light.svg', '-dark.svg');
                }
            }
        });

        // Обновляем градиенты для робота
        const robotGuide = document.querySelector('.robot-guide');
        if (robotGuide) {
            if (this.currentTheme === 'light') {
                robotGuide.style.setProperty('--shadow-glow', '0 0 30px rgba(168, 50, 66, 0.15)');
            } else {
                robotGuide.style.setProperty('--shadow-glow', '0 0 30px rgba(168, 50, 66, 0.3)');
            }
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();

    // Слушаем событие смены темы для обновления компонентов
    document.addEventListener('themechange', (e) => {
        window.themeManager.updateComponentsForTheme();
    });
});

// Экспорт для использования в других модулях
export default ThemeManager;