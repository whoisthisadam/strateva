export const TEST_USERS = {
  pm: { username: 'pm', password: 'pmPass1!', role: 'PROJECT_MANAGER', fullName: 'Менеджер проектов' },
  strat: { username: 'strat', password: 'stratPass1!', role: 'STRATEGIST', fullName: 'Стратег' },
  ba: { username: 'ba', password: 'baPass1!', role: 'BUSINESS_ANALYST', fullName: 'Бизнес-аналитик' },
} as const

export type TestUserKey = keyof typeof TEST_USERS
