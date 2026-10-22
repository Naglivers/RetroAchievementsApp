import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AchievementOfWeekCard } from './AchievementOfWeekCard';
import { CommunityFeed } from './CommunityFeed';
import { GameDetails, getGameDetails, getGameSummary, getRecentGameAwards, getUserProfile, RecentAward, UserGameProgress, UserProfile } from '../src/retroachievements';

type Props = { apiKey: string; username: string; onOpenSettings: () => void; onOpenGame: (game: UserGameProgress) => void };
type TrendingGame = { gameId: number; title: string; consoleName: string; icon: string; count: number };

const icons = new Map<number, string>();
const media = (path: string) => path ? (path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/${path}`}`) : '';
const fallbackIcon = (id: number) => `/Images/${String(id).padStart(6, '0')}.png`;

function GameIcon({ icon, compact = false }: { icon: string; compact?: boolean }) {
  return <View style={[styles.gameIcon, compact && mobile.gameIcon]}><MaterialCommunityIcons name="gamepad-variant" size={24} color="#ffe36d" />{!!icon && <Image source={{ uri: media(icon) }} style={styles.gameIconImage} />}</View>;
}

export function HomeDashboard({ apiKey, username, onOpenSettings, onOpenGame }: Props) {
  const compact = useWindowDimensions().width < 700;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [awards, setAwards] = useState<RecentAward[]>([]);
  const [lastGame, setLastGame] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(apiKey));

  const refresh = useCallback(async () => {
    if (!apiKey) { setProfile(null); setAwards([]); setLastGame(null); return; }
    setLoading(true);
    try {
      const [user, recent] = await Promise.all([
        username ? getUserProfile(apiKey, username).catch(() => null) : Promise.resolve(null),
        getRecentGameAwards(apiKey),
      ]);
      const totals = new Map<number, number>();
      recent.forEach((award) => totals.set(award.gameId, (totals.get(award.gameId) ?? 0) + 1));
      const ids = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id);
      for (const id of ids) {
        if (!icons.has(id)) {
          try { icons.set(id, (await getGameSummary(apiKey, id)).imageIcon || fallbackIcon(id)); }
          catch { icons.set(id, fallbackIcon(id)); }
        }
      }
      setProfile(user);
      if (user?.lastGameId && username) {
        try { setLastGame(await getGameDetails(apiKey, username, user.lastGameId)); }
        catch { setLastGame(null); }
      } else setLastGame(null);
      setAwards(recent.map((award) => ({ ...award, gameIcon: icons.get(award.gameId) || award.gameIcon || fallbackIcon(award.gameId) })));
    } catch { setAwards([]); }
    finally { setLoading(false); }
  }, [apiKey, username]);

  useEffect(() => { refresh(); }, [refresh]);
  const trending = useMemo(() => {
    const result = new Map<number, TrendingGame>();
    awards.forEach((award) => {
      const game = result.get(award.gameId);
      result.set(award.gameId, game ? { ...game, count: game.count + 1 } : { gameId: award.gameId, title: award.gameTitle, consoleName: award.consoleName, icon: award.gameIcon, count: 1 });
    });
    return [...result.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [awards]);

  const openGame = (game: TrendingGame) => onOpenGame({ gameId: game.gameId, title: game.title, consoleName: game.consoleName, imageIcon: game.icon, numAwarded: 0, maxPossible: 0, possibleScore: 0, mostRecentAwardedDate: '' });
  const lastProgress = lastGame?.numAchievements ? Math.min(100, Math.round((lastGame.numAwardedToUser / lastGame.numAchievements) * 100)) : 0;
  const nextAchievement = lastGame?.achievements.find((achievement) => !achievement.dateEarned && !achievement.dateEarnedHardcore);
  const openLastGame = () => {
    if (!lastGame) return;
    onOpenGame({ gameId: lastGame.id, title: lastGame.title, consoleName: lastGame.consoleName, imageIcon: lastGame.imageIcon, numAwarded: lastGame.numAwardedToUser, maxPossible: lastGame.numAchievements, possibleScore: 0, mostRecentAwardedDate: '' });
  };

  return <View style={styles.dashboard}>
    <View style={[styles.hero, compact && mobile.hero]}>
      {lastGame ? <Pressable accessibilityRole="button" onPress={openLastGame} style={[styles.lastGameContent, compact && mobile.heroContent]}>
        <View style={styles.lastGameHeader}>
          <GameIcon icon={lastGame.imageIcon} compact={compact} />
          <View style={styles.lastGameCopy}>
            <Text style={[styles.eyebrow, compact && mobile.eyebrow]}>ÚLTIMO JOGO JOGADO · {lastGame.consoleName}</Text>
            <View style={[styles.lastGameTitleRow, compact && mobile.lastGameTitleRow]}>
              <Text numberOfLines={compact ? 3 : 1} style={[styles.title, styles.lastGameTitle, compact && mobile.title]}>{lastGame.title}</Text>
              {lastProgress === 100 && <View style={styles.mastered}><Feather name="award" size={14} color="#251e04" /><Text style={styles.masteredText}>MASTERIZADO</Text></View>}
            </View>
          </View>
        </View>
        <View style={[styles.lastGameDetails, compact && mobile.lastGameDetails]}>
          <View style={[styles.progressLine, compact && mobile.progressLine]}>
            <View style={[styles.progressTrack, compact && mobile.progressTrack]}><View style={[styles.progressFill, { width: `${lastProgress}%` }]} /></View>
            <Text style={styles.progressNumber}>{lastProgress}%</Text>
            <Text style={[styles.progressMeta, compact && mobile.progressMeta]}>{lastGame.numAwardedToUser}/{lastGame.numAchievements}</Text>
          </View>
          {lastProgress < 100 && <View style={[styles.nextAchievement, compact && mobile.nextAchievement]}>
            <View style={[styles.nextBadge, compact && mobile.nextBadge]}><Feather name="target" size={15} color="#ffe36d" />{!!nextAchievement?.badgeUrl && <Image source={{ uri: media(nextAchievement.badgeUrl) }} style={styles.nextBadgeImage} />}</View>
            <View style={styles.nextCopy}>
              <Text style={[styles.nextLabel, compact && mobile.nextLabel]}>PRÓXIMA CONQUISTA</Text>
              <Text numberOfLines={compact ? 2 : 1} style={[styles.nextTitle, compact && mobile.nextTitle]}>{nextAchievement?.title || 'Abra o jogo para continuar a jornada'}</Text>
              <Text numberOfLines={compact ? 2 : 1} style={[styles.nextDescription, compact && mobile.nextDescription]}>{nextAchievement?.description || 'Veja todas as conquistas disponíveis'}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#d6ceea" />
          </View>}
        </View>
      </Pressable> : <View style={[styles.lastGameCopy, compact && mobile.heroContent]}><Text style={[styles.eyebrow, compact && mobile.eyebrow]}>SEU ÚLTIMO JOGO</Text><Text style={[styles.title, compact && mobile.title]}>{loading && apiKey ? 'Carregando seu progresso…' : 'Seu próximo checkpoint'}</Text><Text style={[styles.subtitle, compact && mobile.subtitle]}>Conecte uma conta com atividade recente para ver a próxima conquista aqui.</Text></View>}
      <Pressable accessibilityRole="button" onPress={refresh} style={[styles.refresh, compact && mobile.refresh]}><Feather name="refresh-cw" size={15} color="#171923" /><Text style={[styles.refreshText, compact && mobile.refreshText]}>Atualizar</Text></Pressable>
    </View>
    {!apiKey ? <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.connect}><Feather name="key" size={17} color="#ffe36d" /><Text style={[styles.connectText, compact && mobile.connectText]}>Conecte sua conta para ver a Home ao vivo</Text><Feather name="chevron-right" size={18} color="#ffe36d" /></Pressable> : loading && awards.length === 0 ? <View style={styles.loading}><ActivityIndicator color="#ffe36d" /></View> : <>
      <Text style={[styles.section, compact && mobile.section]}>Em alta agora</Text>
      <View style={[styles.trending, compact && mobile.trending]}>{trending.map((game, index) => <Pressable accessibilityRole="button" key={game.gameId} onPress={() => openGame(game)} style={[styles.game, compact && mobile.game]}><Text style={[styles.rank, compact && mobile.rank]}>{index + 1}</Text><GameIcon icon={game.icon} compact={compact} /><View style={styles.gameCopy}><Text numberOfLines={compact ? 2 : 1} style={[styles.gameTitle, compact && mobile.gameTitle]}>{game.title}</Text><Text style={[styles.console, compact && mobile.console]}>{game.consoleName}</Text><Text style={[styles.activity, compact && mobile.activity]}>{game.count} conquistas recentes</Text></View>{compact && <Feather name="chevron-right" size={18} color="#8f98ad" />}</Pressable>)}</View>
      {trending.length === 0 && <Text style={styles.empty}>Ainda não há jogos para mostrar.</Text>}
      {!!profile && <View style={[styles.presence, compact && mobile.presence]}><View style={styles.online} /><View style={styles.presenceCopy}><Text style={[styles.presenceLabel, compact && mobile.presenceLabel]}>SUA PRESENÇA</Text><Text style={[styles.presenceName, compact && mobile.presenceName]}>{profile.username}</Text><Text numberOfLines={compact ? 3 : 2} style={[styles.presenceText, compact && mobile.presenceText]}>{profile.richPresence || (profile.lastGameTitle ? `Jogou ${profile.lastGameTitle} recentemente` : 'Sem atividade recente')}</Text></View></View>}
      <View style={[styles.split, compact && mobile.split]}><View style={[styles.splitMain, compact && mobile.splitColumn]}><CommunityFeed apiKey={apiKey} onOpenSettings={onOpenSettings} /></View><View style={[styles.splitSide, compact && mobile.splitColumn]}><AchievementOfWeekCard apiKey={apiKey} /></View></View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  dashboard: { minWidth: 0 },
  hero: { marginTop: 22, padding: 22, borderRadius: 18, backgroundColor: '#24233a', borderWidth: 1, borderColor: '#3b3962', flexDirection: 'row', gap: 14, justifyContent: 'space-between', alignItems: 'flex-start' }, lastGameContent: { flex: 1, minWidth: 0 }, lastGameHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 }, lastGameCopy: { flex: 1, minWidth: 0 }, lastGameTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 }, lastGameTitle: { flexShrink: 1 }, lastGameDetails: { marginLeft: 62 },
  eyebrow: { color: '#b4a2ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: '#fff', fontWeight: '900', fontSize: 27, marginTop: 7 }, subtitle: { color: '#c4c6d8', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 500 },
  refresh: { backgroundColor: '#ffe36d', borderRadius: 9, minHeight: 36, paddingHorizontal: 10, flexDirection: 'row', gap: 6, alignItems: 'center' }, refreshText: { color: '#171923', fontSize: 11, fontWeight: '900' },
  mastered: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, backgroundColor: '#ffe36d', paddingHorizontal: 7, paddingVertical: 5 }, masteredText: { color: '#251e04', fontSize: 9, fontWeight: '900' }, progressLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 }, progressTrack: { flex: 1, height: 7, borderRadius: 5, backgroundColor: '#3b3851', overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#ffe36d' }, progressNumber: { color: '#ffe36d', fontWeight: '900', fontSize: 13 }, progressMeta: { color: '#bcb6cd', fontSize: 11 }, nextAchievement: { minHeight: 45, marginTop: 10, borderRadius: 9, backgroundColor: '#1c1b2d', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, nextBadge: { height: 31, width: 31, borderRadius: 6, backgroundColor: '#343149', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, nextBadgeImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, nextCopy: { flex: 1, minWidth: 0 }, nextLabel: { color: '#b8a9f5', fontSize: 8, fontWeight: '900', letterSpacing: .6 }, nextTitle: { color: '#f1eff8', fontSize: 11, fontWeight: '900', marginTop: 1 }, nextDescription: { color: '#a7a0b8', fontSize: 10, marginTop: 1 },
  connect: { marginTop: 16, minHeight: 58, padding: 15, borderRadius: 13, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#32394b', flexDirection: 'row', alignItems: 'center', gap: 10 }, connectText: { flex: 1, color: '#d8dce8', fontWeight: '800', fontSize: 12 }, loading: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  section: { color: '#f5f6fb', fontSize: 19, fontWeight: '900', marginTop: 27, marginBottom: 11 }, trending: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  game: { width: '31%', minWidth: 170, minHeight: 83, padding: 11, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', gap: 9, alignItems: 'center' }, rank: { color: '#ffe36d', fontSize: 14, fontWeight: '900', width: 14 },
  gameIcon: { height: 48, width: 48, flexShrink: 0, borderRadius: 7, backgroundColor: '#343a4c', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, gameIconImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, gameCopy: { flex: 1, minWidth: 0 }, gameTitle: { color: '#edf0f7', fontSize: 12, fontWeight: '900' }, console: { color: '#8f98ad', fontSize: 10, marginTop: 3 }, activity: { color: '#7edbab', fontSize: 9, fontWeight: '800', marginTop: 8 }, empty: { color: '#aeb4c4', marginTop: 8 },
  presence: { marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', gap: 10 }, presenceCopy: { flex: 1, minWidth: 0 }, online: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#55db8c', marginTop: 4 }, presenceLabel: { color: '#8f98ad', fontSize: 9, fontWeight: '900', letterSpacing: .8 }, presenceName: { color: '#f5f6fb', fontWeight: '900', marginTop: 3, fontSize: 13 }, presenceText: { color: '#b8bfce', fontSize: 11, marginTop: 3, maxWidth: 600 },
  split: { marginTop: 15, flexDirection: 'row', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }, splitMain: { flex: 2, minWidth: 270 }, splitSide: { flex: 1, minWidth: 210 },
});

const mobile = StyleSheet.create({
  hero: { marginTop: 18, padding: 16, borderRadius: 20, flexDirection: 'column', alignItems: 'stretch', gap: 16 },
  heroContent: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' },
  eyebrow: { fontSize: 10, lineHeight: 15, letterSpacing: .7 },
  title: { fontSize: 20, lineHeight: 26, marginTop: 5 },
  subtitle: { fontSize: 13, lineHeight: 20 },
  lastGameTitleRow: { alignItems: 'flex-start', flexDirection: 'column', gap: 8 },
  lastGameDetails: { marginLeft: 0 },
  gameIcon: { width: 54, height: 54, borderRadius: 11 },
  refresh: { minHeight: 44, justifyContent: 'center', borderRadius: 12, paddingHorizontal: 16 },
  refreshText: { fontSize: 13 },
  progressLine: { marginTop: 18, gap: 10 },
  progressTrack: { height: 8 },
  progressMeta: { fontSize: 12 },
  nextAchievement: { marginTop: 16, minHeight: 86, paddingHorizontal: 12, paddingVertical: 12, gap: 10, borderRadius: 13 },
  nextBadge: { width: 44, height: 44, borderRadius: 9 },
  nextLabel: { fontSize: 10, lineHeight: 14 },
  nextTitle: { fontSize: 14, lineHeight: 19, marginTop: 3 },
  nextDescription: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  connectText: { fontSize: 14, lineHeight: 20 },
  section: { fontSize: 20, marginTop: 25, marginBottom: 12 },
  trending: { flexDirection: 'column', gap: 10 },
  game: { width: '100%', minWidth: 0, minHeight: 100, paddingHorizontal: 13, paddingVertical: 14, borderRadius: 16, gap: 10 },
  rank: { width: 14, fontSize: 14 },
  gameTitle: { fontSize: 14, lineHeight: 20 },
  console: { fontSize: 12, lineHeight: 17, color: '#a3acc0' },
  activity: { fontSize: 12, lineHeight: 17, marginTop: 5 },
  presence: { marginTop: 16, padding: 16, borderRadius: 16 },
  presenceLabel: { fontSize: 10, lineHeight: 15 },
  presenceName: { fontSize: 15, lineHeight: 21 },
  presenceText: { fontSize: 13, lineHeight: 20, marginTop: 5 },
  split: { marginTop: 16, flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'stretch', gap: 16 },
  splitColumn: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', minWidth: 0, width: '100%' },
});
