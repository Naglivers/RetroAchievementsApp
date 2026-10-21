export type RecentAward = {
  user: string;
  awardKind: string;
  awardDate: string;
  gameId: number;
  gameTitle: string;
  consoleName: string;
  gameIcon: string;
};

export type UserProfile = { username: string; avatar: string; richPresence: string; lastGameId: number; lastGameTitle: string; lastGameIcon: string; totalPoints: number; totalSoftcorePoints: number; totalTruePoints: number };
export type GameSummary = { id: number; imageIcon: string };
export type TopUser = { username: string; totalPoints: number; totalRatioPoints: number };
export type RetroConsole = { id: number; name: string; iconUrl: string; active: boolean; isGameSystem: boolean };
export type ConsoleGame = { gameId: number; title: string; imageIcon: string; numAchievements: number; points: number };
export type AchievementOfWeek = { title: string; description: string; points: number; gameTitle: string; consoleTitle: string; totalPlayers: number; unlocks: number; badgeUrl: string };
export type UserAward = { gameId: number; title: string; consoleName: string; imageIcon: string; awardedAt: string; awardType: string };

export type RecentAchievement = {
  date: string;
  hardcore: boolean;
  title: string;
  description: string;
  points: number;
  gameTitle: string;
  gameId: number;
  gameIcon: string;
  consoleName: string;
  badgeUrl: string;
};

export type UserGameProgress = {
  gameId: number;
  title: string;
  imageIcon: string;
  consoleName: string;
  numAwarded: number;
  maxPossible: number;
  possibleScore: number;
  mostRecentAwardedDate: string;
};

export type GameAchievement = {
  id: number;
  title: string;
  description: string;
  points: number;
  trueRatio: number;
  type: string;
  badgeUrl: string;
  numAwarded: number;
  dateEarned: string;
  dateEarnedHardcore: string;
  author: string;
};

export type GameDetails = {
  id: number;
  consoleId: number;
  parentGameId: number;
  title: string;
  consoleName: string;
  imageIcon: string;
  imageTitle: string;
  imageBoxArt: string;
  developer: string;
  publisher: string;
  genre: string;
  released: string;
  numDistinctPlayers: number;
  numAwardedToUser: number;
  numAchievements: number;
  userCompletion: string;
  userTotalPlaytime: number;
  highestAwardKind: string;
  achievements: GameAchievement[];
};

export type GameSubset = {
  id: number;
  title: string;
  imageIcon: string;
  numAchievements: number;
  points: number;
};

export type GameComment = { user: string; submitted: string; text: string };

export type GameProgression = {
  players: number;
  beatenPlayers: number;
  hardcoreBeatenPlayers: number;
  completedPlayers: number;
  masteredPlayers: number;
  casualBeatSeconds: number;
  beatSeconds: number;
  completedSeconds: number;
  masteredSeconds: number;
};

type RecentAwardsResponse = {
  Results?: Array<Record<string, unknown>>;
  results?: Array<Record<string, unknown>>;
};

export async function getRecentGameAwards(apiKey: string): Promise<RecentAward[]> {
  const params = new URLSearchParams({
    y: apiKey,
    c: '25',
    k: 'beaten-softcore,beaten-hardcore,completed,mastered',
  });
  const response = await fetch(`https://retroachievements.org/API/API_GetRecentGameAwards.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);

  const payload = await response.json() as RecentAwardsResponse;
  const results = payload.Results ?? payload.results ?? [];
  return results.map((award) => ({
    user: String(award.User ?? award.user ?? ''),
    awardKind: String(award.AwardKind ?? award.awardKind ?? ''),
    awardDate: String(award.AwardDate ?? award.awardDate ?? ''),
    gameId: Number(award.GameID ?? award.gameId ?? 0),
    gameTitle: String(award.GameTitle ?? award.gameTitle ?? ''),
    consoleName: String(award.ConsoleName ?? award.consoleName ?? ''),
    gameIcon: String(award.ImageIcon ?? award.GameIcon ?? award.gameIcon ?? ''),
  }));
}

export async function getUserProfile(apiKey: string, username: string): Promise<UserProfile> {
  const response = await fetch(`https://retroachievements.org/API/API_GetUserProfile.php?${new URLSearchParams({ y: apiKey, u: username })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const data = await response.json() as Record<string, unknown>;
  return { username: String(data.User ?? data.username ?? username), avatar: String(data.UserPic ?? data.userPic ?? ''), richPresence: String(data.RichPresenceMsg ?? data.richPresenceMsg ?? ''), lastGameId: Number(data.LastGameID ?? data.lastGameId ?? 0), lastGameTitle: String(data.LastGameTitle ?? data.lastGameTitle ?? ''), lastGameIcon: String(data.LastGameIcon ?? data.lastGameIcon ?? ''), totalPoints: Number(data.TotalPoints ?? data.totalPoints ?? 0), totalSoftcorePoints: Number(data.TotalSoftcorePoints ?? data.totalSoftcorePoints ?? 0), totalTruePoints: Number(data.TotalTruePoints ?? data.totalTruePoints ?? 0) };
}

export async function getGameSummary(apiKey: string, gameId: number): Promise<GameSummary> {
  const response = await fetch(`https://retroachievements.org/API/API_GetGame.php?${new URLSearchParams({ y: apiKey, i: String(gameId) })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const data = await response.json() as Record<string, unknown>;
  return { id: gameId, imageIcon: String(data.GameIcon ?? data.ImageIcon ?? '') };
}

export async function getTopTenUsers(apiKey: string): Promise<TopUser[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetTopTenUsers.php?${new URLSearchParams({ y: apiKey })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const data = await response.json() as Array<Record<string, unknown>>;
  return data.map((item) => ({ username: String(item.User ?? item.username ?? item['1'] ?? ''), totalPoints: Number(item.TotalPoints ?? item.totalPoints ?? item['2'] ?? 0), totalRatioPoints: Number(item.TotalRatioPoints ?? item.totalRatioPoints ?? item['3'] ?? 0) })).filter((item) => item.username);
}

export async function getConsoles(apiKey: string): Promise<RetroConsole[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetConsoleIDs.php?${new URLSearchParams({ y: apiKey, a: '1', g: '1' })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as Array<Record<string, unknown>>;
  return payload.map((console) => ({
    id: Number(console.ID ?? console.id ?? 0),
    name: String(console.Name ?? console.name ?? ''),
    iconUrl: String(console.IconURL ?? console.iconUrl ?? ''),
    active: Boolean(console.Active ?? console.active),
    isGameSystem: Boolean(console.IsGameSystem ?? console.isGameSystem),
  })).filter((console) => console.id > 0 && console.name).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getConsoleGameCount(apiKey: string, consoleId: number): Promise<number> {
  const response = await fetch(`https://retroachievements.org/API/API_GetGameList.php?${new URLSearchParams({ y: apiKey, i: String(consoleId), f: '1' })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error('Resposta de catálogo inválida');
  return payload.filter((game) => Number(game.ID ?? game.GameID ?? game.id ?? 0) > 0).length;
}

export async function getConsoleGames(apiKey: string, consoleId: number): Promise<ConsoleGame[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetGameList.php?${new URLSearchParams({ y: apiKey, i: String(consoleId), f: '1' })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error('Resposta de catálogo inválida');
  return (payload as Array<Record<string, unknown>>).map((game) => ({
    gameId: Number(game.ID ?? game.GameID ?? game.id ?? 0),
    title: String(game.Title ?? game.title ?? ''),
    imageIcon: String(game.ImageIcon ?? game.imageIcon ?? ''),
    numAchievements: Number(game.NumAchievements ?? game.numAchievements ?? 0),
    points: Number(game.Points ?? game.points ?? 0),
  })).filter((game) => game.gameId > 0).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getAchievementOfTheWeek(apiKey: string): Promise<AchievementOfWeek> {
  const response = await fetch(`https://retroachievements.org/API/API_GetAchievementOfTheWeek.php?${new URLSearchParams({ y: apiKey })}`);
  if (!response.ok) throw new Error('Falha ao buscar conquista da semana');
  const data = await response.json() as Record<string, Record<string, unknown> | unknown>;
  const achievement = (data.Achievement ?? data.achievement ?? {}) as Record<string, unknown>;
  const game = (data.Game ?? data.game ?? {}) as Record<string, unknown>;
  const console = (data.Console ?? data.console ?? {}) as Record<string, unknown>;
  const badge = String(achievement.BadgeName ?? achievement.badgeName ?? achievement.BadgeURL ?? achievement.badgeUrl ?? '');
  const badgeUrl = badge ? (badge.startsWith('http') ? badge : `https://media.retroachievements.org/Badge/${badge.endsWith('.png') ? badge : `${badge}.png`}`) : '';
  return { title: String(achievement.Title ?? achievement.title ?? ''), description: String(achievement.Description ?? achievement.description ?? ''), points: Number(achievement.Points ?? achievement.points ?? 0), gameTitle: String(game.Title ?? game.title ?? ''), consoleTitle: String(console.Title ?? console.title ?? ''), totalPlayers: Number(data.TotalPlayers ?? data.totalPlayers ?? 0), unlocks: Number(data.UnlocksCount ?? data.unlocksCount ?? 0), badgeUrl };
}

export async function getUserRecentAchievements(apiKey: string, username: string): Promise<RecentAchievement[]> {
  const params = new URLSearchParams({ y: apiKey, u: username, m: '10080' });
  const response = await fetch(`https://retroachievements.org/API/API_GetUserRecentAchievements.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);

  const payload = await response.json() as Array<Record<string, unknown>>;
  return payload.map((achievement) => ({
    date: String(achievement.Date ?? achievement.date ?? ''),
    hardcore: Boolean(achievement.HardcoreMode ?? achievement.hardcoreMode),
    title: String(achievement.Title ?? achievement.title ?? ''),
    description: String(achievement.Description ?? achievement.description ?? ''),
    points: Number(achievement.Points ?? achievement.points ?? 0),
    gameTitle: String(achievement.GameTitle ?? achievement.gameTitle ?? ''),
    gameId: Number(achievement.GameID ?? achievement.gameId ?? 0),
    gameIcon: String(achievement.GameIcon ?? achievement.gameIcon ?? ''),
    consoleName: String(achievement.ConsoleName ?? achievement.consoleName ?? ''),
    badgeUrl: String(achievement.BadgeURL ?? achievement.badgeUrl ?? ''),
  }));
}

export async function getUserAwards(apiKey: string, username: string): Promise<UserAward[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetUserAwards.php?${new URLSearchParams({ y: apiKey, u: username })}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const values = (payload.VisibleUserAwards ?? payload.visibleUserAwards ?? []) as Array<Record<string, unknown>>;
  return values.map((award) => ({
    gameId: Number(award.AwardData ?? award.awardData ?? 0),
    title: String(award.Title ?? award.title ?? ''),
    consoleName: String(award.ConsoleName ?? award.consoleName ?? ''),
    imageIcon: String(award.ImageIcon ?? award.imageIcon ?? ''),
    awardedAt: String(award.AwardedAt ?? award.awardedAt ?? ''),
    awardType: String(award.AwardType ?? award.awardType ?? ''),
  })).filter((award) => award.gameId > 0 && award.imageIcon);
}

export async function getAllUserGameProgress(apiKey: string, username: string): Promise<UserGameProgress[]> {
  const games: UserGameProgress[] = [];
  const count = 500;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const params = new URLSearchParams({ y: apiKey, u: username, c: String(count), o: String(offset) });
    const response = await fetch(`https://retroachievements.org/API/API_GetUserCompletionProgress.php?${params}`);
    if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);

    const payload = await response.json() as { Total?: number; Results?: Array<Record<string, unknown>>; results?: Array<Record<string, unknown>> };
    const results = payload.Results ?? payload.results ?? [];
    total = Number(payload.Total ?? results.length);
    games.push(...results.map((game) => ({
      gameId: Number(game.GameID ?? game.gameId ?? 0),
      title: String(game.Title ?? game.title ?? ''),
      imageIcon: String(game.ImageIcon ?? game.imageIcon ?? ''),
      consoleName: String(game.ConsoleName ?? game.consoleName ?? ''),
      numAwarded: Number(game.NumAwarded ?? game.numAwarded ?? 0),
      maxPossible: Number(game.MaxPossible ?? game.maxPossible ?? 0),
      possibleScore: 0,
      mostRecentAwardedDate: String(game.MostRecentAwardedDate ?? game.mostRecentAwardedDate ?? ''),
    })));

    offset += results.length;
    if (results.length === 0) break;
  }

  return games;
}

export async function getUserGamePoints(apiKey: string, username: string, gameIds: number[]): Promise<Map<number, number>> {
  const pointsByGame = new Map<number, number>();
  const uniqueIds = [...new Set(gameIds.filter(Boolean))];

  for (let index = 0; index < uniqueIds.length; index += 100) {
    const params = new URLSearchParams({ y: apiKey, u: username, i: uniqueIds.slice(index, index + 100).join(',') });
    const response = await fetch(`https://retroachievements.org/API/API_GetUserProgress.php?${params}`);
    if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);

    const payload = await response.json() as Record<string, Record<string, unknown>>;
    Object.entries(payload).forEach(([gameId, progress]) => {
      pointsByGame.set(Number(gameId), Number(progress.PossibleScore ?? progress.possibleScore ?? 0));
    });
  }

  return pointsByGame;
}

export async function getGameDetails(apiKey: string, username: string, gameId: number): Promise<GameDetails> {
  const params = new URLSearchParams({ y: apiKey, u: username, g: String(gameId), a: '1' });
  const response = await fetch(`https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const game = await response.json() as Record<string, unknown>;
  const source = (game.Achievements ?? game.achievements ?? {}) as Record<string, Record<string, unknown>>;
  return {
    id: Number(game.ID ?? game.id ?? gameId), consoleId: Number(game.ConsoleID ?? game.consoleId ?? 0), parentGameId: Number(game.ParentGameID ?? game.parentGameId ?? 0), title: String(game.Title ?? game.title ?? ''), consoleName: String(game.ConsoleName ?? game.consoleName ?? ''), imageIcon: String(game.ImageIcon ?? game.imageIcon ?? ''),
    imageTitle: String(game.ImageTitle ?? game.imageTitle ?? ''), imageBoxArt: String(game.ImageBoxArt ?? game.imageBoxArt ?? ''), developer: String(game.Developer ?? game.developer ?? ''), publisher: String(game.Publisher ?? game.publisher ?? ''), genre: String(game.Genre ?? game.genre ?? ''), released: String(game.Released ?? game.released ?? ''),
    numDistinctPlayers: Number(game.NumDistinctPlayers ?? game.numDistinctPlayers ?? 0), numAwardedToUser: Number(game.NumAwardedToUser ?? game.numAwardedToUser ?? 0), numAchievements: Number(game.NumAchievements ?? game.numAchievements ?? 0), userCompletion: String(game.UserCompletion ?? game.userCompletion ?? '0%'), userTotalPlaytime: Number(game.UserTotalPlaytime ?? game.userTotalPlaytime ?? 0), highestAwardKind: String(game.HighestAwardKind ?? game.highestAwardKind ?? ''),
    achievements: Object.values(source).map((achievement) => { const badge = String(achievement.BadgeName ?? achievement.badgeName ?? achievement.BadgeURL ?? achievement.badgeUrl ?? ''); return { id: Number(achievement.ID ?? achievement.id ?? 0), title: String(achievement.Title ?? achievement.title ?? ''), description: String(achievement.Description ?? achievement.description ?? ''), points: Number(achievement.Points ?? achievement.points ?? 0), trueRatio: Number(achievement.TrueRatio ?? achievement.trueRatio ?? 0), type: String(achievement.Type ?? achievement.type ?? ''), badgeUrl: badge && !badge.startsWith('/') && !badge.startsWith('http') ? `/Badge/${badge.endsWith('.png') ? badge : `${badge}.png`}` : badge, numAwarded: Number(achievement.NumAwarded ?? achievement.numAwarded ?? 0), dateEarned: String(achievement.DateEarned ?? achievement.dateEarned ?? ''), dateEarnedHardcore: String(achievement.DateEarnedHardcore ?? achievement.dateEarnedHardcore ?? ''), author: String(achievement.Author ?? achievement.author ?? '') }; }).sort((a, b) => a.id - b.id),
  };
}

/**
 * Subsets are games that point at the current game's ParentGameID. The game-list
 * endpoint is scoped to the console, so this remains small for the common case.
 */
export async function getGameSubsets(apiKey: string, consoleId: number, parentGameId: number, parentTitle: string): Promise<GameSubset[]> {
  if (!consoleId) return [];
  const params = new URLSearchParams({ y: apiKey, i: String(consoleId), f: '1' });
  const response = await fetch(`https://retroachievements.org/API/API_GetGameList.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);

  const payload = await response.json() as Array<Record<string, unknown>>;
  const normalizedParentTitle = parentTitle.replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase();
  return payload
    .filter((entry) => {
      const title = String(entry.Title ?? entry.title ?? '');
      const normalizedTitle = title.replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase();
      const hasParentReference = Number(entry.ParentGameID ?? entry.parentGameId ?? 0) === parentGameId;
      // API_GetGameList does not currently return ParentGameID, although it is
      // present internally. Official subset game titles include "Subset".
      const isSubsetNamedAfterParent = normalizedTitle.includes(normalizedParentTitle) && /subset/i.test(title);
      return hasParentReference || isSubsetNamedAfterParent;
    })
    .map((entry) => ({
      id: Number(entry.ID ?? entry.GameID ?? entry.id ?? 0),
      title: String(entry.Title ?? entry.title ?? ''),
      imageIcon: String(entry.ImageIcon ?? entry.imageIcon ?? ''),
      numAchievements: Number(entry.NumAchievements ?? entry.numAchievements ?? 0),
      points: Number(entry.Points ?? entry.points ?? 0),
    }))
    .filter((subset) => subset.id > 0);
}

export async function getGameComments(apiKey: string, gameId: number): Promise<GameComment[]> {
  const params = new URLSearchParams({ y: apiKey, t: '1', i: String(gameId), c: '25', sort: '-submitted' });
  const response = await fetch(`https://retroachievements.org/API/API_GetComments.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as { Results?: Array<Record<string, unknown>>; results?: Array<Record<string, unknown>> };
  return (payload.Results ?? payload.results ?? []).map((comment) => ({ user: String(comment.User ?? comment.user ?? ''), submitted: String(comment.Submitted ?? comment.submitted ?? ''), text: String(comment.CommentText ?? comment.commentText ?? '') }));
}

export async function getGameProgression(apiKey: string, gameId: number): Promise<GameProgression> {
  const params = new URLSearchParams({ y: apiKey, i: String(gameId) });
  const response = await fetch(`https://retroachievements.org/API/API_GetGameProgression.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const data = await response.json() as Record<string, unknown>;
  return {
    players: Number(data.NumDistinctPlayers ?? 0),
    beatenPlayers: Number(data.TimesUsedInBeatMedian ?? 0),
    hardcoreBeatenPlayers: Number(data.TimesUsedInHardcoreBeatMedian ?? 0),
    completedPlayers: Number(data.TimesUsedInCompletionMedian ?? 0),
    masteredPlayers: Number(data.TimesUsedInMasteryMedian ?? 0),
    casualBeatSeconds: Number(data.MedianTimeToBeat ?? 0),
    beatSeconds: Number(data.MedianTimeToBeatHardcore ?? 0),
    completedSeconds: Number(data.MedianTimeToComplete ?? 0),
    masteredSeconds: Number(data.MedianTimeToMaster ?? 0),
  };
}

export async function getAchievementDistribution(apiKey: string, gameId: number): Promise<Record<number, number>> {
  const params = new URLSearchParams({ y: apiKey, i: String(gameId), h: '0' });
  const response = await fetch(`https://retroachievements.org/API/API_GetAchievementDistribution.php?${params}`);
  if (!response.ok) throw new Error(`RetroAchievements respondeu com ${response.status}`);
  const payload = await response.json() as Record<string, number>;
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [Number(key), Number(value)]));
}

export type RecentMastery = { user: string; rank: number; date: string };
export type GameLeaderboard = { id: number; title: string; description: string; formattedScore: string; user: string };
export async function getRecentMasteries(apiKey: string, gameId: number): Promise<RecentMastery[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetGameRankAndScore.php?${new URLSearchParams({ y: apiKey, g: String(gameId), t: '1' })}`);
  if (!response.ok) throw new Error('Falha ao buscar platinas');
  const data = await response.json() as Array<Record<string, unknown>>;
  return data.slice(0, 8).map((item, index) => ({ user: String(item.User ?? item.user ?? ''), rank: Number(item.Rank ?? item.rank ?? index + 1), date: String(item.LastAward ?? item.lastAward ?? '') }));
}
export async function getGameLeaderboards(apiKey: string, gameId: number): Promise<GameLeaderboard[]> {
  const response = await fetch(`https://retroachievements.org/API/API_GetGameLeaderboards.php?${new URLSearchParams({ y: apiKey, i: String(gameId), c: '4' })}`);
  if (!response.ok) throw new Error('Falha ao buscar classificações');
  const data = await response.json() as { Results?: Array<Record<string, unknown>>; results?: Array<Record<string, unknown>> };
  return (data.Results ?? data.results ?? []).map((item) => { const top = (item.TopEntry ?? item.topEntry ?? {}) as Record<string, unknown>; return { id: Number(item.ID ?? item.id ?? 0), title: String(item.Title ?? item.title ?? ''), description: String(item.Description ?? item.description ?? ''), formattedScore: String(top.FormattedScore ?? top.formattedScore ?? top.Score ?? top.score ?? ''), user: String(top.User ?? top.user ?? '') }; }).filter((item) => item.id > 0);
}
