import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { getAppLanguage, getTranslation } from '../src/i18n';
import { getAllUserGameProgress, getUserGamePoints, getUserRecentAchievements, RecentAchievement, UserGameProgress } from '../src/retroachievements';

type Props = { apiKey: string; username: string; onOpenSettings: () => void; onOpenGame: (game: UserGameProgress) => void };
const media = (path: string) => path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/${path}`}`;

function relativeTime(date: string, locale: string) {
  const milliseconds = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(milliseconds / 60000));
  if (minutes < 60) return locale === 'pt' ? `${minutes} min atrás` : locale === 'es' ? `hace ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === 'pt' ? `${hours} h atrás` : locale === 'es' ? `hace ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === 'pt' ? `${days} d atrás` : locale === 'es' ? `hace ${days} d` : `${days}d ago`;
}

function awardLabel(kind: string, language: string) {
  const labels: Record<string, Record<string, string>> = {
    mastered: { pt: 'Dominou', en: 'Mastered', es: 'Dominó' },
    completed: { pt: 'Completou', en: 'Completed', es: 'Completó' },
    'beaten-hardcore': { pt: 'Terminou em hardcore', en: 'Beat in hardcore', es: 'Terminó en hardcore' },
    'beaten-softcore': { pt: 'Terminou', en: 'Beat', es: 'Terminó' },
  };
  return labels[kind]?.[language] ?? kind;
}

export function ActivityFeed({ apiKey, username, onOpenSettings, onOpenGame }: Props) {
  const { width } = useWindowDimensions();
  const mobile = width < 900;
  const language = getAppLanguage();
  const t = getTranslation(language);
  const [achievements, setAchievements] = useState<RecentAchievement[]>([]);
  const [games, setGames] = useState<UserGameProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [openGame, setOpenGame] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!apiKey || !username) return;
    setLoading(true);
    setError(false);
    try {
      const [recentAchievements, progress] = await Promise.all([
        getUserRecentAchievements(apiKey, username),
        getAllUserGameProgress(apiKey, username),
      ]);
      const pointsByGame = await getUserGamePoints(apiKey, username, progress.map((game) => game.gameId));
      const completeProgress = progress.map((game) => ({ ...game, possibleScore: pointsByGame.get(game.gameId) ?? 0 }));
      setAchievements(recentAchievements);
      setGames(completeProgress);
      setOpenGame([...completeProgress].sort((a, b) => Date.parse(b.mostRecentAwardedDate || '') - Date.parse(a.mostRecentAwardedDate || ''))[0]?.title ?? null);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [apiKey, username]);

  useEffect(() => { refresh(); }, [refresh]);

  const gameFolders = useMemo(() => {
    const timestamp = (date: string) => Date.parse(date) || 0;
    return games.map((game) => ({
      ...game,
      items: achievements.filter((achievement) => achievement.gameId === game.gameId).sort((a, b) => timestamp(b.date) - timestamp(a.date)),
    })).sort((a, b) => timestamp(b.mostRecentAwardedDate) - timestamp(a.mostRecentAwardedDate));
  }, [achievements, games]);

  if (!apiKey || !username) return <View style={[styles.empty, mobile && small.empty]}><View style={styles.emptyIcon}><Feather name="key" size={22} color="#ffe36d" /></View><Text style={[styles.emptyTitle, mobile && small.emptyTitle]}>{t.activityConnectTitle}</Text><Text style={[styles.emptyText, mobile && small.emptyText]}>{username ? t.activityConnectDescription : t.activityMissingUsername}</Text><Pressable accessibilityRole="button" onPress={onOpenSettings} style={[styles.connectButton, mobile && small.connectButton]}><Text style={styles.connectButtonText}>{t.settings}</Text></Pressable></View>;
  if (loading && games.length === 0) return <View style={[styles.loading, mobile && small.loading]}><ActivityIndicator color="#ffe36d" /><Text style={styles.loadingText}>{t.activityLoading}</Text></View>;

  return <View>
    <View style={[styles.heading, mobile && small.heading]}>
      <View style={mobile && small.headingCopy}><Text style={[styles.title, mobile && small.title]}>{t.activityFeedTitle}</Text><Text style={[styles.subtitle, mobile && small.subtitle]}>{t.activityFeedDescription}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t.refresh} onPress={refresh} style={[styles.refresh, mobile && small.refresh]}>{loading ? <ActivityIndicator size="small" color="#ffe36d" /> : <Feather name="refresh-cw" size={18} color="#ffe36d" />}{!mobile && <Text style={styles.refreshText}>{t.refresh}</Text>}</Pressable>
    </View>
    {error && <View style={[styles.error, mobile && small.error]}><Text style={[styles.errorText, mobile && small.errorText]}>{t.activityError}</Text><Pressable accessibilityRole="button" onPress={refresh} style={mobile && small.retryButton}><Text style={[styles.retry, mobile && small.retry]}>{t.retry}</Text></Pressable></View>}
    {!error && !loading && games.length === 0 && <Text style={[styles.noActivity, mobile && small.noActivity]}>{t.noRecentActivity}</Text>}
    {gameFolders.map((folder) => {
      const isOpen = openGame === folder.title;
      const progress = folder.maxPossible ? Math.min(100, Math.round((folder.numAwarded / folder.maxPossible) * 100)) : 0;
      const isComplete = folder.maxPossible > 0 && progress === 100;
      return <View key={folder.gameId} style={[styles.folder, mobile && small.folder, isOpen && mobile && small.folderOpen]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} accessibilityLabel={folder.title} onPress={() => setOpenGame(isOpen ? null : folder.title)} style={[styles.folderHeader, mobile && small.folderHeader]}>
          <View style={[styles.iconWrap, mobile && small.iconWrap]}>
            {folder.imageIcon ? <Image source={{ uri: media(folder.imageIcon) }} style={[styles.gameIcon, small.imageReset, mobile && small.gameIcon]} /> : <View style={[styles.gameIcon, small.imageReset, mobile && small.gameIcon, small.iconFallback]}><MaterialCommunityIcons name="gamepad-variant" size={25} color="#ffe36d" /></View>}
            {isComplete && <View style={[styles.completionMedal, small.completionMedal]}><Feather name="award" size={14} color="#312907" /></View>}
          </View>
          <View style={[styles.folderCopy, mobile && small.folderCopy]}>
            <Text numberOfLines={mobile ? 2 : 1} style={[styles.folderTitle, mobile && small.folderTitle]}>{folder.title}</Text>
            {mobile ? <><Text style={small.consoleName}>{folder.consoleName}</Text><Text style={small.folderMeta}>{folder.numAwarded}/{folder.maxPossible} conquistas · {folder.possibleScore} pts</Text></> : <Text style={styles.folderMeta}>{folder.consoleName} · {folder.numAwarded}/{folder.maxPossible} conquistas · {folder.possibleScore} pts</Text>}
            <View style={[styles.progressRow, mobile && small.progressRow]}><View style={[styles.progressTrack, mobile && small.progressTrack]}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View><Text style={[styles.progressLabel, mobile && small.progressLabel]}>{progress}%</Text></View>
          </View>
          <Feather name={isOpen ? 'chevron-down' : 'chevron-right'} size={20} color="#aeb5c8" />
        </Pressable>
        {isOpen && <View style={[styles.folderContent, mobile && small.folderContent]}>
          <Pressable accessibilityRole="button" onPress={() => onOpenGame(folder)} style={[styles.openGameButton, mobile && small.openGameButton]}><Feather name="external-link" size={16} color="#302907" /><Text style={[styles.openGameText, mobile && small.openGameText]}>Abrir página do jogo</Text></Pressable>
          {folder.items.length === 0 ? <Text style={[styles.meta, mobile && small.emptyFolderText]}>{t.noRecentActivity}</Text> : folder.items.map((achievement, index) => <View style={[styles.card, mobile && small.card]} key={`${achievement.title}-${achievement.date}-${index}`}>
            {achievement.badgeUrl ? <Image source={{ uri: media(achievement.badgeUrl) }} style={[styles.badgeImage, mobile && small.badgeImage]} /> : <View style={[styles.badge, mobile && small.badgeImage]}><Feather name={achievement.hardcore ? 'award' : 'check'} size={20} color="#ffe36d" /></View>}
            <View style={[styles.copy, mobile && small.copy]}><Text style={[styles.player, mobile && small.player]}>{achievement.title} <Text style={styles.award}>+{achievement.points}</Text></Text><Text numberOfLines={mobile ? 2 : 1} style={[styles.description, mobile && small.description]}>{achievement.description}</Text><Text style={[styles.meta, mobile && small.meta]}>{relativeTime(achievement.date, language)}{achievement.hardcore ? ' · Hardcore' : ''}</Text></View>
          </View>)}
        </View>}
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  iconWrap: { width: 46, height: 46, marginRight: 12, flexShrink: 0 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 28, marginBottom: 18 }, title: { color: '#f7f8fc', fontSize: 25, fontWeight: '900' }, subtitle: { color: '#8e96aa', fontSize: 13, marginTop: 6 }, refresh: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#222633' }, refreshText: { color: '#ffe36d', fontSize: 12, fontWeight: '800' }, folder: { marginBottom: 10, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2c3142', backgroundColor: '#1b1e29' }, folderHeader: { minHeight: 76, padding: 12, flexDirection: 'row', alignItems: 'center' }, gameIcon: { height: 46, width: 46, borderRadius: 9, backgroundColor: '#303545', marginRight: 12 }, completionMedal: { height: 22, width: 22, borderRadius: 11, backgroundColor: '#ffe36d', justifyContent: 'center', alignItems: 'center', marginLeft: -22, marginRight: 10, marginTop: 34, borderWidth: 2, borderColor: '#1b1e29', zIndex: 1 }, folderCopy: { flex: 1 }, folderTitle: { color: '#f4f5f9', fontSize: 14, fontWeight: '900' }, folderMeta: { color: '#8790a5', fontSize: 11, marginTop: 4 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 }, progressTrack: { flex: 1, height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: '#333847' }, progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#ffe36d' }, progressLabel: { color: '#ffe36d', fontSize: 11, fontWeight: '900', width: 33, textAlign: 'right' }, folderContent: { paddingHorizontal: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#2b3040' }, openGameButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10, backgroundColor: '#ffe36d' }, openGameText: { color: '#302907', fontSize: 11, fontWeight: '900' }, card: { minHeight: 70, backgroundColor: '#171923', borderRadius: 12, padding: 11, marginTop: 10, marginBottom: 1, flexDirection: 'row', alignItems: 'center' }, badge: { height: 42, width: 42, borderRadius: 9, backgroundColor: '#3c3730', justifyContent: 'center', alignItems: 'center', marginRight: 11 }, badgeImage: { height: 42, width: 42, borderRadius: 9, marginRight: 11, backgroundColor: '#303545' }, copy: { flex: 1 }, player: { color: '#f5f6fb', fontSize: 13, fontWeight: '800' }, award: { color: '#ffe36d', fontWeight: '800' }, description: { color: '#a5adbf', fontSize: 12, marginTop: 3 }, meta: { color: '#7d8599', fontSize: 11, marginTop: 5 }, noActivity: { color: '#9da5b8', padding: 18, backgroundColor: '#1b1e29', borderRadius: 14, textAlign: 'center', fontSize: 13 }, loading: { paddingTop: 82, alignItems: 'center' }, loadingText: { color: '#a5acbd', marginTop: 12, fontSize: 13 }, empty: { marginTop: 32, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: '#313749', backgroundColor: '#1b1e29', alignItems: 'center' }, emptyIcon: { height: 48, width: 48, borderRadius: 24, backgroundColor: '#3c3730', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }, emptyTitle: { color: '#f6f7fb', fontSize: 17, fontWeight: '900' }, emptyText: { color: '#99a1b4', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8, maxWidth: 310 }, connectButton: { marginTop: 18, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: '#ffe36d', borderRadius: 10 }, connectButtonText: { color: '#26220c', fontWeight: '900', fontSize: 13 }, error: { borderRadius: 12, padding: 14, backgroundColor: '#38262b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, errorText: { color: '#f0b8bb', fontSize: 12, flex: 1 }, retry: { color: '#ffe36d', fontSize: 12, fontWeight: '800', marginLeft: 10 }
});

const small = StyleSheet.create({
  heading: { marginTop: 20, marginBottom: 18, alignItems: 'flex-start', gap: 12 }, headingCopy: { flex: 1, minWidth: 0 }, title: { fontSize: 24, lineHeight: 30 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: 5 }, refresh: { height: 46, width: 46, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center', borderRadius: 13, flexShrink: 0, borderWidth: 1, borderColor: '#363c4e' },
  folder: { borderRadius: 17, marginBottom: 12 }, folderOpen: { borderColor: '#55506f' }, folderHeader: { minHeight: 126, padding: 14 }, iconWrap: { width: 52, height: 52, marginRight: 12 }, gameIcon: { width: 52, height: 52, borderRadius: 12 }, imageReset: { marginRight: 0 }, iconFallback: { alignItems: 'center', justifyContent: 'center' }, completionMedal: { position: 'absolute', bottom: -5, right: -5, marginTop: 0, marginLeft: 0, marginRight: 0 },
  folderCopy: { minWidth: 0, paddingRight: 7 }, folderTitle: { fontSize: 14, lineHeight: 20 }, consoleName: { fontSize: 12, lineHeight: 17, marginTop: 4, color: '#b5a7e4' }, folderMeta: { fontSize: 12, lineHeight: 18, marginTop: 2, color: '#9da7bd' }, progressRow: { marginTop: 8 }, progressTrack: { height: 6 }, progressLabel: { fontSize: 12, width: 35 },
  folderContent: { paddingHorizontal: 12, paddingBottom: 12 }, openGameButton: { minHeight: 46, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 12, marginTop: 12 }, openGameText: { fontSize: 13 }, emptyFolderText: { fontSize: 13, lineHeight: 20, marginTop: 14, marginBottom: 4, textAlign: 'center' },
  card: { borderRadius: 13, padding: 12, marginTop: 10 }, badgeImage: { width: 46, height: 46, borderRadius: 10, marginRight: 11, flexShrink: 0 }, copy: { minWidth: 0 }, player: { fontSize: 14, lineHeight: 20 }, description: { fontSize: 13, lineHeight: 19, marginTop: 4 }, meta: { fontSize: 12, lineHeight: 17, color: '#929cb2', marginTop: 5 },
  empty: { marginTop: 20, padding: 24 }, emptyTitle: { fontSize: 19, lineHeight: 25, textAlign: 'center' }, emptyText: { fontSize: 14, lineHeight: 21 }, connectButton: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 24, borderRadius: 12 }, loading: { paddingTop: 44, paddingBottom: 44 }, noActivity: { fontSize: 14, lineHeight: 21, padding: 24 },
  error: { flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 16, borderRadius: 14 }, errorText: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', fontSize: 14, lineHeight: 21 }, retryButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: '#473238', borderRadius: 10 }, retry: { marginLeft: 0, fontSize: 13 },
});
