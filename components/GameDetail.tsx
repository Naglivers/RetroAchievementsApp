import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameComment, GameDetails, GameSubset, getGameComments, getGameDetails, getGameSubsets, UserGameProgress } from '../src/retroachievements';
import { AchievementOrder, AchievementSetPanel } from './AchievementSetPanel';
import { GameSidebar } from './GameSidebar';

const media = (path: string) => `https://media.retroachievements.org${path.startsWith('/') ? path : `/Badge/${path}.png`}`;
const dateText = (value: string) => value ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)) : '';
type Props = { game: UserGameProgress; apiKey: string; username: string; onBack: () => void };

export function GameDetail({ game, apiKey, username, onBack }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
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

  return <View style={styles.page}>
    <Pressable onPress={onBack} style={styles.back}><Feather name="arrow-left" size={18} color="#ffe36d" /><Text style={styles.backText}>Voltar para atividade</Text></Pressable>
    <View style={[styles.layout, desktop && styles.layoutDesktop]}>
      <View style={styles.main}>
        <View style={styles.hero}>
          {details.imageTitle ? <Image source={{ uri: media(details.imageTitle) }} style={styles.heroImage} /> : null}
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            {details.imageBoxArt ? <Image source={{ uri: media(details.imageBoxArt) }} style={styles.boxArt} /> : null}
            <View style={styles.heroCopy}>
              <Text style={styles.console}>{details.consoleName}</Text>
              <Text style={styles.gameTitle}>{details.title}</Text>
              <Text style={styles.gameInfo}>{[details.developer, details.publisher, details.released].filter(Boolean).join(' · ')}</Text>
              <View style={styles.progressRow}><View style={styles.track}><View style={[styles.fill, { width: `${completed}%` }]} /></View><Text style={styles.percent}>{details.numAwardedToUser}/{details.numAchievements} · {completed}%</Text></View>
            </View>
          </View>
        </View>

        <AchievementSetPanel
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

        <View style={styles.stats}><View><Text style={styles.statValue}>{details.numDistinctPlayers.toLocaleString()}</Text><Text style={styles.statLabel}>JOGADORES</Text></View><View><Text style={styles.statValue}>{playtime}</Text><Text style={styles.statLabel}>SEU TEMPO</Text></View><View><Text style={styles.statValue}>{details.genre || '—'}</Text><Text style={styles.statLabel}>GÊNERO</Text></View></View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Conquistas</Text><Text style={styles.sectionCount}>{achievements.length} exibidas</Text></View>
        {achievements.map((achievement) => { const earned = Boolean(achievement.dateEarned); return <View key={achievement.id} style={[styles.achievement, earned && styles.achievementEarned]}><Image source={{ uri: media(achievement.badgeUrl) }} style={[styles.badge, !earned && styles.badgeLocked]} /><View style={styles.achievementCopy}><View style={styles.achievementTop}><Text style={styles.achievementTitle}>{achievement.title}</Text><Text style={styles.points}>{achievement.points} pts</Text></View><Text style={styles.description}>{achievement.description}</Text><Text style={styles.achievementMeta}>{earned ? `Desbloqueada ${dateText(achievement.dateEarned)}${achievement.dateEarnedHardcore ? ' · Hardcore' : ''}` : `${achievement.numAwarded.toLocaleString()} jogadores · ${achievement.trueRatio} RP`}{missable(achievement.type) ? ' · Perdível' : ''}</Text></View></View>; })}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Jogadores recentes</Text><Text style={styles.sectionCount}>sua sessão</Text></View>
        <View style={styles.playerCard}><View style={styles.playerAvatar}><Text style={styles.playerInitial}>{username.slice(0, 1).toUpperCase()}</Text></View><View><Text style={styles.playerName}>{username}</Text><Text style={styles.playerMeta}>Seu progresso neste jogo · {details.userCompletion}</Text></View></View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Comentários</Text><Text style={styles.sectionCount}>{comments.length}</Text></View>
        {comments.length === 0 ? <Text style={styles.empty}>Ainda não há comentários recentes.</Text> : comments.map((comment, index) => <View key={`${comment.user}-${index}`} style={styles.comment}><View style={styles.commentAvatar}><Text style={styles.commentInitial}>{comment.user.slice(0, 1).toUpperCase()}</Text></View><View style={styles.commentCopy}><Text style={styles.commentUser}>{comment.user}</Text><Text style={styles.commentText}>{comment.text}</Text><Text style={styles.commentDate}>{dateText(comment.submitted)}</Text></View></View>)}
      </View>
      {desktop && <View style={rail.sidebar}>
        <Image source={{ uri: details.imageBoxArt ? media(details.imageBoxArt) : media(game.imageIcon) }} style={rail.art} />
        <View style={rail.warning}><Text style={rail.warningText}>◉  Alerta de Epilepsia Fotossensível</Text></View>
        <View style={rail.facts}>{[['Desenvolvedor', details.developer], ['Jogo base', game.title], ['Gênero', details.genre], ['Lançamento', details.released], ['Plataforma', details.consoleName], ['Progresso', details.userCompletion], ['Tempo de jogo', playtime], ['Jogadores', details.numDistinctPlayers.toLocaleString()]].map(([label, value], index) => <View key={label} style={[rail.fact, index === 7 && rail.factLast]}><Text style={rail.factLabel}>{label}</Text><Text style={rail.factValue}>{value || 'Não informado'}</Text></View>)}</View>
        <Text style={rail.resourcesTitle}>Recursos Essenciais</Text>
        <Pressable onPress={() => open(`https://retroachievements.org/game/${game.gameId}/hashes`)} style={rail.resource}><Feather name="file-text" size={14} color="#e1c500" /><Text style={rail.resourceText}>Hashes de Jogo Suportados</Text></Pressable>
        <Pressable onPress={() => open(`https://retroachievements.org/game/${game.gameId}`)} style={rail.resource}><Feather name="message-square" size={14} color="#e1c500" /><Text style={rail.resourceText}>Tópico de Fórum do Set Base</Text></Pressable>
        <Text style={rail.resourcesTitle}>Extras</Text>
        <Pressable onPress={() => open(`https://retroachievements.org/game/${game.gameId}`)} style={rail.resource}><Feather name="search" size={14} color="#e1c500" /><Text style={rail.resourceText}>Encontrar Jogos Relacionados</Text></Pressable>
        <GameSidebar apiKey={apiKey} gameId={details.id} />
      </View>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 18 }, layout: {}, layoutDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 }, main: { flex: 1, minWidth: 0 }, state: { paddingTop: 84, alignItems: 'center' }, muted: { color: '#aeb5c7', marginTop: 12 }, retry: { marginTop: 14, padding: 11, backgroundColor: '#ffe36d', borderRadius: 9 }, retryText: { color: '#28220a', fontWeight: '900' }, back: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 }, backText: { color: '#ffe36d', fontSize: 13, fontWeight: '800' },
  hero: { minHeight: 230, borderRadius: 18, overflow: 'hidden', backgroundColor: '#252a38', justifyContent: 'flex-end' }, heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: .65 }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,12,19,.45)' }, heroContent: { padding: 16, flexDirection: 'row', alignItems: 'flex-end' }, boxArt: { height: 118, width: 86, borderRadius: 8, backgroundColor: '#373d4e', marginRight: 14 }, heroCopy: { flex: 1 }, console: { color: '#ffe36d', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }, gameTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 4 }, gameInfo: { color: '#d4d8e4', fontSize: 11, marginTop: 5 }, progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 }, track: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden', backgroundColor: '#515869' }, fill: { height: '100%', borderRadius: 4, backgroundColor: '#ffe36d' }, percent: { color: '#fff', fontWeight: '800', fontSize: 11, marginLeft: 9 },
  subsets: { backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#303647', borderRadius: 14, marginTop: 12, paddingTop: 12, overflow: 'hidden' }, subsetsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 13, marginBottom: 9 }, subsetsTitle: { color: '#f4f5f9', fontSize: 15, fontWeight: '900' }, subsetsHint: { color: '#8c95aa', fontSize: 10 }, subsetsList: { paddingHorizontal: 10, paddingBottom: 11, gap: 9 }, subsetCard: { width: 248, minHeight: 70, flexDirection: 'row', alignItems: 'center', backgroundColor: '#151821', borderLeftWidth: 3, borderLeftColor: '#e1c500', borderRadius: 7, padding: 8, gap: 9 }, subsetImage: { width: 49, height: 49, borderRadius: 5, backgroundColor: '#303646' }, subsetCopy: { flex: 1 }, subsetTitle: { color: '#e5e8f0', fontSize: 12, lineHeight: 16, fontWeight: '800' }, subsetMeta: { color: '#e1c500', fontSize: 10, marginTop: 4, fontWeight: '700' },
  stats: { borderRadius: 14, borderWidth: 1, borderColor: '#2d3343', backgroundColor: '#1b1e29', marginTop: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between' }, statValue: { color: '#f2f4f9', fontSize: 13, fontWeight: '900', maxWidth: 110 }, statLabel: { color: '#80899f', fontSize: 9, fontWeight: '800', marginTop: 5 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 11 }, sectionTitle: { color: '#f4f5f9', fontSize: 19, fontWeight: '900' }, sectionCount: { color: '#8d96aa', fontSize: 11 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }, filter: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 9, backgroundColor: '#242936', flexDirection: 'row', alignItems: 'center', gap: 7 }, filterActive: { backgroundColor: '#ffe36d' }, filterText: { color: '#c6ccdc', fontSize: 11, fontWeight: '800' }, filterTextActive: { color: '#28220a' },
  achievement: { minHeight: 82, borderRadius: 13, backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#2c3142', padding: 11, flexDirection: 'row', marginBottom: 8 }, achievementEarned: { borderColor: '#59522f' }, badge: { width: 52, height: 52, borderRadius: 9, backgroundColor: '#303646', marginRight: 11 }, badgeLocked: { opacity: .38 }, achievementCopy: { flex: 1 }, achievementTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, achievementTitle: { color: '#f3f4f8', fontSize: 13, fontWeight: '900', flex: 1 }, points: { color: '#ffe36d', fontSize: 11, fontWeight: '900' }, description: { color: '#abb2c3', fontSize: 11, marginTop: 4, lineHeight: 15 }, achievementMeta: { color: '#7e879b', fontSize: 10, marginTop: 5 },
  playerCard: { backgroundColor: '#1b1e29', borderRadius: 13, borderWidth: 1, borderColor: '#2c3142', padding: 12, flexDirection: 'row', alignItems: 'center' }, playerAvatar: { height: 36, width: 36, borderRadius: 18, backgroundColor: '#8764e8', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, playerInitial: { color: '#fff', fontWeight: '900' }, playerName: { color: '#f3f4f8', fontWeight: '900', fontSize: 13 }, playerMeta: { color: '#929aae', fontSize: 11, marginTop: 3 }, empty: { color: '#929aae', fontSize: 12, padding: 15, borderRadius: 12, backgroundColor: '#1b1e29' }, comment: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#292e3e', paddingVertical: 12 }, commentAvatar: { height: 30, width: 30, borderRadius: 15, backgroundColor: '#33394c', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, commentInitial: { color: '#e0e4ef', fontWeight: '900', fontSize: 11 }, commentCopy: { flex: 1 }, commentUser: { color: '#f1f3f8', fontWeight: '800', fontSize: 12 }, commentText: { color: '#aeb5c7', fontSize: 12, marginTop: 4, lineHeight: 17 }, commentDate: { color: '#727b91', fontSize: 10, marginTop: 5 },
});

const rail = StyleSheet.create({
  sidebar: { width: 212, backgroundColor: '#171717', borderRadius: 7, padding: 8 }, art: { width: '100%', height: 238, resizeMode: 'contain', backgroundColor: '#252525', borderRadius: 2 }, warning: { minHeight: 38, marginTop: 12, borderRadius: 8, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#292929' }, warningText: { color: '#aeb0b6', fontSize: 10, fontWeight: '700' }, facts: { marginTop: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#343434', borderRadius: 7, backgroundColor: '#1d1d1d' }, fact: { minHeight: 33, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' }, factLast: { borderBottomWidth: 0 }, factLabel: { width: 78, color: '#36a8ff', fontSize: 10, textAlign: 'right', marginRight: 13 }, factValue: { flex: 1, color: '#e1c500', fontSize: 10, fontWeight: '700', lineHeight: 14 }, resourcesTitle: { color: '#b7bac3', fontSize: 11, fontWeight: '800', marginTop: 15, marginBottom: 6, marginLeft: 2 }, resource: { minHeight: 36, borderRadius: 4, borderWidth: 1, borderColor: '#414141', backgroundColor: '#141414', paddingHorizontal: 11, marginBottom: 5, flexDirection: 'row', alignItems: 'center', gap: 9 }, resourceText: { color: '#e1c500', fontSize: 11, fontWeight: '700', flex: 1 },
});
