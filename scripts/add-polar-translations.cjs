const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/frontend/i18n/locales');

// Translations for polar mode keys
const translations = {
  // English
  'en': {
    magnitude: 'Magnitude',
    phase: 'Phase (°)',
    cartesianMode: 'Cartesian coordinates (Real/Imaginary)',
    polarMode: 'Polar coordinates (Magnitude/Phase)'
  },
  // Spanish
  'es': {
    magnitude: 'Magnitud',
    phase: 'Fase (°)',
    cartesianMode: 'Coordenadas cartesianas (Real/Imaginario)',
    polarMode: 'Coordenadas polares (Magnitud/Fase)'
  },
  // Catalan
  'ca': {
    magnitude: 'Magnitud',
    phase: 'Fase (°)',
    cartesianMode: 'Coordenades cartesianes (Real/Imaginari)',
    polarMode: 'Coordenades polars (Magnitud/Fase)'
  },
  // French
  'fr': {
    magnitude: 'Magnitude',
    phase: 'Phase (°)',
    cartesianMode: 'Coordonnées cartésiennes (Réel/Imaginaire)',
    polarMode: 'Coordonnées polaires (Magnitude/Phase)'
  },
  // German
  'de': {
    magnitude: 'Betrag',
    phase: 'Phase (°)',
    cartesianMode: 'Kartesische Koordinaten (Real/Imaginär)',
    polarMode: 'Polarkoordinaten (Betrag/Phase)'
  },
  // Italian
  'it': {
    magnitude: 'Modulo',
    phase: 'Fase (°)',
    cartesianMode: 'Coordinate cartesiane (Reale/Immaginario)',
    polarMode: 'Coordinate polari (Modulo/Fase)'
  },
  // Portuguese
  'pt': {
    magnitude: 'Magnitude',
    phase: 'Fase (°)',
    cartesianMode: 'Coordenadas cartesianas (Real/Imaginário)',
    polarMode: 'Coordenadas polares (Magnitude/Fase)'
  },
  // Dutch
  'nl': {
    magnitude: 'Magnitude',
    phase: 'Fase (°)',
    cartesianMode: 'Cartesiaanse coördinaten (Reëel/Imaginair)',
    polarMode: 'Poolcoördinaten (Magnitude/Fase)'
  },
  // Polish
  'pl': {
    magnitude: 'Moduł',
    phase: 'Faza (°)',
    cartesianMode: 'Współrzędne kartezjańskie (Rzeczywista/Urojona)',
    polarMode: 'Współrzędne biegunowe (Moduł/Faza)'
  },
  // Russian
  'ru': {
    magnitude: 'Модуль',
    phase: 'Фаза (°)',
    cartesianMode: 'Декартовы координаты (Реальная/Мнимая)',
    polarMode: 'Полярные координаты (Модуль/Фаза)'
  },
  // Ukrainian
  'uk': {
    magnitude: 'Модуль',
    phase: 'Фаза (°)',
    cartesianMode: 'Декартові координати (Реальна/Уявна)',
    polarMode: 'Полярні координати (Модуль/Фаза)'
  },
  // Chinese Simplified
  'zh': {
    magnitude: '幅度',
    phase: '相位 (°)',
    cartesianMode: '笛卡尔坐标 (实部/虚部)',
    polarMode: '极坐标 (幅度/相位)'
  },
  // Chinese Traditional
  'zh-TW': {
    magnitude: '幅度',
    phase: '相位 (°)',
    cartesianMode: '笛卡兒座標 (實部/虛部)',
    polarMode: '極座標 (幅度/相位)'
  },
  // Japanese
  'ja': {
    magnitude: '振幅',
    phase: '位相 (°)',
    cartesianMode: '直交座標 (実部/虚部)',
    polarMode: '極座標 (振幅/位相)'
  },
  // Korean
  'ko': {
    magnitude: '크기',
    phase: '위상 (°)',
    cartesianMode: '직교 좌표 (실수/허수)',
    polarMode: '극좌표 (크기/위상)'
  },
  // Arabic
  'ar': {
    magnitude: 'المقدار',
    phase: 'الطور (°)',
    cartesianMode: 'إحداثيات ديكارتية (حقيقي/تخيلي)',
    polarMode: 'إحداثيات قطبية (المقدار/الطور)'
  },
  // Hebrew
  'he': {
    magnitude: 'גודל',
    phase: 'פאזה (°)',
    cartesianMode: 'קואורדינטות קרטזיות (ממשי/מדומה)',
    polarMode: 'קואורדינטות קוטביות (גודל/פאזה)'
  },
  // Hindi
  'hi': {
    magnitude: 'परिमाण',
    phase: 'कला (°)',
    cartesianMode: 'कार्तीय निर्देशांक (वास्तविक/काल्पनिक)',
    polarMode: 'ध्रुवीय निर्देशांक (परिमाण/कला)'
  },
  // Turkish
  'tr': {
    magnitude: 'Genlik',
    phase: 'Faz (°)',
    cartesianMode: 'Kartezyen koordinatlar (Gerçek/Sanal)',
    polarMode: 'Kutupsal koordinatlar (Genlik/Faz)'
  },
  // Greek
  'el': {
    magnitude: 'Μέτρο',
    phase: 'Φάση (°)',
    cartesianMode: 'Καρτεσιανές συντεταγμένες (Πραγματικό/Φανταστικό)',
    polarMode: 'Πολικές συντεταγμένες (Μέτρο/Φάση)'
  },
  // Czech
  'cs': {
    magnitude: 'Modul',
    phase: 'Fáze (°)',
    cartesianMode: 'Kartézské souřadnice (Reálná/Imaginární)',
    polarMode: 'Polární souřadnice (Modul/Fáze)'
  },
  // Swedish
  'sv': {
    magnitude: 'Belopp',
    phase: 'Fas (°)',
    cartesianMode: 'Kartesiska koordinater (Reell/Imaginär)',
    polarMode: 'Polära koordinater (Belopp/Fas)'
  },
  // Norwegian
  'no': {
    magnitude: 'Beløp',
    phase: 'Fase (°)',
    cartesianMode: 'Kartesiske koordinater (Reell/Imaginær)',
    polarMode: 'Polarkoordinater (Beløp/Fase)'
  },
  // Danish
  'da': {
    magnitude: 'Beløb',
    phase: 'Fase (°)',
    cartesianMode: 'Kartesiske koordinater (Reel/Imaginær)',
    polarMode: 'Polære koordinater (Beløb/Fase)'
  },
  // Finnish
  'fi': {
    magnitude: 'Itseisarvo',
    phase: 'Vaihe (°)',
    cartesianMode: 'Karteesiset koordinaatit (Reaaliluku/Imaginaariluku)',
    polarMode: 'Napakoordinaatit (Itseisarvo/Vaihe)'
  },
  // Hungarian
  'hu': {
    magnitude: 'Abszolútérték',
    phase: 'Fázis (°)',
    cartesianMode: 'Derékszögű koordináták (Valós/Képzetes)',
    polarMode: 'Polárkoordináták (Abszolútérték/Fázis)'
  },
  // Romanian
  'ro': {
    magnitude: 'Modul',
    phase: 'Fază (°)',
    cartesianMode: 'Coordonate carteziene (Real/Imaginar)',
    polarMode: 'Coordonate polare (Modul/Fază)'
  },
  // Bulgarian
  'bg': {
    magnitude: 'Модул',
    phase: 'Фаза (°)',
    cartesianMode: 'Декартови координати (Реална/Имагинерна)',
    polarMode: 'Полярни координати (Модул/Фаза)'
  },
  // Croatian
  'hr': {
    magnitude: 'Modul',
    phase: 'Faza (°)',
    cartesianMode: 'Kartezijeve koordinate (Realni/Imaginarni)',
    polarMode: 'Polarne koordinate (Modul/Faza)'
  },
  // Serbian
  'sr': {
    magnitude: 'Модул',
    phase: 'Фаза (°)',
    cartesianMode: 'Декартове координате (Реални/Имагинарни)',
    polarMode: 'Поларне координате (Модул/Фаза)'
  },
  // Slovak
  'sk': {
    magnitude: 'Modul',
    phase: 'Fáza (°)',
    cartesianMode: 'Kartézske súradnice (Reálna/Imaginárna)',
    polarMode: 'Polárne súradnice (Modul/Fáza)'
  },
  // Slovenian
  'sl': {
    magnitude: 'Modul',
    phase: 'Faza (°)',
    cartesianMode: 'Kartezične koordinate (Realni/Imaginarni)',
    polarMode: 'Polarne koordinate (Modul/Faza)'
  },
  // Thai
  'th': {
    magnitude: 'ขนาด',
    phase: 'เฟส (°)',
    cartesianMode: 'พิกัดคาร์ทีเซียน (จริง/จินตภาพ)',
    polarMode: 'พิกัดเชิงขั้ว (ขนาด/เฟส)'
  },
  // Vietnamese
  'vi': {
    magnitude: 'Mô-đun',
    phase: 'Pha (°)',
    cartesianMode: 'Tọa độ Descartes (Thực/Ảo)',
    polarMode: 'Tọa độ cực (Mô-đun/Pha)'
  },
  // Indonesian
  'id': {
    magnitude: 'Magnitudo',
    phase: 'Fase (°)',
    cartesianMode: 'Koordinat Kartesius (Nyata/Imajiner)',
    polarMode: 'Koordinat polar (Magnitudo/Fase)'
  },
  // Malay
  'ms': {
    magnitude: 'Magnitud',
    phase: 'Fasa (°)',
    cartesianMode: 'Koordinat Cartesian (Nyata/Khayalan)',
    polarMode: 'Koordinat kutub (Magnitud/Fasa)'
  }
};

// English fallback for languages not in the translations list
const englishFallback = translations['en'];

let updatedCount = 0;
let skippedCount = 0;

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(localesDir, file);
  const langCode = file.replace('.json', '');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);

    // Get the appropriate translation (or fallback to English)
    const trans = translations[langCode] || englishFallback;

    // Add the new keys to constellation section if they don't exist
    if (!json.constellation) {
      json.constellation = {};
    }

    let modified = false;

    if (!json.constellation.magnitude) {
      json.constellation.magnitude = trans.magnitude;
      modified = true;
    }
    if (!json.constellation.phase) {
      json.constellation.phase = trans.phase;
      modified = true;
    }
    if (!json.constellation.cartesianMode) {
      json.constellation.cartesianMode = trans.cartesianMode;
      modified = true;
    }
    if (!json.constellation.polarMode) {
      json.constellation.polarMode = trans.polarMode;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
      updatedCount++;
    } else {
      skippedCount++;
    }
  } catch (e) {
    console.error(`Error processing ${file}: ${e.message}`);
  }
}

console.log(`Done! Updated ${updatedCount} files, skipped ${skippedCount}`);
