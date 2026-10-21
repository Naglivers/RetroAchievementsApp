import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GameLeaderboard, GameProgression, getAchievementDistribution, getGameLeaderboards, getGameProgression, getRecentMasteries, getUserProfile, RecentMastery } from '../src/retroachievements';

type ComparedUserProgress = { username: string; avatarUrl: string; unlockedAchievements: number; totalAchievements: number };
type Props = { apiKey: string; gameId: number; currentUser?: { username: string; unlockedAchievements: number; totalAchievements: number } };
const number = (value: number) => value.toLocaleString('pt-BR');
const duration = (seconds: number) => seconds ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : '—';

export function GameSidebar({ apiKey, gameId, currentUser }: Props) {
  const [data, setData] = useState<GameProgression | null>(null);
  const [mode, setMode] = useState<'casual' | 'hardcore'>('hardcore');
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [masters, setMasters] = useState<RecentMastery[]>([]);
  const [leaderboards, setLeaderboards] = useState<GameLeaderboard[]>([]);
  const [comparedUsers, setComparedUsers] = useState<ComparedUserProgress[]>([]);
  const [compareQuery, setCompareQuery] = useState('');

  useEffect(() => {
    let alive = true;
    getGameProgression(apiKey, gameId).then((result) => alive && setData(result)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [apiKey, gameId]);
  useEffect(() => {
    const candidates = [
      ...(currentUser?.username ? [{ username: currentUser.username, unlockedAchievements: currentUser.unlockedAchievements, totalAchievements: currentUser.totalAchievements }] : []),
      ...masters.map((item) => ({ username: item.user, unlockedAchievements: currentUser?.totalAchievements ?? 0, totalAchievements: currentUser?.totalAchievements ?? 0 })),
    ].filter((item, index, all) => item.username && all.findIndex((other) => other.username.toLocaleLowerCase() === item.username.toLocaleLowerCase()) === index).slice(0, 6);
    let alive = true;
    Promise.all(candidates.map(async (item) => {
      try { const profile = await getUserProfile(apiKey, item.username); return { ...item, avatarUrl: profile.avatar }; }
      catch { return { ...item, avatarUrl: '' }; }
    })).then((items) => alive && setComparedUsers(items));
    return () => { alive = false; };
  }, [apiKey, currentUser?.totalAchievements, currentUser?.unlockedAchievements, currentUser?.username, masters]);
  useEffect(() => {
    let alive = true;
    Promise.allSettled([getAchievementDistribution(apiKey, gameId), getRecentMasteries(apiKey, gameId), getGameLeaderboards(apiKey, gameId)]).then(([d, m, l]) => {
      if (!alive) return;
      if (d.status === 'fulfilled') setDistribution(d.value);
      if (m.status === 'fulfilled') setMasters(m.value);
      if (l.status === 'fulfilled') setLeaderboards(l.value);
    });
    return () => { alive = false; };
  }, [apiKey, gameId]);

  if (!data) return <View style={styles.sidebar}><Text style={styles.heading}>Tempo de Jogo</Text><View style={styles.loading}><ActivityIndicator size="small" color="#00aaff" /></View></View>;

  const hardcore = mode === 'hardcore';
  const beatenPlayers = hardcore ? data.hardcoreBeatenPlayers : data.beatenPlayers;
  const beatenSeconds = hardcore ? data.beatSeconds : data.casualBeatSeconds;
  const completedPlayers = hardcore ? data.masteredPlayers : data.completedPlayers;
  const completedSeconds = hardcore ? data.masteredSeconds : data.completedSeconds;
  const completionName = hardcore ? 'Platinado' : 'Completado';
  const completionPercent = data.players ? (completedPlayers / data.players) * 100 : 0;
  const beatenPercent = data.players ? (beatenPlayers / data.players) * 100 : 0;
  const rows = [
    { icon: 'check-circle' as const, name: 'Desbloqueou uma conquista', players: data.players },
    { icon: 'target' as const, name: 'Zerado', players: beatenPlayers, percent: beatenPercent, time: beatenSeconds },
    { icon: 'award' as const, name: completionName, players: completedPlayers, percent: completionPercent, time: completedSeconds, gold: true },
  ].filter((row) => row.players > 0);
  const entries = Object.entries(distribution);
  const highest = Math.max(1, ...entries.map(([, value]) => value));

  return <View style={styles.sidebar}>
    <Text style={styles.heading}>Tempo de Jogo</Text>
    <View style={styles.tabs}>
      <Pressable onPress={() => setMode('casual')}><Text style={[styles.tabMuted, mode === 'casual' && styles.tabOn]}>Casual</Text></Pressable>
      <Pressable onPress={() => setMode('hardcore')}><Text style={[styles.tabMuted, mode === 'hardcore' && styles.tabOn]}>Hardcore</Text></Pressable>
    </View>
    <View style={styles.card}>{rows.map((row, index) => <View key={row.name} style={[styles.row, index === rows.length - 1 && styles.last]}><Feather name={row.icon} size={16} color={row.gold ? '#f5c518' : '#00aaff'} /><View style={styles.copy}><Text style={[styles.label, row.gold && styles.gold]}>{row.name}</Text><Text style={styles.players}>{number(row.players)} jogadores{row.percent ? ` (${row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)` : ''}</Text></View>{row.time ? <View><Text style={styles.time}>{duration(row.time)}</Text><Text style={styles.median}>mediano</Text></View> : null}</View>)}</View>
    <Text style={styles.heading}>Comparar Progresso</Text>
    <View style={compare.card}>
      {comparedUsers.map((item) => { const percentage = item.totalAchievements ? Math.min(100, Math.round((item.unlockedAchievements / item.totalAchievements) * 100)) : 0; return <View key={item.username} style={compare.row}><View style={compare.avatar}>{item.avatarUrl ? <Image source={{ uri: item.avatarUrl }} style={compare.avatarImage} /> : <Text style={compare.initial}>{item.username.slice(0, 1).toUpperCase()}</Text>}</View><Text numberOfLines={1} style={compare.name}>{item.username}</Text><View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percentage }} style={compare.track}><View style={[compare.fill, { width: `${percentage}%` }]} /></View><Text style={compare.percent}>{percentage}%</Text></View>; })}
      <View style={compare.search}><TextInput value={compareQuery} onChangeText={setCompareQuery} accessibilityLabel="Compare com algum usuário" placeholder="compare com algum usuário..." placeholderTextColor="#777" style={compare.input} /><Feather name="search" size={13} color="#e1c500" /></View>
      {!!compareQuery.trim() && <Text style={compare.hint}>A busca de usuários ainda não é oferecida pela API usada pelo app.</Text>}
    </View>
    {entries.length > 0 && <><Text style={styles.heading}>Distribuição de Conquistas</Text><View style={styles.chart}>{entries.map(([key, value]) => <View key={key} style={styles.barWrap}><View style={[styles.bar, { height: `${Math.max(3, value / highest * 100)}%` }]} /><Text style={styles.tick}>{key}</Text></View>)}</View></>}
    {masters.length > 0 && <><Text style={styles.heading}>Últimas Platinas</Text><View style={styles.card}>{masters.map((item) => <View key={`${item.user}-${item.date}`} style={styles.master}><Text style={styles.rank}>#{item.rank}</Text><Text numberOfLines={1} style={styles.user}>{item.user}</Text><Text style={styles.date}>{item.date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(item.date)) : ''}</Text></View>)}</View></>}
    {leaderboards.length > 0 && <><Text style={styles.heading}>Tabela de Classificação</Text><View style={styles.card}>{leaderboards.map((item) => <View key={item.id} style={styles.board}><Text style={styles.boardTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.boardDescription}>{item.description}</Text><Text style={styles.boardScore}>♛ {item.formattedScore} <Text style={styles.user}>{item.user}</Text></Text></View>)}</View></>}
  </View>;
}

const compare = StyleSheet.create({
  card: { backgroundColor: '#1b1b1b', borderWidth: 1, borderColor: '#303030', borderRadius: 5, paddingVertical: 4 },
  row: { height: 25, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' }, initial: { color: '#ddd', fontSize: 7, fontWeight: '900' }, name: { color: '#e1c500', fontSize: 9, fontWeight: '700', width: 58 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: '#303030' }, fill: { height: '100%', backgroundColor: '#e1c500' }, percent: { width: 26, textAlign: 'right', color: '#888', fontSize: 8 },
  search: { height: 28, margin: 5, paddingHorizontal: 7, borderRadius: 4, backgroundColor: '#141414', borderWidth: 1, borderColor: '#414141', flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, color: '#ddd', fontSize: 9 }, hint: { color: '#777', fontSize: 8, paddingHorizontal: 7, paddingBottom: 5, lineHeight: 11 },
});

function GameSidebarLegacy({ apiKey, gameId }: Props) {
  const [data, setData] = useState<GameProgression | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [masters, setMasters] = useState<RecentMastery[]>([]);
  const [leaderboards, setLeaderboards] = useState<GameLeaderboard[]>([]);
  useEffect(() => { let alive = true; getGameProgression(apiKey, gameId).then((result) => alive && setData(result)).catch(() => alive && setData(null)); return () => { alive = false; }; }, [apiKey, gameId]);
  useEffect(() => { let alive = true; Promise.allSettled([getAchievementDistribution(apiKey, gameId), getRecentMasteries(apiKey, gameId), getGameLeaderboards(apiKey, gameId)]).then(([d, m, l]) => { if (!alive) return; if (d.status === 'fulfilled') setDistribution(d.value); if (m.status === 'fulfilled') setMasters(m.value); if (l.status === 'fulfilled') setLeaderboards(l.value); }); return () => { alive = false; }; }, [apiKey, gameId]);
  if (!data) return <View style={styles.sidebar}><Text style={styles.heading}>Tempo de Jogo</Text><View style={styles.loading}><ActivityIndicator size="small" color="#00aaff" /></View></View>;
  const beatenPercent = data.players ? (data.beatenPlayers / data.players) * 100 : 0;
  const masteredPercent = data.players ? (data.masteredPlayers / data.players) * 100 : 0;
  const rows = [
    { icon: 'check-circle' as const, name: 'Desbloqueou uma conquista', players: data.players },
    { icon: 'target' as const, name: 'Zerado', players: data.beatenPlayers, percent: beatenPercent, time: data.beatSeconds },
    { icon: 'award' as const, name: 'Platinado', players: data.masteredPlayers, percent: masteredPercent, time: data.masteredSeconds, gold: true },
  ].filter((row) => row.players > 0);
  const entries = Object.entries(distribution); const highest = Math.max(1, ...entries.map(([, value]) => value));
  return <View style={styles.sidebar}><Text style={styles.heading}>Tempo de Jogo</Text><View style={styles.tabs}><Text style={styles.tabMuted}>Casual</Text><Text style={styles.tabOn}>Hardcore</Text></View><View style={styles.card}>{rows.map((row, index) => <View key={row.name} style={[styles.row, index === rows.length - 1 && styles.last]}><Feather name={row.icon} size={16} color={row.gold ? '#f5c518' : '#00aaff'} /><View style={styles.copy}><Text style={[styles.label, row.gold && styles.gold]}>{row.name}</Text><Text style={styles.players}>{number(row.players)} jogadores{row.percent ? ` (${row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%)` : ''}</Text></View>{row.time ? <View><Text style={styles.time}>{duration(row.time)}</Text><Text style={styles.median}>mediano</Text></View> : null}</View>)}</View>{entries.length > 0 && <><Text style={styles.heading}>Distribuição de Conquistas</Text><View style={styles.chart}>{entries.map(([key, value]) => <View key={key} style={styles.barWrap}><View style={[styles.bar, { height: `${Math.max(3, value / highest * 100)}%` }]} /><Text style={styles.tick}>{key}</Text></View>)}</View></>}{masters.length > 0 && <><Text style={styles.heading}>Últimas Platinas</Text><View style={styles.card}>{masters.map((item) => <View key={`${item.user}-${item.date}`} style={styles.master}><Text style={styles.rank}>#{item.rank}</Text><Text numberOfLines={1} style={styles.user}>{item.user}</Text><Text style={styles.date}>{item.date ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(item.date)) : ''}</Text></View>)}</View></>}{leaderboards.length > 0 && <><Text style={styles.heading}>Tabela de Classificação</Text><View style={styles.card}>{leaderboards.map((item) => <View key={item.id} style={styles.board}><Text style={styles.boardTitle}>{item.title}</Text><Text numberOfLines={2} style={styles.boardDescription}>{item.description}</Text><Text style={styles.boardScore}>♛ {item.formattedScore} <Text style={styles.user}>{item.user}</Text></Text></View>)}</View></>}</View>;
}

const styles = StyleSheet.create({ sidebar: { width: 220 }, heading: { color: '#00aaff', fontWeight: '900', fontSize: 13, marginTop: 15, marginBottom: 6 }, tabs: { flexDirection: 'row', gap: 12, marginBottom: 5 }, tabMuted: { color: '#777', fontSize: 10 }, tabOn: { color: '#ddd', fontSize: 10, borderBottomWidth: 1, borderBottomColor: '#f5c518', paddingBottom: 3 }, card: { backgroundColor: '#1b1b1b', borderWidth: 1, borderColor: '#303030', borderRadius: 5 }, row: { minHeight: 52, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#303030' }, last: { borderBottomWidth: 0 }, copy: { flex: 1 }, label: { color: '#ddd', fontSize: 10, fontWeight: '800' }, gold: { color: '#f5c518' }, players: { color: '#888', fontSize: 9, marginTop: 3 }, time: { color: '#ddd', fontSize: 10, textAlign: 'right' }, median: { color: '#777', fontSize: 8, marginTop: 2 }, loading: { height: 122, backgroundColor: '#1b1b1b', borderWidth: 1, borderColor: '#303030', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }, chart: { height: 95, padding: 6, flexDirection: 'row', alignItems: 'flex-end', gap: 1, backgroundColor: '#1b1b1b', borderWidth: 1, borderColor: '#303030' }, barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }, bar: { width: '100%', backgroundColor: '#e1c500' }, tick: { color: '#777', fontSize: 6, marginTop: 2 }, master: { height: 25, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: '#303030' }, rank: { color: '#00aaff', fontSize: 8, width: 24 }, user: { color: '#e1c500', fontSize: 9, flex: 1 }, date: { color: '#777', fontSize: 8 }, board: { padding: 7, borderBottomWidth: 1, borderBottomColor: '#303030' }, boardTitle: { color: '#e1c500', fontSize: 10, fontWeight: '800' }, boardDescription: { color: '#00aaff', fontSize: 8, marginTop: 2 }, boardScore: { color: '#ddd', fontSize: 9, marginTop: 4 } });
