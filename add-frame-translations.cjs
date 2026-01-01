const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/frontend/i18n/locales');

// Translations for the frame toggle
const translations = {
  'en': { showFrame: 'Show frame', hideFrame: 'Hide frame' },
  'es': { showFrame: 'Mostrar marco', hideFrame: 'Ocultar marco' },
  'ca': { showFrame: 'Mostrar marc', hideFrame: 'Amagar marc' },
  'de': { showFrame: 'Rahmen anzeigen', hideFrame: 'Rahmen ausblenden' },
  'fr': { showFrame: 'Afficher le cadre', hideFrame: 'Masquer le cadre' },
  'it': { showFrame: 'Mostra cornice', hideFrame: 'Nascondi cornice' },
  'pt': { showFrame: 'Mostrar moldura', hideFrame: 'Ocultar moldura' },
  'nl': { showFrame: 'Frame tonen', hideFrame: 'Frame verbergen' },
  'ru': { showFrame: 'Показать рамку', hideFrame: 'Скрыть рамку' },
  'zh-CN': { showFrame: '显示边框', hideFrame: '隐藏边框' },
  'zh-TW': { showFrame: '顯示邊框', hideFrame: '隱藏邊框' },
  'ja': { showFrame: 'フレームを表示', hideFrame: 'フレームを非表示' },
  'ko': { showFrame: '프레임 표시', hideFrame: '프레임 숨기기' },
  'ar': { showFrame: 'إظهار الإطار', hideFrame: 'إخفاء الإطار' },
  'he': { showFrame: 'הצג מסגרת', hideFrame: 'הסתר מסגרת' },
  'hi': { showFrame: 'फ़्रेम दिखाएं', hideFrame: 'फ़्रेम छुपाएं' },
  'tr': { showFrame: 'Çerçeveyi göster', hideFrame: 'Çerçeveyi gizle' },
  'pl': { showFrame: 'Pokaż ramkę', hideFrame: 'Ukryj ramkę' },
  'sv': { showFrame: 'Visa ram', hideFrame: 'Dölj ram' },
  'da': { showFrame: 'Vis ramme', hideFrame: 'Skjul ramme' },
  'no': { showFrame: 'Vis ramme', hideFrame: 'Skjul ramme' },
  'fi': { showFrame: 'Näytä kehys', hideFrame: 'Piilota kehys' },
  'cs': { showFrame: 'Zobrazit rámeček', hideFrame: 'Skrýt rámeček' },
  'hu': { showFrame: 'Keret megjelenítése', hideFrame: 'Keret elrejtése' },
  'ro': { showFrame: 'Afișează cadrul', hideFrame: 'Ascunde cadrul' },
  'uk': { showFrame: 'Показати рамку', hideFrame: 'Приховати рамку' },
  'el': { showFrame: 'Εμφάνιση πλαισίου', hideFrame: 'Απόκρυψη πλαισίου' },
  'th': { showFrame: 'แสดงกรอบ', hideFrame: 'ซ่อนกรอบ' },
  'vi': { showFrame: 'Hiển thị khung', hideFrame: 'Ẩn khung' },
  'id': { showFrame: 'Tampilkan bingkai', hideFrame: 'Sembunyikan bingkai' },
  'ms': { showFrame: 'Tunjukkan bingkai', hideFrame: 'Sembunyikan bingkai' },
  'eu': { showFrame: 'Erakutsi markoa', hideFrame: 'Ezkutatu markoa' },
  'gl': { showFrame: 'Mostrar marco', hideFrame: 'Ocultar marco' },
};

// Default fallback (English)
const defaultTranslation = { showFrame: 'Show frame', hideFrame: 'Hide frame' };

// Get all locale files
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const locale = file.replace('.json', '');

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ensure plotItem section exists
    if (!content.plotItem) {
      content.plotItem = {};
    }

    // Get appropriate translation or fallback to English
    const trans = translations[locale] || defaultTranslation;

    // Add the translations if they don't exist
    if (!content.plotItem.showFrame) {
      content.plotItem.showFrame = trans.showFrame;
    }
    if (!content.plotItem.hideFrame) {
      content.plotItem.hideFrame = trans.hideFrame;
    }

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    console.log(`Updated: ${file}`);
  } catch (err) {
    console.error(`Error processing ${file}:`, err.message);
  }
});

console.log('Done!');
