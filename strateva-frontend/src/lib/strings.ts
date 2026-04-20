/**
 * Central registry of user-visible Russian strings.
 * The Playwright assertNoEnglish helper verifies that no English leaks into the DOM.
 * Keep groups per feature; add new keys here before referencing them in components.
 */

export const strings = {
  app: {
    title: 'Strateva',
    subtitle: 'Инструмент стратегического ИТ- и бизнес-планирования',
    loading: 'Загрузка…',
    error: 'Произошла ошибка',
    retry: 'Повторить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    save: 'Сохранить',
    delete: 'Удалить',
    back: 'Назад',
  },
  nav: {
    dashboard: 'Главная',
    goals: 'Стратегические цели',
    backlogs: 'Бэклоги',
    tasks: 'Задачи',
    reports: 'Отчёты',
    audit: 'Журнал аудита',
    logout: 'Выйти',
  },
  auth: {
    loginTitle: 'Вход в систему',
    loginSubtitle: 'Введите учётные данные, чтобы продолжить',
    usernameLabel: 'Логин',
    usernamePlaceholder: 'Например, pm',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Ваш пароль',
    submit: 'Войти',
    submitting: 'Выполняется вход…',
    requiredUsername: 'Введите логин',
    requiredPassword: 'Введите пароль',
    invalidCredentials: 'Неверный логин или пароль',
    sessionExpired: 'Сеанс истёк, войдите повторно',
    loggedInAs: 'Вы вошли как',
    role: {
      PROJECT_MANAGER: 'Менеджер проектов',
      BUSINESS_ANALYST: 'Бизнес-аналитик',
      EMPLOYEE: 'Сотрудник',
    },
  },
  errors: {
    network: 'Сеть недоступна. Проверьте соединение.',
    forbidden: 'Недостаточно прав для выполнения операции',
    notFound: 'Запрашиваемый ресурс не найден',
    unknown: 'Непредвиденная ошибка. Повторите попытку позже.',
  },
} as const

export type StringsTree = typeof strings
