const userKeys = ['user'] as const;

export const queryKeys = {
  template: {
    health: ['template', 'health'] as const,
  },
  user: {
    all: userKeys,
    detail: (userId: string | null) => [...userKeys, 'detail', userId] as const,
    update: (userId: string) => [...userKeys, 'update', userId] as const,
  },
};
