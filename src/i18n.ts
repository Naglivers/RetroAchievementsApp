import { getLocales, useLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { createContext, createElement, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { dashboardTranslations } from './locales/dashboard';
import { exploreTranslations } from './locales/explore';
import { gameTranslations } from './locales/game';

const translations = {
  pt: {
    subtitle: 'Seu universo retro, em progresso.',
    desktopSubtitle: 'Retro, do seu jeito.',
    overview: 'Visão geral',
    navigation: 'NAVEGAÇÃO',
    settings: 'Configurações',
    preferencesDescription: 'Escolha o idioma do app e conecte sua conta.',
    language: 'Idioma',
    languageAutomatic: 'Automático (sistema)',
    languageHint: 'No modo automático, o app acompanha o idioma do sistema. As conquistas e os dados do RetroAchievements mantêm o idioma original.',
    languageSaveError: 'Não foi possível salvar o idioma. A escolha será mantida até fechar o app. Toque no idioma para tentar novamente.',
    usernamePlaceholder: 'Seu usuário do RetroAchievements',
    search: 'Buscar jogos, jogadores, conquistas',
    greeting: 'BOA NOITE, NAGLI',
    headline: 'Pronto para mais uma conquista?',
    points: 'PONTOS',
    gamesPlayed: 'JOGOS JOGADOS',
    masteries: 'MAESTRIAS',
    continuePlaying: 'CONTINUE JOGANDO',
    collection: 'Sua coleção',
    seeAll: 'Ver tudo',
    complete: 'concluído',
    weeklyGoals: 'Metas da semana',
    viewProgress: 'Ver progresso',
    unlockAchievements: 'Desbloquear conquistas',
    hardcore: 'Jogar em hardcore',
    happeningNow: 'Acontecendo agora',
    live: 'Ao vivo',
    playersActive: '5.713 jogadores estão em jogo',
    activityDescription: 'Veja quem está desbloqueando conquistas agora.',
    home: 'Início', explore: 'Explorar', activity: 'Atividade', profile: 'Perfil',
    settingsTitle: 'Conectar RetroAchievements',
    settingsDescription: 'Adicione suas credenciais para personalizar sua experiência.',
    username: 'Nome de usuário', apiKey: 'Web API Key',
    apiKeyHint: 'Encontre-a no painel de controle da sua conta RetroAchievements.',
    storageNotice: 'No celular, a chave é guardada no armazenamento protegido do dispositivo. Na web, ela fica no armazenamento local deste navegador.',
    save: 'Salvar credenciais', saved: 'Credenciais salvas neste dispositivo.',
    cancel: 'Cancelar', remove: 'Remover dados locais',
    credentialsRequired: 'Preencha o nome de usuário e a Web API Key para salvar.',
    activityFeedTitle: 'Sua atividade', activityFeedDescription: 'Suas conquistas desbloqueadas recentemente.', refresh: 'Atualizar', retry: 'Tentar novamente', activityLoading: 'Carregando atividade…', activityError: 'Não foi possível carregar a atividade. Confira a sua chave e tente novamente.', activityConnectTitle: 'Conecte sua conta para ver sua atividade', activityConnectDescription: 'O histórico usa o usuário e a Web API Key salvos neste dispositivo.', activityMissingUsername: 'Adicione também o seu nome de usuário do RetroAchievements nas configurações.', noRecentActivity: 'Nenhuma conquista desbloqueada nos últimos 7 dias.', communityTitle: 'Comunidade em movimento', communityDescription: 'Jogos recém-finalizados pela comunidade.', communityConnect: 'Conecte sua chave para ver a comunidade',
  },
  en: {
    subtitle: 'Your retro universe, in progress.',
    desktopSubtitle: 'Retro, your way.',
    overview: 'Overview',
    navigation: 'NAVIGATION',
    settings: 'Settings',
    preferencesDescription: 'Choose the app language and connect your account.',
    language: 'Language',
    languageAutomatic: 'Automatic (system)',
    languageHint: 'Automatic mode follows your system language. Achievements and RetroAchievements data stay in their original language.',
    languageSaveError: 'Could not save the language. Your choice will last until you close the app. Select the language to try again.',
    usernamePlaceholder: 'Your RetroAchievements username',
    search: 'Search games, players, achievements',
    greeting: 'GOOD EVENING, NAGLI',
    headline: 'Ready for another achievement?',
    points: 'POINTS',
    gamesPlayed: 'GAMES PLAYED',
    masteries: 'MASTERIES',
    continuePlaying: 'CONTINUE PLAYING',
    collection: 'Your collection',
    seeAll: 'See all',
    complete: 'complete',
    weeklyGoals: 'Weekly goals',
    viewProgress: 'View progress',
    unlockAchievements: 'Unlock achievements',
    hardcore: 'Play hardcore',
    happeningNow: 'Happening now',
    live: 'Live',
    playersActive: '5,713 players are in-game',
    activityDescription: 'See who is unlocking achievements right now.',
    home: 'Home', explore: 'Explore', activity: 'Activity', profile: 'Profile',
    settingsTitle: 'Connect RetroAchievements',
    settingsDescription: 'Add your credentials to personalize your experience.',
    username: 'Username', apiKey: 'Web API Key',
    apiKeyHint: 'Find it in your RetroAchievements account control panel.',
    storageNotice: 'On mobile, your key is stored in protected device storage. On the web, it stays in this browser’s local storage.',
    save: 'Save credentials', saved: 'Credentials saved on this device.',
    cancel: 'Cancel', remove: 'Remove local data',
    credentialsRequired: 'Enter a username and Web API Key before saving.',
    activityFeedTitle: 'Your activity', activityFeedDescription: 'Your recently unlocked achievements.', refresh: 'Refresh', retry: 'Try again', activityLoading: 'Loading activity…', activityError: 'We could not load activity. Check your key and try again.', activityConnectTitle: 'Connect your account to view your activity', activityConnectDescription: 'Your history uses the username and RetroAchievements Web API Key saved on this device.', activityMissingUsername: 'Also add your RetroAchievements username in Settings.', noRecentActivity: 'No achievements unlocked in the last 7 days.', communityTitle: 'Community in motion', communityDescription: 'Games recently completed by the community.', communityConnect: 'Connect your key to see the community',
  },
  es: {
    subtitle: 'Tu universo retro, en progreso.',
    desktopSubtitle: 'Retro, a tu manera.',
    overview: 'Resumen',
    navigation: 'NAVEGACIÓN',
    settings: 'Ajustes',
    preferencesDescription: 'Elige el idioma de la app y conecta tu cuenta.',
    language: 'Idioma',
    languageAutomatic: 'Automático (sistema)',
    languageHint: 'El modo automático sigue el idioma del sistema. Los logros y los datos de RetroAchievements conservan su idioma original.',
    languageSaveError: 'No se pudo guardar el idioma. Tu elección se mantendrá hasta cerrar la app. Selecciona el idioma para volver a intentarlo.',
    usernamePlaceholder: 'Tu usuario de RetroAchievements',
    search: 'Buscar juegos, jugadores, logros',
    greeting: 'BUENAS NOCHES, NAGLI',
    headline: '¿Listo para otro logro?',
    points: 'PUNTOS',
    gamesPlayed: 'JUEGOS JUGADOS',
    masteries: 'MAESTRÍAS',
    continuePlaying: 'SIGUE JUGANDO',
    collection: 'Tu colección',
    seeAll: 'Ver todo',
    complete: 'completado',
    weeklyGoals: 'Metas semanales',
    viewProgress: 'Ver progreso',
    unlockAchievements: 'Desbloquear logros',
    hardcore: 'Jugar en hardcore',
    happeningNow: 'Sucediendo ahora',
    live: 'En vivo',
    playersActive: '5.713 jugadores están jugando',
    activityDescription: 'Mira quién está desbloqueando logros ahora.',
    home: 'Inicio', explore: 'Explorar', activity: 'Actividad', profile: 'Perfil',
    settingsTitle: 'Conectar RetroAchievements',
    settingsDescription: 'Agrega tus credenciales para personalizar tu experiencia.',
    username: 'Nombre de usuario', apiKey: 'Web API Key',
    apiKeyHint: 'Encuéntrala en el panel de control de tu cuenta RetroAchievements.',
    storageNotice: 'En el móvil, la clave se guarda en el almacenamiento protegido del dispositivo. En la web, queda en el almacenamiento local de este navegador.',
    save: 'Guardar credenciales', saved: 'Credenciales guardadas en este dispositivo.',
    cancel: 'Cancelar', remove: 'Eliminar datos locales',
    credentialsRequired: 'Completa el nombre de usuario y la Web API Key antes de guardar.',
    activityFeedTitle: 'Tu actividad', activityFeedDescription: 'Tus logros desbloqueados recientemente.', refresh: 'Actualizar', retry: 'Intentar de nuevo', activityLoading: 'Cargando actividad…', activityError: 'No se pudo cargar la actividad. Revisa tu clave e inténtalo de nuevo.', activityConnectTitle: 'Conecta tu cuenta para ver tu actividad', activityConnectDescription: 'El historial usa el nombre de usuario y la Web API Key guardados en este dispositivo.', activityMissingUsername: 'Agrega también tu nombre de usuario de RetroAchievements en Ajustes.', noRecentActivity: 'No desbloqueaste logros en los últimos 7 días.', communityTitle: 'Comunidad en movimiento', communityDescription: 'Juegos terminados recientemente por la comunidad.', communityConnect: 'Conecta tu clave para ver la comunidad',
  },
} as const;

export type SupportedLanguage = keyof typeof translations;
export type LanguagePreference = SupportedLanguage | 'system';

export const supportedLanguages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const;

const LANGUAGE_KEY = 'checkpoint.language';

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return value === 'pt' || value === 'en' || value === 'es';
}

function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'system' || isSupportedLanguage(value);
}

function getLanguagePreference(): LanguagePreference {
  try {
    if (Platform.OS === 'web') {
      const saved = globalThis.localStorage?.getItem(LANGUAGE_KEY);
      if (isLanguagePreference(saved)) return saved;
    }
  } catch { /* Use the device language if browser storage is unavailable. */ }
  return 'system';
}

function resolveSystemLanguage(locales: readonly { languageCode: string | null }[]): SupportedLanguage {
  for (const locale of locales) {
    const language = locale.languageCode?.toLowerCase().split(/[-_]/)[0];
    if (isSupportedLanguage(language)) return language;
  }
  return 'pt';
}

export function getAppLanguage(): SupportedLanguage {
  const preference = getLanguagePreference();
  if (preference !== 'system') return preference;
  try {
    return resolveSystemLanguage(getLocales());
  } catch { return 'pt'; }
}

export function getTranslation(language = getAppLanguage()) {
  return { ...translations[language], ...dashboardTranslations[language], ...exploreTranslations[language], ...gameTranslations[language] };
}

type LanguageContextValue = {
  language: SupportedLanguage;
  languagePreference: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
  languageSaveError: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locales = useLocales();
  const [languagePreference, updatePreference] = useState<LanguagePreference>(getLanguagePreference);
  const language = languagePreference === 'system' ? resolveSystemLanguage(locales) : languagePreference;
  const [languageSaveError, setLanguageSaveError] = useState(false);
  const revision = useRef(0);
  const writes = useRef(Promise.resolve());

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    SecureStore.getItemAsync(LANGUAGE_KEY).then((saved) => {
      if (active && revision.current === 0 && isLanguagePreference(saved)) updatePreference(saved);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  function setLanguage(next: LanguagePreference) {
    if (!isLanguagePreference(next)) return;
    const currentRevision = ++revision.current;
    updatePreference(next);
    setLanguageSaveError(false);
    // Keep rapid changes in order so the last selection also wins on restart.
    writes.current = writes.current.then(async () => {
      if (Platform.OS === 'web') {
        if (!globalThis.localStorage) throw new Error('Storage unavailable');
        globalThis.localStorage.setItem(LANGUAGE_KEY, next);
      } else {
        await SecureStore.setItemAsync(LANGUAGE_KEY, next);
      }
    }).catch(() => {
      if (revision.current === currentRevision) setLanguageSaveError(true);
    });
  }

  return createElement(LanguageContext.Provider, { value: { language, languagePreference, setLanguage, languageSaveError } }, children);
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return { ...context, t: getTranslation(context.language) };
}
