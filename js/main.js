import { newsMock, systemStats } from './data.js';

class KazRoboticsApp {
    constructor() {
        this.newsGrid = document.getElementById('newsGrid');
        this.newsFilters = document.querySelectorAll('.news__control-btn');
        this.currentFilter = 'all';
        this.isMobile = window.innerWidth < 768;
        this.menuOpen = false;

        this.init();
    }

    init() {
        this.setupAccessibility();
        this.setupNews();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupPerformance();
        this.checkBrowserSupport();

        // Инициализация статистики
        this.initStatsCounters();

        // Запуск системного мониторинга
        this.startSystemMonitoring();
    }

    setupAccessibility() {
        // Улучшение доступности
        document.addEventListener('keydown', (e) => {
            // Закрытие мобильного меню по ESC
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }

            // Навигация по плиткам
            if (e.key === 'Tab' && document.activeElement.classList.contains('puzzle-tile')) {
                const tileId = document.activeElement.dataset.tile;
                if (window.robotAssistant) {
                    window.robotAssistant.updateModuleStats(tileId);
                }
            }
        });

        // Skip links
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    setTimeout(() => target.removeAttribute('tabindex'), 1000);
                }
            });
        });
    }

    setupNews() {
        if (!this.newsGrid) return;

        this.renderNews(this.currentFilter);
    }

    renderNews(filter = 'all') {
        const filteredNews = filter === 'all'
            ? newsMock
            : newsMock.filter(item => item.source === filter);

        this.newsGrid.innerHTML = filteredNews.map(item => this.createNewsCard(item)).join('');

        // Обновляем активный фильтр
        this.newsFilters.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    createNewsCard(item) {
        const sourceIcons = {
            telegram: '📢',
            instagram: '📷'
        };

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        };

        return `
            <article class="news-card" data-source="${item.source}" role="article">
                <div class="news-card__header">
                    <div class="news-card__source">
                        <span class="news-card__source-icon" aria-hidden="true">
                            ${sourceIcons[item.source] || '📰'}
                        </span>
                        <span class="news-card__source-name">${item.source === 'telegram' ? 'Telegram' : 'Instagram'}</span>
                    </div>
                    <time class="news-card__date" datetime="${item.date}">
                        ${formatDate(item.date)}
                    </time>
                </div>
                
                <h3 class="news-card__title">
                    <a href="${item.url}" class="news-card__link">${this.escapeHtml(item.title)}</a>
                </h3>
                
                <p class="news-card__excerpt">${this.escapeHtml(item.excerpt)}</p>
                
                <div class="news-card__footer">
                    <div class="news-card__tags">
                        ${item.tags.map(tag => `
                            <span class="news-card__tag" aria-label="Тег: ${tag}">${tag}</span>
                        `).join('')}
                    </div>
                    <div class="news-card__meta">
                        <span class="news-card__read-time">${item.readTime}</span>
                    </div>
                </div>
            </article>
        `;
    }

    setupEventListeners() {
        // Фильтрация новостей
        this.newsFilters?.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.currentFilter = filter;
                this.renderNews(filter);

                // Обновляем робота
                if (window.robotAssistant) {
                    window.robotAssistant.showHint(`Показаны новости: ${filter === 'all' ? 'Все' : filter}`);
                }
            });
        });

        // Mobile menu functionality
        this.setupMobileMenu();

        // Header scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Resize observer
        this.setupResizeObserver();

        // Form submissions (будущая реализация)
        this.setupForms();

        // Smooth scroll for anchor links
        this.setupSmoothScroll();
    }

    setupMobileMenu() {
        const burger = document.querySelector('.burger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-nav__link, .mobile-auth .btn');
        const body = document.body;

        if (!burger || !mobileMenu) return;

        // Toggle mobile menu
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        // Close menu when clicking on links
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.menuOpen &&
                !e.target.closest('.mobile-menu') &&
                !e.target.closest('.burger')) {
                this.closeMobileMenu();
            }
        });

        // Prevent body scroll when menu is open
        mobileMenu.addEventListener('touchmove', (e) => {
            if (this.menuOpen) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    toggleMobileMenu() {
        const burger = document.querySelector('.burger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const body = document.body;

        this.menuOpen = !this.menuOpen;

        if (burger) {
            burger.setAttribute('aria-expanded', this.menuOpen);
            burger.classList.toggle('active');
        }

        if (mobileMenu) {
            mobileMenu.classList.toggle('active');
            mobileMenu.setAttribute('aria-hidden', !this.menuOpen);
        }

        body.classList.toggle('menu-open', this.menuOpen);

        // Lock body scroll when menu is open
        body.style.overflow = this.menuOpen ? 'hidden' : '';

        // Update robot assistant
        if (window.robotAssistant) {
            if (this.menuOpen) {
                window.robotAssistant.showHint('Мобильное меню открыто');
            }
        }
    }

    closeMobileMenu() {
        if (!this.menuOpen) return;

        const burger = document.querySelector('.burger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const body = document.body;

        this.menuOpen = false;

        if (burger) {
            burger.setAttribute('aria-expanded', 'false');
            burger.classList.remove('active');
        }

        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            mobileMenu.setAttribute('aria-hidden', 'true');
        }

        body.classList.remove('menu-open');
        body.style.overflow = '';
    }

    handleScroll() {
        const header = document.querySelector('.header');
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }

        // Progress bar
        const progress = document.querySelector('.progress-bar');
        if (progress) {
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const trackLength = docHeight - winHeight;
            const pctScrolled = Math.floor((scrollY / trackLength) * 100);
            progress.style.width = `${pctScrolled}%`;
            progress.setAttribute('aria-valuenow', pctScrolled);
        }
    }

    setupResizeObserver() {
        if (!('ResizeObserver' in window)) return;

        const observer = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                const width = entry.contentRect.width;
                this.isMobile = width < 768;

                // Закрываем меню при переходе на десктоп
                if (!this.isMobile && this.menuOpen) {
                    this.closeMobileMenu();
                }

                // Обновляем поведение на мобильных устройствах
                if (this.isMobile && window.robotAssistant) {
                    window.robotAssistant.showHint('Используйте свайпы для навигации', 3000);
                }
            });
        });

        observer.observe(document.body);
    }

    setupSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');

                // Пропускаем ссылки на другие страницы
                if (href === '#' || href.includes('.html')) return;

                const targetId = href.substring(1);
                const target = document.getElementById(targetId);

                if (target) {
                    e.preventDefault();

                    // Закрываем мобильное меню если открыто
                    if (this.menuOpen) {
                        this.closeMobileMenu();
                    }

                    // Плавный скролл
                    window.scrollTo({
                        top: target.offsetTop - 80,
                        behavior: 'smooth'
                    });

                    // Фокусировка на элементе для доступности
                    setTimeout(() => {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                        setTimeout(() => target.removeAttribute('tabindex'), 1000);
                    }, 500);
                }
            });
        });
    }

    setupForms() {
        // Заглушка для будущих форм
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (window.robotAssistant) {
                    window.robotAssistant.setStatus('LOADING');
                }

                // Имитация отправки
                setTimeout(() => {
                    if (window.robotAssistant) {
                        window.robotAssistant.setStatus('ACTIVE');
                        window.robotAssistant.celebrate();
                    }
                    this.showToast('Форма успешно отправлена!');
                }, 1500);
            });
        });
    }

    setupAnimations() {
        // Intersection Observer для анимаций при скролле
        if (!('IntersectionObserver' in window)) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');

                    // Особые анимации для статистики
                    if (entry.target.classList.contains('hero__stat-value')) {
                        this.animateStatCounter(entry.target);
                    }

                    // Отключаем наблюдение после анимации
                    setTimeout(() => {
                        observer.unobserve(entry.target);
                    }, 1000);
                }
            });
        }, observerOptions);

        // Наблюдаем за элементами для анимации
        const animatedElements = document.querySelectorAll('.puzzle-tile, .news-card, .partner-card');
        animatedElements.forEach(el => observer.observe(el));

        // Анимация счетчиков статистики
        const statValues = document.querySelectorAll('.hero__stat-value[data-count]');
        statValues.forEach(el => observer.observe(el));
    }

    animateStatCounter(element) {
        const target = parseInt(element.dataset.count);
        const current = parseInt(element.textContent);

        if (current === target || element.dataset.animating) return;

        element.dataset.animating = 'true';
        this.animateValue(element, current, target, 2000);
    }

    animateValue(element, start, end, duration) {
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const value = Math.floor(start + (end - start) * easeOutQuart);

            element.textContent = value.toLocaleString('ru-RU');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                delete element.dataset.animating;
            }
        };

        requestAnimationFrame(animate);
    }

    initStatsCounters() {
        // Обновляем статистику в hero
        const statElements = {
            'Активных проектов': systemStats.activeProjects,
            'Участников': systemStats.totalUsers,
            'Городов': systemStats.totalCities
        };

        Object.entries(statElements).forEach(([label, value]) => {
            const element = Array.from(document.querySelectorAll('.hero__stat-label'))
                .find(el => el.textContent.includes(label))
                ?.previousElementSibling;

            if (element) {
                element.dataset.count = value;
            }
        });
    }

    startSystemMonitoring() {
        // Мониторинг производительности
        if ('performance' in window) {
            setTimeout(() => {
                const perf = performance.getEntriesByType('navigation')[0];
                if (perf) {
                    console.log(`Время загрузки: ${Math.round(perf.domContentLoadedEventEnd)}мс`);

                    if (window.robotAssistant && perf.domContentLoadedEventEnd < 2000) {
                        window.robotAssistant.showHint('Система загружена быстро!', 2000);
                    }
                }
            }, 1000);
        }

        // Проверка соединения
        setInterval(() => {
            if (!navigator.onLine && window.robotAssistant) {
                window.robotAssistant.setStatus('ERROR');
                window.robotAssistant.showHint('Потеряно соединение с интернетом');
            }
        }, 5000);

        // Обновление онлайн-статистики
        setInterval(() => {
            this.updateOnlineStats();
        }, 30000);
    }

    updateOnlineStats() {
        // Имитация обновления онлайн статистики
        const onlineCountElement = document.querySelector('[data-online-count]');
        if (!onlineCountElement) return;

        const current = parseInt(onlineCountElement.textContent);
        const change = Math.floor(Math.random() * 10) - 3; // -3 to +6
        const newValue = Math.max(100, Math.min(current + change, 200));

        if (newValue !== current) {
            this.animateValue(onlineCountElement, current, newValue, 500);
        }
    }

    setupPerformance() {
        // Lazy loading для изображений
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }

        // Prefetch важных страниц
        if ('connection' in navigator && navigator.connection.saveData !== true) {
            const importantPages = ['about.html', 'projects.html', 'sport.html'];
            importantPages.forEach(page => {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = page;
                document.head.appendChild(link);
            });
        }
    }

    checkBrowserSupport() {
        // Проверка поддержки современных возможностей
        const unsupportedFeatures = [];

        if (!('IntersectionObserver' in window)) {
            unsupportedFeatures.push('IntersectionObserver');
        }

        if (!('ResizeObserver' in window)) {
            unsupportedFeatures.push('ResizeObserver');
        }

        if (unsupportedFeatures.length > 0 && window.robotAssistant) {
            window.robotAssistant.showHint(
                `Некоторые функции могут работать медленнее. Обновите браузер.`,
                5000
            );
        }
    }

    showToast(message, type = 'success') {
        // Создаем toast-уведомление
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = `
            <span class="toast__message">${message}</span>
            <button class="toast__close" aria-label="Закрыть уведомление">×</button>
        `;

        document.body.appendChild(toast);

        // Анимация появления
        setTimeout(() => toast.classList.add('toast--show'), 10);

        // Закрытие
        const closeBtn = toast.querySelector('.toast__close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('toast--show');
            setTimeout(() => toast.remove(), 300);
        });

        // Автоматическое закрытие
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('toast--show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Публичные методы
    updateNews(newsData) {
        // Для будущего обновления новостей через API
        console.log('Обновление новостей:', newsData);
    }

    setTheme(theme) {
        // Переключение темы (будущая функциональность)
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        if (window.robotAssistant) {
            window.robotAssistant.showHint(`Тема изменена: ${theme}`);
        }
    }

    // Метод для обновления навигации
    updateNavigation(activeLink) {
        // Обновляем активную ссылку в десктопной навигации
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeLink) {
                link.classList.add('active');
            }
        });

        // Обновляем активную ссылку в мобильной навигации
        document.querySelectorAll('.mobile-nav__link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === activeLink) {
                link.classList.add('active');
            }
        });
    }
}

// Инициализация при полной загрузке страницы
window.addEventListener('load', () => {
    // Убираем preloader если есть
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 300);
    }

    // Определяем активную страницу
    const currentPath = window.location.pathname;
    const activeLink = currentPath.includes('about.html') ? 'about.html' :
        currentPath.includes('projects.html') ? 'projects.html' :
            currentPath.includes('sport.html') ? 'sport.html' :
                currentPath.includes('education.html') ? 'education.html' :
                    currentPath.includes('calendar.html') ? 'calendar.html' :
                        currentPath.includes('shop.html') ? 'shop.html' : '#directions';

    // Запускаем приложение
    window.app = new KazRoboticsApp();

    // Обновляем навигацию
    setTimeout(() => {
        if (window.app) {
            window.app.updateNavigation(activeLink);
        }
    }, 100);

    // Отправляем аналитику (заглушка)
    console.log('KazRobotics Frontend v0.1.0 запущен');

    // Проверяем авторизацию (будущая функциональность)
    setTimeout(() => {
        if (window.robotAssistant && !localStorage.getItem('userToken')) {
            window.robotAssistant.showHint(
                'Зарегистрируйтесь для дохода ко всем функциям',
                5000
            );
        }
    }, 10000);
});

// Обработка ошибок
window.addEventListener('error', (e) => {
    console.error('Ошибка приложения:', e.error);

    if (window.robotAssistant) {
        window.robotAssistant.showSystemMessage(
            'Произошла ошибка в приложении. Мы уже работаем над исправлением.',
            'error'
        );
    }
});

// Обработка promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Необработанный промис:', e.reason);

    if (window.robotAssistant) {
        window.robotAssistant.showSystemMessage(
            'Произошла ошибка при выполнении операции.',
            'error'
        );
    }
});

// Сохранение состояния
window.addEventListener('beforeunload', () => {
    // Сохраняем состояние приложения
    const state = {
        lastVisited: new Date().toISOString(),
        activeFilter: window.app?.currentFilter || 'all',
        scrollPosition: window.scrollY
    };

    sessionStorage.setItem('appState', JSON.stringify(state));
});

// Восстановление состояния при загрузке
document.addEventListener('DOMContentLoaded', () => {
    try {
        const savedState = sessionStorage.getItem('appState');
        if (savedState) {
            const state = JSON.parse(savedState);

            // Восстанавливаем позицию скролла
            if (state.scrollPosition > 0) {
                setTimeout(() => {
                    window.scrollTo(0, state.scrollPosition);
                }, 100);
            }
        }
    } catch (e) {
        console.warn('Не удалось восстановить состояние:', e);
    }
});

// Экспорт приложения
export default KazRoboticsApp;