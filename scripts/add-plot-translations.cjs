const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/frontend/i18n/locales');

// Translations for plotAxis and plotLegend in different languages
const translations = {
  en: {
    plotAxis: {
      modulationSize: "Modulation Size (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linear)",
      rate: "Rate (R)",
      codeLength: "Code Length (n)",
      quadrature: "Quadrature (N)",
      threshold: "Threshold",
      shapingParam: "Shaping Parameter (β)",
      errorProbability: "Error Probability",
      errorExponent: "Error Exponent",
      optimalRho: "Optimal ρ",
      mutualInformation: "Mutual Information",
      cutoffRate: "Cutoff Rate (R₀)"
    },
    plotLegend: {
      series: "Series",
      modulation: "M",
      type: "Type",
      snr: "SNR",
      rate: "Rate",
      codeLength: "n",
      quadrature: "N",
      threshold: "Threshold",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "SNR Unit",
      uniform: "Uniform",
      maxwellBoltzmann: "MB"
    }
  },
  ca: {
    plotAxis: {
      modulationSize: "Mida de Modulació (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineal)",
      rate: "Taxa (R)",
      codeLength: "Longitud del Codi (n)",
      quadrature: "Quadratura (N)",
      threshold: "Llindar",
      shapingParam: "Paràmetre de Forma (β)",
      errorProbability: "Probabilitat d'Error",
      errorExponent: "Exponent d'Error",
      optimalRho: "ρ Òptim",
      mutualInformation: "Informació Mútua",
      cutoffRate: "Taxa de Tall (R₀)"
    },
    plotLegend: {
      series: "Sèrie",
      modulation: "M",
      type: "Tipus",
      snr: "SNR",
      rate: "Taxa",
      codeLength: "n",
      quadrature: "N",
      threshold: "Llindar",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "Unitat SNR",
      uniform: "Uniforme",
      maxwellBoltzmann: "MB"
    }
  },
  es: {
    plotAxis: {
      modulationSize: "Tamaño de Modulación (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineal)",
      rate: "Tasa (R)",
      codeLength: "Longitud del Código (n)",
      quadrature: "Cuadratura (N)",
      threshold: "Umbral",
      shapingParam: "Parámetro de Forma (β)",
      errorProbability: "Probabilidad de Error",
      errorExponent: "Exponente de Error",
      optimalRho: "ρ Óptimo",
      mutualInformation: "Información Mutua",
      cutoffRate: "Tasa de Corte (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Tipo",
      snr: "SNR",
      rate: "Tasa",
      codeLength: "n",
      quadrature: "N",
      threshold: "Umbral",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "Unidad SNR",
      uniform: "Uniforme",
      maxwellBoltzmann: "MB"
    }
  },
  de: {
    plotAxis: {
      modulationSize: "Modulationsgröße (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linear)",
      rate: "Rate (R)",
      codeLength: "Codelänge (n)",
      quadrature: "Quadratur (N)",
      threshold: "Schwellwert",
      shapingParam: "Formungsparameter (β)",
      errorProbability: "Fehlerwahrscheinlichkeit",
      errorExponent: "Fehlerexponent",
      optimalRho: "Optimales ρ",
      mutualInformation: "Transinformation",
      cutoffRate: "Grenzrate (R₀)"
    },
    plotLegend: {
      series: "Reihe",
      modulation: "M",
      type: "Typ",
      snr: "SNR",
      rate: "Rate",
      codeLength: "n",
      quadrature: "N",
      threshold: "Schwellwert",
      distribution: "Vert.",
      shapingParam: "β",
      snrUnit: "SNR-Einheit",
      uniform: "Gleichverteilt",
      maxwellBoltzmann: "MB"
    }
  },
  fr: {
    plotAxis: {
      modulationSize: "Taille de Modulation (M)",
      snrDb: "RSB (dB)",
      snrLinear: "RSB (linéaire)",
      rate: "Débit (R)",
      codeLength: "Longueur du Code (n)",
      quadrature: "Quadrature (N)",
      threshold: "Seuil",
      shapingParam: "Paramètre de Forme (β)",
      errorProbability: "Probabilité d'Erreur",
      errorExponent: "Exposant d'Erreur",
      optimalRho: "ρ Optimal",
      mutualInformation: "Information Mutuelle",
      cutoffRate: "Débit de Coupure (R₀)"
    },
    plotLegend: {
      series: "Série",
      modulation: "M",
      type: "Type",
      snr: "RSB",
      rate: "Débit",
      codeLength: "n",
      quadrature: "N",
      threshold: "Seuil",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "Unité RSB",
      uniform: "Uniforme",
      maxwellBoltzmann: "MB"
    }
  },
  it: {
    plotAxis: {
      modulationSize: "Dimensione Modulazione (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineare)",
      rate: "Tasso (R)",
      codeLength: "Lunghezza Codice (n)",
      quadrature: "Quadratura (N)",
      threshold: "Soglia",
      shapingParam: "Parametro di Forma (β)",
      errorProbability: "Probabilità di Errore",
      errorExponent: "Esponente di Errore",
      optimalRho: "ρ Ottimale",
      mutualInformation: "Informazione Mutua",
      cutoffRate: "Tasso di Taglio (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Tipo",
      snr: "SNR",
      rate: "Tasso",
      codeLength: "n",
      quadrature: "N",
      threshold: "Soglia",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "Unità SNR",
      uniform: "Uniforme",
      maxwellBoltzmann: "MB"
    }
  },
  pt: {
    plotAxis: {
      modulationSize: "Tamanho da Modulação (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linear)",
      rate: "Taxa (R)",
      codeLength: "Comprimento do Código (n)",
      quadrature: "Quadratura (N)",
      threshold: "Limiar",
      shapingParam: "Parâmetro de Forma (β)",
      errorProbability: "Probabilidade de Erro",
      errorExponent: "Expoente de Erro",
      optimalRho: "ρ Ótimo",
      mutualInformation: "Informação Mútua",
      cutoffRate: "Taxa de Corte (R₀)"
    },
    plotLegend: {
      series: "Série",
      modulation: "M",
      type: "Tipo",
      snr: "SNR",
      rate: "Taxa",
      codeLength: "n",
      quadrature: "N",
      threshold: "Limiar",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "Unidade SNR",
      uniform: "Uniforme",
      maxwellBoltzmann: "MB"
    }
  },
  nl: {
    plotAxis: {
      modulationSize: "Modulatiegrootte (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineair)",
      rate: "Snelheid (R)",
      codeLength: "Codelengte (n)",
      quadrature: "Kwadratuur (N)",
      threshold: "Drempel",
      shapingParam: "Vormparameter (β)",
      errorProbability: "Foutkans",
      errorExponent: "Foutexponent",
      optimalRho: "Optimale ρ",
      mutualInformation: "Wederzijdse Informatie",
      cutoffRate: "Afsnijsnelheid (R₀)"
    },
    plotLegend: {
      series: "Reeks",
      modulation: "M",
      type: "Type",
      snr: "SNR",
      rate: "Snelheid",
      codeLength: "n",
      quadrature: "N",
      threshold: "Drempel",
      distribution: "Dist",
      shapingParam: "β",
      snrUnit: "SNR-eenheid",
      uniform: "Uniform",
      maxwellBoltzmann: "MB"
    }
  },
  pl: {
    plotAxis: {
      modulationSize: "Rozmiar Modulacji (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (liniowy)",
      rate: "Szybkość (R)",
      codeLength: "Długość Kodu (n)",
      quadrature: "Kwadratura (N)",
      threshold: "Próg",
      shapingParam: "Parametr Kształtowania (β)",
      errorProbability: "Prawdopodobieństwo Błędu",
      errorExponent: "Wykładnik Błędu",
      optimalRho: "Optymalne ρ",
      mutualInformation: "Informacja Wzajemna",
      cutoffRate: "Szybkość Odcięcia (R₀)"
    },
    plotLegend: {
      series: "Seria",
      modulation: "M",
      type: "Typ",
      snr: "SNR",
      rate: "Szybkość",
      codeLength: "n",
      quadrature: "N",
      threshold: "Próg",
      distribution: "Rozkł.",
      shapingParam: "β",
      snrUnit: "Jednostka SNR",
      uniform: "Równomierny",
      maxwellBoltzmann: "MB"
    }
  },
  ru: {
    plotAxis: {
      modulationSize: "Размер Модуляции (M)",
      snrDb: "ОСШ (дБ)",
      snrLinear: "ОСШ (линейный)",
      rate: "Скорость (R)",
      codeLength: "Длина Кода (n)",
      quadrature: "Квадратура (N)",
      threshold: "Порог",
      shapingParam: "Параметр Формирования (β)",
      errorProbability: "Вероятность Ошибки",
      errorExponent: "Показатель Ошибки",
      optimalRho: "Оптимальное ρ",
      mutualInformation: "Взаимная Информация",
      cutoffRate: "Скорость Отсечения (R₀)"
    },
    plotLegend: {
      series: "Серия",
      modulation: "M",
      type: "Тип",
      snr: "ОСШ",
      rate: "Скорость",
      codeLength: "n",
      quadrature: "N",
      threshold: "Порог",
      distribution: "Распр.",
      shapingParam: "β",
      snrUnit: "Единица ОСШ",
      uniform: "Равномерное",
      maxwellBoltzmann: "МБ"
    }
  },
  zh: {
    plotAxis: {
      modulationSize: "调制大小 (M)",
      snrDb: "信噪比 (dB)",
      snrLinear: "信噪比 (线性)",
      rate: "速率 (R)",
      codeLength: "码长 (n)",
      quadrature: "正交 (N)",
      threshold: "阈值",
      shapingParam: "整形参数 (β)",
      errorProbability: "误码率",
      errorExponent: "误差指数",
      optimalRho: "最优 ρ",
      mutualInformation: "互信息",
      cutoffRate: "截止速率 (R₀)"
    },
    plotLegend: {
      series: "系列",
      modulation: "M",
      type: "类型",
      snr: "信噪比",
      rate: "速率",
      codeLength: "n",
      quadrature: "N",
      threshold: "阈值",
      distribution: "分布",
      shapingParam: "β",
      snrUnit: "信噪比单位",
      uniform: "均匀",
      maxwellBoltzmann: "MB"
    }
  },
  ja: {
    plotAxis: {
      modulationSize: "変調サイズ (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (線形)",
      rate: "レート (R)",
      codeLength: "符号長 (n)",
      quadrature: "直交 (N)",
      threshold: "閾値",
      shapingParam: "整形パラメータ (β)",
      errorProbability: "誤り確率",
      errorExponent: "誤り指数",
      optimalRho: "最適 ρ",
      mutualInformation: "相互情報量",
      cutoffRate: "カットオフレート (R₀)"
    },
    plotLegend: {
      series: "シリーズ",
      modulation: "M",
      type: "タイプ",
      snr: "SNR",
      rate: "レート",
      codeLength: "n",
      quadrature: "N",
      threshold: "閾値",
      distribution: "分布",
      shapingParam: "β",
      snrUnit: "SNR単位",
      uniform: "一様",
      maxwellBoltzmann: "MB"
    }
  },
  ko: {
    plotAxis: {
      modulationSize: "변조 크기 (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (선형)",
      rate: "속도 (R)",
      codeLength: "코드 길이 (n)",
      quadrature: "직교 (N)",
      threshold: "임계값",
      shapingParam: "성형 매개변수 (β)",
      errorProbability: "오류 확률",
      errorExponent: "오류 지수",
      optimalRho: "최적 ρ",
      mutualInformation: "상호 정보",
      cutoffRate: "컷오프 속도 (R₀)"
    },
    plotLegend: {
      series: "시리즈",
      modulation: "M",
      type: "유형",
      snr: "SNR",
      rate: "속도",
      codeLength: "n",
      quadrature: "N",
      threshold: "임계값",
      distribution: "분포",
      shapingParam: "β",
      snrUnit: "SNR 단위",
      uniform: "균일",
      maxwellBoltzmann: "MB"
    }
  },
  ar: {
    plotAxis: {
      modulationSize: "حجم التعديل (M)",
      snrDb: "نسبة الإشارة للضوضاء (dB)",
      snrLinear: "نسبة الإشارة للضوضاء (خطي)",
      rate: "المعدل (R)",
      codeLength: "طول الكود (n)",
      quadrature: "التربيع (N)",
      threshold: "العتبة",
      shapingParam: "معامل التشكيل (β)",
      errorProbability: "احتمال الخطأ",
      errorExponent: "أس الخطأ",
      optimalRho: "ρ الأمثل",
      mutualInformation: "المعلومات المتبادلة",
      cutoffRate: "معدل القطع (R₀)"
    },
    plotLegend: {
      series: "سلسلة",
      modulation: "M",
      type: "نوع",
      snr: "SNR",
      rate: "معدل",
      codeLength: "n",
      quadrature: "N",
      threshold: "عتبة",
      distribution: "توزيع",
      shapingParam: "β",
      snrUnit: "وحدة SNR",
      uniform: "منتظم",
      maxwellBoltzmann: "MB"
    }
  },
  hi: {
    plotAxis: {
      modulationSize: "मॉड्यूलेशन आकार (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (रैखिक)",
      rate: "दर (R)",
      codeLength: "कोड लंबाई (n)",
      quadrature: "चतुर्भुज (N)",
      threshold: "सीमा",
      shapingParam: "आकार पैरामीटर (β)",
      errorProbability: "त्रुटि संभावना",
      errorExponent: "त्रुटि घातांक",
      optimalRho: "इष्टतम ρ",
      mutualInformation: "पारस्परिक सूचना",
      cutoffRate: "कटऑफ दर (R₀)"
    },
    plotLegend: {
      series: "श्रृंखला",
      modulation: "M",
      type: "प्रकार",
      snr: "SNR",
      rate: "दर",
      codeLength: "n",
      quadrature: "N",
      threshold: "सीमा",
      distribution: "वितरण",
      shapingParam: "β",
      snrUnit: "SNR इकाई",
      uniform: "समान",
      maxwellBoltzmann: "MB"
    }
  },
  tr: {
    plotAxis: {
      modulationSize: "Modülasyon Boyutu (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (doğrusal)",
      rate: "Oran (R)",
      codeLength: "Kod Uzunluğu (n)",
      quadrature: "Dörtlü (N)",
      threshold: "Eşik",
      shapingParam: "Şekillendirme Parametresi (β)",
      errorProbability: "Hata Olasılığı",
      errorExponent: "Hata Üsteli",
      optimalRho: "Optimal ρ",
      mutualInformation: "Karşılıklı Bilgi",
      cutoffRate: "Kesme Oranı (R₀)"
    },
    plotLegend: {
      series: "Seri",
      modulation: "M",
      type: "Tür",
      snr: "SNR",
      rate: "Oran",
      codeLength: "n",
      quadrature: "N",
      threshold: "Eşik",
      distribution: "Dağ.",
      shapingParam: "β",
      snrUnit: "SNR Birimi",
      uniform: "Düzgün",
      maxwellBoltzmann: "MB"
    }
  },
  uk: {
    plotAxis: {
      modulationSize: "Розмір Модуляції (M)",
      snrDb: "СШС (дБ)",
      snrLinear: "СШС (лінійний)",
      rate: "Швидкість (R)",
      codeLength: "Довжина Коду (n)",
      quadrature: "Квадратура (N)",
      threshold: "Поріг",
      shapingParam: "Параметр Формування (β)",
      errorProbability: "Ймовірність Помилки",
      errorExponent: "Показник Помилки",
      optimalRho: "Оптимальне ρ",
      mutualInformation: "Взаємна Інформація",
      cutoffRate: "Швидкість Відсічення (R₀)"
    },
    plotLegend: {
      series: "Серія",
      modulation: "M",
      type: "Тип",
      snr: "СШС",
      rate: "Швидкість",
      codeLength: "n",
      quadrature: "N",
      threshold: "Поріг",
      distribution: "Розп.",
      shapingParam: "β",
      snrUnit: "Одиниця СШС",
      uniform: "Рівномірне",
      maxwellBoltzmann: "МБ"
    }
  },
  vi: {
    plotAxis: {
      modulationSize: "Kích thước Điều chế (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (tuyến tính)",
      rate: "Tốc độ (R)",
      codeLength: "Độ dài Mã (n)",
      quadrature: "Vuông góc (N)",
      threshold: "Ngưỡng",
      shapingParam: "Tham số Định hình (β)",
      errorProbability: "Xác suất Lỗi",
      errorExponent: "Số mũ Lỗi",
      optimalRho: "ρ Tối ưu",
      mutualInformation: "Thông tin Tương hỗ",
      cutoffRate: "Tốc độ Cắt (R₀)"
    },
    plotLegend: {
      series: "Chuỗi",
      modulation: "M",
      type: "Loại",
      snr: "SNR",
      rate: "Tốc độ",
      codeLength: "n",
      quadrature: "N",
      threshold: "Ngưỡng",
      distribution: "P.phối",
      shapingParam: "β",
      snrUnit: "Đơn vị SNR",
      uniform: "Đều",
      maxwellBoltzmann: "MB"
    }
  },
  th: {
    plotAxis: {
      modulationSize: "ขนาดการมอดูเลต (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (เชิงเส้น)",
      rate: "อัตรา (R)",
      codeLength: "ความยาวรหัส (n)",
      quadrature: "ควอดราเจอร์ (N)",
      threshold: "เกณฑ์",
      shapingParam: "พารามิเตอร์การปรับรูปร่าง (β)",
      errorProbability: "ความน่าจะเป็นข้อผิดพลาด",
      errorExponent: "เลขชี้กำลังข้อผิดพลาด",
      optimalRho: "ρ ที่เหมาะสม",
      mutualInformation: "ข้อมูลร่วม",
      cutoffRate: "อัตราตัด (R₀)"
    },
    plotLegend: {
      series: "ชุด",
      modulation: "M",
      type: "ประเภท",
      snr: "SNR",
      rate: "อัตรา",
      codeLength: "n",
      quadrature: "N",
      threshold: "เกณฑ์",
      distribution: "การแจกแจง",
      shapingParam: "β",
      snrUnit: "หน่วย SNR",
      uniform: "สม่ำเสมอ",
      maxwellBoltzmann: "MB"
    }
  },
  sv: {
    plotAxis: {
      modulationSize: "Moduleringsstorlek (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linjär)",
      rate: "Hastighet (R)",
      codeLength: "Kodlängd (n)",
      quadrature: "Kvadratur (N)",
      threshold: "Tröskel",
      shapingParam: "Formningsparameter (β)",
      errorProbability: "Felsannolikhet",
      errorExponent: "Felexponent",
      optimalRho: "Optimal ρ",
      mutualInformation: "Ömsesidig Information",
      cutoffRate: "Avskärningshastighet (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Typ",
      snr: "SNR",
      rate: "Hastighet",
      codeLength: "n",
      quadrature: "N",
      threshold: "Tröskel",
      distribution: "Förd.",
      shapingParam: "β",
      snrUnit: "SNR-enhet",
      uniform: "Likformig",
      maxwellBoltzmann: "MB"
    }
  },
  da: {
    plotAxis: {
      modulationSize: "Modulationsstørrelse (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineær)",
      rate: "Hastighed (R)",
      codeLength: "Kodelængde (n)",
      quadrature: "Kvadratur (N)",
      threshold: "Tærskel",
      shapingParam: "Formningsparameter (β)",
      errorProbability: "Fejlsandsynlighed",
      errorExponent: "Fejleksponent",
      optimalRho: "Optimal ρ",
      mutualInformation: "Gensidig Information",
      cutoffRate: "Afskæringshastighed (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Type",
      snr: "SNR",
      rate: "Hastighed",
      codeLength: "n",
      quadrature: "N",
      threshold: "Tærskel",
      distribution: "Ford.",
      shapingParam: "β",
      snrUnit: "SNR-enhed",
      uniform: "Ensartet",
      maxwellBoltzmann: "MB"
    }
  },
  no: {
    plotAxis: {
      modulationSize: "Modulasjonsstørrelse (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineær)",
      rate: "Hastighet (R)",
      codeLength: "Kodelengde (n)",
      quadrature: "Kvadratur (N)",
      threshold: "Terskel",
      shapingParam: "Formingsparameter (β)",
      errorProbability: "Feilsannsynlighet",
      errorExponent: "Feileksponent",
      optimalRho: "Optimal ρ",
      mutualInformation: "Gjensidig Informasjon",
      cutoffRate: "Avskjæringshastighet (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Type",
      snr: "SNR",
      rate: "Hastighet",
      codeLength: "n",
      quadrature: "N",
      threshold: "Terskel",
      distribution: "Ford.",
      shapingParam: "β",
      snrUnit: "SNR-enhet",
      uniform: "Uniform",
      maxwellBoltzmann: "MB"
    }
  },
  fi: {
    plotAxis: {
      modulationSize: "Modulaatiokoko (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineaarinen)",
      rate: "Nopeus (R)",
      codeLength: "Koodin Pituus (n)",
      quadrature: "Kvadratuuri (N)",
      threshold: "Kynnys",
      shapingParam: "Muotoiluparametri (β)",
      errorProbability: "Virheen Todennäköisyys",
      errorExponent: "Virhe-eksponentti",
      optimalRho: "Optimaalinen ρ",
      mutualInformation: "Keskinäinen Informaatio",
      cutoffRate: "Katkaisunopeus (R₀)"
    },
    plotLegend: {
      series: "Sarja",
      modulation: "M",
      type: "Tyyppi",
      snr: "SNR",
      rate: "Nopeus",
      codeLength: "n",
      quadrature: "N",
      threshold: "Kynnys",
      distribution: "Jak.",
      shapingParam: "β",
      snrUnit: "SNR-yksikkö",
      uniform: "Tasainen",
      maxwellBoltzmann: "MB"
    }
  },
  cs: {
    plotAxis: {
      modulationSize: "Velikost Modulace (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineární)",
      rate: "Rychlost (R)",
      codeLength: "Délka Kódu (n)",
      quadrature: "Kvadratura (N)",
      threshold: "Práh",
      shapingParam: "Parametr Tvarování (β)",
      errorProbability: "Pravděpodobnost Chyby",
      errorExponent: "Exponent Chyby",
      optimalRho: "Optimální ρ",
      mutualInformation: "Vzájemná Informace",
      cutoffRate: "Rychlost Odříznutí (R₀)"
    },
    plotLegend: {
      series: "Série",
      modulation: "M",
      type: "Typ",
      snr: "SNR",
      rate: "Rychlost",
      codeLength: "n",
      quadrature: "N",
      threshold: "Práh",
      distribution: "Rozd.",
      shapingParam: "β",
      snrUnit: "Jednotka SNR",
      uniform: "Rovnoměrné",
      maxwellBoltzmann: "MB"
    }
  },
  el: {
    plotAxis: {
      modulationSize: "Μέγεθος Διαμόρφωσης (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (γραμμικό)",
      rate: "Ρυθμός (R)",
      codeLength: "Μήκος Κώδικα (n)",
      quadrature: "Τετραγωνισμός (N)",
      threshold: "Κατώφλι",
      shapingParam: "Παράμετρος Διαμόρφωσης (β)",
      errorProbability: "Πιθανότητα Σφάλματος",
      errorExponent: "Εκθέτης Σφάλματος",
      optimalRho: "Βέλτιστο ρ",
      mutualInformation: "Αμοιβαία Πληροφορία",
      cutoffRate: "Ρυθμός Αποκοπής (R₀)"
    },
    plotLegend: {
      series: "Σειρά",
      modulation: "M",
      type: "Τύπος",
      snr: "SNR",
      rate: "Ρυθμός",
      codeLength: "n",
      quadrature: "N",
      threshold: "Κατώφλι",
      distribution: "Κατ.",
      shapingParam: "β",
      snrUnit: "Μονάδα SNR",
      uniform: "Ομοιόμορφη",
      maxwellBoltzmann: "MB"
    }
  },
  he: {
    plotAxis: {
      modulationSize: "גודל אפנון (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (ליניארי)",
      rate: "קצב (R)",
      codeLength: "אורך קוד (n)",
      quadrature: "ריבוע (N)",
      threshold: "סף",
      shapingParam: "פרמטר עיצוב (β)",
      errorProbability: "הסתברות שגיאה",
      errorExponent: "מעריך שגיאה",
      optimalRho: "ρ אופטימלי",
      mutualInformation: "מידע הדדי",
      cutoffRate: "קצב חיתוך (R₀)"
    },
    plotLegend: {
      series: "סדרה",
      modulation: "M",
      type: "סוג",
      snr: "SNR",
      rate: "קצב",
      codeLength: "n",
      quadrature: "N",
      threshold: "סף",
      distribution: "התפלג.",
      shapingParam: "β",
      snrUnit: "יחידת SNR",
      uniform: "אחיד",
      maxwellBoltzmann: "MB"
    }
  },
  ro: {
    plotAxis: {
      modulationSize: "Dimensiune Modulație (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (liniar)",
      rate: "Rată (R)",
      codeLength: "Lungime Cod (n)",
      quadrature: "Cvadratură (N)",
      threshold: "Prag",
      shapingParam: "Parametru de Formare (β)",
      errorProbability: "Probabilitate de Eroare",
      errorExponent: "Exponent de Eroare",
      optimalRho: "ρ Optim",
      mutualInformation: "Informație Mutuală",
      cutoffRate: "Rată de Tăiere (R₀)"
    },
    plotLegend: {
      series: "Serie",
      modulation: "M",
      type: "Tip",
      snr: "SNR",
      rate: "Rată",
      codeLength: "n",
      quadrature: "N",
      threshold: "Prag",
      distribution: "Distr.",
      shapingParam: "β",
      snrUnit: "Unitate SNR",
      uniform: "Uniform",
      maxwellBoltzmann: "MB"
    }
  },
  hu: {
    plotAxis: {
      modulationSize: "Moduláció Mérete (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (lineáris)",
      rate: "Sebesség (R)",
      codeLength: "Kódhossz (n)",
      quadrature: "Kvadratúra (N)",
      threshold: "Küszöb",
      shapingParam: "Formázási Paraméter (β)",
      errorProbability: "Hibavalószínűség",
      errorExponent: "Hibakitevő",
      optimalRho: "Optimális ρ",
      mutualInformation: "Kölcsönös Információ",
      cutoffRate: "Levágási Sebesség (R₀)"
    },
    plotLegend: {
      series: "Sorozat",
      modulation: "M",
      type: "Típus",
      snr: "SNR",
      rate: "Sebesség",
      codeLength: "n",
      quadrature: "N",
      threshold: "Küszöb",
      distribution: "Eloszl.",
      shapingParam: "β",
      snrUnit: "SNR Egység",
      uniform: "Egyenletes",
      maxwellBoltzmann: "MB"
    }
  },
  id: {
    plotAxis: {
      modulationSize: "Ukuran Modulasi (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linier)",
      rate: "Laju (R)",
      codeLength: "Panjang Kode (n)",
      quadrature: "Kuadratur (N)",
      threshold: "Ambang",
      shapingParam: "Parameter Pembentukan (β)",
      errorProbability: "Probabilitas Kesalahan",
      errorExponent: "Eksponen Kesalahan",
      optimalRho: "ρ Optimal",
      mutualInformation: "Informasi Mutual",
      cutoffRate: "Laju Potong (R₀)"
    },
    plotLegend: {
      series: "Seri",
      modulation: "M",
      type: "Tipe",
      snr: "SNR",
      rate: "Laju",
      codeLength: "n",
      quadrature: "N",
      threshold: "Ambang",
      distribution: "Dist.",
      shapingParam: "β",
      snrUnit: "Unit SNR",
      uniform: "Seragam",
      maxwellBoltzmann: "MB"
    }
  },
  ms: {
    plotAxis: {
      modulationSize: "Saiz Modulasi (M)",
      snrDb: "SNR (dB)",
      snrLinear: "SNR (linear)",
      rate: "Kadar (R)",
      codeLength: "Panjang Kod (n)",
      quadrature: "Kuadratur (N)",
      threshold: "Ambang",
      shapingParam: "Parameter Pembentukan (β)",
      errorProbability: "Kebarangkalian Ralat",
      errorExponent: "Eksponen Ralat",
      optimalRho: "ρ Optimum",
      mutualInformation: "Maklumat Bersama",
      cutoffRate: "Kadar Potongan (R₀)"
    },
    plotLegend: {
      series: "Siri",
      modulation: "M",
      type: "Jenis",
      snr: "SNR",
      rate: "Kadar",
      codeLength: "n",
      quadrature: "N",
      threshold: "Ambang",
      distribution: "Tbrn.",
      shapingParam: "β",
      snrUnit: "Unit SNR",
      uniform: "Seragam",
      maxwellBoltzmann: "MB"
    }
  }
};

// Process all locale files
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

let updated = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const langCode = file.replace('.json', '');

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Get the translation for this language, fall back to English
    const trans = translations[langCode] || translations.en;

    // Add or update plotAxis and plotLegend
    content.plotAxis = trans.plotAxis;
    content.plotLegend = trans.plotLegend;

    // Write back
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    updated++;
    console.log(`✓ Updated ${file}`);
  } catch (err) {
    console.error(`✗ Error processing ${file}:`, err.message);
    skipped++;
  }
});

console.log(`\nDone! Updated ${updated} files, skipped ${skipped}`);
