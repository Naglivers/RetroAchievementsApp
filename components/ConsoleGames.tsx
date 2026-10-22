import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ConsoleGame, getAllUserGameProgress, getConsoleGames, RetroConsole, UserGameProgress } from '../src/retroachievements';

const media = (path: string) => path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/${path}`}`;
const userProgressCache = new Map<string, Map<number, UserGameProgress>>();

export function ConsoleGames({ apiKey, username, console, onBack, onOpenGame }: { apiKey: string; username: string; console: RetroConsole; onBack: () => void; onOpenGame: (game: UserGameProgress) => void }) {
  const { width } = useWindowDimensions();
  const mobile = width < 900;
  const phone = width < 600;
  const [games, setGames] = useState<ConsoleGame[]>([]);
  const [progressByGame, setProgressByGame] = useState<Map<number, UserGameProgress>>(new Map());
  const [query, setQuery] = useState('');
  const [hideHacks, setHideHacks] = useState(false);
  const [hideHomebrew, setHideHomebrew] = useState(false);
  const [hideDemos, setHideDemos] = useState(false);
  const [hidePrototypes, setHidePrototypes] = useState(false);
  const [hideUnlicensed, setHideUnlicensed] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);
  const [unmasteredFirst, setUnmasteredFirst] = useState(false);
  const [masteredFirst, setMasteredFirst] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => { setLoading(true); setFailed(false); try { const catalog = await getConsoleGames(apiKey, console.id); setGames(catalog); if (username) { let savedProgress = userProgressCache.get(username.toLocaleLowerCase()); if (!savedProgress) { try { const progress = await getAllUserGameProgress(apiKey, username); savedProgress = new Map(progress.map((game) => [game.gameId, game])); userProgressCache.set(username.toLocaleLowerCase(), savedProgress); } catch { savedProgress = new Map(); } } setProgressByGame(savedProgress); } } catch { setFailed(true); } finally { setLoading(false); } }, [apiKey, console.id, username]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!failed) return; const retry = setTimeout(load, 8000); return () => clearTimeout(retry); }, [failed, load]);
  const visible = useMemo(() => games.filter((game) => {
    const title = game.title.toLocaleLowerCase();
    const progress = progressByGame.get(game.gameId);
    const mastered = Boolean(progress?.maxPossible && progress.numAwarded >= progress.maxPossible);
    return title.includes(query.trim().toLocaleLowerCase()) && (!hideHacks || !title.includes('~hack~')) && (!hideHomebrew || !title.includes('~homebrew~')) && (!hideDemos || !title.includes('demo')) && (!hidePrototypes || !title.includes('prototype')) && (!hideUnlicensed || !title.includes('~unlicensed~')) && (!hideMastered || !mastered);
  }).sort((a, b) => { if (!unmasteredFirst && !masteredFirst) return 0; const progressA = progressByGame.get(a.gameId); const progressB = progressByGame.get(b.gameId); const percentA = progressA?.maxPossible ? (progressA.numAwarded / progressA.maxPossible) * 100 : 0; const percentB = progressB?.maxPossible ? (progressB.numAwarded / progressB.maxPossible) * 100 : 0; const masteredA = percentA >= 100; const masteredB = percentB >= 100; if (masteredA !== masteredB) return masteredFirst ? Number(masteredB) - Number(masteredA) : Number(masteredA) - Number(masteredB); return percentB - percentA || a.title.localeCompare(b.title); }), [games, hideDemos, hideHacks, hideHomebrew, hideMastered, hidePrototypes, hideUnlicensed, masteredFirst, progressByGame, query, unmasteredFirst]);
  const open = (game: ConsoleGame) => onOpenGame({ gameId: game.gameId, title: game.title, imageIcon: game.imageIcon, consoleName: console.name, numAwarded: 0, maxPossible: game.numAchievements, possibleScore: game.points, mostRecentAwardedDate: '' });
  const openLuckyGame = () => { if (visible.length) open(visible[Math.floor(Math.random() * visible.length)]); };

  const filters: Array<[boolean, (value: boolean) => void, string, string]> = [[hideHacks, setHideHacks, 'Hacks', 'slash'], [hideHomebrew, setHideHomebrew, 'Homebrew', 'slash'], [hideDemos, setHideDemos, 'Demos', 'slash'], [hidePrototypes, setHidePrototypes, 'Prototypes', 'slash'], [hideUnlicensed, setHideUnlicensed, 'Unlicensed', 'slash'], [hideMastered, setHideMastered, 'Masterizados', 'award'], [unmasteredFirst, (value) => { setUnmasteredFirst(value); if (value) setMasteredFirst(false); }, 'Não masterizados primeiro', 'arrow-up'], [masteredFirst, (value) => { setMasteredFirst(value); if (value) setUnmasteredFirst(false); }, 'Masterizados primeiro', 'arrow-down']];
  const filterLabel = (label: string) => ['Não masterizados primeiro', 'Masterizados primeiro'].includes(label) ? label : `Ocultar ${label}`;
  const filterButtons = filters.map(([enabled, setEnabled, label, icon]) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: enabled }} key={label} onPress={() => setEnabled(!enabled)} style={[styles.filter, mobile && small.filter, enabled && styles.filterActive]}><Feather name={icon as keyof typeof Feather.glyphMap} size={mobile ? 15 : 13} color={enabled ? '#2d2608' : '#b9b1cf'} /><Text style={[styles.filterText, mobile && small.filterText, enabled && styles.filterTextActive]}>{filterLabel(label)}</Text></Pressable>);
  return <View style={[styles.page, mobile && small.page]}>
    <View style={styles.heading}>
      <Pressable accessibilityRole="button" accessibilityLabel="Voltar aos consoles" onPress={onBack} style={[styles.back, mobile && small.navigationButton]}><Feather name="arrow-left" size={20} color="#ffe36d" /></Pressable>
      <View style={[styles.headingCopy, mobile && small.headingCopy]}><Text style={[styles.kicker, mobile && small.kicker]}>CONSOLE</Text><Text style={[styles.title, mobile && small.title]}>{console.name}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Atualizar jogos" onPress={load} style={[styles.refresh, mobile && small.navigationButton]}><Feather name="refresh-cw" size={18} color="#ffe36d" /></Pressable>
    </View>
    <View style={[styles.search, mobile && small.search]}><Feather name="search" size={18} color="#969eb2" /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar jogo" accessibilityLabel="Buscar jogo" autoCorrect={false} placeholderTextColor="#747c91" style={[styles.input, mobile && small.input]} />{!!query && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setQuery('')} style={small.clearSearch}><Feather name="x" size={18} color="#a8b0c4" /></Pressable>}</View>
    {mobile ? <>
      <View style={small.filterHeading}><Text style={small.filterHeadingText}>Filtros e ordem{filters.some(([enabled]) => enabled) ? ` · ${filters.filter(([enabled]) => enabled).length} ativos` : ''}</Text><Text style={small.filterHint}>Deslize →</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={small.filters}>{filterButtons}</ScrollView>
    </> : <View style={styles.filters}>{filterButtons}</View>}
    {loading && games.length === 0 ? <View style={styles.status}><ActivityIndicator color="#ffe36d" /><Text style={[styles.statusText, mobile && small.statusText]}>Carregando jogos…</Text></View> : null}
    {!loading && failed && games.length === 0 ? <View style={styles.status}><Text style={[styles.statusText, mobile && small.statusText]}>Não foi possível carregar os jogos. Tentando novamente…</Text><Pressable accessibilityRole="button" style={[styles.retry, mobile && small.retry]} onPress={load}><Text style={[styles.retryText, mobile && small.retryText]}>Tentar agora</Text></Pressable></View> : null}
    <View style={[styles.listHeader, mobile && small.listHeader]}><Pressable accessibilityRole="button" disabled={!visible.length} onPress={openLuckyGame} style={[styles.lucky, mobile && small.lucky, !visible.length && styles.luckyDisabled]}><Feather name="shuffle" size={16} color="#2d2608" /><Text style={[styles.luckyText, mobile && small.luckyText]}>ESTOU COM SORTE</Text></Pressable><Text style={[styles.count, mobile && small.count]}>{visible.length} jogos</Text></View>
    {!loading && !failed && visible.length === 0 && <View style={styles.status}><Feather name="search" size={24} color="#a993ff" /><Text style={[styles.statusText, mobile && small.statusText]}>Nenhum jogo encontrado. Tente outra busca ou ajuste os filtros.</Text></View>}
    <View style={[styles.grid, mobile && small.grid]}>{visible.map((game) => {
      const progress = progressByGame.get(game.gameId);
      const percent = progress?.maxPossible ? Math.min(100, Math.round((progress.numAwarded / progress.maxPossible) * 100)) : 0;
      const mastered = percent === 100 && !!progress;
      return <Pressable accessibilityRole="button" accessibilityLabel={`${game.title}, ${percent}% completo`} key={game.gameId} onPress={() => open(game)} style={[styles.game, mobile && small.game, mobile && { width: phone ? '100%' : '48.5%' }, mastered && styles.gameMastered]}>
        <View style={[styles.icon, mobile && small.icon]}><MaterialCommunityIcons name="gamepad-variant" size={25} color="#ffe36d" />{!!game.imageIcon && <Image source={{ uri: media(game.imageIcon) }} style={styles.iconImage} />}</View>
        <View style={[styles.copy, mobile && small.copy]}>
          <View style={styles.gameTitleRow}><Text numberOfLines={2} style={[styles.gameTitle, mobile && small.gameTitle]}>{game.title}</Text>{mastered && <View style={[styles.medal, mobile && small.medal]}><Feather name="award" size={14} color="#302807" /></View>}</View>
          <Text style={[styles.meta, mobile && small.meta]}>{game.numAchievements} conquistas · {game.points} pts</Text>
          <View style={[styles.progressRow, mobile && small.progressRow]}><View style={[styles.track, mobile && small.track]}><View style={[styles.fill, { width: `${percent}%` }]} /></View><Text style={[styles.percent, mobile && small.percent]}>{percent}%</Text></View>
        </View>
        <Feather name="chevron-right" size={17} color="#737b90" />
      </Pressable>;
    })}</View>
  </View>;
}

const styles = StyleSheet.create({
  page: { marginTop: 22, paddingBottom: 28 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, back: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222633', borderWidth: 1, borderColor: '#363c4e' }, headingCopy: { flex: 1 }, kicker: { color: '#a993ff', fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: '#f7f8fc', fontSize: 23, fontWeight: '900', marginTop: 2 }, refresh: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#222633', borderWidth: 1, borderColor: '#363c4e' },
  search: { height: 47, marginTop: 20, borderRadius: 12, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, color: '#f4f5f9', fontSize: 14, marginLeft: 9 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, filter: { height: 31, borderRadius: 8, paddingHorizontal: 9, borderWidth: 1, borderColor: '#3a4052', backgroundColor: '#202331', flexDirection: 'row', alignItems: 'center', gap: 5 }, filterActive: { backgroundColor: '#ffe36d', borderColor: '#ffe36d' }, filterText: { color: '#c3bed2', fontSize: 10, fontWeight: '800' }, filterTextActive: { color: '#2d2608' },
  listHeader: { alignItems: 'stretch', marginTop: 16, marginBottom: 9, gap: 9 }, count: { color: '#979fb3', fontSize: 11, fontWeight: '800' }, lucky: { height: 43, borderRadius: 10, paddingHorizontal: 14, backgroundColor: '#ffe36d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, luckyDisabled: { opacity: .45 }, luckyText: { color: '#2d2608', fontSize: 11, fontWeight: '900' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, game: { width: '31%', minWidth: 195, minHeight: 91, borderRadius: 12, padding: 10, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', alignItems: 'center', gap: 9 }, gameMastered: { borderColor: '#8d7a25', backgroundColor: '#262336' },
  icon: { height: 47, width: 47, borderRadius: 8, backgroundColor: '#302d42', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, iconImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, copy: { flex: 1 }, gameTitleRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start' }, gameTitle: { color: '#edf0f7', fontSize: 12, fontWeight: '800', flex: 1 }, medal: { height: 21, width: 21, borderRadius: 11, backgroundColor: '#ffe36d', alignItems: 'center', justifyContent: 'center' }, meta: { color: '#8d96aa', fontSize: 10, marginTop: 4 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }, track: { flex: 1, height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: '#343949' }, fill: { height: '100%', borderRadius: 4, backgroundColor: '#ffe36d' }, percent: { width: 30, color: '#ffe36d', fontSize: 10, fontWeight: '900', textAlign: 'right' },
  status: { minHeight: 130, marginTop: 16, borderRadius: 14, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', alignItems: 'center', justifyContent: 'center', gap: 11, padding: 18 }, statusText: { color: '#abb3c6', textAlign: 'center', fontSize: 12 }, retry: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#ffe36d' }, retryText: { color: '#1c1b1c', fontWeight: '900', fontSize: 11 },
});

const small = StyleSheet.create({
  page: { marginTop: 20, paddingBottom: 24 }, navigationButton: { width: 46, height: 46, borderRadius: 13 }, headingCopy: { minWidth: 0 }, kicker: { fontSize: 11 }, title: { fontSize: 21, lineHeight: 27, marginTop: 3 },
  search: { height: 52, marginTop: 20, borderRadius: 14 }, input: { minWidth: 0, fontSize: 16, paddingVertical: 10 }, clearSearch: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 18, marginBottom: 9 }, filterHeadingText: { color: '#c6ccdb', fontSize: 12, fontWeight: '800' }, filterHint: { color: '#8c96ad', fontSize: 12 },
  filters: { flexDirection: 'row', gap: 8, paddingRight: 4, paddingBottom: 2 }, filter: { height: 44, borderRadius: 12, paddingHorizontal: 13, gap: 7 }, filterText: { fontSize: 12 },
  listHeader: { marginTop: 18, marginBottom: 12, gap: 14 }, count: { fontSize: 12 }, lucky: { height: 48, borderRadius: 13 }, luckyText: { fontSize: 12, letterSpacing: .4 }, grid: { gap: 12 },
  game: { minWidth: 0, minHeight: 112, padding: 13, gap: 11, borderRadius: 16 }, icon: { height: 58, width: 58, borderRadius: 12, flexShrink: 0 }, copy: { minWidth: 0 }, gameTitle: { fontSize: 14, lineHeight: 19 }, medal: { width: 24, height: 24, borderRadius: 12 },
  meta: { fontSize: 12, lineHeight: 17, marginTop: 5 }, progressRow: { marginTop: 9 }, track: { height: 6 }, percent: { width: 35, fontSize: 12 }, statusText: { fontSize: 14, lineHeight: 21 }, retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 }, retryText: { fontSize: 13 },
});
