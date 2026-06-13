export const queryKeys = {
  template: {
    health: ['template', 'health'] as const,
  },
  user: {
    detail: (userId: string) => ['user', userId] as const,
  },
};
