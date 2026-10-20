import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AchievementOfWeekCard } from './AchievementOfWeekCard';
import { CommunityFeed } from './CommunityFeed';
import { getGameSummary, getRecentGameAwards, getUserProfile, RecentAward, UserGameProgress, UserProfile } from '../src/retroachievements';

type Props = { apiKey: string; username: string; onOpenSettings: () => void; onOpenGame: (game: UserGameProgress) => void };
type TrendingGame = { gameId: number; title: string; consoleName: string; icon: string; count: number };

const icons = new Map<number, string>();
const media = (path: string) => path ? (path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/${path}`}`) : '';
const fallbackIcon = (id: number) => `/Images/${String(id).padStart(6, '0')}.png`;

function GameIcon({ icon }: { icon: string }) {
  return <View style={styles.gameIcon}><Feather name="gamepad" size={24} color="#ffe36d" />{!!icon && <Image source={{ uri: media(icon) }} style={styles.gameIconImage} />}</View>;
}

export function HomeDashboard({ apiKey, username, onOpenSettings, onOpenGame }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [awards, setAwards] = useState<RecentAward[]>([]);
  const [loading, setLoading] = useState(Boolean(apiKey));

  const refresh = useCallback(async () => {
    if (!apiKey) { setProfile(null); setAwards([]); return; }
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

  return <View>
    <View style={styles.hero}><View><Text style={styles.eyebrow}>CHECKPOINT · COMUNIDADE</Text><Text style={styles.title}>Encontre seu próximo clássico.</Text><Text style={styles.subtitle}>Conquistas, jogadores e jogos que estão movimentando a comunidade agora.</Text></View><Pressable onPress={refresh} style={styles.refresh}><Feather name="refresh-cw" size={15} color="#171923" /><Text style={styles.refreshText}>Atualizar</Text></Pressable></View>
    {!apiKey ? <Pressable onPress={onOpenSettings} style={styles.connect}><Feather name="key" size={17} color="#ffe36d" /><Text style={styles.connectText}>Conecte sua conta para ver a Home ao vivo</Text></Pressable> : loading && awards.length === 0 ? <View style={styles.loading}><ActivityIndicator color="#ffe36d" /></View> : <>
      <Text style={styles.section}>Em alta agora</Text>
      <View style={styles.trending}>{trending.map((game, index) => <Pressable key={game.gameId} onPress={() => openGame(game)} style={styles.game}><Text style={styles.rank}>{index + 1}</Text><GameIcon icon={game.icon} /><View style={styles.gameCopy}><Text numberOfLines={1} style={styles.gameTitle}>{game.title}</Text><Text style={styles.console}>{game.consoleName}</Text><Text style={styles.activity}>{game.count} conquistas recentes</Text></View></Pressable>)}</View>
      {trending.length === 0 && <Text style={styles.empty}>Ainda não há jogos para mostrar.</Text>}
      {!!profile && <View style={styles.presence}><View style={styles.online} /><View><Text style={styles.presenceLabel}>SUA PRESENÇA</Text><Text style={styles.presenceName}>{profile.username}</Text><Text numberOfLines={2} style={styles.presenceText}>{profile.richPresence || (profile.lastGameTitle ? `Jogou ${profile.lastGameTitle} recentemente` : 'Sem atividade recente')}</Text></View></View>}
      <View style={styles.split}><View style={styles.splitMain}><CommunityFeed apiKey={apiKey} onOpenSettings={onOpenSettings} /></View><View style={styles.splitSide}><AchievementOfWeekCard apiKey={apiKey} /></View></View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  hero: { marginTop: 22, padding: 22, borderRadius: 18, backgroundColor: '#24233a', borderWidth: 1, borderColor: '#3b3962', flexDirection: 'row', gap: 14, justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { color: '#b4a2ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: '#fff', fontWeight: '900', fontSize: 27, marginTop: 7 }, subtitle: { color: '#c4c6d8', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 500 },
  refresh: { backgroundColor: '#ffe36d', borderRadius: 9, minHeight: 36, paddingHorizontal: 10, flexDirection: 'row', gap: 6, alignItems: 'center' }, refreshText: { color: '#171923', fontSize: 11, fontWeight: '900' },
  connect: { marginTop: 16, minHeight: 58, padding: 15, borderRadius: 13, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#32394b', flexDirection: 'row', alignItems: 'center', gap: 10 }, connectText: { color: '#d8dce8', fontWeight: '800', fontSize: 12 }, loading: { minHeight: 220, justifyContent: 'center', alignItems: 'center' },
  section: { color: '#f5f6fb', fontSize: 19, fontWeight: '900', marginTop: 27, marginBottom: 11 }, trending: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  game: { width: '31%', minWidth: 170, minHeight: 83, padding: 11, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', gap: 9, alignItems: 'center' }, rank: { color: '#ffe36d', fontSize: 14, fontWeight: '900', width: 14 },
  gameIcon: { height: 48, width: 48, borderRadius: 7, backgroundColor: '#343a4c', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, gameIconImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, gameCopy: { flex: 1 }, gameTitle: { color: '#edf0f7', fontSize: 12, fontWeight: '900' }, console: { color: '#8f98ad', fontSize: 10, marginTop: 3 }, activity: { color: '#7edbab', fontSize: 9, fontWeight: '800', marginTop: 8 }, empty: { color: '#aeb4c4', marginTop: 8 },
  presence: { marginTop: 14, padding: 14, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', gap: 10 }, online: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#55db8c', marginTop: 4 }, presenceLabel: { color: '#8f98ad', fontSize: 9, fontWeight: '900', letterSpacing: .8 }, presenceName: { color: '#f5f6fb', fontWeight: '900', marginTop: 3, fontSize: 13 }, presenceText: { color: '#b8bfce', fontSize: 11, marginTop: 3, maxWidth: 600 },
  split: { marginTop: 15, flexDirection: 'row', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }, splitMain: { flex: 2, minWidth: 270 }, splitSide: { flex: 1, minWidth: 210 },
});
