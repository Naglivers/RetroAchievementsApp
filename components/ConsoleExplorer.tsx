import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { getAllUserGameProgress, getConsoleGameCount, getConsoleGames, getConsoles, RetroConsole, UserGameProgress } from '../src/retroachievements';
import { CachedConsoleUserStats, loadConsoleGameCounts, loadConsoleUserStats, saveConsoleGameCounts, saveConsoleUserStats } from '../src/credentials';

type ConsoleStats = { total: number | null; played: number; mastered: number; loaded: boolean };
const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function ConsoleExplorer({ apiKey, username, onOpenSettings, onOpenConsole, onOpenGame }: { apiKey: string; username: string; onOpenSettings: () => void; onOpenConsole: (console: RetroConsole) => void; onOpenGame: (game: UserGameProgress) => void }) {
  const { width } = useWindowDimensions();
  const mobile = width < 900;
  const phone = width < 600;
  const [consoles, setConsoles] = useState<RetroConsole[]>([]);
  const [stats, setStats] = useState<Record<number, ConsoleStats>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(Boolean(apiKey));
  const [failed, setFailed] = useState(false);
  const [luckyLoading, setLuckyLoading] = useState(false);

  const load = useCallback(async () => {
    if (!apiKey) { setLoading(false); return; }
    setLoading(true); setFailed(false);
    try {
      const [systems, cachedCounts, cachedUserStats] = await Promise.all([getConsoles(apiKey), loadConsoleGameCounts(), loadConsoleUserStats(username)]);
      setConsoles(systems);
      const progressByConsole = new Map<string, { played: number; mastered: number }>();
      Object.entries(cachedUserStats).forEach(([consoleName, value]) => progressByConsole.set(consoleName, value));
      // A ordem é definida uma única vez com o cache. Atualizações posteriores
      // só mudam os números do card, sem remontar a lista inteira.
      const orderedSystems = [...systems].sort((a, b) => {
        const progressA = progressByConsole.get(normalize(a.name))?.played ?? 0;
        const progressB = progressByConsole.get(normalize(b.name))?.played ?? 0;
        return progressB - progressA || a.name.localeCompare(b.name);
      });
      setConsoles(orderedSystems);
      const needsUserStats = username && systems.some((system) => {
        const saved = cachedUserStats[normalize(system.name)];
        return !saved || saved.played === 0 || saved.mastered === 0;
      });
      if (needsUserStats) {
        try {
          const progress = await getAllUserGameProgress(apiKey, username);
          const fetchedStats: CachedConsoleUserStats = {};
          progress.forEach((game) => {
            const key = normalize(game.consoleName);
            const current = fetchedStats[key] ?? { played: 0, mastered: 0 };
            current.played += 1;
            if (game.maxPossible > 0 && game.numAwarded >= game.maxPossible) current.mastered += 1;
            fetchedStats[key] = current;
          });
          const mergedStats: CachedConsoleUserStats = { ...cachedUserStats };
          Object.entries(fetchedStats).forEach(([consoleName, fresh]) => {
            const saved = cachedUserStats[consoleName];
            mergedStats[consoleName] = {
              played: saved?.played > 0 ? saved.played : fresh.played,
              mastered: saved?.mastered > 0 ? saved.mastered : fresh.mastered,
            };
          });
          progressByConsole.clear();
          Object.entries(mergedStats).forEach(([consoleName, value]) => progressByConsole.set(consoleName, value));
          await saveConsoleUserStats(username, mergedStats).catch(() => undefined);
        } catch {
          // Mantém os números já salvos localmente enquanto a API se recupera.
        }
      }
      const totals: Record<number, ConsoleStats> = {};
      let hasCountFailures = false;
      orderedSystems.forEach((system) => {
        const user = progressByConsole.get(normalize(system.name)) ?? { played: 0, mastered: 0 };
        const cachedTotal = cachedCounts[String(system.id)];
        const hasCachedTotal = Number.isFinite(cachedTotal) && cachedTotal > 0;
        totals[system.id] = { total: hasCachedTotal ? cachedTotal : null, played: user.played, mastered: user.mastered, loaded: hasCachedTotal };
      });
      setStats((current) => {
        const next = { ...current };
        orderedSystems.forEach((system) => {
          const incoming = totals[system.id];
          const previous = current[system.id];
          next[system.id] = {
            total: previous?.total && previous.total > 0 ? previous.total : incoming.total,
            played: previous?.played && previous.played > 0 ? previous.played : incoming.played,
            mastered: previous?.mastered && previous.mastered > 0 ? previous.mastered : incoming.mastered,
            loaded: previous?.loaded || incoming.loaded,
          };
        });
        return next;
      });
      // O endpoint pode responder com catálogos enormes. Uma consulta por vez
      // evita que o servidor derrube todas as contagens por excesso de tráfego.
      for (const system of orderedSystems.filter((item) => !Number.isFinite(cachedCounts[String(item.id)]) || cachedCounts[String(item.id)] <= 0)) {
        let total: number | null = null;
        try { total = await getConsoleGameCount(apiKey, system.id); if (total && total > 0) cachedCounts[String(system.id)] = total; }
        catch { hasCountFailures = true; }
        const user = progressByConsole.get(normalize(system.name)) ?? { played: 0, mastered: 0 };
        totals[system.id] = { total, played: user.played, mastered: user.mastered, loaded: true };
        setStats((current) => ({
          ...current,
          [system.id]: {
            total: (current[system.id]?.total ?? 0) > 0 ? current[system.id].total : total,
            played: current[system.id]?.played && current[system.id].played > 0 ? current[system.id].played : user.played,
            mastered: current[system.id]?.mastered && current[system.id].mastered > 0 ? current[system.id].mastered : user.mastered,
            loaded: true,
          },
        }));
      }
      await saveConsoleGameCounts(cachedCounts).catch(() => undefined);
      if (hasCountFailures) setFailed(true);
    } catch { setConsoles([]); setStats({}); setFailed(true); }
    finally { setLoading(false); }
  }, [apiKey, username]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!failed || !apiKey) return; const retry = setTimeout(load, 8000); return () => clearTimeout(retry); }, [apiKey, failed, load]);
  const filtered = useMemo(() => consoles.filter((console) => console.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [consoles, query]);
  const openLuckyGame = async () => {
    if (!consoles.length || luckyLoading) return;
    setLuckyLoading(true);
    try {
      const shuffled = [...consoles].sort(() => Math.random() - .5);
      for (const system of shuffled) {
        // Se um catálogo falhar, o sorteio continua com o próximo console.
        const games = await getConsoleGames(apiKey, system.id).catch(() => []);
        if (!games.length) continue;
        const game = games[Math.floor(Math.random() * games.length)];
        onOpenGame({ gameId: game.gameId, title: game.title, imageIcon: game.imageIcon, consoleName: system.name, numAwarded: 0, maxPossible: game.numAchievements, possibleScore: game.points, mostRecentAwardedDate: '' });
        return;
      }
      setFailed(true);
    } finally { setLuckyLoading(false); }
  };

  return <View style={[styles.page, mobile && small.page]}>
    <View style={[styles.heading, mobile && small.heading]}>
      <View style={mobile && small.headingCopy}>
        <Text style={[styles.title, mobile && small.title]}>Explorar consoles</Text>
        <Text style={[styles.subtitle, mobile && small.subtitle]}>Todos os sistemas ativos do RetroAchievements.</Text>
      </View>
      <View style={[styles.headingActions, mobile && small.headingActions]}>
        <Pressable accessibilityRole="button" disabled={!consoles.length || luckyLoading} onPress={openLuckyGame} style={[styles.lucky, mobile && small.lucky, (!consoles.length || luckyLoading) && styles.luckyDisabled]}>
          {luckyLoading ? <ActivityIndicator size="small" color="#2d2608" /> : <Feather name="shuffle" size={16} color="#2d2608" />}
          <Text style={[styles.luckyText, mobile && small.luckyText]}>{luckyLoading ? 'SORTEANDO…' : 'ESTOU COM SORTE'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Atualizar consoles" onPress={load} style={[styles.refresh, mobile && small.refresh]}><Feather name="refresh-cw" size={18} color="#ffe36d" /></Pressable>
      </View>
    </View>
    {!apiKey ? <Pressable accessibilityRole="button" onPress={onOpenSettings} style={styles.connect}><Feather name="key" size={18} color="#ffe36d" /><Text style={[styles.connectText, mobile && small.connectText]}>Conecte sua API key para carregar os consoles</Text><Feather name="chevron-right" size={18} color="#ffe36d" /></Pressable> : <>
      <View style={[styles.search, mobile && small.search]}><Feather name="search" size={18} color="#969eb2" /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar console" accessibilityLabel="Buscar console" autoCorrect={false} placeholderTextColor="#747c91" style={[styles.input, mobile && small.input]} />{!!query && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={small.clearSearch}><Feather name="x" size={18} color="#a8b0c4" /></Pressable>}</View>
      {loading && consoles.length === 0 ? <View style={styles.status}><ActivityIndicator color="#ffe36d" /><Text style={[styles.statusText, mobile && small.statusText]}>Carregando consoles…</Text></View> : null}
      {!loading && consoles.length === 0 ? <View style={styles.status}><Text style={[styles.statusText, mobile && small.statusText]}>{failed ? 'Não foi possível carregar os consoles. Tentando novamente…' : 'Nenhum console encontrado.'}</Text><Pressable accessibilityRole="button" onPress={load} style={[styles.retry, mobile && small.retry]}><Text style={[styles.retryText, mobile && small.retryText]}>Tentar agora</Text></Pressable></View> : null}
      {failed && consoles.length > 0 && <Text style={small.notice}>Não foi possível carregar algumas informações. Tentaremos novamente automaticamente.</Text>}
      <Text style={[styles.count, mobile && small.count]}>{filtered.length} consoles</Text>
      {consoles.length > 0 && filtered.length === 0 && <View style={styles.status}><Feather name="search" size={24} color="#a993ff" /><Text style={[styles.statusText, mobile && small.statusText]}>Nenhum console encontrado para “{query}”.</Text></View>}
      <View style={[styles.grid, mobile && small.grid]}>{filtered.map((console) => {
        const progress = stats[console.id] ?? { total: 0, played: 0, mastered: 0, loaded: false };
        const total = progress.total ?? 0;
        const masteredPercent = total ? Math.min(100, (progress.mastered / total) * 100) : 0;
        const playedPercent = total ? Math.min(100 - masteredPercent, ((progress.played - progress.mastered) / total) * 100) : 0;
        const consolePercent = total ? Math.min(100, Math.round((progress.played / total) * 100)) : 0;
        const isConsoleMastered = total > 0 && progress.mastered >= total;
        return <Pressable accessibilityRole="button" accessibilityLabel={`Ver jogos de ${console.name}`} key={console.id} onPress={() => onOpenConsole(console)} style={[styles.console, mobile && small.console, mobile && { width: phone ? '100%' : '48.5%' }, isConsoleMastered && styles.consoleMastered]}>
          <View style={styles.consoleTop}>
            <View style={[styles.icon, mobile && small.icon]}><Feather name="cpu" size={23} color="#ffe36d" />{!!console.iconUrl && <Image source={{ uri: console.iconUrl }} style={styles.iconImage} />}</View>
            <Text numberOfLines={2} style={[styles.consoleName, mobile && small.consoleName]}>{console.name}</Text>
            {isConsoleMastered ? <View style={styles.masteryMedal}><Feather name="award" size={14} color="#2d2608" /><Text style={styles.masteryMedalText}>100%</Text></View> : mobile && <Feather name="chevron-right" size={18} color="#7d869d" />}
          </View>
          <View style={[styles.bar, mobile && small.bar]}><View style={[styles.masteredSegment, { width: `${masteredPercent}%` }]} /><View style={[styles.playedSegment, { left: `${masteredPercent}%`, width: `${playedPercent}%` }]} /></View>
          <View style={[styles.statsRow, mobile && small.statsRow]}><Text style={[styles.masteredText, mobile && small.statsText]}>{progress.mastered} masterizados</Text><Text style={[styles.playedText, mobile && small.statsText]}>{Math.max(0, progress.played - progress.mastered)} jogados</Text></View>
          <View style={styles.totalRow}><Text style={[styles.totalText, mobile && small.totalText]}>{total} jogos no console</Text><Text style={[styles.consolePercent, mobile && small.consolePercent]}>{consolePercent}%</Text></View>
        </Pressable>;
      })}</View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  page: { marginTop: 25, paddingBottom: 28 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, title: { color: '#f7f8fc', fontSize: 25, fontWeight: '900' }, subtitle: { color: '#929aaf', fontSize: 13, marginTop: 6 }, headingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, lucky: { height: 38, borderRadius: 10, paddingHorizontal: 11, backgroundColor: '#ffe36d', flexDirection: 'row', alignItems: 'center', gap: 6 }, luckyDisabled: { opacity: .45 }, luckyText: { color: '#2d2608', fontSize: 10, fontWeight: '900' }, refresh: { height: 38, width: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222633', borderWidth: 1, borderColor: '#363c4e' },
  connect: { minHeight: 62, marginTop: 20, padding: 14, borderRadius: 13, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#343a4c', flexDirection: 'row', alignItems: 'center', gap: 10 }, connectText: { color: '#d9d0ff', fontSize: 12, fontWeight: '800', flex: 1 },
  search: { height: 47, marginTop: 22, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, color: '#f4f5f9', fontSize: 14, marginLeft: 9 }, count: { color: '#979fb3', fontSize: 11, fontWeight: '800', marginTop: 17, marginBottom: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, console: { minHeight: 124, width: '31%', minWidth: 175, borderRadius: 12, padding: 11, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647' }, consoleMastered: { borderColor: '#8d7a25', backgroundColor: '#262336' }, consoleTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, icon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#302d42', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, iconImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, consoleName: { flex: 1, color: '#edf0f7', fontSize: 12, fontWeight: '800' }, masteryMedal: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ffe36d', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 4 }, masteryMedalText: { color: '#2d2608', fontSize: 9, fontWeight: '900' }, bar: { height: 7, backgroundColor: '#0e1018', borderRadius: 5, overflow: 'hidden', marginTop: 12, position: 'relative' }, masteredSegment: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#ffe36d' }, playedSegment: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#8b93a7' }, statsRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 5 }, masteredText: { color: '#ffe36d', fontSize: 9, fontWeight: '800' }, playedText: { color: '#aeb6c7', fontSize: 9, fontWeight: '800' }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }, totalText: { color: '#757e92', fontSize: 9 }, consolePercent: { color: '#d8d1ea', fontSize: 11, fontWeight: '900' },
  status: { minHeight: 130, marginTop: 16, borderRadius: 14, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', alignItems: 'center', justifyContent: 'center', gap: 11, padding: 18 }, statusText: { color: '#abb3c6', textAlign: 'center', fontSize: 12 }, retry: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#ffe36d' }, retryText: { color: '#1c1b1c', fontWeight: '900', fontSize: 11 },
});

const small = StyleSheet.create({
  page: { marginTop: 20, paddingBottom: 24 },
  heading: { alignItems: 'stretch', flexDirection: 'column', gap: 16 },
  headingCopy: { minWidth: 0 }, title: { fontSize: 24, lineHeight: 30 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  headingActions: { alignItems: 'stretch', gap: 10 }, lucky: { flex: 1, height: 48, borderRadius: 13, justifyContent: 'center' }, luckyText: { fontSize: 12, letterSpacing: .4 }, refresh: { height: 48, width: 48, borderRadius: 13 },
  connectText: { fontSize: 14, lineHeight: 21 }, search: { height: 52, marginTop: 18, borderRadius: 14 }, input: { minWidth: 0, fontSize: 16, paddingVertical: 10 }, clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  count: { fontSize: 12, marginTop: 20, marginBottom: 10 }, grid: { gap: 12 }, console: { minWidth: 0, minHeight: 160, borderRadius: 17, padding: 16 }, icon: { height: 44, width: 44, borderRadius: 12 }, consoleName: { fontSize: 16, lineHeight: 21 },
  bar: { height: 8, marginTop: 16 }, statsRow: { marginTop: 10, flexWrap: 'wrap', rowGap: 4 }, statsText: { fontSize: 12, lineHeight: 18 }, totalText: { fontSize: 12, color: '#929cb3' }, consolePercent: { fontSize: 14, lineHeight: 21 },
  statusText: { fontSize: 14, lineHeight: 21 }, retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 }, retryText: { fontSize: 13 },
  notice: { color: '#c8b9e5', fontSize: 12, lineHeight: 18, marginTop: 12, padding: 12, backgroundColor: '#272236', borderRadius: 12 },
});
