// Системные константы
export const SystemStatus = {
    ACTIVE: {
        text: "Система активна",
        color: "#4ADE80",
        icon: "✅",
        emoji: "🟢"
    },
    LOADING: {
        text: "Загрузка модулей...",
        color: "#FBBF24",
        icon: "⏳",
        emoji: "🟡"
    },
    WARNING: {
        text: "Обновление базы",
        color: "#F59E0B",
        icon: "⚠️",
        emoji: "🟠"
    },
    ERROR: {
        text: "Сбой соединения",
        color: "#EF4444",
        icon: "❌",
        emoji: "🔴"
    },
    IDLE: {
        text: "Ожидание ввода",
        color: "#A83242",
        icon: "🤖",
        emoji: "⚙️"
    }
};

// Модули системы
export const Modules = {
    about: {
        id: "about",
        title: "О федерации",
        description: "Миссия, команда, новости и история развития",
        icon: "🏢",
        color: "#7a1e2b",
        connections: ["projects", "education"],
        endpoint: "/api/about",
        stats: {
            members: 125,
            projects: 45,
            years: 5
        }
    },
    projects: {
        id: "projects",
        title: "Робопроекты",
        description: "Исследовательские проекты, галерея и регистрация",
        icon: "🔬",
        color: "#a83242",
        connections: ["about", "sport", "calendar"],
        endpoint: "/api/projects",
        stats: {
            active: 150,
            completed: 89,
            participants: 1200
        }
    },
    sport: {
        id: "sport",
        title: "Робоспорт",
        description: "Соревнования, регламенты, сезоны и регистрация",
        icon: "🏆",
        color: "#d35400",
        connections: ["projects", "calendar", "shop"],
        endpoint: "/api/sport",
        stats: {
            events: 78,
            participants: 3500,
            categories: 12
        }
    },
    education: {
        id: "education",
        title: "Обучение",
        description: "Курсы, программы для тренеров и судей",
        icon: "🎓",
        color: "#2980b9",
        connections: ["about", "calendar"],
        endpoint: "/api/education",
        stats: {
            courses: 24,
            students: 4500,
            trainers: 156
        }
    },
    calendar: {
        id: "calendar",
        title: "Календарь",
        description: "Мероприятия, события и активности по всей стране",
        icon: "📅",
        color: "#27ae60",
        connections: ["projects", "sport", "education", "shop"],
        endpoint: "/api/calendar",
        stats: {
            upcoming: 45,
            cities: 28,
            registered: 8900
        }
    },
    shop: {
        id: "shop",
        title: "Магазин",
        description: "Мерч, оборудование и компоненты для робототехники",
        icon: "🛒",
        color: "#8e44ad",
        connections: ["sport", "calendar"],
        endpoint: "/api/shop",
        stats: {
            products: 234,
            orders: 1567,
            satisfaction: 98
        }
    }
};

// Связи между модулями (граф)
export const ModuleConnections = [
    { from: "about", to: "projects", strength: 0.8 },
    { from: "about", to: "education", strength: 0.9 },
    { from: "projects", to: "sport", strength: 0.7 },
    { from: "projects", to: "calendar", strength: 0.6 },
    { from: "sport", to: "calendar", strength: 0.8 },
    { from: "sport", to: "shop", strength: 0.5 },
    { from: "education", to: "calendar", strength: 0.7 },
    { from: "calendar", to: "shop", strength: 0.4 }
];

// Новости
export const newsMock = [
    {
        id: 1,
        title: "Открыт новый сезон исследовательских проектов 2024",
        excerpt: "Приём заявок на участие в научно-исследовательских проектах по робототехнике продлится до 15 января.",
        source: "telegram",
        date: "2024-12-10",
        tags: ["Проекты", "Исследования", "Новый сезон"],
        readTime: "3 мин",
        image: "assets/images/news/projects-2024.jpg",
        url: "#news-1"
    },
    {
        id: 2,
        title: "Регистрация на соревнования RoboFest Kazakhstan открыта",
        excerpt: "Крупнейшие соревнования по робототехнике в Казахстане пройдут в марте 2024 года.",
        source: "instagram",
        date: "2024-12-07",
        tags: ["Соревнования", "RoboFest", "Регистрация"],
        readTime: "2 мин",
        image: "assets/images/news/robofest-2024.jpg",
        url: "#news-2"
    },
    {
        id: 3,
        title: "Федерация расширяет партнёрскую программу",
        excerpt: "Новые образовательные учреждения и технологические компании присоединились к программе.",
        source: "telegram",
        date: "2024-12-03",
        tags: ["Партнёрство", "Развитие", "Образование"],
        readTime: "4 мин",
        image: "assets/images/news/partnership.jpg",
        url: "#news-3"
    },
    {
        id: 4,
        title: "Запущена новая образовательная программа для тренеров",
        excerpt: "Бесплатные курсы повышения квалификации для преподавателей робототехники.",
        source: "telegram",
        date: "2024-11-28",
        tags: ["Обучение", "Тренеры", "Курсы"],
        readTime: "5 мин",
        image: "assets/images/news/training.jpg",
        url: "#news-4"
    },
    {
        id: 5,
        title: "Календарь мероприятий на 2024 год опубликован",
        excerpt: "Все запланированные события, мастер-классы и соревнования на следующий год.",
        source: "instagram",
        date: "2024-11-25",
        tags: ["Календарь", "События", "2024"],
        readTime: "2 мин",
        image: "assets/images/news/calendar-2024.jpg",
        url: "#news-5"
    },
    {
        id: 6,
        title: "Новая коллекция мерча KazRobotics уже в продаже",
        excerpt: "Одежда, аксессуары и оборудование с символикой федерации доступны в магазине.",
        source: "telegram",
        date: "2024-11-20",
        tags: ["Магазин", "Мерч", "Новинки"],
        readTime: "3 мин",
        image: "assets/images/news/merch.jpg",
        url: "#news-6"
    }
];

// Партнёры
export const partners = [
    {
        id: 1,
        name: "КазНУ им. аль-Фараби",
        logo: "assets/partners/kaznu.svg",
        url: "https://www.kaznu.kz"
    },
    {
        id: 2,
        name: "Университет Сулеймана Демиреля",
        logo: "assets/partners/sdu.svg",
        url: "https://sdu.edu.kz"
    },
    {
        id: 3,
        name: "КБТУ",
        logo: "assets/partners/kbtu.svg",
        url: "https://kbtu.edu.kz"
    },
    {
        id: 4,
        name: "Фонд Назарбаева",
        logo: "assets/partners/nazarbayev-fund.svg",
        url: "https://fntr.kz"
    },
    {
        id: 5,
        name: "Kaspi",
        logo: "assets/partners/kaspi.svg",
        url: "https://kaspi.kz"
    },
    {
        id: 6,
        name: "Arduino",
        logo: "assets/partners/arduino.svg",
        url: "https://arduino.cc"
    }
];

// Статистика системы
export const systemStats = {
    totalUsers: 5234,
    onlineUsers: 127,
    activeProjects: 150,
    upcomingEvents: 45,
    totalCities: 28,
    partnerCount: 24
};

// Экспорт по умолчанию
export default {
    SystemStatus,
    Modules,
    ModuleConnections,
    newsMock,
    partners,
    systemStats
};