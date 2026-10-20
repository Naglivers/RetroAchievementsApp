import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const featured = { title: "Oddworld: Abe's Oddysee", system: 'PlayStation', progress: 62, image: 'https://media.retroachievements.org/Images/025250.png' };
const games = [
  { title: 'Super Mario World', system: 'SNES', points: '96%', color: '#ffbd44', image: 'https://media.retroachievements.org/Images/000058.png' },
  { title: 'Pokémon Emerald', system: 'Game Boy Advance', points: '41%', color: '#67d5a8', image: 'https://media.retroachievements.org/Images/000478.png' },
  { title: 'Castlevania: Symphony', system: 'PlayStation', points: '18%', color: '#db91ff', image: 'https://media.retroachievements.org/Images/000112.png' },
];

const weeklyGoals = [
  { label: 'Desbloquear conquistas', current: 7, total: 10, color: '#ffe36d' },
  { label: 'Jogar em hardcore', current: 3, total: 5, color: '#a993ff' },
];

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action && <Text style={styles.action}>{action}</Text>}</View>;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('Início');
  const [search, setSearch] = useState('');
  const tabs = ['Início', 'Explorar', 'Atividade', 'Perfil'];
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = { Início: 'home', Explorar: 'compass', Atividade: 'pulse', Perfil: 'person' };

  return <SafeAreaView style={styles.safe}><View style={styles.page}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.topbar}><View><Text style={styles.brand}>CHECKPOINT</Text><Text style={styles.tagline}>Seu universo retro, em progresso.</Text></View><Pressable style={styles.avatar}><Text style={styles.avatarText}>N</Text></Pressable></View>
      <View style={styles.search}><Feather name="search" size={19} color="#8a91a9" /><TextInput value={search} onChangeText={setSearch} placeholder="Buscar jogos, jogadores, conquistas" placeholderTextColor="#777f96" style={styles.input} /></View>
      <View style={styles.greeting}><Text style={styles.eyebrow}>BOA NOITE, NAGLI</Text><Text style={styles.headline}>Pronto para mais uma conquista?</Text></View>
      <View style={styles.overview}>
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>12.480</Text><Text style={styles.overviewLabel}>PONTOS</Text></View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>38</Text><Text style={styles.overviewLabel}>JOGOS JOGADOS</Text></View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>4</Text><Text style={styles.overviewLabel}>MAESTRIAS</Text></View>
      </View>
      <Pressable style={styles.hero}><Image source={{ uri: featured.image }} style={styles.heroImage} /><LinearGradient colors={['transparent', '#171924']} style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.nowPlaying}>CONTINUE JOGANDO</Text><Text style={styles.heroTitle}>{featured.title}</Text><Text style={styles.heroSystem}>{featured.system}</Text><View style={styles.progressRow}><View style={styles.track}><View style={[styles.fill, { width: `${featured.progress}%` }]} /></View><Text style={styles.percent}>{featured.progress}%</Text></View></View></Pressable>
      <SectionTitle title="Sua coleção" action="Ver tudo" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameList}>{games.map((game) => <Pressable key={game.title} style={styles.gameCard}><Image source={{ uri: game.image }} style={styles.gameImage} /><View style={styles.gameInfo}><Text numberOfLines={1} style={styles.gameTitle}>{game.title}</Text><Text style={styles.gameSystem}>{game.system}</Text><View style={styles.gameStat}><View style={[styles.dot, { backgroundColor: game.color }]} /><Text style={styles.gamePoints}>{game.points} concluído</Text></View></View></Pressable>)}</ScrollView>
      <SectionTitle title="Metas da semana" action="Ver progresso" />
      <View style={styles.goalsCard}>{weeklyGoals.map((goal) => <View key={goal.label} style={styles.goal}><View style={styles.goalTop}><Text style={styles.goalLabel}>{goal.label}</Text><Text style={styles.goalValue}>{goal.current}/{goal.total}</Text></View><View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${(goal.current / goal.total) * 100}%`, backgroundColor: goal.color }]} /></View></View>)}</View>
      <SectionTitle title="Acontecendo agora" action="Ao vivo" />
      <View style={styles.activity}><View style={styles.liveDot} /><View style={styles.activityText}><Text style={styles.activityTitle}>5.713 jogadores estão em jogo</Text><Text style={styles.activitySub}>Veja quem está desbloqueando conquistas agora.</Text></View><Feather name="chevron-right" color="#aab0c3" size={22} /></View>
    </ScrollView>
    <View style={styles.nav}>{tabs.map((tab) => { const active = activeTab === tab; const icon = icons[tab]; return <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.navItem}><Ionicons name={active ? icon : `${icon}-outline` as keyof typeof Ionicons.glyphMap} size={21} color={active ? '#ffe36d' : '#747c91'} /><Text style={[styles.navText, active && styles.navTextActive]}>{tab}</Text></Pressable>; })}</View>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#11131b' }, page: { flex: 1, backgroundColor: '#11131b', maxWidth: 720, width: '100%', alignSelf: 'center' }, content: { padding: 20, paddingBottom: 112 }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, brand: { color: '#fff4ac', fontSize: 20, fontWeight: '900', letterSpacing: 1.2 }, tagline: { color: '#737b91', fontSize: 12, marginTop: 2 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8764e8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#b49dff' }, avatarText: { color: 'white', fontSize: 16, fontWeight: '800' }, search: { height: 48, marginTop: 25, borderRadius: 14, backgroundColor: '#1c1f2b', paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#2b3040' }, input: { flex: 1, color: '#f5f6fb', marginLeft: 10, fontSize: 14 }, greeting: { marginTop: 28, marginBottom: 16 }, eyebrow: { color: '#a993ff', fontWeight: '800', fontSize: 11, letterSpacing: 1.3 }, headline: { color: '#f7f7fb', fontSize: 26, fontWeight: '800', lineHeight: 32, marginTop: 6 }, overview: { minHeight: 70, borderWidth: 1, borderColor: '#292e3e', borderRadius: 16, backgroundColor: '#1c1f2b', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, overviewItem: { flex: 1, alignItems: 'center' }, overviewValue: { color: '#f4f5f9', fontSize: 15, fontWeight: '900' }, overviewLabel: { color: '#858ca1', fontSize: 8, fontWeight: '800', letterSpacing: .5, marginTop: 5, textAlign: 'center' }, overviewDivider: { height: 28, width: 1, backgroundColor: '#323747' }, hero: { height: 236, borderRadius: 20, overflow: 'hidden', backgroundColor: '#272337', justifyContent: 'flex-end' }, heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: .85 }, heroShade: { ...StyleSheet.absoluteFillObject }, heroCopy: { padding: 18 }, nowPlaying: { color: '#fff0a3', fontWeight: '900', fontSize: 10, letterSpacing: 1.1 }, heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 5 }, heroSystem: { color: '#cbcdd7', fontSize: 13, marginTop: 2 }, progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 }, track: { flex: 1, height: 6, backgroundColor: '#515363', borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#ffe36d', borderRadius: 3 }, percent: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 9 }, sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 29, marginBottom: 13 }, sectionTitle: { color: '#f6f7fb', fontSize: 18, fontWeight: '800' }, action: { color: '#a993ff', fontSize: 13, fontWeight: '700' }, gameList: { gap: 12, paddingRight: 20 }, gameCard: { width: 152, borderRadius: 15, backgroundColor: '#1c1f2b', overflow: 'hidden', borderWidth: 1, borderColor: '#292e3e' }, gameImage: { height: 91, width: '100%', backgroundColor: '#363b4d' }, gameInfo: { padding: 11 }, gameTitle: { color: '#f5f6fb', fontSize: 13, fontWeight: '800' }, gameSystem: { color: '#858ca1', fontSize: 11, marginTop: 3 }, gameStat: { flexDirection: 'row', alignItems: 'center', marginTop: 9 }, dot: { height: 6, width: 6, borderRadius: 3, marginRight: 5 }, gamePoints: { color: '#b7bccb', fontSize: 10, fontWeight: '600' }, goalsCard: { backgroundColor: '#1c1f2b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#292e3e', gap: 16 }, goal: { gap: 8 }, goalTop: { flexDirection: 'row', justifyContent: 'space-between' }, goalLabel: { color: '#e7e9f0', fontSize: 13, fontWeight: '700' }, goalValue: { color: '#b9bfd0', fontSize: 12, fontWeight: '800' }, goalTrack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#343949' }, goalFill: { height: '100%', borderRadius: 3 }, activity: { backgroundColor: '#1c1f2b', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#292e3e' }, liveDot: { height: 9, width: 9, borderRadius: 5, backgroundColor: '#55db8c', marginRight: 12 }, activityText: { flex: 1 }, activityTitle: { color: '#eceef5', fontSize: 14, fontWeight: '800' }, activitySub: { color: '#858ca1', fontSize: 12, marginTop: 3 }, nav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: '#171923', borderTopWidth: 1, borderColor: '#292d3b', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 11 }, navItem: { alignItems: 'center', minWidth: 60 }, navText: { color: '#747c91', fontSize: 10, marginTop: 5, fontWeight: '700' }, navTextActive: { color: '#ffe36d' }
});
