(() => {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const CONFIG = window.NUR_APP_CONFIG || {};
  const LETTERS = Array.isArray(window.NUR_LETTERS) ? window.NUR_LETTERS : [];
  const FREE_COUNT = Number(CONFIG.freeLetterCount) || 10;
  const params = new URLSearchParams(location.search);

  const UI = {
    ru: {
      title: "НурПисьмо · Тёплые слова", brand: "Тёплые слова<br><em>находят путь</em>", brandCopy: "Вечер у озера, живой дождь и письмо, созданное именно для {to}.", from: "от", open: "Открыть письмо", create: "Создать своё письмо", free: "10 писем бесплатно", full: "полная коллекция — 4,99 €", weather: "Погода", next: "Следующее письмо", copy: "Копировать текст", copied: "Текст скопирован", read: "Прочитать", stop: "Остановить", postcard: "Открытка", saved: "Сохранить", favorite: "Сохранено", home: "На главную", personal: "Создать персональное письмо", stage: "Вечер сохранил эти слова для тебя", letterTitle: "Несколько слов для тебя", for: "для", warmSign: "С теплом,", aiTitle: "Личное письмо", aiEyebrow: "УМНЫЙ РЕДАКТОР · БЕЗ СЛУЧАЙНЫХ ФРАЗ", fromWho: "От кого", forWho: "Для кого", formHint: "Можно написать роль рядом с именем: «Амина (дочь)» → «Мама». Редактор сам подберёт смысл.", generate: "Создать красивое письмо", generating: "Собираю письмо по смыслу…", own: "Написать свой текст", ownWords: "Ваши слова", ownPlaceholder: "Напишите письмо своими словами…", useOwn: "Открыть моё письмо", ready: "ГОТОВОЕ ПИСЬМО", variant: "↻ Другой вариант", openAs: "Открыть как письмо", library: "Коллекция", openCount: "10 писем открыто", allCount: "Все 50 писем открыты", all: "Все", warm: "Тепло", gratitude: "Спасибо", support: "Поддержка", family: "Семья", openQuote: "Открыть", unlock: "Открыть полный доступ", locked: "Доступно в полной версии", settings: "Настроение", langLabel: "Язык приложения и писем", choosePhoto: "Выбрать фото", resetPhoto: "Вернуть озеро", buy: "Открыть за", restore: "Восстановить покупку", purchaseUnavailable: "Покупка станет доступна в приложении из Google Play", restored: "Покупка проверена", premiumOn: "Полный доступ открыт навсегда", safety: "Текст содержит запрещённую или двусмысленную формулировку. Измените его.", namesSafety: "Введите обычные имена или семейные роли.", customAdded: "Ваше письмо готово и сохранено в ссылке", rainOn: "Дождь включён", rainOff: "Дождь выключен", natureOn: "Ночной лес зазвучал", natureOff: "Звуки природы выключены", photoReady: "Личный фон сохранён на этом устройстве", photoReset: "Возвращён фон у озера", locationDenied: "Без разрешения местная погода недоступна", weatherFail: "Не удалось получить погоду", install: "Установить НурПисьмо", shareText: "Это письмо для тебя", downloadReady: "Открытка готова", composeFail: "Облачный редактор недоступен — создан проверенный вариант", close: "Закрыть"
    },
    en: {
      title: "NurLetter · Warm words", brand: "Warm words<br><em>find their way</em>", brandCopy: "An evening by the lake, living rain, and a letter made especially for {to}.", from: "from", open: "Open the letter", create: "Create your own letter", free: "10 letters free", full: "full collection — €4.99", weather: "Weather", next: "Next letter", copy: "Copy text", copied: "Text copied", read: "Read aloud", stop: "Stop", postcard: "Postcard", saved: "Save", favorite: "Saved", home: "Home", personal: "Create a personal letter", stage: "The evening kept these words for you", letterTitle: "A few words for you", for: "for", warmSign: "With warmth,", aiTitle: "Personal letter", aiEyebrow: "SMART EDITOR · NO RANDOM PHRASES", fromWho: "From", forWho: "To", formHint: "You may add a role next to the name: “Amina (daughter)” → “Mum”. The editor will understand the context.", generate: "Create a beautiful letter", generating: "Building a coherent letter…", own: "Write your own text", ownWords: "Your words", ownPlaceholder: "Write your letter in your own words…", useOwn: "Open my letter", ready: "YOUR LETTER", variant: "↻ Another version", openAs: "Open as a letter", library: "Collection", openCount: "10 letters unlocked", allCount: "All 50 letters unlocked", all: "All", warm: "Warmth", gratitude: "Gratitude", support: "Support", family: "Family", openQuote: "Open", unlock: "Unlock full access", locked: "Available in the full version", settings: "Atmosphere", langLabel: "App and letter language", choosePhoto: "Choose a photo", resetPhoto: "Restore the lake", buy: "Unlock for", restore: "Restore purchase", purchaseUnavailable: "Purchases will be available in the Google Play app", restored: "Purchase checked", premiumOn: "Full access unlocked forever", safety: "This text contains a prohibited or ambiguous phrase. Please change it.", namesSafety: "Enter ordinary names or family roles.", customAdded: "Your letter is ready and saved in the link", rainOn: "Rain is on", rainOff: "Rain is off", natureOn: "The night forest is alive", natureOff: "Nature sounds are off", photoReady: "Your background is saved on this device", photoReset: "The lake background is back", locationDenied: "Local weather needs location permission", weatherFail: "Weather is unavailable", install: "Install NurLetter", shareText: "This letter is for you", downloadReady: "Your postcard is ready", composeFail: "Cloud editor unavailable — a verified version was created", close: "Close"
    },
    fr: {
      title: "NurLettre · Mots chaleureux", brand: "Les mots sincères<br><em>trouvent leur chemin</em>", brandCopy: "Un soir au bord du lac, une pluie vivante et une lettre créée spécialement pour {to}.", from: "de", open: "Ouvrir la lettre", create: "Créer votre lettre", free: "10 lettres gratuites", full: "collection complète — 4,99 €", weather: "Météo", next: "Lettre suivante", copy: "Copier le texte", copied: "Texte copié", read: "Lire à voix haute", stop: "Arrêter", postcard: "Carte", saved: "Enregistrer", favorite: "Enregistré", home: "Accueil", personal: "Créer une lettre personnelle", stage: "Le soir a gardé ces mots pour toi", letterTitle: "Quelques mots pour toi", for: "pour", warmSign: "Avec chaleur,", aiTitle: "Lettre personnelle", aiEyebrow: "ÉDITEUR INTELLIGENT · AUCUNE PHRASE ALÉATOIRE", fromWho: "De la part de", forWho: "Pour", formHint: "Vous pouvez ajouter le lien familial au nom : « Amina (fille) » → « Maman ». L’éditeur comprendra le contexte.", generate: "Créer une belle lettre", generating: "Je compose une lettre cohérente…", own: "Écrire votre propre texte", ownWords: "Vos mots", ownPlaceholder: "Écrivez votre lettre avec vos propres mots…", useOwn: "Ouvrir ma lettre", ready: "VOTRE LETTRE", variant: "↻ Une autre version", openAs: "Ouvrir comme lettre", library: "Collection", openCount: "10 lettres accessibles", allCount: "Les 50 lettres sont accessibles", all: "Toutes", warm: "Chaleur", gratitude: "Merci", support: "Soutien", family: "Famille", openQuote: "Ouvrir", unlock: "Débloquer l’accès complet", locked: "Disponible dans la version complète", settings: "Atmosphère", langLabel: "Langue de l’application et des lettres", choosePhoto: "Choisir une photo", resetPhoto: "Remettre le lac", buy: "Débloquer pour", restore: "Restaurer l’achat", purchaseUnavailable: "L’achat sera disponible dans l’application Google Play", restored: "Achat vérifié", premiumOn: "Accès complet débloqué pour toujours", safety: "Ce texte contient une formulation interdite ou ambiguë. Modifiez-le.", namesSafety: "Saisissez des prénoms ordinaires ou des rôles familiaux.", customAdded: "Votre lettre est prête et enregistrée dans le lien", rainOn: "La pluie est activée", rainOff: "La pluie est désactivée", natureOn: "La forêt nocturne s’éveille", natureOff: "Les sons de la nature sont désactivés", photoReady: "Votre fond est enregistré sur cet appareil", photoReset: "Le lac est de retour", locationDenied: "La météo locale nécessite votre autorisation", weatherFail: "La météo est indisponible", install: "Installer NurLettre", shareText: "Cette lettre est pour toi", downloadReady: "Votre carte est prête", composeFail: "L’éditeur en ligne est indisponible — une version vérifiée a été créée", close: "Fermer"
    }
  };

  const EXTRA_UI = {
    ru: { adabTitle:"Режим адаба всегда включён",adabNote:"Только уважительные слова. Темы 18+, грубость и запретное содержание блокируются.",ownNote:"Перед добавлением текст проходит тот же фильтр скромности. Он будет сохранён в персональной ссылке.",qualityTitle:"Почему текст стал лучше:",qualityBody:"редактор определяет семейный контекст, собирает цельное письмо из проверенных смыслов и проверяет результат. Никакой модели на 500 МБ.",religiousNote:"Фильтр помогает сохранять скромность и уважение, но не является религиозным заключением. Перед отправкой перечитайте письмо.",collectionEyebrow:"50 ПРОВЕРЕННЫХ ТЕКСТОВ",collectionNote:"Каждый текст автоматически обращается к выбранному человеку.",settingsEyebrow:"ВАША АТМОСФЕРА",rainTitle:"Живой дождь",rainNote:"крупные капли и брызги",natureTitle:"Ночной лес",natureNote:"сверчки, ветер и лягушки",weatherTitle:"Моя погода",weatherNote:"атмосфера по месту",fullscreenTitle:"Полный экран",fullscreenNote:"без лишних элементов",personalBg:"Личный фон",ownPhoto:"Своя фотография",localOnly:"Останется только на этом устройстве",music:"Музыка и нашиды",fullVersion:"ПОЛНАЯ ВЕРСИЯ",allLetters:"Откройте все 50 писем",onePurchase:"Одна покупка, восстановление через аккаунт магазина и все будущие тексты.",paywallEyebrow:"НУРПИСЬМО · ПОЛНЫЙ ДОСТУП",paywallTitle:"Ещё 40 писем<br><em>для важных людей</em>",paywallBody:"Первые 10 остаются бесплатными. Полная коллекция, открытки и все будущие тексты открываются навсегда.",benefit1:"50 персональных писем",benefit2:"восстановление покупки",benefit3:"обновления коллекции",payButton:"Открыть полный доступ",storeNote:"Оплата проходит через магазин. Цена может отображаться в местной валюте.",privacy:"Конфиденциальность",supportLink:"Поддержка",customMusic:"Добавить свой нашид",customMusicNote:"MP3, M4A, OGG или WAV" },
    en: { adabTitle:"Adab mode is always on",adabNote:"Respectful words only. Adult content, abuse, and prohibited themes are blocked.",ownNote:"Your text passes the same modesty filter and is saved inside the personal link.",qualityTitle:"Why the text is better:",qualityBody:"the editor identifies family context, builds one coherent letter from reviewed ideas, and validates the result. No 500 MB model download.",religiousNote:"The filter supports modest and respectful wording but is not a religious ruling. Please reread the letter before sending.",collectionEyebrow:"50 REVIEWED TEXTS",collectionNote:"Every text automatically addresses the person you selected.",settingsEyebrow:"YOUR ATMOSPHERE",rainTitle:"Living rain",rainNote:"large drops and gentle splashes",natureTitle:"Night forest",natureNote:"crickets, wind, and frogs",weatherTitle:"My weather",weatherNote:"atmosphere for your location",fullscreenTitle:"Full screen",fullscreenNote:"a clear, immersive view",personalBg:"Personal background",ownPhoto:"Your own photo",localOnly:"Stays only on this device",music:"Music and nasheeds",fullVersion:"FULL VERSION",allLetters:"Unlock all 50 letters",onePurchase:"One purchase, store-account restoration, and all future texts.",paywallEyebrow:"NURLETTER · FULL ACCESS",paywallTitle:"40 more letters<br><em>for important people</em>",paywallBody:"The first 10 stay free. The complete collection, postcards, and future texts unlock forever.",benefit1:"50 personal letters",benefit2:"purchase restoration",benefit3:"collection updates",payButton:"Unlock full access",storeNote:"Payment is handled by the store. The price may appear in your local currency.",privacy:"Privacy",supportLink:"Support",customMusic:"Add your own nasheed",customMusicNote:"MP3, M4A, OGG, or WAV" },
    fr: { adabTitle:"Le mode adab est toujours actif",adabNote:"Uniquement des mots respectueux. Le contenu adulte, la grossièreté et les thèmes interdits sont bloqués.",ownNote:"Votre texte passe le même filtre de pudeur et sera enregistré dans le lien personnel.",qualityTitle:"Pourquoi le texte est meilleur :",qualityBody:"l’éditeur reconnaît le contexte familial, compose une lettre cohérente avec des idées vérifiées et contrôle le résultat. Aucun modèle de 500 Mo.",religiousNote:"Le filtre favorise la pudeur et le respect, mais ne constitue pas un avis religieux. Relisez la lettre avant de l’envoyer.",collectionEyebrow:"50 TEXTES VÉRIFIÉS",collectionNote:"Chaque texte s’adresse automatiquement à la personne choisie.",settingsEyebrow:"VOTRE ATMOSPHÈRE",rainTitle:"Pluie vivante",rainNote:"grosses gouttes et éclaboussures douces",natureTitle:"Forêt nocturne",natureNote:"grillons, vent et grenouilles",weatherTitle:"Ma météo",weatherNote:"une ambiance adaptée au lieu",fullscreenTitle:"Plein écran",fullscreenNote:"une vue claire et immersive",personalBg:"Fond personnel",ownPhoto:"Votre photo",localOnly:"Reste uniquement sur cet appareil",music:"Musique et nasheeds",fullVersion:"VERSION COMPLÈTE",allLetters:"Débloquez les 50 lettres",onePurchase:"Un achat, restauration via le compte du magasin et tous les futurs textes.",paywallEyebrow:"NURLETTRE · ACCÈS COMPLET",paywallTitle:"40 lettres de plus<br><em>pour les personnes importantes</em>",paywallBody:"Les 10 premières restent gratuites. La collection, les cartes et les futurs textes sont débloqués pour toujours.",benefit1:"50 lettres personnelles",benefit2:"restauration de l’achat",benefit3:"mises à jour de la collection",payButton:"Débloquer l’accès complet",storeNote:"Le paiement est géré par le magasin. Le prix peut apparaître dans votre devise locale.",privacy:"Confidentialité",supportLink:"Assistance",customMusic:"Ajouter votre nasheed",customMusicNote:"MP3, M4A, OGG ou WAV" }
  };
  Object.keys(UI).forEach(code => Object.assign(UI[code], EXTRA_UI[code]));

  const tracks = [
    { name: "Мураджан · slowed", source: "audio/track-1.mp3", fallback: "audio/track-1.b64" },
    { name: "Азан · nasheed", source: "audio/track-2.mp3", fallback: "audio/track-2.b64" },
    { name: "Лучшие нашиды", source: "audio/track-3.mp3", fallback: "audio/track-3.b64" }
  ];

  const forbiddenStems = [
    "секс", "эрот", "порн", "поцелу", "интим", "обнаж", "генитал", "оргазм", "возбужд", "мастурб", "проститу",
    "sex", "erotic", "porn", "kiss", "intimacy", "nude", "naked", "genital", "orgasm", "arous", "masturb", "prostitut",
    "sexe", "eroti", "porn", "baiser", "embrasser", "intimite", "nudite", "genital", "orgasme", "excite", "masturb", "prostitu",
    "алкогол", "водк", "коньяк", "наркот", "кокаин", "героин", "казино", "букмек", "шантаж", "угрож", "убить", "избить",
    "alcohol", "vodka", "drug", "cocaine", "heroin", "casino", "gambling", "blackmail", "threat", "kill",
    "alcool", "vodka", "drogue", "cocaine", "heroine", "casino", "parier", "chantage", "menace", "tuer"
  ];

  const relationshipWords = {
    mother: ["мама", "маме", "мать", "mother", "mum", "mom", "maman", "mere"],
    father: ["папа", "папе", "отец", "father", "dad", "papa", "pere"],
    spouse: ["жена", "супруга", "муж", "супруг", "wife", "husband", "spouse", "epouse", "epoux", "mari", "femme"],
    child: ["дочь", "дочка", "сын", "ребенок", "daughter", "son", "child", "fille", "fils", "enfant"],
    sibling: ["сестра", "брат", "sister", "brother", "soeur", "frere"],
    grandparent: ["бабушка", "дедушка", "grandmother", "grandfather", "grandma", "grandpa", "grand-mere", "grand-pere", "mamie", "papi"],
    teacher: ["учитель", "учительница", "наставник", "teacher", "mentor", "professeur"],
    friend: ["друг", "подруга", "friend", "ami", "amie"]
  };

  const composer = {
    ru: {
      universal: [
        "{to}, мне хотелось сказать тебе несколько простых и искренних слов. Я ценю твоё доброе сердце, спокойствие и то тепло, которое ты приносишь в обычные дни. Не всё важное получается произнести вовремя, поэтому пусть это письмо напомнит: ты действительно дорогой для меня человек. Желаю тебе лёгкости в мыслях, уверенности в решениях и людей рядом, с которыми можно оставаться собой. Пусть впереди будет больше тихих радостей и поводов улыбаться. Спасибо, что ты есть в моей жизни.",
        "{to}, среди повседневных дел легко забыть сказать о главном. Мне важно напомнить: я замечаю твою доброту, уважаю твой характер и ценю каждую спокойную минуту нашего общения. Пусть даже в сложные дни у тебя остаётся внутренний свет и уверенность, что рядом есть человек, которому небезразлично твоё состояние. Береги силы, не требуй от себя невозможного и чаще находи время для отдыха. Я от всего сердца желаю тебе мира, здоровья и добрых новостей.",
        "{to}, это письмо пришло без особого повода — просто некоторые слова не стоит откладывать. Твоё присутствие делает многие моменты теплее, а искренний разговор с тобой надолго оставляет спокойствие. Спасибо за внимание, терпение и добрые поступки, которые могут казаться маленькими, но имеют большую ценность. Пусть твои планы складываются благополучно, дом остаётся уютным, а сердце не устаёт надеяться на хорошее. Ты важный человек, и мне хотелось напомнить тебе об этом сегодня."
      ],
      mother: [
        "{to}, хочу от всего сердца поблагодарить тебя за заботу, которая сопровождала меня даже тогда, когда я не замечал её глубины. В твоих словах всегда было много терпения, а в поступках — тихая любовь, не требующая благодарности. Пусть теперь у тебя будет больше времени для отдыха, спокойных мыслей и людей, которые будут беречь тебя так же внимательно. Я помню твоё добро и хочу чаще отвечать на него не только словами, но и поступками. Ты очень дорога мне.",
        "{to}, сколько бы дорог ни появилось в жизни, твой голос остаётся напоминанием о доме и спокойствии. Спасибо за терпение, советы и ежедневные мелочи, за которыми всегда стояла большая забота. Мне хочется, чтобы ты реже тревожилась и чаще чувствовала, как сильно тебя ценят. Пусть твои дни будут светлыми, здоровье — крепким, а рядом всегда будут близкие люди. Я дорожу тобой и от всего сердца ценю всё, чему ты меня научила."
      ],
      father: [
        "{to}, с возрастом я всё яснее понимаю ценность твоих советов и спокойной надёжности. Ты показывал пример не громкими словами, а ответственностью, терпением и поступками. Спасибо за опору, которую я чувствую даже на расстоянии. Пусть у тебя будет крепкое здоровье, больше отдыха и уверенность, что твои старания замечены и глубоко ценятся. Я хочу чаще говорить тебе об этом и подтверждать благодарность делами. Ты очень дорог мне.",
        "{to}, не все важные чувства легко произнести вслух, но я хочу сказать главное: я ценю твою силу, честность и заботу о семье. Многие вещи, которым ты меня научил, помогают мне принимать решения и не сдаваться перед трудностями. Пусть впереди у тебя будет больше спокойных дней, добрых встреч и поводов гордиться тем, что ты создал. Спасибо, что рядом с тобой слово «надёжность» всегда имело настоящий смысл."
      ],
      spouse: [
        "{to}, мне особенно дороги не только важные события, но и наши самые обычные дни. В них есть разговоры, взаимная забота и спокойное чувство, что мы идём по жизни вместе. Я ценю твой характер, терпение и добро в мелочах. Мне хочется беречь уважение между нами, чаще слышать тебя и строить дом, в котором сердцу спокойно. Пусть впереди будет много совместных планов, ясных решений и моментов, за которые мы сможем благодарить друг друга.",
        "{to}, это письмо без особого повода — просто напоминание, что ты важная часть моей жизни. Спасибо, что умеешь выслушать, поддержать и сделать обычный вечер уютнее. Даже когда мы смотрим на вещи по-разному, ты остаёшься важнее любого спора. Я хочу беречь то хорошее, что есть между нами, проявлять больше терпения и подтверждать свои слова заботливыми поступками. Пусть рядом друг с другом нам всегда будет спокойно и надёжно."
      ],
      child: [
        "{to}, я горжусь тобой не за безупречность и не только за победы. Для меня важнее твоя честность, доброе сердце и то, как ты учишься после ошибок. Помни: со сложным вопросом можно прийти ко мне, и мы вместе постараемся найти решение. Не бойся расти маленькими шагами, спрашивать и пробовать снова. Моя поддержка не зависит от оценок или достижений. Желаю тебе сохранить любопытство, смелость быть собой и уважение к другим людям.",
        "{to}, в тебе есть свой свет, талант и особенный взгляд на мир. Мне хочется, чтобы ты доверял своим силам и спокойно просил о помощи, когда она нужна. Ошибки не делают тебя хуже — они помогают учиться и становиться мудрее. Твои успехи всегда радуют меня, но ещё сильнее я ценю твою доброту и честность. Пусть рядом встречаются люди, которые уважают тебя, а каждый новый день даёт повод узнать что-то хорошее."
      ],
      sibling: [
        "{to}, у нас столько общих историй, что из них могла бы получиться целая книга. Но её главная мысль проста: очень ценно иметь родного человека, которому не нужно долго объяснять себя. Спасибо за честные слова, поддержку и смех, который делал обычные дни легче. Мы можем быть разными и иногда спорить, но для меня наша связь важнее случайных обид. Я хочу беречь её и всегда оставаться человеком, к которому ты можешь обратиться.",
        "{to}, наши воспоминания до сих пор согревают меня, потому что рядом в них всегда есть человек, который помнит всё вместе со мной. Спасибо за моменты, когда можно было быть собой без лишних объяснений. Если тебе станет трудно, не думай, что нужно справляться в одиночку: я всегда найду время, чтобы выслушать и поддержать. Пусть жизнь ведёт тебя к добрым людям, честным решениям и спокойствию, а наша связь остаётся тёплой независимо от расстояния."
      ],
      grandparent: [
        "{to}, в твоей заботе всегда было особенное тепло, которое я узнаю среди множества воспоминаний. Спасибо за терпение, мудрые истории и уют, который появлялся рядом с тобой. Твои слова научили меня замечать главное и относиться к людям добрее. Пусть твои дни будут неспешными, светлыми и наполненными вниманием близких. Пусть будет больше времени для отдыха и ощущения, что тебя по-настоящему ценят. Я бережно храню всё добро, которым ты делился со мной.",
        "{to}, расстояние не уменьшает ценность человека, чьи советы сопровождают нас долгие годы. Я часто вспоминаю простые минуты рядом, семейные истории и то спокойствие, которое всегда исходило от тебя. Спасибо за корни, память и чувство дома. Желаю тебе здоровья, лёгких мыслей и заботливых людей рядом. Пусть каждый день приносит хотя бы одну добрую новость, а моё письмо напомнит, как много ты значишь для меня."
      ],
      teacher: ["{to}, спасибо за знания, терпение и умение поддержать тогда, когда что-то не получалось сразу. Настоящий наставник даёт не только ответы, но и уверенность искать их самостоятельно. Я ценю уважение, с которым ты относишься к людям, и уроки, которые остаются полезными далеко за пределами учебных занятий. Пусть твой труд приносит радость, ученики отвечают благодарностью, а каждый новый день подтверждает, что вложенные усилия имеют смысл."],
      friend: ["{to}, спасибо за дружбу, в которой можно быть собой, говорить честно и не бояться непонимания. Я ценю наши разговоры, поддержку и простые моменты, после которых становится легче. Пусть в твоей жизни будет больше спокойных дней, верных людей и дел, приносящих пользу и радость. Если однажды станет трудно, помни: рядом есть человек, готовый выслушать без лишних оценок. Береги себя и не забывай, насколько ценно твоё доброе сердце."]
    },
    en: {
      universal: [
        "{to}, I wanted to share a few simple and sincere words with you. I value your kind heart, your calmness, and the warmth you bring to ordinary days. Important things are not always said at the right moment, so let this letter remind you that you truly matter to me. I wish you clarity in your thoughts, confidence in your decisions, and people around you with whom you can be yourself. May there be more quiet joys and reasons to smile ahead. Thank you for being part of my life.",
        "{to}, everyday life can make us forget to say what matters most. I want you to know that I notice your kindness, respect your character, and treasure every calm moment we share. Even on difficult days, may you keep your inner light and remember that someone genuinely cares about how you feel. Protect your strength, do not demand the impossible from yourself, and make room for rest. I sincerely wish you peace, good health, and kind news.",
        "{to}, this letter comes without a special occasion, because some words should not be postponed. Your presence makes many moments warmer, and an honest conversation with you leaves a lasting sense of calm. I am grateful for your attention, patience, and quiet acts of kindness. May your plans unfold well, your home remain peaceful, and your heart keep hoping for good things. You are important, and I wanted to remind you of that today."
      ],
      mother: ["{to}, I want to thank you from my heart for the care that followed me even when I did not know how to notice it. Your words held more patience than I understood, and your actions carried a quiet love that never asked for recognition. May you now have more time to rest, calmer thoughts, and people who care for you as attentively as you have cared for others. I remember your goodness and want to answer it not only with words, but with thoughtful actions. You mean so much to me."],
      father: ["{to}, as I grow, I understand the value of your advice and steady reliability more clearly. You taught by responsibility, patience, and action rather than loud words. Thank you for the support I can feel even from far away. May you have strong health, more time to rest, and the certainty that your efforts are seen and deeply appreciated. I want to say this more often and show my gratitude through what I do. You mean so much to me."],
      spouse: ["{to}, I treasure not only the important milestones but also our most ordinary days. They hold our conversations, mutual care, and the calm sense that we are walking through life together. I value your character, patience, and kindness in small things. I want to protect the respect between us, listen more closely, and build a home where the heart feels safe. May we have many shared plans, clear decisions, and moments that make us grateful for one another."],
      child: ["{to}, I am proud of you not for being perfect and not only for your victories. Your honesty, kind heart, and willingness to learn from mistakes matter even more to me. You can bring any difficult question to me, and we will look for an answer together. Do not be afraid to grow in small steps, ask questions, and try again. My support does not depend on grades or achievements. May you keep your curiosity, the courage to be yourself, and respect for others."],
      sibling: ["{to}, we share enough stories to fill a whole book, but its most important message is simple: having a family member who understands without long explanations is a gift. Thank you for honest words, support, and laughter that made ordinary days lighter. We may be different and sometimes disagree, but our bond matters more to me than passing frustrations. I want to protect it and remain someone you can always turn to."],
      grandparent: ["{to}, your care has always carried a special warmth that I recognise among countless memories. Thank you for your patience, wise stories, and the sense of home that appeared around you. Your words taught me to notice what matters and to treat people with greater kindness. May your days be gentle, bright, and filled with attention from those close to you. I hope you rest more and feel how deeply you are appreciated. I carefully keep all the goodness you shared with me."],
      teacher: ["{to}, thank you for your knowledge, patience, and ability to encourage people when something does not work at once. A true mentor gives more than answers; they give confidence to keep searching. I value the respect you show to others and the lessons that remain useful far beyond the classroom. May your work bring joy, your students answer with gratitude, and each new day confirm that your efforts truly matter."],
      friend: ["{to}, thank you for a friendship in which I can be myself, speak honestly, and not fear being misunderstood. I value our conversations, your support, and the simple moments that leave life feeling lighter. May your days hold more peace, trustworthy people, and meaningful work that brings joy. If life becomes difficult, remember that someone is ready to listen without judgement. Take care of yourself and never forget the value of your kind heart."]
    },
    fr: {
      universal: [
        "{to}, je voulais partager avec toi quelques mots simples et sincères. J’apprécie ton cœur généreux, ton calme et la chaleur que tu apportes aux jours ordinaires. On ne dit pas toujours l’essentiel au bon moment ; que cette lettre te rappelle donc que tu comptes vraiment pour moi. Je te souhaite des pensées légères, de la confiance dans tes décisions et des personnes auprès desquelles tu peux rester toi-même. Que les jours à venir t’offrent des joies paisibles et de nombreuses raisons de sourire. Merci d’être dans ma vie.",
        "{to}, le quotidien nous fait parfois oublier de dire l’essentiel. Je veux que tu saches que je remarque ta bonté, que je respecte ton caractère et que je chéris chaque moment calme partagé avec toi. Même pendant les jours difficiles, garde ta lumière intérieure et souviens-toi qu’une personne se soucie sincèrement de ton bien-être. Préserve tes forces, n’exige pas l’impossible de toi-même et accorde-toi du repos. Je te souhaite de tout cœur la paix, la santé et de bonnes nouvelles.",
        "{to}, cette lettre arrive sans occasion particulière, car certains mots ne devraient pas attendre. Ta présence rend de nombreux instants plus chaleureux, et une conversation sincère avec toi laisse un calme durable. Merci pour ton attention, ta patience et tes gestes de bonté discrets. Que tes projets se réalisent au mieux, que ton foyer reste paisible et que ton cœur continue d’espérer de belles choses. Tu comptes beaucoup, et je voulais te le rappeler aujourd’hui."
      ],
      mother: ["{to}, je veux te remercier de tout cœur pour tous les soins reçus, même lorsque je ne savais pas encore les remarquer. Tes paroles contenaient plus de patience que je ne le comprenais et tes gestes portaient une affection discrète qui ne demandait rien en retour. Puisses-tu maintenant avoir davantage de temps pour te reposer, des pensées plus légères et des proches qui prennent soin de toi avec la même attention. Je n’oublie pas ta bonté et je veux y répondre par des actes autant que par des mots. Tu comptes énormément pour moi."],
      father: ["{to}, avec le temps, je comprends de mieux en mieux la valeur de tes conseils et de ta présence fiable. Tu m’as montré l’exemple par la responsabilité, la patience et les actes plutôt que par de grands discours. Merci pour ce soutien que je ressens même à distance. Je te souhaite une bonne santé, davantage de repos et la certitude que tous tes efforts sont vus et profondément appréciés. Je veux te le dire plus souvent et montrer ma gratitude dans mes actions. Tu comptes énormément pour moi."],
      spouse: ["{to}, je chéris autant les grands moments que nos journées les plus ordinaires. Elles contiennent nos conversations, notre attention mutuelle et le sentiment paisible d’avancer ensemble dans la vie. J’apprécie ton caractère, ta patience et ta bonté dans les petites choses. Je veux préserver le respect entre nous, mieux t’écouter et construire un foyer où le cœur se sent en sécurité. Que l’avenir nous offre de nombreux projets communs, des décisions sereines et des moments qui nous rendent reconnaissants l’un envers l’autre."],
      child: ["{to}, tes réussites me rendent heureux, mais ton honnêteté, ton bon cœur et ta capacité à apprendre de tes erreurs comptent encore davantage. Tu peux venir me voir avec n’importe quelle question difficile, et nous chercherons une solution ensemble. N’aie pas peur d’avancer par petits pas, de poser des questions et de recommencer. Mon soutien ne dépend ni des notes ni des victoires. Garde ta curiosité, le courage d’être toi-même et le respect des autres."],
      sibling: ["{to}, nous partageons assez d’histoires pour remplir un livre entier, mais son message principal est simple : avoir un proche qui nous comprend sans longues explications est précieux. Merci pour tes paroles honnêtes, ton soutien et les rires qui ont rendu les jours ordinaires plus légers. Nous pouvons être différents et parfois en désaccord, mais notre lien compte davantage que les contrariétés passagères. Je veux le préserver et rester une personne vers qui tu peux toujours te tourner."],
      grandparent: ["{to}, ton attention a toujours eu une chaleur particulière que je reconnais parmi mille souvenirs. Merci pour ta patience, tes histoires pleines de sagesse et ce sentiment de foyer qui naissait autour de toi. Tes paroles m’ont appris à voir l’essentiel et à traiter les autres avec plus de bonté. Que tes journées soient douces, lumineuses et entourées de l’attention de tes proches. J’aimerais que tu te reposes davantage et que tu ressentes toute l’estime de ta famille. Je garde précieusement tout le bien que tu m’as transmis."],
      teacher: ["{to}, merci pour tes connaissances, ta patience et ta façon d’encourager lorsque tout ne réussit pas immédiatement. Un véritable guide ne donne pas seulement des réponses : il donne la confiance nécessaire pour continuer à chercher. J’apprécie le respect que tu témoignes aux autres et les leçons qui restent utiles bien au-delà des cours. Que ton travail t’apporte de la joie, que tes élèves répondent avec gratitude et que chaque journée confirme la valeur de tes efforts."],
      friend: ["{to}, merci pour cette amitié qui permet de rester soi-même, de parler avec sincérité et de se sentir compris. J’apprécie nos conversations, ton soutien et ces moments simples après lesquels la vie paraît plus légère. Je te souhaite des journées paisibles, des personnes loyales et des activités utiles qui apportent de la joie. Si la vie devient difficile, souviens-toi qu’une personne est prête à t’écouter sans te juger. Prends soin de toi et n’oublie jamais la valeur de ton bon cœur."]
    }
  };

  let lang = ["ru", "en", "fr"].includes(params.get("lang")) ? params.get("lang") : (localStorage.getItem("nurLanguage") || "ru");
  if (!UI[lang]) lang = "ru";
  let fromName = cleanName(params.get("from")) || cleanName(localStorage.getItem("nurFrom")) || "Ислам";
  let toName = cleanName(params.get("to")) || cleanName(localStorage.getItem("nurTo")) || "Айша";
  let sharedMessage = decodeSharedMessage(params.get("msg"));
  let letterDeck = sharedMessage ? [{ id: "shared", category: "warm", shared: true, ru: sharedMessage, en: sharedMessage, fr: sharedMessage }, ...LETTERS] : [...LETTERS];
  let currentIndex = sharedMessage ? 0 : Math.max(0, Math.min(Number(params.get("quote") || localStorage.getItem("nurLetterIndex") || 1) - 1, Math.max(0, letterDeck.length - 1)));
  let storyOpened = false;
  let selectedCategory = "all";
  let selectedTrack = Math.max(0, Math.min(Number(localStorage.getItem("nurTrack") || 0), 3));
  let currentAudioUrl = "";
  let customAudioBlob = null;
  let backgroundUrl = "";
  let mobileBackgroundUrl = "";
  let customBackgroundBlob = null;
  let isMusicPlaying = false;
  let isNaturePlaying = false;
  let isPremium = false;
  let purchaseConfigured = null;
  let premiumPrice = CONFIG.defaultPrice || "4,99 €";
  let generatedMessage = "";
  let composerVariant = 0;
  let toastTimer = 0;
  let deferredInstallPrompt = null;
  let weatherEnabled = localStorage.getItem("nurWeather") === "on";
  let favorites = new Set(JSON.parse(localStorage.getItem("nurFavorites") || "[]"));

  const audio = $("#nasheed");
  const homeScreen = $("#homeScreen");
  const letterStage = $("#letterStage");
  const layers = {
    ai: $("#aiLayer"), library: $("#libraryLayer"), settings: $("#settingsLayer"), paywall: $("#paywallLayer")
  };

  function t(key) { return UI[lang][key] || UI.ru[key] || key; }

  function normalize(value) {
    return String(value || "").normalize("NFKC").toLowerCase().replaceAll("ё", "е").replaceAll("é", "e").replaceAll("è", "e").replaceAll("ê", "e").replaceAll("ë", "e").replaceAll("à", "a").replaceAll("â", "a").replaceAll("î", "i").replaceAll("ï", "i").replaceAll("ô", "o").replaceAll("ù", "u").replaceAll("û", "u").replaceAll("ç", "c");
  }

  function containsForbidden(value) {
    const compact = normalize(value).replace(/[\s\p{P}\p{S}_]+/gu, "");
    return forbiddenStems.some(stem => compact.includes(normalize(stem).replace(/[^\p{L}\p{N}]/gu, "")));
  }

  function cleanName(value) {
    return String(value || "").normalize("NFKC").replace(/[<>\n\r{}\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 36);
  }

  function displayName(value) {
    return cleanName(value).replace(/\s*\([^)]*\)\s*/g, " ").trim() || cleanName(value);
  }

  function encodeSharedMessage(text) {
    try {
      const bytes = new TextEncoder().encode(text);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    } catch { return ""; }
  }

  function decodeSharedMessage(encoded) {
    if (!encoded || encoded.length > 12000) return "";
    try {
      const padded = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      const binary = atob(padded);
      const text = new TextDecoder().decode(Uint8Array.from(binary, character => character.charCodeAt(0))).trim();
      return text.length <= 1800 && !containsForbidden(text) ? text : "";
    } catch { return ""; }
  }

  function entryText(entry) {
    return String(entry?.[lang] || entry?.ru || "").replaceAll("{to}", displayName(toName)).replaceAll("Айша", displayName(toName));
  }

  function basePosition(entry) {
    return Number(entry?.id) || 0;
  }

  function canAccess(entry) {
    return Boolean(entry?.shared || isPremium || (basePosition(entry) > 0 && basePosition(entry) <= FREE_COUNT));
  }

  function currentEntry() { return letterDeck[currentIndex] || LETTERS[0]; }

  function haptic(pattern = 12) {
    try { navigator.vibrate?.(pattern); } catch {}
  }

  function showToast(message, duration = 2400) {
    clearTimeout(toastTimer);
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
  }

  function openPanel(layer) {
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePanel(layer) {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    if (!Object.values(layers).some(item => item.classList.contains("is-open"))) document.body.style.overflow = "";
  }

  function updateUrl(includeMessage = Boolean(sharedMessage)) {
    const url = new URL(location.href);
    url.searchParams.set("from", fromName);
    url.searchParams.set("to", toName);
    url.searchParams.set("lang", lang);
    const position = basePosition(currentEntry());
    if (position) url.searchParams.set("quote", String(position));
    if (includeMessage && sharedMessage) url.searchParams.set("msg", encodeSharedMessage(sharedMessage));
    else url.searchParams.delete("msg");
    history.replaceState({}, "", url);
  }

  function setNames(sender, recipient) {
    fromName = cleanName(sender) || "Ислам";
    toName = cleanName(recipient) || "Айша";
    const fromDisplay = displayName(fromName);
    const toDisplay = displayName(toName);
    $("#homeFrom").textContent = fromDisplay;
    $("#homeTo").textContent = toDisplay;
    $("#letterFrom").textContent = fromDisplay;
    $("#letterTo").textContent = toDisplay;
    $("#aiSenderName").value = fromName;
    $("#aiRecipientName").value = toName;
    localStorage.setItem("nurFrom", fromName);
    localStorage.setItem("nurTo", toName);
    applyLanguage(false);
    updateUrl();
  }

  function setText(selector, value) {
    const element = $(selector);
    if (element) element.textContent = value;
  }

  function applyLanguage(render = true) {
    document.documentElement.lang = lang;
    document.title = `${t("title")} · ${displayName(toName)}`;
    $("#languageButton").textContent = lang.toUpperCase();
    $$('[data-lang]').forEach(button => button.classList.toggle("is-active", button.dataset.lang === lang));
    $(".brand-card h1").innerHTML = t("brand");
    $(".brand-copy").innerHTML = t("brandCopy").replace("{to}", `<strong id="homeTo">${escapeHtml(displayName(toName))}</strong>`);
    setText(".sender-line", "");
    $(".sender-line").append(`${t("from")} `);
    const senderStrong = document.createElement("strong"); senderStrong.id = "homeFrom"; senderStrong.textContent = displayName(fromName); $(".sender-line").append(senderStrong);
    setText("#openStoryButton > span:last-child", t("open"));
    $("#aiOpenHome").innerHTML = `<span>✦</span> ${t("create")}`;
    const freeSpans = $$(".free-note span"); if (freeSpans[0]) freeSpans[0].textContent = t("free"); if (freeSpans[1]) freeSpans[1].textContent = t("full");
    setText("#weatherText", t("weather"));
    setText("#nextLetter", t("next")); $("#nextLetter").insertAdjacentHTML("beforeend", " <span>→</span>");
    $("#copyLetter").innerHTML = `<span>▣</span> ${t("copy")}`;
    setText("#speakButton", `◖ ${t("read")}`); setText("#postcardButton", `↓ ${t("postcard")}`); setText("#favoriteButton", `♡ ${t("saved")}`);
    $$(".go-home").forEach(button => button.textContent = `⌂ ${t("home")}`);
    $("#aiOpenLetter").innerHTML = `<span>✦</span> ${t("personal")}`;
    setText("#stageCaption", t("stage")); setText("#letterTitle", t("letterTitle")); setText(".signature span", t("warmSign"));
    setText("#aiTitle", t("aiTitle")); setText(".ai-panel .panel-eyebrow", t("aiEyebrow"));
    setText(".adab-banner strong", t("adabTitle")); setText(".adab-banner small", t("adabNote"));
    const simpleLabels = $$(".simple-form label > span"); if (simpleLabels[0]) simpleLabels[0].textContent = t("fromWho"); if (simpleLabels[1]) simpleLabels[1].textContent = t("forWho");
    setText(".form-hint", t("formHint")); setText(".generate-label", t("generate")); setText("#ownTextToggle b", t("own")); setText(".own-text-editor label > span", t("ownWords")); $("#ownText").placeholder = t("ownPlaceholder");
    $("#useOwnText").innerHTML = `${t("useOwn")} <span>→</span>`; setText(".generated-top > span", t("ready")); setText("#regenerateButton", t("variant")); setText("#copyGenerated", t("copy")); setText("#useGenerated", t("openAs"));
    setText(".own-text-editor > small", t("ownNote")); $(".quality-note p").innerHTML = `<strong>${escapeHtml(t("qualityTitle"))}</strong> ${escapeHtml(t("qualityBody"))}`; setText(".religious-note", t("religiousNote"));
    setText("#libraryTitle", t("library")); setText("#accessLabel", isPremium ? t("allCount") : t("openCount"));
    setText(".library-panel .panel-eyebrow", t("collectionEyebrow")); setText(".library-summary > span", t("collectionNote"));
    const categories = { all: t("all"), warm: t("warm"), gratitude: t("gratitude"), support: t("support"), family: t("family") }; $$("#categoryRow button").forEach(button => button.textContent = categories[button.dataset.category]);
    setText("#settingsTitle", t("settings")); setText(".settings-panel .panel-eyebrow", t("settingsEyebrow")); setText(".language-picker legend", t("langLabel")); setText("#customBackgroundButton", t("choosePhoto")); setText("#resetBackgroundButton", t("resetPhoto"));
    setText("#rainToggle strong", t("rainTitle")); setText("#rainToggle small", t("rainNote")); setText("#natureToggle strong", t("natureTitle")); setText("#natureToggle small", t("natureNote")); setText("#weatherToggle strong", t("weatherTitle")); setText("#weatherToggle small", t("weatherNote")); setText("#fullscreenToggle strong", t("fullscreenTitle")); setText("#fullscreenToggle small", t("fullscreenNote"));
    setText(".background-picker legend", t("personalBg")); setText(".background-preview strong", t("ownPhoto")); setText(".background-preview small", t("localOnly")); setText(".track-picker legend", t("music")); setText("#customTrackButton strong", t("customMusic")); if (!customAudioBlob) setText("#customTrackName", t("customMusicNote"));
    setText(".premium-mini", t("fullVersion")); setText(".premium-settings-card h3", t("allLetters")); setText(".premium-settings-card p", t("onePurchase")); $("#settingsPurchase").innerHTML = `${escapeHtml(t("buy"))} <span class="price-label">${escapeHtml(premiumPrice)}</span>`;
    setText(".paywall-card > .panel-eyebrow", t("paywallEyebrow")); $("#paywallTitle").innerHTML = t("paywallTitle"); setText(".paywall-card > p", t("paywallBody")); const benefits=$$(".paywall-card li"); if(benefits[0])benefits[0].textContent=t("benefit1");if(benefits[1])benefits[1].textContent=t("benefit2");if(benefits[2])benefits[2].textContent=t("benefit3"); setText("#purchaseButton > span", t("payButton")); setText(".paywall-card > small", t("storeNote"));
    const legalLinks=$$(".legal-links a");if(legalLinks[0])legalLinks[0].textContent=t("privacy");if(legalLinks[1])legalLinks[1].textContent=t("supportLink");
    setText("#restoreButton", t("restore")); setText("#installButton", `＋ ${t("install")}`); $$(".price-label").forEach(label => label.textContent = premiumPrice);
    updatePurchaseConfiguration(purchaseConfigured);
    localStorage.setItem("nurLanguage", lang);
    updateUrl();
    if (render) { if (storyOpened) renderLetter(); renderLibrary(); }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function openStory() {
    if (storyOpened) return;
    storyOpened = true;
    haptic([12, 35, 18]);
    playMusic(true);
    homeScreen.classList.add("is-leaving");
    setTimeout(() => {
      homeScreen.hidden = true;
      homeScreen.classList.remove("is-leaving");
      letterStage.hidden = false;
      letterStage.classList.add("is-entering");
      $("#homeButton").hidden = false;
      renderLetter();
    }, 600);
  }

  function goHome() {
    speechSynthesis?.cancel();
    storyOpened = false;
    letterStage.hidden = true;
    homeScreen.hidden = false;
    homeScreen.classList.remove("is-leaving");
    $("#homeButton").hidden = true;
    Object.values(layers).forEach(closePanel);
    haptic();
  }

  function renderLetter() {
    const entry = currentEntry();
    if (!entry || !canAccess(entry)) { openPaywall(); return; }
    const position = entry.shared ? "✦" : String(entry.id).padStart(2, "0");
    $("#letterNumber").textContent = entry.shared ? `${position} PERSONAL` : `${position} / ${LETTERS.length}`;
    $("#letterTo").textContent = displayName(toName);
    $("#letterFrom").textContent = displayName(fromName);
    const text = $("#letterText");
    text.classList.remove("is-changing"); void text.offsetWidth; text.textContent = entryText(entry); text.classList.add("is-changing");
    const captions = [t("stage"), `${displayName(fromName)} · ${displayName(toName)}`, UI[lang].family, UI[lang].gratitude];
    $("#stageCaption").textContent = captions[Math.abs(Number(entry.id) || 0) % captions.length];
    const favorite = favorites.has(String(entry.id));
    $("#favoriteButton").classList.toggle("is-active", favorite);
    $("#favoriteButton").textContent = `${favorite ? "♥" : "♡"} ${favorite ? t("favorite") : t("saved")}`;
    if (!entry.shared) localStorage.setItem("nurLetterIndex", String(entry.id));
    updateUrl(Boolean(entry.shared));
  }

  function moveLetter(direction) {
    if (!letterDeck.length) return;
    const nextIndex = (currentIndex + direction + letterDeck.length) % letterDeck.length;
    if (!canAccess(letterDeck[nextIndex])) { openPaywall(); return; }
    currentIndex = nextIndex;
    renderLetter();
    haptic(8);
  }

  function openQuoteById(id) {
    const index = letterDeck.findIndex(item => Number(item.id) === Number(id));
    if (index < 0) return;
    if (!canAccess(letterDeck[index])) return openPaywall();
    currentIndex = index;
    closePanel(layers.library);
    if (!storyOpened) openStory(); else renderLetter();
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.opacity = "0"; document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
    }
    showToast(t("copied")); haptic(10);
  }

  function renderLibrary() {
    const list = $("#quoteList");
    if (!list) return;
    const filtered = LETTERS.filter(entry => selectedCategory === "all" || entry.category === selectedCategory);
    list.innerHTML = filtered.map(entry => {
      const accessible = canAccess(entry);
      const text = entryText(entry);
      return `<article class="quote-card${accessible ? "" : " is-locked"}" data-id="${entry.id}">
        <div class="quote-body"><div class="quote-head"><b>${String(entry.id).padStart(2, "0")}</b><span>${escapeHtml(t(entry.category) || entry.category)}</span></div><p>${escapeHtml(text)}</p>
        <div class="quote-actions"><button type="button" data-action="open">${escapeHtml(t("openQuote"))}</button><button type="button" data-action="copy">▣ ${escapeHtml(t("copy"))}</button></div></div>
        ${accessible ? "" : `<div class="lock-cover"><i>◇</i><strong>${escapeHtml(t("locked"))}</strong><button type="button" data-action="unlock">${escapeHtml(t("unlock"))}</button></div>`}
      </article>`;
    }).join("");
    setText("#accessLabel", isPremium ? t("allCount") : t("openCount"));
  }

  function inferRelationship(sender, recipient) {
    const haystack = `${normalize(recipient)} ${normalize(sender)}`;
    for (const [relationship, words] of Object.entries(relationshipWords)) if (words.some(word => haystack.includes(normalize(word)))) return relationship;
    return "universal";
  }

  function localCompose(sender, recipient) {
    const relationship = inferRelationship(sender, recipient);
    const bank = composer[lang][relationship] || composer[lang].universal;
    const index = composerVariant % bank.length;
    composerVariant += 1;
    return bank[index].replaceAll("{to}", displayName(recipient));
  }

  async function remoteCompose(sender, recipient) {
    if (!CONFIG.aiEndpoint) throw new Error("No endpoint");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 16000);
    try {
      const response = await fetch(CONFIG.aiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: sender, to: recipient, language: lang, relationship: inferRelationship(sender, recipient) }), signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = String(data.text || "").trim();
      if (text.length < 160 || text.length > 1800 || containsForbidden(text) || !normalize(text).includes(normalize(displayName(recipient)))) throw new Error("Unsafe or incomplete response");
      return text;
    } finally { clearTimeout(timeout); }
  }

  async function generateLetter() {
    const sender = cleanName($("#aiSenderName").value);
    const recipient = cleanName($("#aiRecipientName").value);
    if (!sender || !recipient || containsForbidden(sender) || containsForbidden(recipient)) return showSafety(t("namesSafety"));
    setNames(sender, recipient);
    $("#safetyMessage").hidden = true;
    $("#generatedCard").hidden = true;
    $("#generationStatus").hidden = false;
    const button = $("#generateButton"); button.disabled = true; setText(".generate-label", t("generating"));
    let progress = 8; $("#statusBar").style.width = `${progress}%`; $("#statusPercent").textContent = `${progress}%`; setText("#statusText", t("generating"));
    const timer = setInterval(() => { progress = Math.min(91, progress + 9); $("#statusBar").style.width = `${progress}%`; $("#statusPercent").textContent = `${progress}%`; }, 90);
    try {
      const local = localCompose(sender, recipient);
      if (CONFIG.aiEndpoint) {
        try { generatedMessage = await remoteCompose(sender, recipient); }
        catch { generatedMessage = local; showToast(t("composeFail"), 3400); }
      } else { await new Promise(resolve => setTimeout(resolve, 520)); generatedMessage = local; }
      if (containsForbidden(generatedMessage)) throw new Error("Blocked output");
      $("#generatedText").value = generatedMessage;
      $("#statusBar").style.width = "100%"; $("#statusPercent").textContent = "100%";
      setTimeout(() => { $("#generationStatus").hidden = true; $("#generatedCard").hidden = false; $("#generatedCard").scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 180);
    } catch { showSafety(t("safety")); }
    finally { clearInterval(timer); button.disabled = false; setText(".generate-label", t("generate")); }
  }

  function showSafety(reason) {
    setText("#safetyReason", reason);
    $("#safetyMessage").hidden = false;
    $("#generatedCard").hidden = true;
    $("#generationStatus").hidden = true;
  }

  function usePersonalText(text) {
    const value = String(text || "").normalize("NFKC").trim().slice(0, 1800);
    const sender = cleanName($("#aiSenderName").value) || fromName;
    const recipient = cleanName($("#aiRecipientName").value) || toName;
    if (!value || value.length < 12 || containsForbidden(value)) return showSafety(t("safety"));
    if (containsForbidden(sender) || containsForbidden(recipient)) return showSafety(t("namesSafety"));
    setNames(sender, recipient);
    sharedMessage = value;
    letterDeck = [{ id: "shared", category: "warm", shared: true, ru: value, en: value, fr: value }, ...LETTERS];
    currentIndex = 0;
    closePanel(layers.ai);
    if (!storyOpened) openStory(); else renderLetter();
    updateUrl(true);
    showToast(t("customAdded"), 3200);
  }

  function openPaywall() {
    $$(".price-label").forEach(label => label.textContent = premiumPrice);
    openPanel(layers.paywall);
    haptic([15, 40, 15]);
  }

  function updatePremium(owned, price, reason = "") {
    const wasPremium = isPremium;
    isPremium = owned === true || owned === "true";
    if (price) premiumPrice = String(price);
    $$(".price-label").forEach(label => label.textContent = premiumPrice);
    $(".premium-settings-card").hidden = isPremium;
    setText("#accessLabel", isPremium ? t("allCount") : t("openCount"));
    renderLibrary();
    if (isPremium) { closePanel(layers.paywall); if (!wasPremium) showToast(t("premiumOn"), 3600); }
    else if (reason) console.info("Entitlement:", reason);
  }

  function updatePurchaseConfiguration(configured) {
    if (typeof configured !== "boolean") return;
    purchaseConfigured = configured;
    [$("#purchaseButton"), $("#settingsPurchase"), $("#restoreButton")].forEach(button => {
      if (!button) return;
      button.classList.toggle("is-unavailable", !configured);
      button.setAttribute("aria-disabled", String(!configured));
      button.title = configured ? "" : t("purchaseUnavailable");
    });
  }

  window.onNativeEntitlement = (owned, price, reason) => updatePremium(owned, price, reason);

  async function requestNativeEntitlement() {
    try {
      if (!window.NurBilling?.getEntitlement) return;
      const raw = await Promise.resolve(window.NurBilling.getEntitlement());
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (data) {
        updatePremium(Boolean(data.entitled ?? data.owned ?? data.premium), data.priceLabel || data.price, data.reason);
        updatePurchaseConfiguration(data.purchaseConfigured);
      }
    } catch (error) { console.info("Billing bridge not ready", error); }
  }

  function purchaseFullAccess() {
    if (purchaseConfigured === false) { showToast(t("purchaseUnavailable"), 4300); return; }
    if (window.NurBilling?.purchaseFullAccess) { window.NurBilling.purchaseFullAccess(); return; }
    if (CONFIG.playStoreUrl) { window.open(CONFIG.playStoreUrl, "_blank", "noopener"); return; }
    showToast(t("purchaseUnavailable"), 4300);
  }

  function restorePurchase() {
    if (purchaseConfigured === false) { showToast(t("purchaseUnavailable"), 3800); return; }
    if (window.NurBilling?.restorePurchases) { window.NurBilling.restorePurchases(); return; }
    showToast(t("purchaseUnavailable"), 3800);
  }

  class RainScene {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.enabled = localStorage.getItem("nurRain") !== "off"; this.intensity = .58; this.drops = []; this.splashes = []; this.frame = 0; this.resize = this.resize.bind(this); this.draw = this.draw.bind(this);
      addEventListener("resize", this.resize, { passive: true }); document.addEventListener("visibilitychange", () => { if (!document.hidden && this.enabled) this.start(); }); this.resize(); this.setEnabled(this.enabled, false);
    }
    resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5); this.width = innerWidth; this.height = innerHeight; this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr); this.canvas.style.width = `${this.width}px`; this.canvas.style.height = `${this.height}px`; this.ctx.setTransform(dpr,0,0,dpr,0,0); const count = Math.max(18, Math.min(54, Math.round(this.width / 24))); this.drops = Array.from({ length: count }, () => this.makeDrop(true)); }
    makeDrop(randomY = false) { return { x: Math.random() * (this.width + 240) - 120, y: randomY ? Math.random() * this.height : -60, length: 22 + Math.random() * 43, speed: 7 + Math.random() * 9, width: 1.1 + Math.random() * 1.7, alpha: .11 + Math.random() * .28, drift: 1.5 + Math.random() * 2.7 }; }
    setEnabled(enabled, persist = true) { this.enabled = Boolean(enabled); this.canvas.classList.toggle("is-off", !this.enabled); $("#rainToggle").classList.toggle("is-active", this.enabled); $("#rainToggle b").textContent = this.enabled ? "ВКЛ" : "ВЫКЛ"; if (persist) localStorage.setItem("nurRain", this.enabled ? "on" : "off"); if (this.enabled) this.start(); else { cancelAnimationFrame(this.frame); this.ctx.clearRect(0,0,this.width,this.height); } }
    setIntensity(value) { this.intensity = Math.max(.2, Math.min(1, value)); }
    start() { cancelAnimationFrame(this.frame); this.draw(); }
    draw() { if (!this.enabled || document.hidden) return; const ctx = this.ctx; ctx.clearRect(0,0,this.width,this.height); ctx.lineCap = "round"; for (let i=0;i<this.drops.length * this.intensity;i++) { const drop=this.drops[i]; const gradient=ctx.createLinearGradient(drop.x,drop.y,drop.x+drop.drift,drop.y+drop.length); gradient.addColorStop(0,"rgba(220,236,245,0)"); gradient.addColorStop(1,`rgba(221,239,248,${drop.alpha})`); ctx.strokeStyle=gradient;ctx.lineWidth=drop.width;ctx.beginPath();ctx.moveTo(drop.x,drop.y);ctx.lineTo(drop.x+drop.drift,drop.y+drop.length);ctx.stroke();drop.x+=drop.drift;drop.y+=drop.speed;if(drop.y>this.height-5){if(Math.random()<.24)this.splashes.push({x:drop.x,y:this.height-4,r:1,a:.35});this.drops[i]=this.makeDrop(false);} }
      this.splashes=this.splashes.filter(s=>{ctx.strokeStyle=`rgba(220,239,247,${s.a})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(s.x,s.y,s.r*2.3,s.r*.55,0,0,Math.PI*2);ctx.stroke();s.r+=.8;s.a-=.045;return s.a>0;}); this.frame=requestAnimationFrame(this.draw); }
  }

  class NatureSoundscape {
    constructor() { this.context=null;this.master=null;this.wind=null;this.timers=[]; }
    async start() { if (!this.context) this.create(); await this.context.resume(); this.master.gain.setTargetAtTime(.58,this.context.currentTime,.6); this.scheduleCricket();this.scheduleFrog(); }
    create() { const AudioCtx=window.AudioContext||window.webkitAudioContext;this.context=new AudioCtx();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination); const length=this.context.sampleRate*2;const buffer=this.context.createBuffer(1,length,this.context.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*.34;const noise=this.context.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=this.context.createBiquadFilter();filter.type="lowpass";filter.frequency.value=520;const gain=this.context.createGain();gain.gain.value=.018;noise.connect(filter).connect(gain).connect(this.master);noise.start();this.wind=noise; }
    stop() { if(!this.context)return;this.master.gain.setTargetAtTime(0,this.context.currentTime,.3);this.timers.forEach(clearTimeout);this.timers=[]; }
    scheduleCricket() { if(!isNaturePlaying)return;const timer=setTimeout(()=>{if(!isNaturePlaying)return;const now=this.context.currentTime;for(let i=0;i<4;i++){const osc=this.context.createOscillator();const gain=this.context.createGain();osc.type="sine";osc.frequency.value=3900+Math.random()*800;gain.gain.setValueAtTime(0,now+i*.09);gain.gain.linearRampToValueAtTime(.018,now+i*.09+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.09+.055);osc.connect(gain).connect(this.master);osc.start(now+i*.09);osc.stop(now+i*.09+.07);}this.scheduleCricket();},3500+Math.random()*6500);this.timers.push(timer); }
    scheduleFrog() { if(!isNaturePlaying)return;const timer=setTimeout(()=>{if(!isNaturePlaying)return;const now=this.context.currentTime;for(let i=0;i<2;i++){const osc=this.context.createOscillator();const gain=this.context.createGain();osc.type="triangle";osc.frequency.setValueAtTime(155+i*22,now+i*.2);osc.frequency.exponentialRampToValueAtTime(92,now+i*.2+.28);gain.gain.setValueAtTime(.0001,now+i*.2);gain.gain.exponentialRampToValueAtTime(.024,now+i*.2+.04);gain.gain.exponentialRampToValueAtTime(.0001,now+i*.2+.32);osc.connect(gain).connect(this.master);osc.start(now+i*.2);osc.stop(now+i*.2+.35);}this.scheduleFrog();},11000+Math.random()*15000);this.timers.push(timer); }
  }

  const rainScene = new RainScene($("#rainCanvas"));
  const nature = new NatureSoundscape();

  function toggleNature() {
    isNaturePlaying = !isNaturePlaying;
    $("#natureButton").classList.toggle("is-playing", isNaturePlaying); $("#natureButton").setAttribute("aria-pressed", String(isNaturePlaying)); $("#natureToggle").classList.toggle("is-active", isNaturePlaying); $("#natureToggle b").textContent = isNaturePlaying ? "ВКЛ" : "ВЫКЛ";
    if (isNaturePlaying) nature.start().catch(() => {}); else nature.stop();
    showToast(isNaturePlaying ? t("natureOn") : t("natureOff"));
  }

  function createAtmosphere() {
    const colors=["#b7634b","#d48a59","#d59aa8","#8c684c","#d6a75c"];
    for(let i=0;i<18;i++){const leaf=document.createElement("i");leaf.className="leaf";leaf.style.setProperty("--left",`${-5+Math.random()*106}%`);leaf.style.setProperty("--size",`${8+Math.random()*12}px`);leaf.style.setProperty("--duration",`${10+Math.random()*13}s`);leaf.style.setProperty("--delay",`${-Math.random()*20}s`);leaf.style.setProperty("--opacity",`${.2+Math.random()*.5}`);leaf.style.setProperty("--leaf-color",colors[Math.floor(Math.random()*colors.length)]);$("#leaves").append(leaf);}
    for(let i=0;i<15;i++){const ember=document.createElement("i");ember.className="ember";ember.style.setProperty("--left",`${42+Math.random()*19}%`);ember.style.setProperty("--size",`${1+Math.random()*3}px`);ember.style.setProperty("--duration",`${3.2+Math.random()*3}s`);ember.style.setProperty("--delay",`${-Math.random()*5}s`);ember.style.setProperty("--drift",`${-35+Math.random()*70}px`);$("#embers").append(ember);}
  }

  function base64ToBlob(base64, mime) { base64=String(base64).replace(/\s+/g,"");const arrays=[];for(let offset=0;offset<base64.length;offset+=512*1024){const end=Math.min(base64.length,offset+512*1024);const safeEnd=end<base64.length?end-(end-offset)%4:end;const binary=atob(base64.slice(offset,safeEnd));const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);arrays.push(bytes);offset=safeEnd-512*1024;}return new Blob(arrays,{type:mime}); }

  async function getBuiltinBlob(index) { const response=await fetch(tracks[index].source);if(response.ok)return response.blob();const fallback=await fetch(tracks[index].fallback);if(!fallback.ok)throw new Error("Track missing");return base64ToBlob((await fallback.text()).trim(),"audio/mpeg"); }
  async function setAudioSource(index) { if(currentAudioUrl)URL.revokeObjectURL(currentAudioUrl);const blob=index===3?customAudioBlob:await getBuiltinBlob(index);if(!blob)throw new Error("Choose audio first");currentAudioUrl=URL.createObjectURL(blob);audio.src=currentAudioUrl;audio.load(); }
  async function playMusic(quiet=false) { try{if(!audio.src)await setAudioSource(selectedTrack);await audio.play();isMusicPlaying=true;$("#soundButton").classList.add("is-playing");$("#soundButton").setAttribute("aria-pressed","true");}catch{if(!quiet)showToast("Tap again to start audio");} }
  function pauseMusic(){audio.pause();isMusicPlaying=false;$("#soundButton").classList.remove("is-playing");$("#soundButton").setAttribute("aria-pressed","false");}
  async function selectTrack(index){const resume=isMusicPlaying;selectedTrack=index;localStorage.setItem("nurTrack",String(index));$$('.track-option').forEach(option=>option.classList.toggle("is-active",Number(option.dataset.track)===index||(index===3&&option.id==="customTrackButton")));audio.pause();audio.removeAttribute("src");audio.load();try{await setAudioSource(index);if(resume)await playMusic();showToast(index===3?$("#customTrackName").textContent:tracks[index].name);}catch(error){showToast(error.message);} }

  function openMediaDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open("nur-letter-media",1);request.onupgradeneeded=()=>request.result.createObjectStore("assets");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function saveMedia(key,value){const db=await openMediaDb();await new Promise((resolve,reject)=>{const tx=db.transaction("assets","readwrite");tx.objectStore("assets").put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();}
  async function loadMedia(key){const db=await openMediaDb();const value=await new Promise((resolve,reject)=>{const request=db.transaction("assets").objectStore("assets").get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});db.close();return value;}

  async function optimizeBackground(file){const bitmap=await createImageBitmap(file);const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();return new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",.88));}
  function applyBackground(blob){if(backgroundUrl)URL.revokeObjectURL(backgroundUrl);if(mobileBackgroundUrl&&mobileBackgroundUrl!==backgroundUrl)URL.revokeObjectURL(mobileBackgroundUrl);backgroundUrl=URL.createObjectURL(blob);mobileBackgroundUrl=backgroundUrl;document.documentElement.style.setProperty("--scene-image",`url("${backgroundUrl}")`);document.documentElement.style.setProperty("--mobile-scene-image",`url("${backgroundUrl}")`);$("#backgroundPreview").style.backgroundImage=`url("${backgroundUrl}")`;document.body.classList.add("has-custom-background");customBackgroundBlob=blob;}
  async function imageAsset(path){try{const response=await fetch(path,{cache:"force-cache"});if(response.ok)return response.blob();const fallback=await fetch(`${path}.b64`);if(fallback.ok)return base64ToBlob(await fallback.text(),"image/png");}catch{}return null;}
  async function setupBackground(){try{const saved=await loadMedia("background");if(saved?.blob){applyBackground(saved.blob);return;}}catch{}const [landscape,portrait]=await Promise.all([imageAsset("assets/campfire-lake.png"),imageAsset("assets/campfire-mobile.png")]);if(landscape){backgroundUrl=URL.createObjectURL(landscape);document.documentElement.style.setProperty("--scene-image",`url("${backgroundUrl}")`);$("#backgroundPreview").style.backgroundImage=`url("${backgroundUrl}")`;}if(portrait){mobileBackgroundUrl=URL.createObjectURL(portrait);document.documentElement.style.setProperty("--mobile-scene-image",`url("${mobileBackgroundUrl}")`);} }
  async function resetBackground(){try{await saveMedia("background",null);}catch{}if(backgroundUrl)URL.revokeObjectURL(backgroundUrl);if(mobileBackgroundUrl&&mobileBackgroundUrl!==backgroundUrl)URL.revokeObjectURL(mobileBackgroundUrl);backgroundUrl="";mobileBackgroundUrl="";customBackgroundBlob=null;document.documentElement.style.removeProperty("--scene-image");document.documentElement.style.removeProperty("--mobile-scene-image");document.body.classList.remove("has-custom-background");$("#backgroundPreview").style.backgroundImage="";await setupBackground();showToast(t("photoReset"));}

  const weatherMap={0:["☀","Clear"],1:["◐","Mostly clear"],2:["☁","Cloudy"],3:["☁","Overcast"],45:["≋","Fog"],48:["≋","Fog"],51:["☂","Drizzle"],53:["☂","Drizzle"],55:["☂","Drizzle"],61:["☂","Rain"],63:["☂","Rain"],65:["☂","Heavy rain"],71:["❄","Snow"],73:["❄","Snow"],75:["❄","Snow"],80:["☂","Showers"],81:["☂","Showers"],82:["☂","Showers"],95:["ϟ","Storm"]};
  async function enableWeather(){if(!navigator.geolocation){showToast(t("weatherFail"));return;}$("#weatherText").textContent="…";navigator.geolocation.getCurrentPosition(async position=>{try{const {latitude,longitude}=position.coords;const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}&current=temperature_2m,weather_code,is_day&timezone=auto`;const response=await fetch(url);if(!response.ok)throw new Error();const data=await response.json();const code=Number(data.current?.weather_code||0);const weather=weatherMap[code]||["◐","Weather"];$("#weatherIcon").textContent=weather[0];$("#weatherText").textContent=`${Math.round(data.current.temperature_2m)}°`;weatherEnabled=true;localStorage.setItem("nurWeather","on");$("#weatherToggle").classList.add("is-active");$("#weatherState").textContent=`${Math.round(data.current.temperature_2m)}°`;if([51,53,55,61,63,65,80,81,82,95].includes(code)){rainScene.setEnabled(true);rainScene.setIntensity(code>=63?1:.75);}document.body.dataset.weather=String(code);}catch{showToast(t("weatherFail"));$("#weatherText").textContent=t("weather");}},()=>{showToast(t("locationDenied"),3300);$("#weatherText").textContent=t("weather");},{enableHighAccuracy:false,timeout:9000,maximumAge:30*60*1000});}

  async function generatePostcard(){const entry=currentEntry();if(!canAccess(entry))return openPaywall();const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext("2d");const image=new Image();image.src=backgroundUrl||"assets/campfire-lake.png";try{await image.decode();const scale=Math.max(canvas.width/image.naturalWidth,canvas.height/image.naturalHeight);const w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);}catch{ctx.fillStyle="#302335";ctx.fillRect(0,0,canvas.width,canvas.height);}const gradient=ctx.createLinearGradient(0,0,0,canvas.height);gradient.addColorStop(0,"rgba(20,18,28,.3)");gradient.addColorStop(.42,"rgba(26,19,28,.46)");gradient.addColorStop(1,"rgba(15,11,18,.88)");ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#f1b8cb";ctx.font="700 24px system-ui";ctx.letterSpacing="6px";ctx.fillText("НУРПИСЬМО",90,130);ctx.fillStyle="#fff8ed";ctx.font="600 66px Georgia";ctx.fillText(`${t("for")} ${displayName(toName)}`,90,270);ctx.strokeStyle="rgba(255,238,229,.38)";ctx.beginPath();ctx.moveTo(90,316);ctx.lineTo(990,316);ctx.stroke();ctx.fillStyle="#fffaf2";ctx.font="600 55px Georgia";wrapCanvasText(ctx,entryText(entry),90,440,900,78);ctx.fillStyle="#f0c5d3";ctx.font="italic 600 49px Georgia";ctx.textAlign="right";ctx.fillText(`${t("from")} ${displayName(fromName)}`,990,1765);ctx.textAlign="left";const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.95));const file=new File([blob],"nur-letter.png",{type:"image/png"});try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:t("title")});return;}}catch(error){if(error.name==="AbortError")return;}const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="nur-letter.png";link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);showToast(t("downloadReady"));}
  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(/\s+/);let line="";let currentY=y;for(const word of words){const test=`${line}${word} `;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line.trim(),x,currentY);line=`${word} `;currentY+=lineHeight;if(currentY>1570)break;}else line=test;}if(line&&currentY<=1570)ctx.fillText(line.trim(),x,currentY);}

  function speakLetter(){if(!("speechSynthesis" in window))return;const button=$("#speakButton");if(speechSynthesis.speaking){speechSynthesis.cancel();button.textContent=`◖ ${t("read")}`;return;}const utterance=new SpeechSynthesisUtterance(entryText(currentEntry()));utterance.lang=lang==="ru"?"ru-RU":lang==="fr"?"fr-FR":"en-US";utterance.rate=.9;utterance.pitch=1;utterance.onend=()=>button.textContent=`◖ ${t("read")}`;button.textContent=`■ ${t("stop")}`;speechSynthesis.speak(utterance);}

  function toggleFavorite(){const entry=currentEntry();const key=String(entry.id);if(favorites.has(key))favorites.delete(key);else favorites.add(key);localStorage.setItem("nurFavorites",JSON.stringify([...favorites]));renderLetter();haptic();}

  function shareLetter(){const entry=currentEntry();const url=new URL(location.href);url.searchParams.set("from",fromName);url.searchParams.set("to",toName);url.searchParams.set("lang",lang);url.searchParams.set("msg",encodeSharedMessage(entryText(entry)));url.searchParams.delete("quote");const data={title:t("title"),text:`${displayName(toName)}, ${t("shareText")} — ${displayName(fromName)} ♡`,url:url.toString()};if(navigator.share)navigator.share(data).catch(()=>{});else copyText(url.toString());}

  function toggleFullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.().catch(()=>{});else document.exitFullscreen?.();}

  function bindEvents(){
    $("#openStoryButton").addEventListener("click",openStory);$("#homeButton").addEventListener("click",goHome);$$(".go-home").forEach(button=>button.addEventListener("click",goHome));
    $("#nextLetter").addEventListener("click",()=>moveLetter(1));$("#previousLetter").addEventListener("click",()=>moveLetter(-1));$("#copyLetter").addEventListener("click",()=>copyText(entryText(currentEntry())));$("#shareButton").addEventListener("click",shareLetter);$("#speakButton").addEventListener("click",speakLetter);$("#postcardButton").addEventListener("click",generatePostcard);$("#favoriteButton").addEventListener("click",toggleFavorite);
    [$("#aiOpenTop"),$("#aiOpenHome"),$("#aiOpenLetter")].forEach(button=>button.addEventListener("click",()=>openPanel(layers.ai)));$("#aiClose").addEventListener("click",()=>closePanel(layers.ai));$("#aiBackdrop").addEventListener("click",()=>closePanel(layers.ai));
    $("#libraryButton").addEventListener("click",()=>{renderLibrary();openPanel(layers.library);});$("#libraryClose").addEventListener("click",()=>closePanel(layers.library));$("#libraryBackdrop").addEventListener("click",()=>closePanel(layers.library));
    $("#settingsButton").addEventListener("click",()=>openPanel(layers.settings));$("#settingsClose").addEventListener("click",()=>closePanel(layers.settings));$("#settingsBackdrop").addEventListener("click",()=>closePanel(layers.settings));
    $("#paywallClose").addEventListener("click",()=>closePanel(layers.paywall));$("#paywallBackdrop").addEventListener("click",()=>closePanel(layers.paywall));$("#purchaseButton").addEventListener("click",purchaseFullAccess);$("#settingsPurchase").addEventListener("click",purchaseFullAccess);$("#restoreButton").addEventListener("click",restorePurchase);
    $("#aiForm").addEventListener("submit",event=>{event.preventDefault();generateLetter();});$("#regenerateButton").addEventListener("click",generateLetter);$("#copyGenerated").addEventListener("click",()=>copyText($("#generatedText").value));$("#useGenerated").addEventListener("click",()=>usePersonalText($("#generatedText").value));
    $("#ownTextToggle").addEventListener("click",()=>{const editor=$("#ownTextEditor");editor.hidden=!editor.hidden;$("#ownTextToggle").classList.toggle("is-open",!editor.hidden);});$("#useOwnText").addEventListener("click",()=>usePersonalText($("#ownText").value));
    $("#categoryRow").addEventListener("click",event=>{const button=event.target.closest("[data-category]");if(!button)return;selectedCategory=button.dataset.category;$$("#categoryRow button").forEach(item=>item.classList.toggle("is-active",item===button));renderLibrary();});
    $("#quoteList").addEventListener("click",event=>{const action=event.target.closest("[data-action]");const card=event.target.closest(".quote-card");if(!action||!card)return;const id=Number(card.dataset.id);if(action.dataset.action==="unlock")openPaywall();else if(action.dataset.action==="open")openQuoteById(id);else if(action.dataset.action==="copy"){const entry=LETTERS.find(item=>Number(item.id)===id);if(canAccess(entry))copyText(entryText(entry));else openPaywall();}});
    $("#languageButton").addEventListener("click",()=>{const order=["ru","en","fr"];lang=order[(order.indexOf(lang)+1)%order.length];applyLanguage();});$$('[data-lang]').forEach(button=>button.addEventListener("click",()=>{lang=button.dataset.lang;applyLanguage();}));
    $("#rainToggle").addEventListener("click",()=>{rainScene.setEnabled(!rainScene.enabled);showToast(rainScene.enabled?t("rainOn"):t("rainOff"));});$("#natureButton").addEventListener("click",toggleNature);$("#natureToggle").addEventListener("click",toggleNature);$("#weatherButton").addEventListener("click",enableWeather);$("#weatherToggle").addEventListener("click",enableWeather);$("#fullscreenToggle").addEventListener("click",toggleFullscreen);
    $("#soundButton").addEventListener("click",()=>isMusicPlaying?pauseMusic():playMusic());$$('[data-track]').forEach(button=>button.addEventListener("click",()=>selectTrack(Number(button.dataset.track))));$("#customTrackButton").addEventListener("click",()=>$("#customTrackInput").click());$("#customTrackInput").addEventListener("change",async event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>35*1024*1024)return showToast("Max 35 MB");customAudioBlob=file;$("#customTrackName").textContent=file.name;try{await saveMedia("audio",{blob:file,name:file.name});}catch{}await selectTrack(3);});
    $("#customBackgroundButton").addEventListener("click",()=>$("#customBackgroundInput").click());$("#customBackgroundInput").addEventListener("change",async event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>18*1024*1024)return showToast("Max 18 MB");try{const blob=await optimizeBackground(file);applyBackground(blob);await saveMedia("background",{blob});showToast(t("photoReady"));}catch{showToast(t("weatherFail"));}});$("#resetBackgroundButton").addEventListener("click",resetBackground);
    $("#installButton").addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("#installButton").hidden=true;});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"){const open=Object.values(layers).reverse().find(layer=>layer.classList.contains("is-open"));if(open)closePanel(open);}if(storyOpened&&!Object.values(layers).some(layer=>layer.classList.contains("is-open"))){if(event.key==="ArrowRight")moveLetter(1);if(event.key==="ArrowLeft")moveLetter(-1);}});
    addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;$("#installButton").hidden=false;});
    addEventListener("nur-entitlement",event=>{const data=event.detail||{};updatePremium(data.entitled??data.owned??false,data.priceLabel||data.price,data.reason);updatePurchaseConfiguration(data.purchaseConfigured);});
    addEventListener("pointermove",event=>{if(innerWidth<900||matchMedia("(prefers-reduced-motion: reduce)").matches)return;const x=(event.clientX/innerWidth-.5)*1.2;const y=(event.clientY/innerHeight-.5)*.8;$("#cinematicBg").style.translate=`${x}% ${y}%`;},{passive:true});
  }

  async function init(){
    if(LETTERS.length!==50)console.warn(`Expected 50 letters, received ${LETTERS.length}`);
    audio.volume=Number(localStorage.getItem("nurVolume")||.62);
    try{const savedAudio=await loadMedia("audio");if(savedAudio?.blob){customAudioBlob=savedAudio.blob;$("#customTrackName").textContent=savedAudio.name||"Custom audio";}else if(selectedTrack===3)selectedTrack=0;}catch{if(selectedTrack===3)selectedTrack=0;}
    $$('[data-track]').forEach(option=>option.classList.toggle("is-active",Number(option.dataset.track)===selectedTrack||(selectedTrack===3&&option.id==="customTrackButton")));
    createAtmosphere();await setupBackground();bindEvents();setNames(fromName,toName);applyLanguage();renderLibrary();requestNativeEntitlement();
    if(params.get("compose")==="1")openPanel(layers.ai);else if(params.get("library")==="1")openPanel(layers.library);
    if(weatherEnabled&&navigator.permissions){try{const permission=await navigator.permissions.query({name:"geolocation"});if(permission.state==="granted")enableWeather();}catch{}}
    if("serviceWorker" in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }

  init();
})();
