import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { getAppLanguage, getTranslation } from '../src/i18n';
import { getRecentGameAwards, getUserProfile, RecentAward } from '../src/retroachievements';

type Props = { apiKey: string; onOpenSettings: () => void };

export function CommunityFeed({ apiKey, onOpenSettings }: Props) {
  const t = getTranslation(getAppLanguage());
  const [awards, setAwards] = useState<RecentAward[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const refresh = useCallback(async () => {
    if (!apiKey) { setFailed(false); return; }
    setLoading(true);
    setFailed(false);
    try { const recent = await getRecentGameAwards(apiKey); setAwards(recent); const users = [...new Set(recent.slice(0, 5).map((award) => award.user))]; const profiles = await Promise.all(users.map(async (user) => { try { return [user, (await getUserProfile(apiKey, user)).avatar] as const; } catch { return [user, ''] as const; } })); setAvatars(Object.fromEntries(profiles)); } catch { setAwards([]); setAvatars({}); setFailed(true); } finally { setLoading(false); }
  }, [apiKey]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!failed || !apiKey) return;
    const retry = setTimeout(refresh, 8000);
    return () => clearTimeout(retry);
  }, [apiKey, failed, refresh]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.communityTitle}</Text>
          <Text style={styles.subtitle}>{t.communityDescription}</Text>
        </View>
        {apiKey ? <Pressable onPress={refresh} style={styles.refresh}><Feather name="refresh-cw" size={16} color="#a993ff" /></Pressable> : null}
      </View>
      {!apiKey ? <Pressable onPress={onOpenSettings} style={styles.connect}><Text style={styles.connectText}>{t.communityConnect}</Text><Feather name="chevron-right" size={18} color="#ffe36d" /></Pressable> : null}
      {apiKey && loading && awards.length === 0 ? <View style={styles.loader}><ActivityIndicator color="#a993ff" /><Text style={styles.statusText}>Buscando atividade da comunidade…</Text></View> : null}
      {apiKey && !loading && awards.length === 0 ? <View style={styles.empty}><Text style={styles.statusText}>{failed ? 'Não foi possível carregar a comunidade. Tentando novamente em instantes…' : 'Ainda não há atividade para mostrar.'}</Text><Pressable onPress={refresh} style={styles.retry}><Feather name="refresh-cw" size={13} color="#171923" /><Text style={styles.retryText}>Tentar agora</Text></Pressable></View> : null}
      {apiKey && !loading ? awards.slice(0, 5).map((award, index) => (
        <View key={award.user + '-' + award.gameId + '-' + index} style={styles.item}>
          {avatars[award.user] ? <Image source={{ uri: avatars[award.user].startsWith('http') ? avatars[award.user] : `https://media.retroachievements.org${avatars[award.user]}` }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{award.user.slice(0, 1).toUpperCase()}</Text></View>}
          <View style={styles.copy}>
            <Text style={styles.player}>{award.user} <Text style={styles.action}>{award.awardKind}</Text></Text>
            <Text numberOfLines={1} style={styles.game}>{award.gameTitle}{' · '}{award.consoleName}</Text>
          </View>
        </View>
      )) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 30, marginBottom: 2 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, title: { color: '#f5f6fb', fontSize: 18, fontWeight: '900' }, subtitle: { color: '#8891a5', fontSize: 12, marginTop: 4 }, refresh: { height: 34, width: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#25283a' }, connect: { padding: 15, borderRadius: 14, backgroundColor: '#1d2030', borderWidth: 1, borderColor: '#30354a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, connectText: { color: '#d9d0ff', fontSize: 13, fontWeight: '700' }, loader: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 10 }, empty: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 11, borderWidth: 1, borderColor: '#30354a', borderRadius: 12, backgroundColor: '#1d2030', padding: 14 }, statusText: { color: '#aab2c4', fontSize: 11, textAlign: 'center' }, retry: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 30, borderRadius: 8, backgroundColor: '#ffe36d' }, retryText: { color: '#171923', fontSize: 10, fontWeight: '900' }, item: { paddingVertical: 11, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#252a38' }, avatar: { height: 26, width: 26, borderRadius: 13, marginRight: 10, backgroundColor: '#303647' }, avatarFallback: { height: 26, width: 26, borderRadius: 13, marginRight: 10, backgroundColor: '#55469a', alignItems: 'center', justifyContent: 'center' }, avatarInitial: { color: '#fff', fontSize: 11, fontWeight: '900' }, copy: { flex: 1 }, player: { color: '#e8eaf2', fontSize: 13, fontWeight: '800' }, action: { color: '#b5bccd', fontWeight: '500' }, game: { color: '#868fa4', fontSize: 11, marginTop: 3 }
});
