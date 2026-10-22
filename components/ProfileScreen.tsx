import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { getAllUserGameProgress, getUserAwards, getUserProfile, getUserRecentAchievements, RecentAchievement, UserAward, UserGameProgress, UserProfile } from '../src/retroachievements';

type Props = { apiKey: string; username: string; onOpenSettings: () => void; onOpenGame: (game: UserGameProgress) => void; onApiAvailabilityChange?: (available: boolean) => void };
const media = (value: string) => value ? (value.startsWith('http') ? value : `https://media.retroachievements.org${value.startsWith('/') ? value : `/${value}`}`) : '';
const date = (value: string) => value ? new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(value)) : '—';

export function ProfileScreen({ apiKey, username, onOpenSettings, onOpenGame, onApiAvailabilityChange }: Props) {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const mobile = !desktop;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<UserGameProgress[]>([]);
  const [awards, setAwards] = useState<RecentAchievement[]>([]);
  const [gameAwards, setGameAwards] = useState<UserAward[]>([]);
  const [openRecentGame, setOpenRecentGame] = useState<number | null>(null);
  const [loading, setLoading] = useState(Boolean(apiKey));
  const [failed, setFailed] = useState(false);
  const refresh = useCallback(async () => {
    if (!apiKey || !username) { setLoading(false); return; }
    setLoading(true); setFailed(false);
    try { const [user, progress, recent, userAwards] = await Promise.all([getUserProfile(apiKey, username), getAllUserGameProgress(apiKey, username), getUserRecentAchievements(apiKey, username), getUserAwards(apiKey, username)]); setProfile(user); setGames(progress); setAwards(recent); setGameAwards(userAwards); onApiAvailabilityChange?.(true); }
    catch { setFailed(true); } finally { setLoading(false); }
  }, [apiKey, username]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (!failed) return; const timer = setTimeout(refresh, 8000); return () => clearTimeout(timer); }, [failed, refresh]);
  useEffect(() => { if (failed && !profile) onOpenSettings(); }, [failed, onOpenSettings, profile]);
  const totals = useMemo(() => { const mastered = games.filter((g) => g.maxPossible > 0 && g.numAwarded >= g.maxPossible).length; const unlocked = games.reduce((n, g) => n + g.numAwarded, 0); const possible = games.reduce((n, g) => n + g.maxPossible, 0); return { mastered, unlocked, possible, percent: possible ? Math.round(unlocked / possible * 100) : 0 }; }, [games]);
  const recentGames = useMemo(() => [...games].sort((a, b) => b.mostRecentAwardedDate.localeCompare(a.mostRecentAwardedDate)).slice(0, 8), [games]);
  const openAward = (award: RecentAchievement) => onOpenGame({ gameId: award.gameId, title: award.gameTitle, imageIcon: award.gameIcon, consoleName: award.consoleName, numAwarded: 0, maxPossible: 0, possibleScore: 0, mostRecentAwardedDate: award.date });
  if (!apiKey) return <View style={[styles.page, mobile && phone.page]}><Text style={styles.title}>Perfil</Text><Pressable onPress={onOpenSettings} style={styles.connect}><Feather name="key" size={16} color="#ffe36d" /><Text style={[styles.connectText, phone.connectText]}>Conecte sua conta para carregar seu perfil.</Text></Pressable></View>;
  if (loading && !profile) return <View style={styles.state}><ActivityIndicator color="#ffe36d" /><Text style={styles.muted}>Carregando perfil…</Text></View>;
  if (failed && !profile) return <View style={styles.state}><Text style={styles.muted}>Não foi possível carregar o perfil.</Text><Pressable onPress={refresh} style={styles.retry}><Text style={styles.retryText}>Tentar agora</Text></Pressable></View>;
  return <View style={[styles.page, mobile && phone.page]}>
    <View style={[styles.header, mobile && phone.header]}>
      <View style={[styles.identity, mobile && phone.identity]}>
        {profile?.avatar ? <Image source={{ uri: media(profile.avatar) }} style={[styles.avatar, mobile && phone.avatar]} /> : <View style={[styles.avatarFallback, mobile && phone.avatar]}><Text style={styles.avatarText}>{username.slice(0, 1).toUpperCase()}</Text></View>}
        <View style={styles.identityCopy}>
          <Text numberOfLines={1} style={[styles.username, mobile && phone.username]}>{profile?.username || username}</Text>
          <Text style={[styles.member, mobile && phone.member]}>RetroAchievements player</Text>
          {desktop && <><PlayingNow game={recentGames[0]} /><View style={styles.presence}><View style={styles.online} /><Text numberOfLines={1} style={styles.presenceText}>{profile?.richPresence || 'Sem rich presence no momento'}</Text></View></>}
        </View>
        {mobile && <Pressable accessibilityRole="button" accessibilityLabel="Atualizar perfil" disabled={loading} onPress={refresh} style={phone.refresh}>{loading ? <ActivityIndicator size="small" color="#ffe36d" /> : <Feather name="refresh-cw" size={19} color="#ffe36d" />}</Pressable>}
      </View>
      {mobile && <View style={phone.presenceCard}><PlayingNow game={recentGames[0]} /><View style={[styles.presence, phone.presence]}><View style={styles.online} /><Text style={[styles.presenceText, phone.presenceText]}>{profile?.richPresence || 'Sem rich presence no momento'}</Text></View></View>}
      {desktop && <Pressable onPress={refresh} style={styles.refresh}><Feather name="refresh-cw" size={14} color="#25210a" /><Text style={styles.refreshText}>ATUALIZAR</Text></Pressable>}
    </View>
    <View style={[styles.columns, desktop && styles.columnsDesktop]}><View style={styles.main}>
      <UserStatsPanel profile={profile} games={games} unlocked={totals.unlocked} mastered={totals.mastered} />
      <Text style={[styles.section, mobile && phone.section]}>Status de Progressão</Text><View style={[styles.statusCard, mobile && phone.statusCard]}><View style={[styles.statusLine, mobile && phone.statusLine]}><Text style={[styles.miniLabel, mobile && phone.miniLabel]}>GERAL</Text><Text style={[styles.miniValue, mobile && phone.miniValue]}>{totals.unlocked.toLocaleString()} / {totals.possible.toLocaleString()} conquistas</Text></View><View style={[styles.track, mobile && phone.track]}><View style={[styles.fill, { width: `${totals.percent}%` }]} /></View><View style={styles.metrics}><Metric value={games.length} label="JOGOS JOGADOS" /><Metric value={totals.mastered} label="MASTERIZADOS" /><Metric value={`${totals.percent}%`} label="COMPLETO" /></View></View>
      <Text style={[styles.section, mobile && phone.section]}>Últimos Jogos Jogados</Text><View style={[styles.list, mobile && phone.list]}>{recentGames.map((game) => <ProfileGameFolder key={game.gameId} game={game} awards={awards.filter((award) => award.gameId === game.gameId)} open={openRecentGame === game.gameId} onToggle={() => setOpenRecentGame(openRecentGame === game.gameId ? null : game.gameId)} onOpen={() => onOpenGame(game)} />)}</View>{!recentGames.length && <Text style={styles.empty}>Ainda não há jogos com progresso.</Text>}
    </View><View style={[styles.side, desktop && styles.sideDesktop]}>
      <Text style={[styles.section, mobile && phone.section]}>Game Awards</Text><View style={[styles.badgeGrid, mobile && phone.badgeGrid]}>{gameAwards.slice(0, 36).map((award, index) => <Pressable accessibilityRole="button" accessibilityLabel={award.title} key={`${award.gameId}-${award.awardedAt}-${index}`} onPress={() => onOpenGame({ gameId: award.gameId, title: award.title, imageIcon: award.imageIcon, consoleName: award.consoleName, numAwarded: 0, maxPossible: 0, possibleScore: 0, mostRecentAwardedDate: award.awardedAt })} style={[styles.gridBadge, { width: 42, height: 42 }, mobile && phone.gridBadge]}><Feather name="award" size={18} color="#ffe36d" /><Image source={{ uri: media(award.imageIcon) }} style={styles.gridImage} /></Pressable>)}</View>
      <Text style={[styles.section, mobile && phone.section]}>Progresso Recente</Text><View style={[styles.activity, mobile && phone.list]}>{awards.slice(0, 7).map((award, index) => <Pressable accessibilityRole="button" key={`${award.title}-${index}`} onPress={() => openAward(award)} style={[styles.activityRow, mobile && phone.activityRow]}><View style={styles.dot} /><View style={styles.activityCopy}><Text numberOfLines={2} style={[styles.activityTitle, mobile && phone.activityTitle]}>{award.title}</Text><Text numberOfLines={1} style={[styles.activityGame, mobile && phone.activityGame]}>{award.gameTitle}</Text></View><Text style={[styles.activityDate, mobile && phone.activityDate]}>{date(award.date)}</Text></Pressable>)}</View>{!awards.length && <Text style={styles.empty}>Nenhuma conquista recente.</Text>}
    </View></View>
  </View>;
}

function Metric({ value, label }: { value: string | number; label: string }) { const mobile = useWindowDimensions().width < 900; return <View style={styles.metric}><Text style={[styles.metricValue, mobile && phone.metricValue]}>{value}</Text><Text style={[styles.metricLabel, mobile && phone.metricLabel]}>{label}</Text></View>; }
function GameIcon({ icon }: { icon: string }) { return <View style={styles.gameIcon}><MaterialCommunityIcons name="gamepad-variant" size={23} color="#ffe36d" />{!!icon && <Image source={{ uri: media(icon) }} style={styles.gameImage} />}</View>; }
function PlayingNow({ game }: { game?: UserGameProgress }) { const mobile = useWindowDimensions().width < 900; if (!game?.title) return null; return <View style={[playing.row, mobile && phone.playing]}>{game.imageIcon ? <Image source={{ uri: media(game.imageIcon) }} style={[playing.icon, mobile && phone.playingIcon]} /> : <Feather name="monitor" size={16} color="#ffe36d" />}<Text numberOfLines={mobile ? 3 : 1} style={[playing.text, mobile && phone.playingText]}>Última vez visto em: {game.title}</Text></View>; }
function UserStatsPanel({ profile, games, unlocked, mastered }: { profile: UserProfile | null; games: UserGameProgress[]; unlocked: number; mastered: number }) {
  const mobile = useWindowDimensions().width < 900;
  const consoles = Object.values(games.reduce<Record<string, { name: string; active: number; mastered: number }>>((all, game) => { const entry = all[game.consoleName] ?? { name: game.consoleName, active: 0, mastered: 0 }; entry.active += game.numAwarded > 0 ? 1 : 0; entry.mastered += game.maxPossible > 0 && game.numAwarded >= game.maxPossible ? 1 : 0; all[game.consoleName] = entry; return all; }, {})).sort((a, b) => b.active - a.active).slice(0, 3);
  const ratio = profile?.totalPoints ? (profile.totalTruePoints / profile.totalPoints).toFixed(2) : '0.00';
  return <View style={[statsV2.wrap, mobile && phone.statsWrap]}>
    <View style={statsV2.header}><View style={statsV2.headerIcon}><Feather name="bar-chart-2" size={16} color="#00aaff" /></View><View><Text style={statsV2.title}>User Stats</Text><Text style={[statsV2.headerCaption, mobile && phone.caption]}>VISÃO GERAL DA CONTA</Text></View></View>
    <Text style={[statsV2.kicker, mobile && phone.kicker]}>PLAYER STATS</Text>
    <View style={statsV2.columns}>
      <View style={statsV2.column}><StatLineV2 label="Pontos" value={profile?.totalPoints.toLocaleString() ?? '0'} /><StatLineV2 label="Conquistas desbloqueadas" value={unlocked.toLocaleString()} /><StatLineV2 label="RetroRatio" value={ratio} /></View>
      <View style={[statsV2.column, statsV2.columnLast]}><StatLineV2 label="Pontos casual" value={profile?.totalSoftcorePoints.toLocaleString() ?? '0'} /><StatLineV2 label="Masterizados" value={mastered.toLocaleString()} /><StatLineV2 label="Jogos jogados" value={games.length.toLocaleString()} /></View>
    </View>
    <View style={statsV2.divider} />
    <View style={[statsV2.progressHeader, mobile && phone.progressHeader]}><Text style={[statsV2.progressTitle, mobile && phone.progressTitle]}>Progression Status</Text><Text style={[statsV2.progressCaption, mobile && phone.caption]}>{consoles.length} consoles</Text></View>
    <View style={[statsV2.legend, mobile && phone.legend]}><Text style={[statsV2.progressing, mobile && phone.legendText]}>● Em progresso</Text><Text style={[statsV2.mastered, mobile && phone.legendText]}>● Masterizados</Text></View>
    <View style={statsV2.progressCard}>
      {consoles.map((console) => {
        const percent = console.active ? Math.min(100, console.mastered / console.active * 100) : 0;
        return mobile ? <View key={console.name} style={phone.consoleRow}>
          <View style={phone.consoleHeading}><View style={statsV2.consoleDot} /><Text numberOfLines={2} style={phone.consoleName}>{console.name}</Text><Text style={phone.consoleValue}>{console.active} jogos</Text></View>
          <View style={phone.consoleProgress}><View style={[statsV2.consoleTrack, phone.consoleTrack]}><View style={[statsV2.consoleFill, { width: `${percent}%` }]} /></View><View style={phone.consoleAward}><Feather name="award" size={14} color="#ffe36d" /><Text style={phone.consoleMastered}>{console.mastered}</Text></View></View>
        </View> : <View key={console.name} style={statsV2.consoleRow}><View style={statsV2.consoleDot} /><Text numberOfLines={1} style={statsV2.consoleName}>{console.name}</Text><Text style={statsV2.consoleValue}>{console.active} jogos</Text><View style={statsV2.consoleTrack}><View style={[statsV2.consoleFill, { width: `${percent}%` }]} /></View><Text style={statsV2.consoleMastered}>{console.mastered}</Text></View>;
      })}
      {!consoles.length && <Text style={statsV2.empty}>Nenhum progresso encontrado.</Text>}
    </View>
  </View>;
}
function StatLine({ label, value }: { label: string; value: string }) { return <View style={userStats.statLine}><Text style={userStats.statLabel}>{label}</Text><Text style={userStats.dots}>··········</Text><Text style={userStats.statValue}>{value}</Text></View>; }
function StatLineV2({ label, value }: { label: string; value: string }) { const mobile = useWindowDimensions().width < 900; return <View style={[statsV2.stat, mobile && phone.stat]}><Text style={[statsV2.statLabel, mobile && phone.statLabel]}>{label}</Text><Text style={[statsV2.statValue, mobile && phone.statValue]}>{value}</Text></View>; }
function ProfileGameFolder({ game, awards, open, onToggle, onOpen }: { game: UserGameProgress; awards: RecentAchievement[]; open: boolean; onToggle: () => void; onOpen: () => void }) {
  const mobile = useWindowDimensions().width < 900;
  const percent = game.maxPossible ? Math.round(game.numAwarded / game.maxPossible * 100) : 0;
  return <View><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={[folder.row, mobile && phone.folderRow]}><GameIcon icon={game.imageIcon} /><View style={folder.copy}><View style={styles.gameTitleLine}><Text numberOfLines={mobile ? 2 : 1} style={[styles.gameTitle, mobile && phone.gameTitle]}>{game.title}</Text>{percent === 100 && <Feather name="award" size={15} color="#ffe36d" />}</View><Text numberOfLines={mobile ? 2 : 1} style={[styles.console, mobile && phone.console]}>{game.consoleName} · {game.numAwarded}/{game.maxPossible} conquistas</Text><View style={[styles.smallTrack, mobile && phone.smallTrack]}><View style={[styles.smallFill, { width: `${percent}%` }]} /></View></View><View style={styles.gameRight}><Text style={[styles.percent, mobile && phone.percent]}>{percent}%</Text><Feather name={open ? 'chevron-down' : 'chevron-right'} size={18} color="#9099ac" /></View></Pressable>{open && <View style={[folder.content, mobile && phone.folderContent]}><Pressable accessibilityRole="button" onPress={onOpen} style={[folder.openButton, mobile && phone.openButton]}><Feather name="external-link" size={15} color="#28220a" /><Text style={[folder.openText, mobile && phone.openText]}>Abrir página do jogo</Text></Pressable>{awards.length ? awards.slice(0, 4).map((award, index) => <View key={`${award.title}-${index}`} style={[folder.award, mobile && phone.award]}><View style={[folder.awardBadge, mobile && phone.awardBadge]}><Feather name="award" size={14} color="#ffe36d" />{!!award.badgeUrl && <Image source={{ uri: media(award.badgeUrl) }} style={folder.awardImage} />}</View><View style={folder.awardCopy}><Text numberOfLines={mobile ? 2 : 1} style={[folder.awardTitle, mobile && phone.awardTitle]}>{award.title} <Text style={folder.awardPoints}>+{award.points}</Text></Text><Text numberOfLines={mobile ? 2 : 1} style={[folder.awardDescription, mobile && phone.awardDescription]}>{award.description}</Text></View></View>) : <Text style={[folder.empty, mobile && phone.empty]}>Sem conquistas recentes neste jogo.</Text>}</View>}</View>;
}
function GameRow({ game, onPress }: { game: UserGameProgress; onPress: () => void }) { const percent = game.maxPossible ? Math.round(game.numAwarded / game.maxPossible * 100) : 0; return <Pressable onPress={onPress} style={styles.gameRow}><GameIcon icon={game.imageIcon} /><View style={styles.gameCopy}><View style={styles.gameTitleLine}><Text numberOfLines={1} style={styles.gameTitle}>{game.title}</Text>{percent === 100 && <Feather name="award" size={13} color="#ffe36d" />}</View><Text numberOfLines={1} style={styles.console}>{game.consoleName}</Text><View style={styles.smallTrack}><View style={[styles.smallFill, { width: `${percent}%` }]} /></View></View><View style={styles.gameRight}><Text style={styles.percent}>{percent}%</Text><Text style={styles.gameCount}>{game.numAwarded}/{game.maxPossible}</Text></View></Pressable>; }

const folder = StyleSheet.create({ row: { minHeight: 64, padding: 8, borderBottomWidth: 1, borderBottomColor: '#303647', flexDirection: 'row', alignItems: 'center', gap: 8 }, copy: { flex: 1, minWidth: 0 }, content: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#303647', backgroundColor: '#171923' }, openButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5, backgroundColor: '#ffe36d', marginBottom: 6 }, openText: { color: '#28220a', fontSize: 9, fontWeight: '900' }, award: { minHeight: 48, marginTop: 5, padding: 6, borderRadius: 5, backgroundColor: '#202331', flexDirection: 'row', alignItems: 'center', gap: 7 }, awardBadge: { width: 31, height: 31, borderRadius: 4, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#302d42' }, awardImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, awardCopy: { flex: 1, minWidth: 0 }, awardTitle: { color: '#e9edf5', fontSize: 10, fontWeight: '900' }, awardPoints: { color: '#ffe36d' }, awardDescription: { color: '#98a1b5', fontSize: 9, marginTop: 2 }, empty: { color: '#858fa3', fontSize: 9, paddingVertical: 5 } });
const playing = StyleSheet.create({ row: { height: 20, marginTop: 5, paddingHorizontal: 5, borderRadius: 4, backgroundColor: '#28263b', flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', maxWidth: '100%' }, icon: { height: 14, width: 14, borderRadius: 2 }, text: { color: '#ffe36d', fontSize: 9, fontWeight: '800', flexShrink: 1 } });
const statsV2 = StyleSheet.create({ wrap: { marginTop: 12, padding: 13, borderRadius: 10, borderWidth: 1, borderColor: '#343b4f', backgroundColor: '#1c1f2b' }, header: { flexDirection: 'row', alignItems: 'center', gap: 8 }, headerIcon: { height: 31, width: 31, borderRadius: 8, backgroundColor: '#20283b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#304a68' }, title: { color: '#f1f5ff', fontSize: 17, fontWeight: '900' }, headerCaption: { color: '#78839a', fontSize: 8, fontWeight: '900', letterSpacing: .7, marginTop: 1 }, kicker: { color: '#00aaff', fontSize: 9, fontWeight: '900', marginTop: 14, marginBottom: 6, letterSpacing: .5 }, columns: { flexDirection: 'row', borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#32394b', backgroundColor: '#171923' }, column: { flex: 1, minWidth: 0, paddingHorizontal: 9, paddingVertical: 4 }, columnLast: { borderLeftWidth: 1, borderLeftColor: '#32394b' }, stat: { minHeight: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, borderBottomWidth: 1, borderBottomColor: '#282e3d' }, statLabel: { color: '#aeb7c8', fontSize: 9, fontWeight: '700', flex: 1 }, statValue: { color: '#00aaff', fontSize: 10, fontWeight: '900' }, divider: { height: 1, backgroundColor: '#363c4b', marginTop: 15 }, progressHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12 }, progressTitle: { color: '#f1f5ff', fontSize: 16, fontWeight: '900' }, progressCaption: { color: '#778197', fontSize: 9 }, legend: { flexDirection: 'row', gap: 14, marginTop: 6, marginBottom: 7 }, progressing: { color: '#d7dce7', fontSize: 9, fontWeight: '800' }, mastered: { color: '#ffe36d', fontSize: 9, fontWeight: '800' }, progressCard: { borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#3b4151', backgroundColor: '#171923' }, consoleRow: { minHeight: 33, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: '#303647' }, consoleDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#00aaff' }, consoleName: { width: 106, color: '#dbe2ef', fontSize: 9, fontWeight: '900' }, consoleValue: { width: 42, color: '#aeb7c8', fontSize: 8, textAlign: 'right' }, consoleTrack: { flex: 1, height: 8, overflow: 'hidden', borderRadius: 3, backgroundColor: '#343a4a', borderWidth: 1, borderColor: '#555b6b' }, consoleFill: { height: '100%', backgroundColor: '#e1c500' }, consoleMastered: { width: 21, color: '#ffe36d', fontSize: 10, fontWeight: '900', textAlign: 'right' }, empty: { color: '#8993a7', padding: 8, fontSize: 9 } });
const userStats = StyleSheet.create({ wrap: { marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#303647', backgroundColor: '#1c1f2b' }, title: { color: '#00aaff', fontSize: 15, fontWeight: '900', marginTop: 5 }, subTitle: { color: '#00aaff', fontSize: 9, fontWeight: '900', marginTop: 12, marginBottom: 5 }, table: { padding: 7, borderRadius: 4, backgroundColor: '#171923' }, statLine: { minHeight: 19, flexDirection: 'row', alignItems: 'center' }, statLabel: { color: '#c6ccda', fontSize: 9, fontWeight: '700' }, dots: { flex: 1, color: '#515768', fontSize: 8, textAlign: 'right', marginHorizontal: 5 }, statValue: { color: '#00aaff', fontSize: 10, fontWeight: '900', minWidth: 54, textAlign: 'right' }, legend: { flexDirection: 'row', gap: 12, marginTop: 7, marginBottom: 5 }, legendIdle: { color: '#b9c0d0', fontSize: 9, fontWeight: '800' }, legendMastered: { color: '#ffe36d', fontSize: 9, fontWeight: '800' }, progressCard: { borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#303647' }, consoleRow: { minHeight: 28, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#303647' }, consoleName: { width: 105, color: '#dce1eb', fontSize: 9, fontWeight: '800' }, consoleValue: { width: 56, color: '#9ca5b8', fontSize: 8, textAlign: 'right' }, consoleTrack: { flex: 1, height: 6, backgroundColor: '#333847', overflow: 'hidden', borderRadius: 3 }, consoleFill: { height: '100%', backgroundColor: '#ffe36d' }, consoleMastered: { width: 17, color: '#ffe36d', fontSize: 9, fontWeight: '900', textAlign: 'right' }, empty: { color: '#8993a7', padding: 8, fontSize: 9 } });

const styles = StyleSheet.create({
  page: { marginTop: 22, paddingBottom: 30 }, state: { minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 10 }, muted: { color: '#969eb2', fontSize: 11 }, title: { color: '#f5f6fb', fontSize: 22, fontWeight: '900' }, header: { minHeight: 76, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#303647', backgroundColor: '#1c1f2b', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { height: 54, width: 54, borderRadius: 7, backgroundColor: '#303647' }, avatarFallback: { height: 54, width: 54, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8764e8' }, avatarText: { color: '#fff', fontSize: 20, fontWeight: '900' }, identityCopy: { flex: 1, minWidth: 0 }, username: { color: '#f4f5f9', fontSize: 17, fontWeight: '900' }, member: { color: '#8e97ab', fontSize: 9, marginTop: 2 }, presence: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }, online: { height: 7, width: 7, borderRadius: 4, backgroundColor: '#55db8c' }, presenceText: { color: '#c6ccda', fontSize: 10, flex: 1 }, refresh: { height: 29, paddingHorizontal: 8, borderRadius: 5, backgroundColor: '#ffe36d', flexDirection: 'row', alignItems: 'center', gap: 4 }, refreshText: { color: '#25210a', fontSize: 8, fontWeight: '900' },
  columns: { marginTop: 12, gap: 12 }, columnsDesktop: { flexDirection: 'row', alignItems: 'flex-start' }, main: { flex: 1, minWidth: 0 }, side: { width: '100%' }, sideDesktop: { width: 238, flexShrink: 0 }, section: { color: '#00aaff', fontSize: 11, fontWeight: '900', marginTop: 13, marginBottom: 6 }, statusCard: { padding: 9, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', borderRadius: 6 }, statusLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, miniLabel: { color: '#9aa4b8', fontSize: 8, fontWeight: '900' }, miniValue: { color: '#dce0ea', fontSize: 9 }, track: { height: 7, marginTop: 7, borderRadius: 3, backgroundColor: '#10121a', overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#e1c500' }, metrics: { flexDirection: 'row', marginTop: 9, borderTopWidth: 1, borderTopColor: '#303647', paddingTop: 8 }, metric: { flex: 1, alignItems: 'center' }, metricValue: { color: '#ffe36d', fontSize: 13, fontWeight: '900' }, metricLabel: { color: '#7d879c', fontSize: 7, fontWeight: '900', textAlign: 'center', marginTop: 3 },
  lastGame: { minHeight: 61, padding: 7, marginTop: 10, borderRadius: 6, borderWidth: 1, borderColor: '#3a4052', backgroundColor: '#222633', flexDirection: 'row', alignItems: 'center', gap: 8 }, lastCopy: { flex: 1, minWidth: 0 }, lastLabel: { color: '#aa98ee', fontSize: 8, fontWeight: '900' }, lastTitle: { color: '#f2f3f8', fontSize: 12, fontWeight: '900', marginTop: 3 }, list: { borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#303647', backgroundColor: '#1c1f2b' }, gameRow: { minHeight: 60, padding: 7, borderBottomWidth: 1, borderBottomColor: '#303647', flexDirection: 'row', alignItems: 'center', gap: 8 }, gameIcon: { height: 43, width: 43, borderRadius: 5, backgroundColor: '#302d42', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, gameImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, gameCopy: { flex: 1, minWidth: 0 }, gameTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 }, gameTitle: { flex: 1, color: '#e9edf5', fontSize: 11, fontWeight: '900' }, console: { color: '#8993a7', fontSize: 9, marginTop: 2 }, smallTrack: { height: 4, marginTop: 6, borderRadius: 2, overflow: 'hidden', backgroundColor: '#10121a' }, smallFill: { height: '100%', backgroundColor: '#e1c500' }, gameRight: { width: 36, alignItems: 'flex-end' }, percent: { color: '#ffe36d', fontSize: 10, fontWeight: '900' }, gameCount: { color: '#818ba0', fontSize: 8, marginTop: 3 },
  badgeGrid: { padding: 7, borderWidth: 1, borderColor: '#303647', borderRadius: 6, backgroundColor: '#1c1f2b', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, gridBadge: { height: 27, width: 27, borderRadius: 3, backgroundColor: '#302d42', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#41485d' }, gridImage: { ...StyleSheet.absoluteFill, width: undefined, height: undefined }, activity: { borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#303647', backgroundColor: '#1c1f2b' }, activityRow: { minHeight: 36, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#303647' }, dot: { height: 5, width: 5, borderRadius: 3, backgroundColor: '#00aaff' }, activityCopy: { flex: 1, minWidth: 0 }, activityTitle: { color: '#dfe4ef', fontSize: 9, fontWeight: '800' }, activityGame: { color: '#858fa3', fontSize: 8, marginTop: 1 }, activityDate: { color: '#7d8798', fontSize: 8 }, empty: { color: '#8993a7', fontSize: 10, padding: 8, borderWidth: 1, borderColor: '#303647', borderRadius: 6, backgroundColor: '#1c1f2b' }, connect: { minHeight: 58, marginTop: 15, padding: 13, borderRadius: 9, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', flexDirection: 'row', alignItems: 'center', gap: 9 }, connectText: { color: '#d9d0ff', fontSize: 12, fontWeight: '800' }, retry: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#ffe36d' }, retryText: { color: '#1c1b1c', fontWeight: '900', fontSize: 10 },
});

const phone = StyleSheet.create({
  page: { marginTop: 16, paddingBottom: 12 },
  header: { padding: 14, borderRadius: 18, flexDirection: 'column', alignItems: 'stretch', gap: 14 },
  identity: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%', gap: 12 },
  avatar: { height: 56, width: 56, borderRadius: 14 },
  username: { fontSize: 21, lineHeight: 27 },
  member: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  refresh: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#2b2936', borderWidth: 1, borderColor: '#494438', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  presenceCard: { padding: 12, borderRadius: 12, backgroundColor: '#141722', gap: 8 },
  playing: { height: 'auto', minHeight: 24, marginTop: 0, paddingHorizontal: 0, backgroundColor: 'transparent', alignItems: 'flex-start', gap: 7, alignSelf: 'stretch' },
  playingIcon: { width: 22, height: 22, borderRadius: 5 },
  playingText: { flex: 1, fontSize: 12, lineHeight: 18 },
  presence: { marginTop: 0, alignItems: 'flex-start', gap: 7 },
  presenceText: { fontSize: 12, lineHeight: 19 },
  connectText: { flex: 1, lineHeight: 19 },
  section: { fontSize: 16, lineHeight: 22, color: '#eef1fa', marginTop: 22, marginBottom: 10 },
  statsWrap: { marginTop: 0, borderRadius: 16, padding: 14 },
  caption: { fontSize: 10, lineHeight: 14 },
  kicker: { fontSize: 10, marginTop: 18, marginBottom: 9 },
  stat: { minHeight: 72, paddingVertical: 10, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 5 },
  statLabel: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', fontSize: 11, lineHeight: 15 },
  statValue: { fontSize: 17, lineHeight: 22, maxWidth: '100%', flexShrink: 1 },
  progressHeader: { flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  progressTitle: { fontSize: 15, lineHeight: 21 },
  legend: { flexWrap: 'wrap', gap: 10, marginTop: 10, marginBottom: 11 },
  legendText: { fontSize: 10, lineHeight: 15 },
  consoleRow: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#303647', gap: 9 },
  consoleHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  consoleName: { flex: 1, minWidth: 0, color: '#dbe2ef', fontSize: 12, lineHeight: 17, fontWeight: '800' },
  consoleValue: { color: '#aeb7c8', fontSize: 11, flexShrink: 0 },
  consoleProgress: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  consoleTrack: { height: 8, borderRadius: 4 },
  consoleAward: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 32, justifyContent: 'flex-end' },
  consoleMastered: { color: '#ffe36d', fontSize: 12, fontWeight: '900' },
  statusCard: { padding: 14, borderRadius: 16 },
  statusLine: { flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  miniLabel: { fontSize: 10 },
  miniValue: { fontSize: 11, lineHeight: 16, flexShrink: 1 },
  track: { height: 8, marginTop: 12, borderRadius: 4 },
  metricValue: { fontSize: 19, lineHeight: 25 },
  metricLabel: { fontSize: 9, lineHeight: 13, paddingHorizontal: 2 },
  list: { borderRadius: 16 },
  folderRow: { minHeight: 96, padding: 12, gap: 10 },
  gameTitle: { fontSize: 13, lineHeight: 18 },
  console: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  smallTrack: { height: 5, marginTop: 9 },
  percent: { fontSize: 12, lineHeight: 19, marginBottom: 5 },
  folderContent: { padding: 12 },
  openButton: { minHeight: 44, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, gap: 7, alignSelf: 'stretch', justifyContent: 'center', marginBottom: 8 },
  openText: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
  award: { minHeight: 68, padding: 9, borderRadius: 10, gap: 10, marginTop: 7 },
  awardBadge: { width: 40, height: 40, borderRadius: 7 },
  awardTitle: { fontSize: 12, lineHeight: 17 },
  awardDescription: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  empty: { fontSize: 12, lineHeight: 18, paddingVertical: 8 },
  badgeGrid: { padding: 12, borderRadius: 16, gap: 8, justifyContent: 'center' },
  gridBadge: { width: 48, height: 48, borderRadius: 9 },
  activityRow: { minHeight: 70, paddingHorizontal: 12, paddingVertical: 11, gap: 10 },
  activityTitle: { fontSize: 12, lineHeight: 18 },
  activityGame: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  activityDate: { fontSize: 10, maxWidth: 48, textAlign: 'right' },
});
