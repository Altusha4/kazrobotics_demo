// main.js
import { newsMock, systemStats } from './data.js';

class KazRoboticsApp {
    constructor() {
        this.newsGrid = document.getElementById('newsGrid');
        this.newsFilters = document.querySelectorAll('.news__control-btn');
        this.currentFilter = 'all';
        this.isMobile = window.innerWidth < 768;
        this.menuOpen = false;
        this.preloader = document.querySelector('.preloader');

        this.init();
    }

    init() {
        this.setupAccessibility();
        this.setupTheme();
        this.setupNews();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupPerformance();
        this.checkBrowserSupport();

        // Инициализация статистики
        this.initStatsCounters();

        // Запуск системного мониторинга
        this.startSystemMonitoring();

        // Скрываем preloader после загрузки
        this.hidePreloader();
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

            // Активация фильтров новостей по клавишам
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const activeFilterBtn = document.querySelector('.news__control-btn.active');
                if (activeFilterBtn) {
                    e.preventDefault();
                    const filters = Array.from(this.newsFilters);
                    const currentIndex = filters.indexOf(activeFilterBtn);
                    let nextIndex;

                    if (e.key === 'ArrowLeft') {
                        nextIndex = currentIndex > 0 ? currentIndex - 1 : filters.length - 1;
                    } else {
                        nextIndex = currentIndex < filters.length - 1 ? currentIndex + 1 : 0;
                    }

                    filters[nextIndex].click();
                    filters[nextIndex].focus();
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

        // Улучшенные focus стили
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('button, a, input, textarea, select')) {
                e.target.classList.add('focused');
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('button, a, input, textarea, select')) {
                e.target.classList.remove('focused');
            }
        });
    }

    setupTheme() {
        // Проверяем сохранённую тему
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Обновляем робота при смене темы
        document.addEventListener('themechange', (e) => {
            if (window.robotAssistant) {
                const themeName = e.detail.theme === 'light' ? 'Светлая' : 'Тёмная';
                window.robotAssistant.showHint(`Тема изменена на ${themeName.toLowerCase()}`);
            }

            // Добавляем класс для анимации смены темы
            document.body.classList.add('theme-changing');
            setTimeout(() => {
                document.body.classList.remove('theme-changing');
            }, 300);
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
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.classList.remove('active');
                btn.removeAttribute('aria-current');
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

                // Аналитика
                this.trackEvent('news_filter', { filter });
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

        // Theme change effects
        this.setupThemeEffects();

        // Кнопки авторизации
        this.setupAuthButtons();

        // Интерактивные элементы
        this.setupInteractiveElements();
    }

    setupMobileMenu() {
        const burger = document.querySelector('.burger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-nav__link, .mobile-auth .btn, .mobile-theme-toggle .theme-toggle');
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

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen) {
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
                window.robotAssistant.setStatus('ACTIVE');
            }
        }

        // Аналитика
        this.trackEvent('mobile_menu', { action: this.menuOpen ? 'open' : 'close' });
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

        // Возвращаем фокус на бургер-кнопку
        setTimeout(() => {
            burger?.focus();
        }, 100);
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

        // Анимации при скролле
        this.handleScrollAnimations();
    }

    handleScrollAnimations() {
        // Анимация для элементов при скролле
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 100;

            if (isVisible) {
                el.classList.add('animated');
            }
        });
    }

    setupResizeObserver() {
        if (!('ResizeObserver' in window)) return;

        const observer = new ResizeObserver((entries) => {
            entries.forEach(entry => {
                const width = entry.contentRect.width;
                const wasMobile = this.isMobile;
                this.isMobile = width < 768;

                // Закрываем меню при переходе на десктоп
                if (!this.isMobile && this.menuOpen) {
                    this.closeMobileMenu();
                }

                // Обновляем поведение на мобильных устройствах
                if (this.isMobile && !wasMobile && window.robotAssistant) {
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

                // Пропускаем ссылки на другие страницы и пустые ссылки
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
                        top: target.offsetTop - 100,
                        behavior: 'smooth'
                    });

                    // Фокусировка на элементе для доступности
                    setTimeout(() => {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                        setTimeout(() => target.removeAttribute('tabindex'), 1000);
                    }, 500);

                    // Обновляем активную ссылку в навигации
                    this.updateActiveNavLink(href);

                    // Аналитика
                    this.trackEvent('anchor_click', { target: targetId });
                }
            });
        });
    }

    updateActiveNavLink(href) {
        // Обновляем активную ссылку в навигации
        document.querySelectorAll('.nav__link, .mobile-nav__link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === href) {
                link.classList.add('active');
            }
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
                    this.showToast('Форма успешно отправлена!', 'success');

                    // Сброс формы
                    form.reset();
                }, 1500);

                // Аналитика
                this.trackEvent('form_submit', { form_id: form.id || 'unknown' });
            });
        });

        // Валидация форм
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.addEventListener('invalid', (e) => {
                    e.preventDefault();
                    this.showToast('Пожалуйста, заполните поле правильно', 'error');
                    input.classList.add('invalid');
                });

                input.addEventListener('input', () => {
                    input.classList.remove('invalid');
                });
            });
        });
    }

    setupThemeEffects() {
        // Добавляем класс при смене темы для плавных переходов
        document.addEventListener('themechange', () => {
            document.body.classList.add('theme-changing');
            setTimeout(() => {
                document.body.classList.remove('theme-changing');
            }, 300);
        });
    }

    setupAuthButtons() {
        // Обработка кнопок авторизации
        const authButtons = document.querySelectorAll('[href="#login"], [href="#register"]');
        authButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                if (window.robotAssistant) {
                    window.robotAssistant.showHint('Система авторизации в разработке');
                    window.robotAssistant.setStatus('WARNING');

                    setTimeout(() => {
                        window.robotAssistant.setStatus('ACTIVE');
                    }, 2000);
                }

                this.showToast('Система авторизации скоро будет доступна', 'info');

                // Аналитика
                const action = btn.getAttribute('href') === '#login' ? 'login_click' : 'register_click';
                this.trackEvent(action);
            });
        });
    }

    setupInteractiveElements() {
        // Интерактивные элементы
        const interactiveElements = document.querySelectorAll('.btn, .puzzle-tile, .news-card');

        interactiveElements.forEach(el => {
            // Добавляем эффект при наведении
            el.addEventListener('mouseenter', () => {
                if (window.robotAssistant && !this.isMobile) {
                    window.robotAssistant.followElement(el);
                }
            });

            // Добавляем эффект при клике
            el.addEventListener('click', (e) => {
                if (el.classList.contains('puzzle-tile')) {
                    const tileId = el.dataset.tile;
                    this.trackEvent('module_click', { module: tileId });

                    if (window.robotAssistant) {
                        window.robotAssistant.showHint(`Переход к модулю: ${el.querySelector('.puzzle-tile__title').textContent}`);
                    }
                }
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
        const animatedElements = document.querySelectorAll('.puzzle-tile, .news-card, .partner-card, .section-title, .section-subtitle');
        animatedElements.forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });

        // Анимация счетчиков статистики
        const statValues = document.querySelectorAll('.hero__stat-value[data-count]');
        statValues.forEach(el => observer.observe(el));

        // Анимация для hero
        const heroContent = document.querySelector('.hero__content');
        if (heroContent) {
            setTimeout(() => {
                heroContent.classList.add('animated');
            }, 300);
        }
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

        // Мониторинг ошибок
        window.addEventListener('error', (e) => {
            console.error('Ошибка приложения:', e.error);
            this.trackEvent('error', { message: e.message, filename: e.filename });
        });
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

            if (window.robotAssistant && Math.random() > 0.8) {
                window.robotAssistant.showHint(`Онлайн пользователей: ${newValue}`, 2000);
            }
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

        // Оптимизация для мобильных устройств
        if (this.isMobile) {
            // Отключаем некоторые анимации на слабых устройствах
            if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
                document.body.classList.add('reduce-animations');
            }
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

        // Проверка поддержки Service Worker (для будущего PWA)
        if ('serviceWorker' in navigator) {
            console.log('Service Worker поддерживается');
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
            this.closeToast(toast);
        });

        // Автоматическое закрытие
        setTimeout(() => {
            if (toast.parentNode) {
                this.closeToast(toast);
            }
        }, 5000);
    }

    closeToast(toast) {
        toast.classList.remove('toast--show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }

    hidePreloader() {
        if (!this.preloader) return;

        // Ждем полной загрузки страницы
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.preloader.style.opacity = '0';
                this.preloader.style.pointerEvents = 'none';

                setTimeout(() => {
                    this.preloader.remove();

                    // Показываем приветственное сообщение
                    if (window.robotAssistant) {
                        setTimeout(() => {
                            window.robotAssistant.showHint('Добро пожаловать в KazRobotics!', 4000);
                            window.robotAssistant.blinkEyes(2);
                        }, 500);
                    }
                }, 300);
            }, 500);
        });

        // Фолбэк на случай если load событие не сработает
        setTimeout(() => {
            if (this.preloader.parentNode) {
                this.preloader.style.opacity = '0';
                setTimeout(() => this.preloader.remove(), 300);
            }
        }, 3000);
    }

    trackEvent(eventName, data = {}) {
        // Заглушка для аналитики
        const eventData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...data
        };

        console.log('Аналитика:', eventData);

        // В будущем можно добавить отправку на сервер
        // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventData) });
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Публичные методы для взаимодействия с другими компонентами
    updateNews(newsData) {
        // Для будущего обновления новостей через API
        console.log('Обновление новостей:', newsData);
    }

    setTheme(theme) {
        if (window.themeManager) {
            window.themeManager.setTheme(theme);
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }

    isMenuOpen() {
        return this.menuOpen;
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

    // Отправляем аналитику загрузки
    window.app.trackEvent('page_load', {
        path: currentPath,
        theme: window.app.getCurrentTheme(),
        is_mobile: window.app.isMobile
    });

    console.log('KazRobotics Frontend v0.1.0 запущен');

    // Проверяем авторизацию (будущая функциональность)
    setTimeout(() => {
        if (window.robotAssistant && !localStorage.getItem('userToken')) {
            window.robotAssistant.showHint(
                'Зарегистрируйтесь для доступа ко всем функциям',
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

    // Отправляем ошибку в аналитику
    if (window.app) {
        window.app.trackEvent('error', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno
        });
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
        scrollPosition: window.scrollY,
        theme: window.app?.getCurrentTheme() || 'dark'
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

            // Восстанавливаем тему если нет сохраненной
            if (!localStorage.getItem('theme') && state.theme) {
                document.documentElement.setAttribute('data-theme', state.theme);
            }
        }
    } catch (e) {
        console.warn('Не удалось восстановить состояние:', e);
    }
});

// Обработка офлайн/онлайн статуса
window.addEventListener('online', () => {
    if (window.robotAssistant) {
        window.robotAssistant.setStatus('ACTIVE');
        window.robotAssistant.showHint('Соединение восстановлено');
    }

    if (window.app) {
        window.app.showToast('Соединение восстановлено', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.robotAssistant) {
        window.robotAssistant.setStatus('ERROR');
        window.robotAssistant.showHint('Потеряно соединение с интернетом');
    }

    if (window.app) {
        window.app.showToast('Потеряно соединение с интернетом', 'error');
    }
});

// Экспорт приложения
export default KazRoboticsApp;