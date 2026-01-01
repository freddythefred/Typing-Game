import type { DifficultyId } from '../config/difficulty'
import type { LanguageId } from '../data/wordBank'

export type I18nKey =
  | 'common.back'
  | 'common.cancel'
  | 'common.continue'
  | 'common.delete'
  | 'common.ok'
  | 'common.rename'
  | 'difficulty.level'
  | 'game.endGame'
  | 'hud.accuracy'
  | 'hud.best'
  | 'hud.combo'
  | 'hud.lives'
  | 'hud.score'
  | 'menu.best'
  | 'menu.changeProfile'
  | 'menu.chooseMode'
  | 'menu.phrases'
  | 'menu.play'
  | 'menu.settings'
  | 'menu.tagline'
  | 'menu.title'
  | 'menu.words'
  | 'profile.addProfile'
  | 'profile.deleteConfirm'
  | 'profile.fallbackName'
  | 'profile.maxProfiles'
  | 'profile.nameRequired'
  | 'profile.namePrompt'
  | 'profile.newNameRequired'
  | 'profile.newNamePrompt'
  | 'profile.title'
  | 'result.accuracy'
  | 'result.backToMenu'
  | 'result.bestScore'
  | 'result.bubblesPopped'
  | 'result.charsPerSec'
  | 'result.longestStreak'
  | 'result.newBest'
  | 'result.playAgain'
  | 'result.score'
  | 'result.title'
  | 'settings.language'
  | 'settings.title'
  | 'settings.volumeDown'
  | 'settings.volumeUp'

type MessageValue = string

const MESSAGES: Record<LanguageId, Record<I18nKey, MessageValue>> = {
  en: {
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.continue': 'Continue',
    'common.delete': 'Delete',
    'common.ok': 'OK',
    'common.rename': 'Rename',
    'difficulty.level': 'Level {level}',
    'game.endGame': 'End Game',
    'hud.accuracy': 'Accuracy {value}%',
    'hud.best': 'Best {value}',
    'hud.combo': 'COMBO',
    'hud.lives': 'Lives {value}/5',
    'hud.score': 'SCORE',
    'menu.best': 'Best: {value}',
    'menu.changeProfile': 'Change Profile',
    'menu.chooseMode': 'Choose Mode',
    'menu.phrases': 'Phrases',
    'menu.play': 'Play',
    'menu.settings': 'Settings',
    'menu.tagline': 'Type fast. Stay afloat.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Words',
    'profile.addProfile': 'Add Profile',
    'profile.deleteConfirm': 'Delete profile "{name}"?',
    'profile.fallbackName': 'Profile',
    'profile.maxProfiles': 'Maximum {max} profiles.',
    'profile.nameRequired': 'Please enter a profile name.',
    'profile.namePrompt': 'Profile name?',
    'profile.newNameRequired': 'Please enter a new profile name.',
    'profile.newNamePrompt': 'New profile name?',
    'profile.title': 'Choose Profile',
    'result.accuracy': 'Accuracy: {value}%',
    'result.backToMenu': 'Back to Menu',
    'result.bestScore': 'Best Score: {value}{newBest}',
    'result.bubblesPopped': 'Bubbles Popped: {value}',
    'result.charsPerSec': 'Chars/sec: {value}',
    'result.longestStreak': 'Longest Streak: {value}',
    'result.newBest': ' (NEW!)',
    'result.playAgain': 'Play Again',
    'result.score': 'Score: {value}',
    'result.title': 'Run Complete',
    'settings.language': 'Language',
    'settings.title': 'Settings',
    'settings.volumeDown': 'Volume -',
    'settings.volumeUp': 'Volume +'
  },
  fr: {
    'common.back': 'Retour',
    'common.cancel': 'Annuler',
    'common.continue': 'Continuer',
    'common.delete': 'Supprimer',
    'common.ok': 'OK',
    'common.rename': 'Renommer',
    'difficulty.level': 'Niveau {level}',
    'game.endGame': 'Terminer',
    'hud.accuracy': 'Précision {value}%',
    'hud.best': 'Record {value}',
    'hud.combo': 'SÉRIE',
    'hud.lives': 'Vies {value}/5',
    'hud.score': 'SCORE',
    'menu.best': 'Record : {value}',
    'menu.changeProfile': 'Changer de profil',
    'menu.chooseMode': 'Choisir un mode',
    'menu.phrases': 'Phrases',
    'menu.play': 'Jouer',
    'menu.settings': 'Options',
    'menu.tagline': 'Tape vite. Reste à flot.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Mots',
    'profile.addProfile': 'Ajouter un profil',
    'profile.deleteConfirm': 'Supprimer le profil « {name} » ?',
    'profile.fallbackName': 'Profil',
    'profile.maxProfiles': 'Maximum {max} profils.',
    'profile.nameRequired': 'Saisis un nom de profil.',
    'profile.namePrompt': 'Nom du profil ?',
    'profile.newNameRequired': 'Saisis un nouveau nom de profil.',
    'profile.newNamePrompt': 'Nouveau nom du profil ?',
    'profile.title': 'Choisir un profil',
    'result.accuracy': 'Précision : {value}%',
    'result.backToMenu': 'Menu',
    'result.bestScore': 'Meilleur score : {value}{newBest}',
    'result.bubblesPopped': 'Bulles éclatées : {value}',
    'result.charsPerSec': 'Car./s : {value}',
    'result.longestStreak': 'Série max : {value}',
    'result.newBest': ' (NOUVEAU !)',
    'result.playAgain': 'Rejouer',
    'result.score': 'Score : {value}',
    'result.title': 'Partie terminée',
    'settings.language': 'Langue',
    'settings.title': 'Options',
    'settings.volumeDown': 'Volume -',
    'settings.volumeUp': 'Volume +'
  },
  es: {
    'common.back': 'Volver',
    'common.cancel': 'Cancelar',
    'common.continue': 'Continuar',
    'common.delete': 'Eliminar',
    'common.ok': 'OK',
    'common.rename': 'Renombrar',
    'difficulty.level': 'Nivel {level}',
    'game.endGame': 'Terminar',
    'hud.accuracy': 'Precisión {value}%',
    'hud.best': 'Récord {value}',
    'hud.combo': 'RACHA',
    'hud.lives': 'Vidas {value}/5',
    'hud.score': 'PUNTOS',
    'menu.best': 'Récord: {value}',
    'menu.changeProfile': 'Cambiar perfil',
    'menu.chooseMode': 'Elegir modo',
    'menu.phrases': 'Frases',
    'menu.play': 'Jugar',
    'menu.settings': 'Ajustes',
    'menu.tagline': 'Escribe rápido. Mantente a flote.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Palabras',
    'profile.addProfile': 'Añadir perfil',
    'profile.deleteConfirm': '¿Eliminar el perfil "{name}"?',
    'profile.fallbackName': 'Perfil',
    'profile.maxProfiles': 'Máximo {max} perfiles.',
    'profile.nameRequired': 'Introduce un nombre de perfil.',
    'profile.namePrompt': '¿Nombre del perfil?',
    'profile.newNameRequired': 'Introduce un nuevo nombre de perfil.',
    'profile.newNamePrompt': '¿Nuevo nombre del perfil?',
    'profile.title': 'Elegir perfil',
    'result.accuracy': 'Precisión: {value}%',
    'result.backToMenu': 'Volver al menú',
    'result.bestScore': 'Mejor puntuación: {value}{newBest}',
    'result.bubblesPopped': 'Burbujas reventadas: {value}',
    'result.charsPerSec': 'Car./s: {value}',
    'result.longestStreak': 'Racha más larga: {value}',
    'result.newBest': ' (¡NUEVO!)',
    'result.playAgain': 'Jugar de nuevo',
    'result.score': 'Puntuación: {value}',
    'result.title': 'Partida completa',
    'settings.language': 'Idioma',
    'settings.title': 'Ajustes',
    'settings.volumeDown': 'Volumen -',
    'settings.volumeUp': 'Volumen +'
  },
  it: {
    'common.back': 'Indietro',
    'common.cancel': 'Annulla',
    'common.continue': 'Continua',
    'common.delete': 'Elimina',
    'common.ok': 'OK',
    'common.rename': 'Rinomina',
    'difficulty.level': 'Livello {level}',
    'game.endGame': 'Termina',
    'hud.accuracy': 'Precisione {value}%',
    'hud.best': 'Record {value}',
    'hud.combo': 'SERIE',
    'hud.lives': 'Vite {value}/5',
    'hud.score': 'PUNTI',
    'menu.best': 'Record: {value}',
    'menu.changeProfile': 'Cambia profilo',
    'menu.chooseMode': 'Scegli modalità',
    'menu.phrases': 'Frasi',
    'menu.play': 'Gioca',
    'menu.settings': 'Impostazioni',
    'menu.tagline': 'Scrivi veloce. Resta a galla.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Parole',
    'profile.addProfile': 'Aggiungi profilo',
    'profile.deleteConfirm': 'Eliminare il profilo "{name}"?',
    'profile.fallbackName': 'Profilo',
    'profile.maxProfiles': 'Massimo {max} profili.',
    'profile.nameRequired': 'Inserisci un nome profilo.',
    'profile.namePrompt': 'Nome profilo?',
    'profile.newNameRequired': 'Inserisci un nuovo nome profilo.',
    'profile.newNamePrompt': 'Nuovo nome profilo?',
    'profile.title': 'Scegli profilo',
    'result.accuracy': 'Precisione: {value}%',
    'result.backToMenu': 'Menu',
    'result.bestScore': 'Miglior punteggio: {value}{newBest}',
    'result.bubblesPopped': 'Bolle scoppiate: {value}',
    'result.charsPerSec': 'Car./s: {value}',
    'result.longestStreak': 'Serie più lunga: {value}',
    'result.newBest': ' (NUOVO!)',
    'result.playAgain': 'Gioca ancora',
    'result.score': 'Punteggio: {value}',
    'result.title': 'Partita finita',
    'settings.language': 'Lingua',
    'settings.title': 'Impostazioni',
    'settings.volumeDown': 'Volume -',
    'settings.volumeUp': 'Volume +'
  },
  de: {
    'common.back': 'Zurück',
    'common.cancel': 'Abbrechen',
    'common.continue': 'Weiter',
    'common.delete': 'Löschen',
    'common.ok': 'OK',
    'common.rename': 'Umbenennen',
    'difficulty.level': 'Stufe {level}',
    'game.endGame': 'Beenden',
    'hud.accuracy': 'Genauigkeit {value}%',
    'hud.best': 'Bestwert {value}',
    'hud.combo': 'KOMBO',
    'hud.lives': 'Leben {value}/5',
    'hud.score': 'PUNKTE',
    'menu.best': 'Bestwert: {value}',
    'menu.changeProfile': 'Profil wechseln',
    'menu.chooseMode': 'Modus wählen',
    'menu.phrases': 'Sätze',
    'menu.play': 'Spielen',
    'menu.settings': 'Einstellungen',
    'menu.tagline': 'Tippe schnell. Bleib über Wasser.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Wörter',
    'profile.addProfile': 'Profil hinzufügen',
    'profile.deleteConfirm': 'Profil "{name}" löschen?',
    'profile.fallbackName': 'Profil',
    'profile.maxProfiles': 'Maximal {max} Profile.',
    'profile.nameRequired': 'Bitte einen Profilnamen eingeben.',
    'profile.namePrompt': 'Profilname?',
    'profile.newNameRequired': 'Bitte einen neuen Profilnamen eingeben.',
    'profile.newNamePrompt': 'Neuer Profilname?',
    'profile.title': 'Profil wählen',
    'result.accuracy': 'Genauigkeit: {value}%',
    'result.backToMenu': 'Zum Menü',
    'result.bestScore': 'Bestwert: {value}{newBest}',
    'result.bubblesPopped': 'Blasen geplatzt: {value}',
    'result.charsPerSec': 'Zeichen/s: {value}',
    'result.longestStreak': 'Längste Serie: {value}',
    'result.newBest': ' (NEU!)',
    'result.playAgain': 'Nochmal spielen',
    'result.score': 'Punkte: {value}',
    'result.title': 'Runde beendet',
    'settings.language': 'Sprache',
    'settings.title': 'Einstellungen',
    'settings.volumeDown': 'Lautstärke -',
    'settings.volumeUp': 'Lautstärke +'
  },
  ru: {
    'common.back': 'Назад',
    'common.cancel': 'Отмена',
    'common.continue': 'Продолжить',
    'common.delete': 'Удалить',
    'common.ok': 'OK',
    'common.rename': 'Переименовать',
    'difficulty.level': 'Уровень {level}',
    'game.endGame': 'Завершить',
    'hud.accuracy': 'Точность {value}%',
    'hud.best': 'Рекорд {value}',
    'hud.combo': 'КОМБО',
    'hud.lives': 'Жизни {value}/5',
    'hud.score': 'СЧЁТ',
    'menu.best': 'Рекорд: {value}',
    'menu.changeProfile': 'Сменить профиль',
    'menu.chooseMode': 'Выбор режима',
    'menu.phrases': 'Фразы',
    'menu.play': 'Играть',
    'menu.settings': 'Настройки',
    'menu.tagline': 'Печатай быстро. Держись на плаву.',
    'menu.title': 'Bubble Type',
    'menu.words': 'Слова',
    'profile.addProfile': 'Добавить профиль',
    'profile.deleteConfirm': 'Удалить профиль «{name}»?',
    'profile.fallbackName': 'Профиль',
    'profile.maxProfiles': 'Максимум профилей: {max}.',
    'profile.nameRequired': 'Введите имя профиля.',
    'profile.namePrompt': 'Имя профиля?',
    'profile.newNameRequired': 'Введите новое имя профиля.',
    'profile.newNamePrompt': 'Новое имя профиля?',
    'profile.title': 'Выбор профиля',
    'result.accuracy': 'Точность: {value}%',
    'result.backToMenu': 'В меню',
    'result.bestScore': 'Рекорд: {value}{newBest}',
    'result.bubblesPopped': 'Лопнуто пузырей: {value}',
    'result.charsPerSec': 'Симв./с: {value}',
    'result.longestStreak': 'Лучшая серия: {value}',
    'result.newBest': ' (НОВЫЙ!)',
    'result.playAgain': 'Сыграть ещё',
    'result.score': 'Счёт: {value}',
    'result.title': 'Забег завершён',
    'settings.language': 'Язык',
    'settings.title': 'Настройки',
    'settings.volumeDown': 'Громкость -',
    'settings.volumeUp': 'Громкость +'
  },
  ar: {
    'common.back': 'رجوع',
    'common.cancel': 'إلغاء',
    'common.continue': 'متابعة',
    'common.delete': 'حذف',
    'common.ok': 'حسناً',
    'common.rename': 'إعادة تسمية',
    'difficulty.level': 'المستوى {level}',
    'game.endGame': 'إنهاء',
    'hud.accuracy': 'الدقة {value}%',
    'hud.best': 'أفضل {value}',
    'hud.combo': 'سلسلة',
    'hud.lives': 'الحياة {value}/5',
    'hud.score': 'النقاط',
    'menu.best': 'أفضل: {value}',
    'menu.changeProfile': 'تغيير الملف',
    'menu.chooseMode': 'اختر الوضع',
    'menu.phrases': 'عبارات',
    'menu.play': 'ابدأ',
    'menu.settings': 'الإعدادات',
    'menu.tagline': 'اكتب بسرعة. ابقَ طافياً.',
    'menu.title': 'Bubble Type',
    'menu.words': 'كلمات',
    'profile.addProfile': 'إضافة ملف',
    'profile.deleteConfirm': 'حذف الملف \"{name}\"؟',
    'profile.fallbackName': 'ملف',
    'profile.maxProfiles': 'الحد الأقصى {max} ملفات.',
    'profile.nameRequired': 'يرجى إدخال اسم للملف.',
    'profile.namePrompt': 'اسم الملف؟',
    'profile.newNameRequired': 'يرجى إدخال اسم جديد للملف.',
    'profile.newNamePrompt': 'اسم جديد للملف؟',
    'profile.title': 'اختر ملفاً',
    'result.accuracy': 'الدقة: {value}%',
    'result.backToMenu': 'العودة للقائمة',
    'result.bestScore': 'أفضل نتيجة: {value}{newBest}',
    'result.bubblesPopped': 'فقاعات مفقوعة: {value}',
    'result.charsPerSec': 'حرف/ث: {value}',
    'result.longestStreak': 'أطول سلسلة: {value}',
    'result.newBest': ' (جديد!)',
    'result.playAgain': 'العب مجدداً',
    'result.score': 'النقاط: {value}',
    'result.title': 'انتهت الجولة',
    'settings.language': 'اللغة',
    'settings.title': 'الإعدادات',
    'settings.volumeDown': 'الصوت -',
    'settings.volumeUp': 'الصوت +'
  }
}

function getLocale(language: LanguageId): string {
  // Keep simple: use BCP-47 base tags (browser will pick regional defaults).
  return language
}

export function formatInt(language: LanguageId, value: number) {
  return new Intl.NumberFormat(getLocale(language), { maximumFractionDigits: 0 }).format(value)
}

export function formatFixed(language: LanguageId, value: number, digits: number) {
  return new Intl.NumberFormat(getLocale(language), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    value
  )
}

export function t(language: LanguageId, key: I18nKey, vars?: Record<string, string | number>) {
  const template = MESSAGES[language]?.[key] ?? MESSAGES.en[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => String(vars[name] ?? `{${name}}`))
}

export function difficultyLevelFor(id: DifficultyId): 1 | 2 | 3 {
  if (id === 'level1' || id === 'extra') return 1
  if (id === 'level2' || id === 'phrases2') return 2
  return 3
}

export function difficultyLabel(language: LanguageId, id: DifficultyId) {
  return t(language, 'difficulty.level', { level: difficultyLevelFor(id) })
}
