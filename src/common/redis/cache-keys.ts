export const CacheKeys = {
  notificationUnreadCount: (userId: string) => `notif:unread:user:${userId}`,
  chatUnreadCount: (userId: string) => `chat:unread:user:${userId}`,
  leaderboardTop: (limit = 100) => `leaderboard:top:${limit}`,
  userConversations: (userId: string) => `conv:user:${userId}`,
  userTradeOffers: (userId: string) => `trade:offers:user:${userId}`,
  itemsList: (hash: string, page: number, limit: number) =>
    `items:list:${hash}:${page}:${limit}`,
};
