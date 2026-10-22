import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameComment, GameDetails, GameSubset, getGameComments, getGameDetails, getGameSubsets, UserGameProgress } from '../src/retroachievements';
import { AchievementOrder, AchievementSetPanel } from './AchievementSetPanel';
import { GameSidebar } from './GameSidebar';

const media = (path: string) => path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/Badge/${path}.png`}`;
const dateText = (value: string) => value ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '';
type Props = { game: UserGameProgress; apiKey: string; username: string; onBack: () => void };

export function GameDetail({ game, apiKey, username, onBack }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  const compact = width < 700;
  const [mobileTab, setMobileTab] = useState<'achievements' | 'about'>('achievements');
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [comments, setComments] = useState<GameComment[]>([]);
  const [subsets, setSubsets] = useState<GameSubset[]>([]);
  const [activeSetId, setActiveSetId] = useState(game.gameId);
  const [baseSet, setBaseSet] = useState({ id: game.gameId, icon: game.imageIcon });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hideEarned, setHideEarned] = useState(false);
  const [hideNonMissable, setHideNonMissable] = useState(false);
  const [order, setOrder] = useState<AchievementOrder>('default');

  const load = useCallback(async () => {
    setLoading(true); setFailed(false);
    try {
      const [info, loadedComments] = await Promise.all([
        getGameDetails(apiKey, username, game.gameId),
        getGameComments(apiKey, game.gameId),
      ]);
      const baseInfo = info.parentGameId ? await getGameDetails(apiKey, username, info.parentGameId) : info;
      setDetails(info); setComments(loadedComments); setActiveSetId(info.id);
      setBaseSet({ id: baseInfo.id, icon: baseInfo.imageIcon || game.imageIcon });
      try { setSubsets(await getGameSubsets(apiKey, baseInfo.consoleId, baseInfo.id, baseInfo.title)); } catch { setSubsets([]); }
    } catch { setFailed(true); } finally { setLoading(false); }
  }, [apiKey, username, game.gameId]);

  useEffect(() => { setActiveSetId(game.gameId); setBaseSet({ id: game.gameId, icon: game.imageIcon }); load(); }, [load, game.gameId, game.imageIcon]);
  const selectSet = useCallback(async (setId: number) => {
    if (setId === activeSetId) return;
    try {
      const [info, loadedComments] = await Promise.all([getGameDetails(apiKey, username, setId), getGameComments(apiKey, setId)]);
      setActiveSetId(setId); setDetails(info); setComments(loadedComments);
    } catch { /* mantém o set atual caso a API não responda */ }
  }, [activeSetId, apiKey, username]);
  const missable = (type: string) => type.trim().toLowerCase() === 'missable';
  const achievements = useMemo(() => [...(details?.achievements ?? [])].filter((item) =>
    !(hideEarned && item.dateEarned) && !(hideNonMissable && !missable(item.type)),
  ).sort((a, b) => order === 'earned' ? Number(Boolean(b.dateEarned)) - Number(Boolean(a.dateEarned)) : order === 'locked' ? Number(Boolean(a.dateEarned)) - Number(Boolean(b.dateEarned)) : order === 'points' ? b.points - a.points : order === 'difficulty' ? b.trueRatio - a.trueRatio : order === 'name' ? a.title.localeCompare(b.title) : a.id - b.id), [details, hideEarned, hideNonMissable, order]);

  if (loading) return <View style={styles.state}><ActivityIndicator color="#ffe36d" /><Text style={styles.muted}>Carregando página do jogo…</Text></View>;
  if (failed || !details) return <View style={styles.state}><Text style={styles.muted}>Não foi possível carregar este jogo.</Text><Pressable onPress={load} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View>;

  const completed = details.numAchievements ? Math.round((details.numAwardedToUser / details.numAchievements) * 100) : 0;
  const playtime = `${Math.floor(details.userTotalPlaytime / 3600)}h ${Math.floor((details.userTotalPlaytime % 3600) / 60)}min`;
  const open = (url: string) => Linking.openURL(url);
  const gameInformation = <View style={[rail.sidebar, desktop ? phone.desktopSidebar : phone.sidebar]}>
    <Image resizeMode="contain" source={{ uri: details.imageBoxArt ? media(details.imageBoxArt) : media(game.imageIcon) }} style={[rail.art, !desktop && phone.art]} />
    <View style={[rail.warning, phone.warning]}><Feather name="eye" size={15} color="#aeb5c7" /><Text style={[rail.warningText, !desktop && phone.warningText]}>Alerta de Epilepsia Fotossensível</Text></View>
    <View style={[rail.facts, !desktop && phone.facts]}>{[['Desenvolvedor', details.developer], ['Jogo base', game.title], ['Gênero', details.genre], ['Lançamento', details.released], ['Plataforma', details.consoleName], ['Progresso', details.userCompletion], ['Tempo de jogo', playtime], ['Jogadores', details.numDistinctPlayers.toLocaleString()]].map(([label, value], index) => <View key={label} style={[rail.fact, index === 7 && rail.factLast, !desktop && phone.fact]}><Text style={[rail.factLabel, !desktop && phone.factLabel]}>{label}</Text><Text style={[rail.factValue, !desktop && phone.factValue]}>{value || 'Não informado'}</Text></View>)}</View>
    <Text style={[rail.resourcesTitle, !desktop && phone.resourcesTitle]}>Recursos Essenciais</Text>
    <Pressable accessibilityRole="link" onPress={() => open(`https://retroachievements.org/game/${game.gameId}/hashes`)} style={[rail.resource, !desktop && phone.resource]}><Feather name="file-text" size={16} color="#ffe36d" /><Text style={[rail.resourceText, !desktop && phone.resourceText]}>Hashes de Jogo Suportados</Text><Feather name="external-link" size={14} color="#929aaf" /></Pressable>
    <Pressable accessibilityRole="link" onPress={() => open(`https://retroachievements.org/game/${game.gameId}`)} style={[rail.resource, !desktop && phone.resource]}><Feather name="message-square" size={16} color="#ffe36d" /><Text style={[rail.resourceText, !desktop && phone.resourceText]}>Tópico de Fórum do Set Base</Text><Feather name="external-link" size={14} color="#929aaf" /></Pressable>
    <Text style={[rail.resourcesTitle, !desktop && phone.resourcesTitle]}>Extras</Text>
    <Pressable accessibilityRole="link" onPress={() => open(`https://retroachievements.org/game/${game.gameId}`)} style={[rail.resource, !desktop && phone.resource]}><Feather name="search" size={16} color="#ffe36d" /><Text style={[rail.resourceText, !desktop && phone.resourceText]}>Encontrar Jogos Relacionados</Text><Feather name="external-link" size={14} color="#929aaf" /></Pressable>
    <GameSidebar apiKey={apiKey} gameId={details.id} currentUser={{ username, unlockedAchievements: details.numAwardedToUser, totalAchievements: details.numAchievements }} />
  </View>;

  return <View style={styles.page}>
    <Pressable accessibilityRole="button" onPress={onBack} style={[styles.back, !desktop && phone.back]}><Feather name="arrow-left" size={18} color="#ffe36d" /><Text style={styles.backText}>Voltar</Text></Pressable>
    <View style={[styles.layout, desktop && styles.layoutDesktop]}>
      <View style={[styles.main, !desktop && phone.main]}>
        <View style={[styles.hero, compact && phone.hero]}>
          {details.imageTitle ? <Image source={{ uri: media(details.imageTitle) }} style={[styles.heroImage, compact && phone.heroImage]} /> : null}
          <View style={[styles.heroShade, compact && phone.heroShade]} />
          <View style={[styles.heroContent, compact && phone.heroContent]}>
            {details.imageBoxArt ? <Image resizeMode="contain" source={{ uri: media(details.imageBoxArt) }} style={[styles.boxArt, compact && phone.boxArt]} /> : null}
            <View style={[styles.heroCopy, phone.shrink]}>
              <Text style={styles.console}>{details.consoleName}</Text>
              <Text style={[styles.gameTitle, compact && phone.gameTitle]}>{details.title}</Text>
              <Text style={[styles.gameInfo, compact && phone.gameInfo]}>{[details.developer, details.publisher, details.released].filter(Boolean).join(' · ')}</Text>
              <View style={[styles.progressRow, compact && phone.progressRow]}><View style={[styles.track, compact && phone.track]}><View style={[styles.fill, { width: `${completed}%` }]} /></View><Text style={[styles.percent, compact && phone.percent]}>{details.numAwardedToUser}/{details.numAchievements} · {completed}%</Text></View>
            </View>
          </View>
        </View>

        {!desktop && <View accessibilityRole="tablist" style={phone.tabs}>{([{ id: 'achievements', title: 'Conquistas', icon: 'award' }, { id: 'about', title: 'Sobre o jogo', icon: 'info' }] as const).map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: mobileTab === tab.id }} onPress={() => setMobileTab(tab.id)} style={[phone.tab, mobileTab === tab.id && phone.tabActive]}><Feather name={tab.icon} size={16} color={mobileTab === tab.id ? '#ffe36d' : '#9ca5bb'} /><Text style={[phone.tabText, mobileTab === tab.id && phone.tabTextActive]}>{tab.title}</Text></Pressable>)}</View>}
        {(desktop || mobileTab === 'achievements') && <><AchievementSetPanel
          baseGameId={baseSet.id}
          baseIcon={baseSet.icon}
          details={details}
          subsets={subsets}
          activeSetId={activeSetId}
          onSelectSet={selectSet}
          onConfigureSubsets={() => {}}
          order={order}
          onChangeOrder={setOrder}
          missableOnly={hideNonMissable}
          onToggleMissable={() => setHideNonMissable(!hideNonMissable)}
          lockedOnly={hideEarned}
          onToggleLocked={() => setHideEarned(!hideEarned)}
        />

        <View style={[styles.stats, !desktop && phone.stats]}>{[[details.numDistinctPlayers.toLocaleString(), 'JOGADORES'], [playtime, 'SEU TEMPO'], [details.genre || '—', 'GÊNERO']].map(([value, label]) => <View key={label} style={phone.stat}><Text style={[styles.statValue, !desktop && phone.statValue]}>{value}</Text><Text style={[styles.statLabel, !desktop && phone.statLabel]}>{label}</Text></View>)}</View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Conquistas</Text><Text style={styles.sectionCount}>{achievements.length} exibidas</Text></View>
        {achievements.length === 0 && <View style={phone.empty}><Feather name="filter" size={22} color="#a993ff" /><Text style={phone.emptyText}>Nenhuma conquista com esses filtros.</Text></View>}
        {achievements.map((achievement) => { const earned = Boolean(achievement.dateEarned); return <View key={achievement.id} style={[styles.achievement, !desktop && phone.achievement, earned && styles.achievementEarned]}><Image source={{ uri: media(achievement.badgeUrl) }} style={[styles.badge, compact && phone.badge, !earned && styles.badgeLocked]} /><View style={[styles.achievementCopy, phone.shrink]}><View style={[styles.achievementTop, compact && phone.achievementTop]}><Text style={[styles.achievementTitle, !desktop && phone.achievementTitle]}>{achievement.title}</Text><Text style={[styles.points, !desktop && phone.points]}>{achievement.points} pts</Text></View><Text style={[styles.description, !desktop && phone.description]}>{achievement.description}</Text><Text style={[styles.achievementMeta, !desktop && phone.meta]}>{earned ? `Desbloqueada ${dateText(achievement.dateEarned)}${achievement.dateEarnedHardcore ? ' · Hardcore' : ''}` : `${achievement.numAwarded.toLocaleString()} jogadores · ${achievement.trueRatio} RP`}{missable(achievement.type) ? ' · Perdível' : ''}</Text></View></View>; })}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Jogadores recentes</Text><Text style={styles.sectionCount}>sua sessão</Text></View>
        <View style={styles.playerCard}><View style={styles.playerAvatar}><Text style={styles.playerInitial}>{username.slice(0, 1).toUpperCase()}</Text></View><View style={phone.shrink}><Text style={styles.playerName}>{username}</Text><Text style={[styles.playerMeta, !desktop && phone.meta]}>Seu progresso neste jogo · {details.userCompletion}</Text></View></View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Comentários</Text><Text style={styles.sectionCount}>{comments.length}</Text></View>
        {comments.length === 0 ? <Text style={styles.empty}>Ainda não há comentários recentes.</Text> : comments.map((comment, index) => <View key={`${comment.user}-${index}`} style={styles.comment}><View style={styles.commentAvatar}><Text style={styles.commentInitial}>{comment.user.slice(0, 1).toUpperCase()}</Text></View><View style={[styles.commentCopy, phone.shrink]}><Text style={styles.commentUser}>{comment.user}</Text><Text style={[styles.commentText, !desktop && phone.description]}>{comment.text}</Text><Text style={[styles.commentDate, !desktop && phone.meta]}>{dateText(comment.submitted)}</Text></View></View>)}</>}
        {!desktop && mobileTab === 'about' && gameInformation}
      </View>
      {desktop && gameInformation}
    </View>
  </View>;
}

const phone = StyleSheet.create({
  main: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%' }, desktopSidebar: { width: 236, minWidth: 236, overflow: 'hidden' }, warning: { flexDirection: 'row', gap: 7, paddingHorizontal: 8, paddingVertical: 8 },
  shrink: { flex: 1, minWidth: 0 }, back: { minHeight: 44, alignSelf: 'flex-start', paddingRight: 16, marginBottom: 12 },
  hero: { minHeight: 220 }, heroImage: { opacity: .22 }, heroShade: { backgroundColor: 'rgba(17,19,27,.65)' }, heroContent: { padding: 16, alignItems: 'flex-start' }, boxArt: { width: 64, height: 90, marginRight: 12 },
  gameTitle: { fontSize: 21, lineHeight: 27 }, gameInfo: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  progressRow: { flexDirection: 'column', alignItems: 'stretch', gap: 8, marginTop: 14 }, track: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height: 7 }, percent: { marginLeft: 0, fontSize: 12 },
  tabs: { flexDirection: 'row', borderRadius: 14, padding: 5, gap: 5, backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#303647', marginTop: 16 },
  tab: { flex: 1, minHeight: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive: { backgroundColor: '#302c36' }, tabText: { color: '#9ca5bb', fontSize: 13, fontWeight: '800' }, tabTextActive: { color: '#ffe36d' },
  stats: { gap: 10, padding: 14 }, stat: { flex: 1, minWidth: 0 }, statValue: { fontSize: 14, lineHeight: 20, maxWidth: undefined }, statLabel: { fontSize: 9, letterSpacing: .5 },
  achievement: { padding: 13, borderRadius: 16, marginBottom: 10 }, badge: { width: 46, height: 46, marginRight: 12 }, achievementTop: { flexWrap: 'wrap' },
  achievementTitle: { fontSize: 14, lineHeight: 20 }, points: { fontSize: 12, lineHeight: 20 }, description: { fontSize: 13, lineHeight: 20, color: '#bbc2d2', marginTop: 6 }, meta: { fontSize: 11, lineHeight: 17, color: '#929db3', marginTop: 7 },
  empty: { padding: 24, backgroundColor: '#1b1e29', borderRadius: 16, alignItems: 'center', gap: 10 }, emptyText: { color: '#aeb5c7', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  sidebar: { width: '100%', minWidth: 0, padding: 16, backgroundColor: '#1b1e29', borderColor: '#303647', borderWidth: 1, borderRadius: 18, marginTop: 16, overflow: 'hidden' },
  art: { height: 240, backgroundColor: '#151822', borderRadius: 12 }, warningText: { fontSize: 11, lineHeight: 16, textAlign: 'center', flexShrink: 1 },
  facts: { backgroundColor: '#151822', borderColor: '#303647', borderRadius: 12 }, fact: { minHeight: 48, paddingVertical: 10, gap: 10, borderBottomColor: '#303647' },
  factLabel: { width: 90, marginRight: 0, fontSize: 12, textAlign: 'left', color: '#9ca5bb' }, factValue: { fontSize: 12, lineHeight: 19, color: '#e2e6f0' },
  resourcesTitle: { fontSize: 14, marginTop: 22, marginBottom: 10, color: '#f3f4f9' }, resource: { minHeight: 48, borderRadius: 10, borderColor: '#353c50', backgroundColor: '#222737', marginBottom: 8 }, resourceText: { fontSize: 12, lineHeight: 18, color: '#ffe36d' },
});

const styles = StyleSheet.create({
  page: { paddingTop: 18 }, layout: {}, layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 }, main: { flex: 1, minWidth: 0 }, state: { paddingTop: 84, alignItems: 'center' }, muted: { color: '#aeb5c7', marginTop: 12 }, retry: { marginTop: 14, padding: 11, backgroundColor: '#ffe36d', borderRadius: 9 }, retryText: { color: '#28220a', fontWeight: '900' }, back: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 }, backText: { color: '#ffe36d', fontSize: 13, fontWeight: '800' },
  hero: { minHeight: 230, borderRadius: 18, overflow: 'hidden', backgroundColor: '#252a38', justifyContent: 'flex-end' }, heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: .65 }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,12,19,.45)' }, heroContent: { padding: 16, flexDirection: 'row', alignItems: 'flex-end' }, boxArt: { height: 118, width: 86, borderRadius: 8, backgroundColor: '#373d4e', marginRight: 14 }, heroCopy: { flex: 1 }, console: { color: '#ffe36d', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, gameTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 4 }, gameInfo: { color: '#d4d8e4', fontSize: 11, marginTop: 5 }, progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 }, track: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#515869' }, fill: { height: '100%', borderRadius: 4, backgroundColor: '#ffe36d' }, percent: { color: '#fff', fontWeight: '800', fontSize: 11, marginLeft: 9 },
  subsets: { backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#303647', borderRadius: 14, marginTop: 12, paddingTop: 12, overflow: 'hidden' }, subsetsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 13, marginBottom: 9 }, subsetsTitle: { color: '#f4f5f9', fontSize: 15, fontWeight: '900' }, subsetsHint: { color: '#8c95aa', fontSize: 10 }, subsetsList: { paddingHorizontal: 10, paddingBottom: 11, gap: 9 }, subsetCard: { width: 248, minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: '#151821', borderLeftWidth: 3, borderLeftColor: '#e1c500', borderRadius: 7, padding: 8, gap: 9 }, subsetImage: { width: 49, height: 49, borderRadius: 5, backgroundColor: '#303646' }, subsetCopy: { flex: 1 }, subsetTitle: { color: '#e5e8f0', fontSize: 12, lineHeight: 16, fontWeight: '800' }, subsetMeta: { color: '#e1c500', fontSize: 10, marginTop: 4, fontWeight: '700' },
  stats: { borderRadius: 14, borderWidth: 1, borderColor: '#2d3343', backgroundColor: '#1b1e29', marginTop: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between' }, statValue: { color: '#f2f4f9', fontSize: 13, fontWeight: '900', maxWidth: 110 }, statLabel: { color: '#80899f', fontSize: 9, fontWeight: '800', marginTop: 5 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 11 }, sectionTitle: { color: '#f4f5f9', fontSize: 19, fontWeight: '900' }, sectionCount: { color: '#8d96aa', fontSize: 11 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }, filter: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, backgroundColor: '#242936', flexDirection: 'row', alignItems: 'center', gap: 7 }, filterActive: { backgroundColor: '#ffe36d' }, filterText: { color: '#c6ccdc', fontSize: 11, fontWeight: '800' }, filterTextActive: { color: '#28220a' },
  achievement: { minHeight: 82, borderRadius: 13, backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#2c3142', padding: 11, flexDirection: 'row', marginBottom: 8 }, achievementEarned: { borderColor: '#59522f' }, badge: { width: 52, height: 52, borderRadius: 9, backgroundColor: '#303646', marginRight: 11 }, badgeLocked: { opacity: .38 }, achievementCopy: { flex: 1 }, achievementTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, achievementTitle: { color: '#f3f4f8', fontSize: 13, fontWeight: '900', flex: 1 }, points: { color: '#ffe36d', fontSize: 11, fontWeight: '900' }, description: { color: '#abb2c3', fontSize: 11, marginTop: 4, lineHeight: 15 }, achievementMeta: { color: '#7e879b', fontSize: 10, marginTop: 5 },
  playerCard: { backgroundColor: '#1b1e29', borderRadius: 13, borderWidth: 1, borderColor: '#2c3142', padding: 12, flexDirection: 'row', alignItems: 'center' }, playerAvatar: { height: 36, width: 36, borderRadius: 18, backgroundColor: '#8764e8', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, playerInitial: { color: '#fff', fontWeight: '900' }, playerName: { color: '#f3f4f8', fontWeight: '900', fontSize: 13 }, playerMeta: { color: '#929aae', fontSize: 11, marginTop: 3 }, empty: { color: '#929aae', fontSize: 12, padding: 15, borderRadius: 12, backgroundColor: '#1b1e29' }, comment: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#292e3e', paddingVertical: 12 }, commentAvatar: { height: 30, width: 30, borderRadius: 15, backgroundColor: '#33394c', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, commentInitial: { color: '#e0e4ef', fontWeight: '900', fontSize: 11 }, commentCopy: { flex: 1 }, commentUser: { color: '#f1f3f8', fontWeight: '800', fontSize: 12 }, commentText: { color: '#aeb5c7', fontSize: 12, marginTop: 4, lineHeight: 17 }, commentDate: { color: '#727b91', fontSize: 10, marginTop: 5 },
});

const rail = StyleSheet.create({
  sidebar: { width: 212, backgroundColor: '#171717', borderRadius: 7, padding: 8 }, art: { width: '100%', height: 238, backgroundColor: '#252525', borderRadius: 2 }, warning: { minHeight: 38, marginTop: 12, borderRadius: 8, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#292929' }, warningText: { color: '#aeb0b6', fontSize: 10, fontWeight: '700' }, facts: { marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#343434', borderRadius: 7, backgroundColor: '#1d1d1d' }, fact: { minHeight: 33, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' }, factLast: { borderBottomWidth: 0 }, factLabel: { width: 78, color: '#36a8ff', fontSize: 10, textAlign: 'right', marginRight: 13 }, factValue: { flex: 1, color: '#e1c500', fontSize: 10, fontWeight: '700', lineHeight: 14 }, resourcesTitle: { color: '#b7bac3', fontSize: 11, fontWeight: '800', marginTop: 15, marginBottom: 6, marginLeft: 2 }, resource: { minHeight: 36, borderRadius: 4, borderWidth: 1, borderColor: '#414141', backgroundColor: '#141414', paddingHorizontal: 11, marginBottom: 5, flexDirection: 'row', alignItems: 'center', gap: 9 }, resourceText: { color: '#e1c500', fontSize: 11, fontWeight: '700', flex: 1 },
});
