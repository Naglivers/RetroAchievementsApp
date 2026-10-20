import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAppLanguage, getTranslation } from '../src/i18n';
import { clearCredentials, loadCredentials, saveCredentials } from '../src/credentials';
import { ActivityFeed } from '../components/ActivityFeed';
import { CommunityFeed } from '../components/CommunityFeed';
import { GameDetail } from '../components/GameDetail';
import { HomeDashboard } from '../components/HomeDashboard';
import { UserGameProgress } from '../src/retroachievements';

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
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [credentialsError, setCredentialsError] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserGameProgress | null>(null);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const language = getAppLanguage();
  const t = getTranslation(language);
  const tabs = [t.home, t.explore, t.activity, t.profile];
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = { [t.home]: 'home', [t.explore]: 'compass', [t.activity]: 'pulse', [t.profile]: 'person' };
  const deviceDate = new Intl.DateTimeFormat(language, { weekday: 'long', day: '2-digit', month: 'short' }).format(new Date()).toUpperCase();

  useEffect(() => {
    loadCredentials().then((credentials) => {
      setUsername(credentials.username);
      setApiKey(credentials.apiKey);
    });
  }, []);

  async function handleSaveCredentials() {
    if (!username.trim() || !apiKey.trim()) {
      setCredentialsError(true);
      return;
    }
    await saveCredentials({ username, apiKey });
    setCredentialsError(false);
    setSaved(true);
  }

  async function handleClearCredentials() {
    await clearCredentials();
    setUsername('');
    setApiKey('');
    setSaved(false);
  }

  return <SafeAreaView style={styles.safe}><View style={[styles.page, isDesktop && styles.desktopPage]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>
      <View style={[styles.topbar, isDesktop && styles.desktopTopbar]}><View>{!isDesktop && <Text style={styles.brand}>CHECKPOINT</Text>}<Text style={[styles.tagline, isDesktop && styles.desktopPageTitle]}>{isDesktop ? t.overview : t.subtitle}</Text></View>{isDesktop && <Text style={styles.desktopDate}>{deviceDate}</Text>}<View style={styles.headerActions}><Pressable onPress={() => setSettingsOpen(true)} style={styles.settingsButton}><Feather name="settings" size={18} color="#c5cada" /></Pressable><Pressable style={styles.avatar}><Text style={styles.avatarText}>N</Text></Pressable></View></View>
      {selectedGame ? <GameDetail game={selectedGame} apiKey={apiKey} username={username} onBack={() => setSelectedGame(null)} /> : activeTab === 2 ? <ActivityFeed apiKey={apiKey} username={username} onOpenSettings={() => setSettingsOpen(true)} onOpenGame={setSelectedGame} /> : activeTab === 0 ? <HomeDashboard apiKey={apiKey} username={username} onOpenSettings={() => setSettingsOpen(true)} onOpenGame={setSelectedGame} /> : <>
      <View style={styles.search}><Feather name="search" size={19} color="#8a91a9" /><TextInput value={search} onChangeText={setSearch} placeholder={t.search} placeholderTextColor="#777f96" style={styles.input} /></View>
      <View style={styles.greeting}><Text style={styles.eyebrow}>{t.greeting}</Text><Text style={styles.headline}>{t.headline}</Text></View>
      <View style={styles.overview}>
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>12.480</Text><Text style={styles.overviewLabel}>{t.points}</Text></View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>38</Text><Text style={styles.overviewLabel}>{t.gamesPlayed}</Text></View>
        <View style={styles.overviewDivider} />
        <View style={styles.overviewItem}><Text style={styles.overviewValue}>4</Text><Text style={styles.overviewLabel}>{t.masteries}</Text></View>
      </View>
      <Pressable style={[styles.hero, isDesktop && styles.desktopHero]}><Image source={{ uri: featured.image }} style={styles.heroImage} /><LinearGradient colors={['transparent', '#171924']} style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.nowPlaying}>{t.continuePlaying}</Text><Text style={styles.heroTitle}>{featured.title}</Text><Text style={styles.heroSystem}>{featured.system}</Text><View style={styles.progressRow}><View style={styles.track}><View style={[styles.fill, { width: `${featured.progress}%` }]} /></View><Text style={styles.percent}>{featured.progress}%</Text></View></View></Pressable>
      <SectionTitle title={t.collection} action={t.seeAll} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameList}>{games.map((game) => <Pressable key={game.title} style={styles.gameCard}><Image source={{ uri: game.image }} style={styles.gameImage} /><View style={styles.gameInfo}><Text numberOfLines={1} style={styles.gameTitle}>{game.title}</Text><Text style={styles.gameSystem}>{game.system}</Text><View style={styles.gameStat}><View style={[styles.dot, { backgroundColor: game.color }]} /><Text style={styles.gamePoints}>{game.points} {t.complete}</Text></View></View></Pressable>)}</ScrollView>
      <SectionTitle title={t.weeklyGoals} action={t.viewProgress} />
      <View style={styles.goalsCard}>{weeklyGoals.map((goal, index) => <View key={goal.label} style={styles.goal}><View style={styles.goalTop}><Text style={styles.goalLabel}>{index === 0 ? t.unlockAchievements : t.hardcore}</Text><Text style={styles.goalValue}>{goal.current}/{goal.total}</Text></View><View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${(goal.current / goal.total) * 100}%`, backgroundColor: goal.color }]} /></View></View>)}</View>
      <CommunityFeed apiKey={apiKey} onOpenSettings={() => setSettingsOpen(true)} />
      </>}
    </ScrollView>
    <View style={[styles.nav, isDesktop && styles.desktopNav]}>{isDesktop && <><View style={styles.desktopBrand}><Text style={styles.brand}>CHECKPOINT</Text><Text style={styles.tagline}>{t.desktopSubtitle}</Text></View><Text style={styles.desktopNavCaption}>{t.navigation}</Text></>}{tabs.map((tab, index) => { const active = activeTab === index; const icon = icons[tab]; return <Pressable key={tab} onPress={() => setActiveTab(index)} style={[styles.navItem, isDesktop && styles.desktopNavItem, active && isDesktop && styles.desktopNavItemActive]}><Ionicons name={active ? icon : `${icon}-outline` as keyof typeof Ionicons.glyphMap} size={21} color={active ? '#ffe36d' : '#747c91'} /><Text style={[styles.navText, isDesktop && styles.desktopNavText, active && styles.navTextActive]}>{tab}</Text></Pressable>; })}{isDesktop && <Pressable onPress={() => setSettingsOpen(true)} style={styles.desktopNavFooter}><Feather name="settings" size={17} color="#858ca1" /><Text style={styles.desktopSettings}>{t.settings}</Text></Pressable>}</View>
    <Modal transparent visible={settingsOpen} animationType="fade" onRequestClose={() => setSettingsOpen(false)}><View style={styles.modalOverlay}><View style={styles.modalCard}><View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{t.settingsTitle}</Text><Text style={styles.modalDescription}>{t.settingsDescription}</Text></View><Pressable onPress={() => setSettingsOpen(false)} style={styles.closeButton}><Feather name="x" size={20} color="#d6d9e5" /></Pressable></View><Text style={styles.fieldLabel}>{t.username}</Text><TextInput autoCapitalize="none" autoCorrect={false} value={username} onChangeText={(value) => { setUsername(value); setCredentialsError(false); }} placeholder="RetroAchievements username" placeholderTextColor="#747c91" style={styles.modalInput} /><Text style={styles.fieldLabel}>{t.apiKey}</Text><TextInput autoCapitalize="none" autoCorrect={false} secureTextEntry value={apiKey} onChangeText={(value) => { setApiKey(value); setCredentialsError(false); }} placeholder="••••••••••••••••" placeholderTextColor="#747c91" style={styles.modalInput} /><Text style={styles.keyHint}>{t.apiKeyHint}</Text><Text style={styles.storageNotice}>{t.storageNotice}</Text>{credentialsError && <Text style={styles.credentialsError}>{t.credentialsRequired}</Text>}{saved && <Text style={styles.savedMessage}>{t.saved}</Text>}<Pressable onPress={handleSaveCredentials} style={styles.saveButton}><Text style={styles.saveButtonText}>{t.save}</Text></Pressable><View style={styles.modalFooter}><Pressable onPress={handleClearCredentials}><Text style={styles.removeText}>{t.remove}</Text></Pressable><Pressable onPress={() => setSettingsOpen(false)}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable></View></View></View></Modal>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#11131b' }, page: { flex: 1, backgroundColor: '#11131b', maxWidth: 720, width: '100%', alignSelf: 'center' }, desktopPage: { maxWidth: '100%', alignSelf: 'stretch' }, content: { padding: 20, paddingBottom: 112 }, desktopContent: { paddingLeft: 276, paddingRight: 42, paddingBottom: 44, width: '100%', maxWidth: '100%', alignSelf: 'stretch' }, topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, desktopTopbar: { height: 64, borderBottomWidth: 1, borderBottomColor: '#292e3e', marginBottom: 4 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 11 }, settingsButton: { height: 40, width: 40, borderRadius: 20, backgroundColor: '#1c1f2b', borderWidth: 1, borderColor: '#303647', justifyContent: 'center', alignItems: 'center' }, brand: { color: '#fff4ac', fontSize: 20, fontWeight: '900', letterSpacing: 1.2 }, tagline: { color: '#737b91', fontSize: 12, marginTop: 2 }, desktopPageTitle: { color: '#f5f6fb', fontSize: 21, fontWeight: '800', marginTop: 0 }, desktopDate: { marginLeft: 'auto', marginRight: 20, color: '#858ca1', fontSize: 10, fontWeight: '800', letterSpacing: .7 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8764e8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#b49dff' }, avatarText: { color: 'white', fontSize: 16, fontWeight: '800' }, search: { height: 48, marginTop: 25, borderRadius: 14, backgroundColor: '#1c1f2b', paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#2b3040' }, input: { flex: 1, color: '#f5f6fb', marginLeft: 10, fontSize: 14 }, greeting: { marginTop: 28, marginBottom: 16 }, eyebrow: { color: '#a993ff', fontWeight: '800', fontSize: 11, letterSpacing: 1.3 }, headline: { color: '#f7f7fb', fontSize: 26, fontWeight: '800', lineHeight: 32, marginTop: 6 }, overview: { minHeight: 70, borderWidth: 1, borderColor: '#292e3e', borderRadius: 16, backgroundColor: '#1c1f2b', flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, overviewItem: { flex: 1, alignItems: 'center' }, overviewValue: { color: '#f4f5f9', fontSize: 15, fontWeight: '900' }, overviewLabel: { color: '#858ca1', fontSize: 8, fontWeight: '800', letterSpacing: .5, marginTop: 5, textAlign: 'center' }, overviewDivider: { height: 28, width: 1, backgroundColor: '#323747' }, hero: { height: 236, borderRadius: 20, overflow: 'hidden', backgroundColor: '#272337', justifyContent: 'flex-end' }, desktopHero: { height: 320 }, heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: .85 }, heroShade: { ...StyleSheet.absoluteFillObject }, heroCopy: { padding: 18 }, nowPlaying: { color: '#fff0a3', fontWeight: '900', fontSize: 10, letterSpacing: 1.1 }, heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 5 }, heroSystem: { color: '#cbcdd7', fontSize: 13, marginTop: 2 }, progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 }, track: { flex: 1, height: 6, backgroundColor: '#515363', borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', backgroundColor: '#ffe36d', borderRadius: 3 }, percent: { color: '#fff', fontSize: 12, fontWeight: '800', marginLeft: 9 }, sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 29, marginBottom: 13 }, sectionTitle: { color: '#f6f7fb', fontSize: 18, fontWeight: '800' }, action: { color: '#a993ff', fontSize: 13, fontWeight: '700' }, gameList: { gap: 12, paddingRight: 20 }, gameCard: { width: 152, borderRadius: 15, backgroundColor: '#1c1f2b', overflow: 'hidden', borderWidth: 1, borderColor: '#292e3e' }, gameImage: { height: 91, width: '100%', backgroundColor: '#363b4d' }, gameInfo: { padding: 11 }, gameTitle: { color: '#f5f6fb', fontSize: 13, fontWeight: '800' }, gameSystem: { color: '#858ca1', fontSize: 11, marginTop: 3 }, gameStat: { flexDirection: 'row', alignItems: 'center', marginTop: 9 }, dot: { height: 6, width: 6, borderRadius: 3, marginRight: 5 }, gamePoints: { color: '#b7bccb', fontSize: 10, fontWeight: '600' }, goalsCard: { backgroundColor: '#1c1f2b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#292e3e', gap: 16 }, goal: { gap: 8 }, goalTop: { flexDirection: 'row', justifyContent: 'space-between' }, goalLabel: { color: '#e7e9f0', fontSize: 13, fontWeight: '700' }, goalValue: { color: '#b9bfd0', fontSize: 12, fontWeight: '800' }, goalTrack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#343949' }, goalFill: { height: '100%', borderRadius: 3 }, activity: { backgroundColor: '#1c1f2b', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#292e3e' }, liveDot: { height: 9, width: 9, borderRadius: 5, backgroundColor: '#55db8c', marginRight: 12 }, activityText: { flex: 1 }, activityTitle: { color: '#eceef5', fontSize: 14, fontWeight: '800' }, activitySub: { color: '#858ca1', fontSize: 12, marginTop: 3 }, nav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: '#171923', borderTopWidth: 1, borderColor: '#292d3b', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 11 }, desktopNav: { top: 0, bottom: 0, right: undefined, width: 232, height: undefined, borderTopWidth: 0, borderRightWidth: 1, borderRightColor: '#292d3b', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', paddingTop: 35, paddingHorizontal: 14 }, desktopBrand: { paddingHorizontal: 12, marginBottom: 42 }, desktopNavCaption: { color: '#697187', fontWeight: '800', fontSize: 9, letterSpacing: 1, paddingHorizontal: 12, marginBottom: 10 }, navItem: { alignItems: 'center', minWidth: 60 }, desktopNavItem: { flexDirection: 'row', alignItems: 'center', minWidth: 0, height: 46, borderRadius: 10, paddingHorizontal: 12, marginBottom: 4 }, desktopNavItemActive: { backgroundColor: '#2b293b' }, navText: { color: '#747c91', fontSize: 10, marginTop: 5, fontWeight: '700' }, desktopNavText: { fontSize: 13, marginTop: 0, marginLeft: 12 }, navTextActive: { color: '#ffe36d' }, desktopNavFooter: { marginTop: 'auto', marginBottom: 18, padding: 12, flexDirection: 'row', alignItems: 'center' }, desktopSettings: { color: '#858ca1', fontSize: 12, marginLeft: 10, fontWeight: '700' }, modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 6, 10, .78)', justifyContent: 'center', alignItems: 'center', padding: 20 }, modalCard: { width: '100%', maxWidth: 460, backgroundColor: '#1b1e29', borderRadius: 22, padding: 22, borderWidth: 1, borderColor: '#3a4053' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 }, modalTitle: { color: '#f7f8fc', fontSize: 20, fontWeight: '800' }, modalDescription: { color: '#949bae', fontSize: 13, marginTop: 6, maxWidth: 340, lineHeight: 18 }, closeButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }, fieldLabel: { color: '#dfe2ec', fontSize: 12, fontWeight: '800', marginBottom: 7 }, modalInput: { height: 48, borderRadius: 12, backgroundColor: '#12141d', borderWidth: 1, borderColor: '#353b4d', color: '#f7f8fc', paddingHorizontal: 14, fontSize: 14, marginBottom: 14 }, keyHint: { color: '#828ba1', fontSize: 11, lineHeight: 16, marginTop: -6, marginBottom: 16 }, storageNotice: { color: '#abb2c4', fontSize: 11, lineHeight: 16, backgroundColor: '#262a38', padding: 12, borderRadius: 10 }, credentialsError: { color: '#f5a8ac', fontSize: 12, fontWeight: '700', marginTop: 12 }, savedMessage: { color: '#70e0a1', fontSize: 12, fontWeight: '700', marginTop: 12 }, saveButton: { height: 48, borderRadius: 13, marginTop: 18, backgroundColor: '#ffe36d', justifyContent: 'center', alignItems: 'center' }, saveButtonText: { color: '#20220f', fontSize: 14, fontWeight: '900' }, modalFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingHorizontal: 4 }, removeText: { color: '#f39499', fontSize: 12, fontWeight: '700' }, cancelText: { color: '#b6bdcd', fontSize: 12, fontWeight: '700' }
});
