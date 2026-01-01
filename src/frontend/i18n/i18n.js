import { register, init, getLocaleFromNavigator, locale, addMessages } from 'svelte-i18n';

// Import English synchronously as fallback (always needed)
import en from './locales/en.json';

// Add English messages synchronously so they're available immediately
addMessages('en', en);

// Register all supported languages for lazy loading
// English is already loaded above, but we register it anyway for consistency
register('es', () => import('./locales/es.json'));
register('ca', () => import('./locales/ca.json'));
register('zh-CN', () => import('./locales/zh-CN.json'));
register('zh-TW', () => import('./locales/zh-TW.json'));
register('hi', () => import('./locales/hi.json'));
register('ar', () => import('./locales/ar.json'));
register('bn', () => import('./locales/bn.json'));
register('pt', () => import('./locales/pt.json'));
register('ru', () => import('./locales/ru.json'));
register('ja', () => import('./locales/ja.json'));
register('pa', () => import('./locales/pa.json'));
register('de', () => import('./locales/de.json'));
register('jv', () => import('./locales/jv.json'));
register('ko', () => import('./locales/ko.json'));
register('fr', () => import('./locales/fr.json'));
register('te', () => import('./locales/te.json'));
register('mr', () => import('./locales/mr.json'));
register('tr', () => import('./locales/tr.json'));
register('ta', () => import('./locales/ta.json'));
register('vi', () => import('./locales/vi.json'));
register('ur', () => import('./locales/ur.json'));
register('it', () => import('./locales/it.json'));
register('th', () => import('./locales/th.json'));
register('gu', () => import('./locales/gu.json'));
register('fa', () => import('./locales/fa.json'));
register('pl', () => import('./locales/pl.json'));
register('uk', () => import('./locales/uk.json'));
register('ml', () => import('./locales/ml.json'));
register('kn', () => import('./locales/kn.json'));
register('my', () => import('./locales/my.json'));
register('or', () => import('./locales/or.json'));
register('ro', () => import('./locales/ro.json'));
register('nl', () => import('./locales/nl.json'));
register('hu', () => import('./locales/hu.json'));
register('el', () => import('./locales/el.json'));
register('cs', () => import('./locales/cs.json'));
register('sv', () => import('./locales/sv.json'));
register('he', () => import('./locales/he.json'));
register('id', () => import('./locales/id.json'));
register('ms', () => import('./locales/ms.json'));
register('fil', () => import('./locales/fil.json'));
register('fi', () => import('./locales/fi.json'));
register('sk', () => import('./locales/sk.json'));
register('da', () => import('./locales/da.json'));
register('no', () => import('./locales/no.json'));
register('hr', () => import('./locales/hr.json'));
register('bg', () => import('./locales/bg.json'));
register('sr', () => import('./locales/sr.json'));
register('sl', () => import('./locales/sl.json'));
register('lt', () => import('./locales/lt.json'));
register('lv', () => import('./locales/lv.json'));
register('et', () => import('./locales/et.json'));
register('sw', () => import('./locales/sw.json'));
register('af', () => import('./locales/af.json'));
register('ga', () => import('./locales/ga.json'));
register('cy', () => import('./locales/cy.json'));
register('eu', () => import('./locales/eu.json'));
register('gl', () => import('./locales/gl.json'));
register('is', () => import('./locales/is.json'));
register('mt', () => import('./locales/mt.json'));
register('mk', () => import('./locales/mk.json'));
register('sq', () => import('./locales/sq.json'));
register('ka', () => import('./locales/ka.json'));
register('hy', () => import('./locales/hy.json'));
register('az', () => import('./locales/az.json'));
register('kk', () => import('./locales/kk.json'));
register('uz', () => import('./locales/uz.json'));
register('ne', () => import('./locales/ne.json'));
register('si', () => import('./locales/si.json'));
register('km', () => import('./locales/km.json'));
register('lo', () => import('./locales/lo.json'));
register('am', () => import('./locales/am.json'));
register('zu', () => import('./locales/zu.json'));
register('yo', () => import('./locales/yo.json'));
register('ig', () => import('./locales/ig.json'));
register('ha', () => import('./locales/ha.json'));
register('tlh', () => import('./locales/tlh.json'));
register('en-pirate', () => import('./locales/en-pirate.json'));
register('gal', () => import('./locales/gal.json'));

// Language metadata for the selector
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: 'img:ca' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերdelays', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'tlh', name: 'Klingon', nativeName: 'tlhIngan Hol', flag: '🖖' },
  { code: 'en-pirate', name: 'Pirate English', nativeName: 'Pirate Speak', flag: '🏴‍☠️' },
  { code: 'gal', name: 'Enchanting Table', nativeName: '╎リℸ ̣ ∷╎⊣⚍ᒷ', flag: '🔮' }
];

// Sort languages alphabetically by native name for the selector
export const sortedLanguages = [...languages].sort((a, b) =>
  a.nativeName.localeCompare(b.nativeName)
);

// Get stored language preference or detect from browser
function getInitialLocale() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale');
    if (stored && languages.some(l => l.code === stored)) {
      return stored;
    }
    // Try to match browser language
    const browserLang = getLocaleFromNavigator();
    if (browserLang) {
      // Try exact match first
      if (languages.some(l => l.code === browserLang)) {
        return browserLang;
      }
      // Try base language (e.g., 'en' from 'en-US')
      const baseLang = browserLang.split('-')[0];
      if (languages.some(l => l.code === baseLang)) {
        return baseLang;
      }
    }
  }
  return 'en';
}

// Initialize i18n synchronously
export function setupI18n() {
  const initialLocale = getInitialLocale();

  // Set the locale synchronously FIRST to avoid "Cannot format" errors
  locale.set(initialLocale);

  // Then initialize with the same locale
  init({
    fallbackLocale: 'en',
    initialLocale: initialLocale
  });
}

// Change language and persist preference
export function setLanguage(lang) {
  locale.set(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', lang);
    // Set document direction for RTL languages
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    document.documentElement.dir = rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
}

export { locale };
