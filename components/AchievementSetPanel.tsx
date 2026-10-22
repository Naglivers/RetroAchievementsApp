import { Feather } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameDetails, GameSubset } from '../src/retroachievements';

const media = (path: string) => path.startsWith('http') ? path : `https://media.retroachievements.org${path.startsWith('/') ? path : `/Badge/${path}.png`}`;
export type AchievementOrder = 'earned' | 'locked' | 'default' | 'points' | 'difficulty' | 'name';
type SetItem = { id: number; name: string; icon: string; kind: 'base' | 'subset' };

type Props = {
  baseGameId: number;
  baseIcon: string;
  details: GameDetails;
  subsets: GameSubset[];
  activeSetId: number;
  onSelectSet: (id: number) => void;
  onConfigureSubsets: () => void;
  order: AchievementOrder;
  onChangeOrder: (order: AchievementOrder) => void;
  missableOnly: boolean;
  onToggleMissable: () => void;
  lockedOnly: boolean;
  onToggleLocked: () => void;
};

export function AchievementSetPanel({ baseGameId, baseIcon, details, subsets, activeSetId, onSelectSet, onConfigureSubsets, order, onChangeOrder, missableOnly, onToggleMissable, lockedOnly, onToggleLocked }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const styles = compact ? { ...basePanelStyles(), ...phone } : basePanelStyles();
  const sets: SetItem[] = [{ id: baseGameId, name: 'Base Set', icon: baseIcon, kind: 'base' }, ...subsets.map((subset) => ({ id: subset.id, name: subset.title, icon: subset.imageIcon, kind: 'subset' as const }))];
  const authors = [...new Set(details.achievements.map((achievement) => achievement.author).filter(Boolean))];
  const totalPoints = details.achievements.reduce((sum, achievement) => sum + achievement.points, 0);
  const earned = details.achievements.filter((achievement) => Boolean(achievement.dateEarned));
  const earnedPoints = earned.reduce((sum, achievement) => sum + achievement.points, 0);
  const missable = details.achievements.filter((achievement) => achievement.type.toLowerCase() === 'missable').length;
  const percentage = details.numAchievements ? Math.round((details.numAwardedToUser / details.numAchievements) * 100) : 0;
  const status = percentage === 100 ? 'Mastered' : percentage > 0 ? 'Em progresso' : 'Não iniciado';
  const labels: Record<AchievementOrder, string> = { earned: 'Desbloqueado primeiro', locked: 'Bloqueado primeiro', default: 'Ordem padrão', points: 'Pontos', difficulty: 'Dificuldade', name: 'Nome' };
  const nextOrder: AchievementOrder = order === 'earned' ? 'locked' : order === 'locked' ? 'default' : 'earned';

  return <View style={styles.panel}>
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {sets.map((set) => <Pressable key={set.id} accessibilityRole="tab" accessibilityState={{ selected: activeSetId === set.id }} onPress={() => onSelectSet(set.id)} accessibilityLabel={`Selecionar ${set.name}`} style={[styles.tab, activeSetId === set.id && styles.tabActive]}>
          <Image source={{ uri: media(set.icon) }} style={styles.tabIcon} accessibilityLabel={set.name} />
          {compact && <Text numberOfLines={1} style={[phone.tabName, activeSetId === set.id && phone.tabNameActive]}>{set.name}</Text>}
        </Pressable>)}
      </ScrollView>
      <Pressable onPress={onConfigureSubsets} accessibilityLabel="Configurar subsets" style={styles.configure}><Feather name="sliders" size={16} color="#d9b900" /></Pressable>
    </View>
    <View style={styles.information}>
      <View style={styles.infoLeft}>
        <Text style={styles.kind}>{activeSetId === baseGameId ? 'Base Set' : 'Subset'}</Text>
        {activeSetId !== baseGameId && <Text style={styles.setName}>{details.title}</Text>}
        <Text style={styles.valueLine}><Text style={styles.blue}>{details.numAchievements} conquistas</Text> valendo <Text style={styles.blue}>{totalPoints.toLocaleString()} pontos</Text> <Text style={styles.dim}>(— · ×—)</Text></Text>
        <Text style={styles.progressLine}>Desbloqueadas <Text style={styles.blue}>{earned.length} conquistas</Text> valendo <Text style={styles.blue}>{earnedPoints.toLocaleString()} pontos</Text></Text>
      </View>
      <View style={styles.status}><Feather name={percentage === 100 ? 'award' : 'target'} size={18} color="#ffe36d" /><Text style={styles.statusPercent}>{percentage}%</Text><Text style={styles.statusText}>{status}</Text></View>
    </View>
    {authors.length > 0 && <View style={styles.people}><Feather name="award" size={14} color="#e1c500" /><Text style={styles.peopleTitle}>{authors.length} autor{authors.length === 1 ? '' : 'es'}</Text>{authors.slice(0, 4).map((author) => <View key={author} style={styles.author}><View style={styles.initial}><Text style={styles.initialText}>{author.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.authorName}>{author}</Text></View>)}{authors.length > 4 && <Text style={styles.more}>+{authors.length - 4}</Text>}<View style={styles.contributors}><Feather name="users" size={14} color="#929292" /><Text style={styles.contributorText}>Contributors indisponíveis</Text></View></View>}
    <View style={styles.filters}>
      <Pressable onPress={() => onChangeOrder(nextOrder)} accessibilityLabel="Alterar ordenação" style={styles.filter}><Feather name="arrow-up" size={14} color="#e1c500" /><Text style={styles.filterText}>{labels[order]}</Text></Pressable>
      <Pressable onPress={onToggleMissable} accessibilityLabel="Apenas perdíveis" style={[styles.filter, missableOnly && styles.filterOn]}><Feather name="alert-circle" size={14} color={missableOnly ? '#171717' : '#e1c500'} /><Text style={[styles.filterText, missableOnly && styles.filterTextOn]}>Apenas Perdíveis</Text><Text style={[styles.count, missableOnly && styles.countOn]}>{missable}</Text></Pressable>
      <Pressable onPress={onToggleLocked} accessibilityLabel="Apenas bloqueados" style={[styles.filter, lockedOnly && styles.filterOn]}><Feather name="eye-off" size={14} color={lockedOnly ? '#171717' : '#e1c500'} /><Text style={[styles.filterText, lockedOnly && styles.filterTextOn]}>Apenas Bloqueados</Text></Pressable>
      <View style={styles.counters}><View style={styles.counter}><Feather name="layers" size={13} color="#aaa" /><Text style={styles.counterText}>0</Text></View><View style={styles.counter}><Feather name="award" size={13} color="#ddd" /><Text style={styles.counterText}>{details.numAchievements}</Text></View></View>
    </View>
  </View>;
}

function basePanelStyles() { return styles; }

const phone = StyleSheet.create({
  panel: { backgroundColor: '#1b1e29', borderWidth: 1, borderColor: '#303647', borderRadius: 16, marginTop: 16, overflow: 'hidden' },
  tabBar: { flexDirection: 'row', minHeight: 80, backgroundColor: '#151822', borderBottomWidth: 1, borderBottomColor: '#303647' },
  tabs: { gap: 8, padding: 10 }, tab: { width: 90, minHeight: 68, gap: 6, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#303647', justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: '#302c36', borderColor: '#a8944a' }, tabIcon: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#303647' },
  tabName: { color: '#9ca5bb', fontSize: 11, width: '100%', textAlign: 'center', fontWeight: '700' }, tabNameActive: { color: '#ffe36d' },
  configure: { width: 44, borderLeftWidth: 1, borderLeftColor: '#303647', alignItems: 'center', justifyContent: 'center' },
  information: { padding: 14, flexDirection: 'column', gap: 14 }, infoLeft: { minWidth: 0 }, kind: { color: '#f3f4f9', fontSize: 14, fontWeight: '900' }, setName: { color: '#ffe36d', fontSize: 14, lineHeight: 20, marginTop: 4, fontWeight: '700' },
  valueLine: { color: '#c6cddd', fontSize: 13, lineHeight: 21, marginTop: 6 }, progressLine: { color: '#9ca5bb', fontSize: 12, lineHeight: 20, marginTop: 6 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#303647' }, statusPercent: { color: '#ffe36d', fontSize: 17, fontWeight: '900' }, statusText: { color: '#9ca5bb', fontSize: 12 },
  people: { padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#303647' }, peopleTitle: { color: '#c6cddd', fontSize: 12, fontWeight: '700' },
  author: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' }, authorName: { color: '#ffe36d', fontSize: 12, flexShrink: 1 }, contributors: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }, contributorText: { color: '#929db3', fontSize: 11, flexShrink: 1 },
  filters: { borderTopWidth: 1, borderTopColor: '#303647', padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, borderWidth: 1, borderColor: '#353c50', backgroundColor: '#222737', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }, filterText: { color: '#ffe36d', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  counters: { flexDirection: 'row', gap: 8, marginLeft: 'auto' }, counter: { minHeight: 44, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#151822', flexDirection: 'row', alignItems: 'center', gap: 6 }, counterText: { color: '#c6cddd', fontSize: 12, fontWeight: '700' },
});

const styles = StyleSheet.create({
  panel: { backgroundColor: '#1d1d1d', borderWidth: 1, borderColor: '#303030', borderRadius: 5, marginTop: 13, overflow: 'hidden' }, tabBar: { flexDirection: 'row', minHeight: 47, backgroundColor: '#151515', borderBottomWidth: 1, borderBottomColor: '#303030' }, tabs: { gap: 8, paddingHorizontal: 10, paddingTop: 7 }, tab: { width: 33, height: 33, paddingBottom: 3, borderBottomWidth: 2, borderBottomColor: 'transparent' }, tabActive: { borderBottomColor: '#e5e5e5' }, tabIcon: { width: 29, height: 29, borderRadius: 2, backgroundColor: '#333' }, configure: { width: 45, borderLeftWidth: 1, borderLeftColor: '#303030', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }, information: { padding: 11, flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, infoLeft: { flex: 1 }, kind: { color: '#e6e6e6', fontSize: 13, fontWeight: '900' }, setName: { color: '#f5c518', fontSize: 12, marginTop: 2, fontWeight: '700' }, valueLine: { color: '#ddd', fontSize: 12, marginTop: 4 }, blue: { color: '#00aaff', fontWeight: '800' }, dim: { color: '#a7a7a7' }, progressLine: { color: '#c6c6c6', fontSize: 11, marginTop: 4 }, status: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 75 }, statusPercent: { color: '#ddd', fontSize: 15, fontWeight: '900', marginTop: 2 }, statusText: { color: '#999', fontSize: 9 }, people: { minHeight: 39, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#303030' }, peopleTitle: { color: '#ddd', fontSize: 11, fontWeight: '800', marginRight: 4 }, author: { flexDirection: 'row', alignItems: 'center', gap: 4 }, initial: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#464646' }, initialText: { color: '#f5c518', fontSize: 9, fontWeight: '900' }, authorName: { color: '#e1c500', fontSize: 10, fontWeight: '700' }, more: { color: '#aaa', fontSize: 10 }, contributors: { marginLeft: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, contributorText: { color: '#858585', fontSize: 9 }, filters: { borderTopWidth: 1, borderTopColor: '#303030', padding: 7, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }, filter: { minHeight: 29, paddingHorizontal: 8, borderWidth: 1, borderColor: '#444', backgroundColor: '#151515', borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 5 }, filterOn: { backgroundColor: '#e1c500', borderColor: '#e1c500' }, filterText: { color: '#e1c500', fontSize: 10, fontWeight: '700' }, filterTextOn: { color: '#171717' }, count: { minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#303030', color: '#eee', fontSize: 9, textAlign: 'center', textAlignVertical: 'center' }, countOn: { backgroundColor: '#171717', color: '#eee' }, counters: { marginLeft: 'auto', flexDirection: 'row', gap: 5 }, counter: { minHeight: 28, paddingHorizontal: 8, borderRadius: 4, backgroundColor: '#151515', flexDirection: 'row', alignItems: 'center', gap: 4 }, counterText: { color: '#ddd', fontSize: 10, fontWeight: '800' },
});
