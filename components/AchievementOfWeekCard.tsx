import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AchievementOfWeek, getAchievementOfTheWeek } from '../src/retroachievements';

export function AchievementOfWeekCard({ apiKey }: { apiKey: string }) {
  const [item, setItem] = useState<AchievementOfWeek | null>(null);
  const [loading, setLoading] = useState(Boolean(apiKey));
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!apiKey) { setLoading(false); setFailed(true); return; }
    setLoading(true);
    setFailed(false);
    try { setItem(await getAchievementOfTheWeek(apiKey)); }
    catch { setItem(null); setFailed(true); }
    finally { setLoading(false); }
  }, [apiKey]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!failed || !apiKey) return;
    const retry = setTimeout(load, 8000);
    return () => clearTimeout(retry);
  }, [apiKey, failed, load]);

  return <View style={styles.card}>
    <View style={styles.header}><Text style={styles.kicker}>CONQUISTA DA SEMANA</Text><Feather name="award" size={17} color="#ffe36d" /></View>
    {loading ? <View style={styles.status}><ActivityIndicator color="#ffe36d" /><Text style={styles.statusText}>Buscando a conquista da semana…</Text></View> : item ? <>
      <View style={styles.row}><View style={styles.icon}><Feather name="award" size={28} color="#ffe36d" />{!!item.badgeUrl && <Image source={{ uri: item.badgeUrl }} style={styles.badge} />}</View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text numberOfLines={2} style={styles.description}>{item.description}</Text><Text style={styles.game}>{item.gameTitle} · {item.consoleTitle}</Text></View></View>
      <View style={styles.stats}><Text style={styles.stat}>{item.points} pts</Text><Text style={styles.stat}>{item.unlocks.toLocaleString('pt-BR')} desbloqueios</Text></View>
    </> : <View style={styles.status}><Text style={styles.statusText}>{failed ? 'Não foi possível carregar agora. Tentando novamente em instantes…' : 'Nenhuma conquista disponível.'}</Text><Pressable onPress={load} style={styles.retry}><Feather name="refresh-cw" size={13} color="#171923" /><Text style={styles.retryText}>Tentar agora</Text></Pressable></View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { minHeight: 164, padding: 15, borderRadius: 14, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#4d4672' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, kicker: { color: '#b6a2ff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  row: { flexDirection: 'row', marginTop: 12, gap: 10 }, icon: { width: 54, height: 54, backgroundColor: '#302b45', borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, badge: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, copy: { flex: 1 },
  title: { color: '#f4f5f9', fontSize: 14, fontWeight: '900' }, description: { color: '#b7becf', fontSize: 10, lineHeight: 14, marginTop: 3 }, game: { color: '#ffe36d', fontSize: 10, marginTop: 5, fontWeight: '800' },
  stats: { flexDirection: 'row', gap: 14, marginTop: 11, borderTopWidth: 1, borderTopColor: '#343a4c', paddingTop: 9 }, stat: { color: '#aeb6c8', fontSize: 10, fontWeight: '700' },
  status: { minHeight: 105, alignItems: 'center', justifyContent: 'center', gap: 12 }, statusText: { color: '#afb6c8', fontSize: 11, textAlign: 'center' },
  retry: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 10, minHeight: 31, borderRadius: 8, backgroundColor: '#ffe36d' }, retryText: { color: '#171923', fontWeight: '900', fontSize: 10 },
});
