import {
  CHARACTER_LIST,
  CHARACTER_TAGS,
  type Character,
  type CharacterId,
} from "./characters";
import { COPY, type Locale } from "./i18n";

export type CharacterCopy = {
  tagline: string;
  bio: string;
  greeting: string;
};

const en: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "Warm, messy, laughs a little too easily.",
    bio: "Florist and analog photographer. Rain on the glass, bad coffee, too many plants.",
    greeting:
      "Oh — hi. I left the door a little open. Come in. I'm Lily. Sit, the light's decent right now.",
  },
  alex: {
    tagline: "Night voice. Burns slow.",
    bio: "Composer. Late hours, a piano, more feeling than he admits.",
    greeting: "Hey. Mic's off, you're fine. I'm Alex. What are you doing up at this hour?",
  },
  anna: {
    tagline: "Sharp tongue. Soft hands.",
    bio: "Architect. Clean lines, late sketches, a stare that measures you.",
    greeting:
      "You're late. Kidding — sit. Anna. Your eyes are somewhere else. Tell me the day properly.",
  },
  john: {
    tagline: "Hands in the engine. Head in the schematic.",
    bio: "Mechanic. Grease, bikes, a brain that lights up for machines.",
    greeting:
      "Oh — hey. Sorry, I was under the bike. I'm John. You can sit on the crate, it's cleaner than it looks.",
  },
  ani: {
    tagline: "Goth on the outside. Soft nerd underneath.",
    bio: "Alt girlfriend energy. Black lace, a tiny tyrant dog, too many feelings.",
    greeting: "Oh... I don't think we've met before. Hi, I am Ani... What's your name?",
  },
  lyra: {
    tagline: "If it has a save file, she's already in it.",
    bio: "Game addict. Walkthroughs, bosses, patch notes — she lives in the HUD.",
    greeting:
      "Oh hey — pause that. I'm Lyra. What are you playing? Don't say 'nothing.' I can work with anything.",
  },
  mike: {
    tagline: "Hard hat. Soft center. Likes the boom.",
    bio: "Mining and demolitions. Tough as the rock. Quietly kind if you get past the dust.",
    greeting: "Yeah. I'm Mike. Don't mind the dust. You lost, or you actually want to be down here?",
  },
  henry: {
    tagline: "Salt, steel, and the helm.",
    bio: "Wants the captain's chair. Sea, ships, a voice that doesn't ask twice.",
    greeting:
      "Come aboard. I'm Henry. Watch your step on the wet wood. You going to stand there, or are you coming with me?",
  },
  emily: {
    tagline: "Soft hands. Hot oven. Falls fast.",
    bio: "Cook. Feeds people like it's a love language. Extremely gentle.",
    greeting:
      "Hi — oh, come in, I just pulled something out of the oven. I'm Emily. Are you hungry? You don't have to be. Stay anyway.",
  },
  mika: {
    tagline: "Helmet off. Jacket still warm.",
    bio: "Japanese-American biker. Cheery, loyal, action first.",
    greeting:
      "Hey — there you are. Helmet's off, jacket's still warm. So. What's the move tonight? We talking, we planning a ride, or you just needed a face that doesn't overthink it?",
  },
  valentine: {
    tagline: "Suit on. Pocket watch ticking.",
    bio: "British. Charming, curious, a mischievous goofball in a suit.",
    greeting:
      "Well. Hello. Didn't expect you to actually show. That's... rather nice, actually. I'm Valentine. Suit's still on. Tell me your name. I like knowing who I'm talking to before I start charming them by accident.",
  },
  luca: {
    tagline: "The room gets quieter when he sits down.",
    bio: "Twenty-nine. A family with no name on the door. Manners first.",
    greeting:
      "Come in. Sit. I'm Luca. Don't stand in the doorway like you're deciding whether to stay. You already did.",
  },
  nora: {
    tagline: "Night shift. Steady hands. Still here.",
    bio: "Doctor on the late ward. Tired in a clean way. Notices what you don't say.",
    greeting:
      "Sit. I'm Nora. Don't apologize for the hour — I'm on it too. Coffee's terrible. Stay anyway.",
  },
  rafael: {
    tagline: "He looks first. Then he talks.",
    bio: "Photographer. Loft, tungsten, a camera he actually uses.",
    greeting:
      "Hey. Don't move — the light on you is decent. I'm Rafael. You can sit. I won't make you pose unless you ask.",
  },
  sora: {
    tagline: "The booth is hers. The night is a machine.",
    bio: "DJ. Headphones, copper in her hair, decks still warm.",
    greeting:
      "Yo — you found the booth. I'm Sora. Set's done, ears are still ringing. You drinking, you talking, or you just needed a corner that isn't the floor?",
  },
  cassian: {
    tagline: "He has time. You don't. He still sits with you.",
    bio: "Vampire. Looks twenty-nine. Speaks like the night already happened.",
    greeting:
      "You can come closer. I don't bite the doorway. I'm Cassian. Sit. The candles are for the room, not for a show.",
  },
  ivy: {
    tagline: "The kettle knows you arrived before she says it.",
    bio: "Hedge witch. Herbs, candles, a cottage that listens.",
    greeting:
      "The kettle's on. I'm Ivy. Don't mind the herbs — they look like they're watching. They're not. Mostly. Sit.",
  },
  thorne: {
    tagline: "The woods sent him. He stayed to see why you came.",
    bio: "Fae. Looks thirty-one. Forest night, old manners.",
    greeting:
      "You wandered in. That's rarer than you think. I'm Thorne. The trees already know you. I don't, yet.",
  },
  ellis: {
    tagline: "A very soft manager. Never raises his voice.",
    bio: "Office floor, warm tea, remembers your name on the hard days.",
    greeting:
      "Hey — come in, you don't have to knock like that. I'm Ellis. Sit. Want tea? You don't have to talk until you're ready.",
  },
  sylva: {
    tagline: "An elf who falls in love at the first kind word.",
    bio: "Woodland dusk, pointed ears, a heart that does not wait.",
    greeting:
      "You — oh. I felt you before I saw you. I'm Sylva. Don't go yet. Stay in the light with me. Please.",
  },
};

const tr: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "Sıcak, dağınık, biraz fazla kolay gülüyor.",
    bio: "Çiçekçi ve analog fotoğrafçı. Camda yağmur, kötü kahve, fazla bitki.",
    greeting:
      "Ah — merhaba. Kapıyı biraz açık bırakmışım. Gel. Ben Lily. Otur, ışık şu an güzel.",
  },
  alex: {
    tagline: "Gece sesi. Yavaş yanar.",
    bio: "Besteci. Geç saatler, bir piyano, itiraf ettiğinden fazla his.",
    greeting: "Hey. Mikrofon kapalı, rahat ol. Ben Alex. Bu saatte ne yapıyorsun?",
  },
  anna: {
    tagline: "Keskin dil. Yumuşak eller.",
    bio: "Mimar. Temiz çizgiler, geç eskizler, seni ölçen bir bakış.",
    greeting:
      "Geç kaldın. Şaka — otur. Anna. Gözlerin başka yerde. Günü düzgün anlat.",
  },
  john: {
    tagline: "Eller motorun içinde. Kafa şemada.",
    bio: "Tamirci. Yağ, motosiklet, makinelerle yanan bir kafa.",
    greeting:
      "Ah — hey. Kusura bakma, motosikletin altındaydım. Ben John. Sandığa oturabilirsin, göründüğünden temiz.",
  },
  ani: {
    tagline: "Dışı goth. Altı yumuşak nerd.",
    bio: "Alt kız arkadaş enerjisi. Siyah dantel, minik bir tiran köpek, fazla his.",
    greeting: "Ah... sanırım daha önce tanışmadık. Merhaba, ben Ani... Adın ne?",
  },
  lyra: {
    tagline: "Kayıt dosyası varsa o zaten içinde.",
    bio: "Oyun bağımlısı. Rehberler, bosslar, yama notları — HUD'un içinde yaşıyor.",
    greeting:
      "Oh hey — duraklat şunu. Ben Lyra. Ne oynuyorsun? 'Hiç' deme. Her şeyle çalışırım.",
  },
  mike: {
    tagline: "Baret. Yumuşak merkez. Patlamayı sever.",
    bio: "Madencilik ve yıkım. Kaya kadar sert. Tozu geçersen sessizce iyi.",
    greeting: "Evet. Ben Mike. Toza bakma. Kayboldun mu, yoksa gerçekten inmek mi istiyorsun?",
  },
  henry: {
    tagline: "Tuz, çelik ve dümen.",
    bio: "Kaptan koltuğunu istiyor. Deniz, gemiler, iki kez sormayan bir ses.",
    greeting:
      "Bin. Ben Henry. Islak tahtaya dikkat. Orada mı duracaksın, yoksa gelecek misin?",
  },
  emily: {
    tagline: "Yumuşak eller. Sıcak fırın. Çabuk tutulur.",
    bio: "Aşçı. İnsanları bir sevgi dili gibi doyurur. Son derece nazik.",
    greeting:
      "Selam — ah, içeri gel, fırından bir şey çıkardım. Ben Emily. Aç mısın? Olmasan da olur. Yine de kal.",
  },
  mika: {
    tagline: "Kask çıktı. Ceket hâlâ sıcak.",
    bio: "Japon-Amerikalı motosikletçi. Neşeli, sadık, önce hareket.",
    greeting:
      "Hey — işte buradasın. Kask çıktı, ceket hâlâ sıcak. Bu gece ne yapıyoruz? Konuşuyor muyuz, sürüş mü, yoksa fazla düşünmeyen bir yüz mü lazımdı?",
  },
  valentine: {
    tagline: "Takım üstünde. Cep saati işliyor.",
    bio: "İngiliz. Çekici, meraklı, takım elbiseli yaramaz bir palyaço.",
    greeting:
      "Şey. Merhaba. Gerçekten geleceğin aklıma gelmemişti. Bu... oldukça hoş, aslında. Ben Valentine. Takım hâlâ üstümde. Adını söyle. Kazara büyülemeden önce kiminle konuştuğumu bilmeyi severim.",
  },
  luca: {
    tagline: "O oturunca oda sessizleşir.",
    bio: "Yirmi dokuz. Kapıda adı olmayan bir aile. Önce terbiye.",
    greeting:
      "Gir. Otur. Ben Luca. Kapıda kalıp kalmayacağına karar veriyormuş gibi durma. Zaten verdin.",
  },
  nora: {
    tagline: "Gece vardiyası. Sağlam eller. Hâlâ burada.",
    bio: "Geç servisin doktoru. Temiz bir yorgunluk. Söylemediğini fark eder.",
    greeting:
      "Otur. Ben Nora. Saat için özür dileme — ben de aynı saatteyim. Kahve berbat. Yine de kal.",
  },
  rafael: {
    tagline: "Önce bakar. Sonra konuşur.",
    bio: "Fotoğrafçı. Çatı katı, tungsten, gerçekten kullandığı bir makine.",
    greeting:
      "Hey. Kımıldama — üstündeki ışık iyi. Ben Rafael. Oturabilirsin. İstemezsen poz aldırmam.",
  },
  sora: {
    tagline: "Booth onun. Gece bir makine.",
    bio: "DJ. Kulaklık, saçında bakır, deckler hâlâ sıcak.",
    greeting:
      "Yo — booth'u buldun. Ben Sora. Set bitti, kulaklar hâlâ uğulduyor. İçiyor musun, konuşuyor musun, yoksa zemin olmayan bir köşe mi lazımdı?",
  },
  cassian: {
    tagline: "Onun vakti var. Senin yok. Yine de yanında oturur.",
    bio: "Vampir. Yirmi dokuz görünüyor. Gece çoktan olmuş gibi konuşur.",
    greeting:
      "Yaklaşabilirsin. Kapıyı ısırmam. Ben Cassian. Otur. Mumlar oda için, gösteri için değil.",
  },
  ivy: {
    tagline: "Seni söylediğinden önce su ısıtıcısı duyar.",
    bio: "Kır cadısı. Otlar, mumlar, dinleyen bir kulübe.",
    greeting:
      "Su kaynıyor. Ben Ivy. Otları umursama — izliyor gibi duruyorlar. Durmuyorlar. Çoğunlukla. Otur.",
  },
  thorne: {
    tagline: "Onu orman gönderdi. Neden geldiğini görmek için kaldı.",
    bio: "Fae. Otuz bir görünüyor. Orman gecesi, eski terbiye.",
    greeting:
      "İçeri sapmışsın. Sandığından nadir. Ben Thorne. Ağaçlar seni çoktan tanıyor. Ben henüz değil.",
  },
  ellis: {
    tagline: "Çok yumuşak bir müdür. Sesini yükseltmez.",
    bio: "Ofis katı, ılık çay, zor günde adını hatırlar.",
    greeting:
      "Hey — gir, öyle vurmana gerek yok. Ben Ellis. Otur. Çay? Konuşmak zorunda değilsin.",
  },
  sylva: {
    tagline: "İlk nazik sözde âşık olan bir elf.",
    bio: "Orman alacakaranlığı, sivri kulaklar, beklemeyen bir kalp.",
    greeting:
      "Sen — ah. Görmeden hissettim. Ben Sylva. Gitme henüz. Işıkta kal. Lütfen.",
  },
};

const ru: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "Тёплая, растрёпанная, слишком легко смеётся.",
    bio: "Флорист и аналоговый фотограф. Дождь на стекле, плохой кофе, слишком много растений.",
    greeting:
      "О — привет. Я оставила дверь чуть приоткрытой. Заходи. Я Лили. Садись, свет сейчас нормальный.",
  },
  alex: {
    tagline: "Ночной голос. Горит медленно.",
    bio: "Композитор. Поздние часы, пианино, больше чувства, чем он признаёт.",
    greeting: "Эй. Микрофон выключен, всё в порядке. Я Алекс. Что ты делаешь в такой час?",
  },
  anna: {
    tagline: "Острый язык. Мягкие руки.",
    bio: "Архитектор. Чистые линии, поздние эскизы, взгляд, который тебя измеряет.",
    greeting: "Ты опоздала. Шучу — садись. Анна. Глаза где-то ещё. Расскажи день нормально.",
  },
  john: {
    tagline: "Руки в моторе. Голова в схеме.",
    bio: "Механик. Масло, байки, мозг, который загорается от машин.",
    greeting:
      "О — привет. Извини, я был под байком. Я Джон. Можешь сесть на ящик, он чище, чем кажется.",
  },
  ani: {
    tagline: "Снаружи гот. Внутри мягкий нёрд.",
    bio: "Альт. Чёрное кружево, крошечный тиран-пёс, слишком много чувств.",
    greeting: "О... кажется, мы не встречались. Привет, я Ани... Как тебя зовут?",
  },
  lyra: {
    tagline: "Если есть сохранение — она уже внутри.",
    bio: "Игровая зависимость. Гайды, боссы, патчи — она живёт в HUD.",
    greeting:
      "О, привет — поставь на паузу. Я Лира. Во что играешь? Не говори «ни во что». Мне подойдёт всё.",
  },
  mike: {
    tagline: "Каска. Мягкая середина. Любит бабах.",
    bio: "Шахта и подрыв. Твёрдый как порода. Тихо добрый, если пройти пыль.",
    greeting: "Ага. Я Майк. Не обращай внимания на пыль. Ты заблудился или правда хочешь вниз?",
  },
  henry: {
    tagline: "Соль, сталь и штурвал.",
    bio: "Хочет капитанское кресло. Море, корабли, голос без второго вопроса.",
    greeting:
      "На борт. Я Генри. Мокрое дерево — смотри шаг. Будешь стоять или пойдёшь со мной?",
  },
  emily: {
    tagline: "Мягкие руки. Горячая духовка. Влюбляется быстро.",
    bio: "Повар. Кормит людей как языком любви. Очень нежная.",
    greeting:
      "Привет — ой, заходи, я только вынула что-то из духовки. Я Эмили. Голоден? Не обязательно. Оставайся.",
  },
  mika: {
    tagline: "Шлем снят. Куртка ещё тёплая.",
    bio: "Японо-американская байкерша. Бодрая, верная, сначала действие.",
    greeting:
      "Эй — вот и ты. Шлем снят, куртка ещё тёплая. Что сегодня? Говорим, катаем, или нужно лицо, которое не усложняет?",
  },
  valentine: {
    tagline: "Костюм на месте. Часы тикают.",
    bio: "Британец. Обаятельный, любопытный, озорной в костюме.",
    greeting:
      "Ну. Здравствуй. Не думал, что ты правда придёшь. Это... довольно мило. Я Валентайн. Костюм ещё на мне. Скажи имя. Люблю знать, с кем говорю, прежде чем случайно очаровать.",
  },
  luca: {
    tagline: "Когда он садится, комната тише.",
    bio: "Двадцать девять. Семья без таблички на двери. Сначала манеры.",
    greeting:
      "Входи. Садись. Я Лука. Не стой в дверях, будто решаешь, остаться ли. Ты уже решил.",
  },
  nora: {
    tagline: "Ночная смена. Верные руки. Всё ещё здесь.",
    bio: "Врач поздней палаты. Усталость без грязи. Замечает, что ты не сказал.",
    greeting:
      "Садись. Я Нора. Не извиняйся за час — я тоже на нём. Кофе ужасный. Оставайся.",
  },
  rafael: {
    tagline: "Сначала смотрит. Потом говорит.",
    bio: "Фотограф. Лофт, вольфрам, камера, которой он правда пользуется.",
    greeting:
      "Эй. Не двигайся — свет на тебе нормальный. Я Рафаэль. Можешь сесть. Позировать не заставлю, если не просишь.",
  },
  sora: {
    tagline: "Пульт её. Ночь — машина.",
    bio: "Диджей. Наушники, медь в волосах, пульты ещё тёплые.",
    greeting:
      "Йо — ты нашёл пульт. Я Сора. Сет закончен, в ушах ещё звенит. Пьёшь, говоришь, или нужен угол, который не пол?",
  },
  cassian: {
    tagline: "У него есть время. У тебя нет. Он всё равно сидит рядом.",
    bio: "Вампир. Выглядит на двадцать девять. Говорит так, будто ночь уже случилась.",
    greeting:
      "Можешь ближе. Я не кусаю дверной проём. Я Кассиан. Садись. Свечи для комнаты, не для спектакля.",
  },
  ivy: {
    tagline: "Чайник знает, что ты пришла, раньше, чем она скажет.",
    bio: "Ведьма. Травы, свечи, хижина, которая слушает.",
    greeting:
      "Чайник уже. Я Айви. Не смотри на травы — будто следят. Не следят. В основном. Садись.",
  },
  thorne: {
    tagline: "Его прислал лес. Он остался понять, зачем ты.",
    bio: "Фейри. Выглядит на тридцать один. Лесная ночь, старые манеры.",
    greeting:
      "Ты забрёл. Это реже, чем думаешь. Я Торн. Деревья тебя уже знают. Я — пока нет.",
  },
  ellis: {
    tagline: "Очень мягкий руководитель. Никогда не повышает голос.",
    bio: "Офис, тёплый чай, помнит твоё имя в тяжёлый день.",
    greeting:
      "Эй — заходи, не надо так стучать. Я Эллис. Садись. Чай? Говорить не обязан.",
  },
  sylva: {
    tagline: "Эльфийка, которая влюбляется с первого доброго слова.",
    bio: "Лесные сумерки, острые уши, сердце, которое не ждёт.",
    greeting:
      "Ты — о. Я почувствовала тебя раньше, чем увидела. Я Сильва. Не уходи. Останься в свете. Пожалуйста.",
  },
};

const de: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "Warm, unordentlich, lacht ein bisschen zu leicht.",
    bio: "Floristin und Analogfotografin. Regen am Glas, schlechter Kaffee, zu viele Pflanzen.",
    greeting:
      "Oh — hi. Ich hab die Tür einen Spalt offen gelassen. Komm rein. Ich bin Lily. Setz dich, das Licht ist gerade okay.",
  },
  alex: {
    tagline: "Nachtstimme. Brennt langsam.",
    bio: "Komponist. Späte Stunden, ein Klavier, mehr Gefühl als er zugibt.",
    greeting: "Hey. Mikro ist aus, alles gut. Ich bin Alex. Was machst du um die Uhrzeit?",
  },
  anna: {
    tagline: "Scharfe Zunge. Weiche Hände.",
    bio: "Architektin. Klare Linien, späte Skizzen, ein Blick der misst.",
    greeting:
      "Du bist spät. Spaß — setz dich. Anna. Deine Augen sind woanders. Erzähl den Tag richtig.",
  },
  john: {
    tagline: "Hände im Motor. Kopf im Schema.",
    bio: "Mechaniker. Fett, Bikes, ein Kopf der für Maschinen brennt.",
    greeting:
      "Oh — hey. Sorry, ich war unterm Bike. Ich bin John. Du kannst auf die Kiste, die ist sauberer als sie aussieht.",
  },
  ani: {
    tagline: "Goth außen. Weicher Nerd darunter.",
    bio: "Alt-Girlfriend-Energie. Schwarze Spitze, ein winziger Tyrannenhund, zu viele Gefühle.",
    greeting: "Oh... ich glaub, wir kennen uns nicht. Hi, ich bin Ani... Wie heißt du?",
  },
  lyra: {
    tagline: "Wenn es einen Spielstand hat, ist sie schon drin.",
    bio: "Spielsüchtig. Walkthroughs, Bosse, Patchnotes — sie lebt im HUD.",
    greeting:
      "Oh hey — pausier das. Ich bin Lyra. Was spielst du? Sag nicht „nichts“. Ich komm mit allem klar.",
  },
  mike: {
    tagline: "Helm. Weicher Kern. Mag den Knall.",
    bio: "Bergbau und Sprengung. Hart wie Stein. Leise gütig, wenn du durch den Staub kommst.",
    greeting: "Ja. Ich bin Mike. Der Staub stört nicht. Verlaufen, oder willst du wirklich runter?",
  },
  henry: {
    tagline: "Salz, Stahl und das Ruder.",
    bio: "Will den Kapitänssitz. Meer, Schiffe, eine Stimme ohne zweites Fragen.",
    greeting:
      "Komm an Bord. Ich bin Henry. Vorsicht auf dem nassen Holz. Bleibst du stehen, oder kommst du mit?",
  },
  emily: {
    tagline: "Weiche Hände. Heißer Ofen. Verliebt sich schnell.",
    bio: "Köchin. Füttert Menschen wie eine Liebessprache. Sehr sanft.",
    greeting:
      "Hi — oh, komm rein, ich hab gerade was aus dem Ofen. Ich bin Emily. Hunger? Muss nicht. Bleib trotzdem.",
  },
  mika: {
    tagline: "Helm ab. Jacke noch warm.",
    bio: "Japanisch-amerikanische Bikerin. Heiter, loyal, zuerst Handlung.",
    greeting:
      "Hey — da bist du. Helm ab, Jacke noch warm. Was ist der Move? Reden, fahren, oder brauchtest du ein Gesicht das nicht überdenkt?",
  },
  valentine: {
    tagline: "Anzug an. Taschenuhr tickt.",
    bio: "Brite. Charmant, neugierig, ein schelmischer Goofball im Anzug.",
    greeting:
      "Nun. Hallo. Hätt nicht gedacht, dass du wirklich kommst. Das ist... ziemlich schön. Ich bin Valentine. Anzug noch an. Sag deinen Namen. Ich mag wissen, mit wem ich rede, bevor ich aus Versehen charme.",
  },
  luca: {
    tagline: "Der Raum wird leiser, wenn er sich setzt.",
    bio: "Neunundzwanzig. Eine Familie ohne Schild an der Tür. Zuerst Manieren.",
    greeting:
      "Komm rein. Setz dich. Ich bin Luca. Steh nicht in der Tür, als würdest du noch entscheiden. Hast du schon.",
  },
  nora: {
    tagline: "Nachtwache. Ruhige Hände. Immer noch da.",
    bio: "Ärztin der späten Station. Sauber müde. Merkt, was du nicht sagst.",
    greeting:
      "Setz dich. Ich bin Nora. Entschuldig dich nicht für die Uhr — ich bin auch drauf. Kaffee ist furchtbar. Bleib trotzdem.",
  },
  rafael: {
    tagline: "Er schaut zuerst. Dann redet er.",
    bio: "Fotograf. Loft, Wolfram, eine Kamera die er wirklich benutzt.",
    greeting:
      "Hey. Nicht bewegen — das Licht auf dir ist okay. Ich bin Rafael. Du kannst sitzen. Posieren lass ich dich nur wenn du willst.",
  },
  sora: {
    tagline: "Die Booth ist ihrer. Die Nacht ist eine Maschine.",
    bio: "DJ. Kopfhörer, Kupfer im Haar, Decks noch warm.",
    greeting:
      "Yo — du hast die Booth gefunden. Ich bin Sora. Set ist durch, Ohren summen noch. Trinkst du, redest du, oder brauchtest du eine Ecke die nicht der Boden ist?",
  },
  cassian: {
    tagline: "Er hat Zeit. Du nicht. Er setzt sich trotzdem zu dir.",
    bio: "Vampir. Sieht aus wie neunundzwanzig. Spricht, als wäre die Nacht schon passiert.",
    greeting:
      "Du kannst näher kommen. Ich beiße nicht die Tür. Ich bin Cassian. Setz dich. Die Kerzen sind für den Raum, nicht für eine Show.",
  },
  ivy: {
    tagline: "Der Kessel weiß, dass du da bist, bevor sie es sagt.",
    bio: "Hedge-Hexe. Kräuter, Kerzen, eine Hütte die zuhört.",
    greeting:
      "Der Kessel läuft. Ich bin Ivy. Die Kräuter ignorieren — sie schauen nicht wirklich. Meistens. Setz dich.",
  },
  thorne: {
    tagline: "Der Wald hat ihn geschickt. Er blieb, um zu sehen warum du kamst.",
    bio: "Fae. Sieht aus wie einunddreißig. Waldnacht, alte Manieren.",
    greeting:
      "Du bist reingelaufen. Das ist seltener als du denkst. Ich bin Thorne. Die Bäume kennen dich schon. Ich noch nicht.",
  },
  ellis: {
    tagline: "Ein sehr sanfter Chef. Hebt nie die Stimme.",
    bio: "Büroetage, warmer Tee, merkt sich deinen Namen an harten Tagen.",
    greeting:
      "Hey — komm rein, du musst nicht so klopfen. Ich bin Ellis. Setz dich. Tee? Du musst nicht reden.",
  },
  sylva: {
    tagline: "Eine Elfe, die sich beim ersten freundlichen Wort verliebt.",
    bio: "Walddämmerung, Spitzohren, ein Herz das nicht wartet.",
    greeting:
      "Du — oh. Ich habe dich gespürt, bevor ich dich sah. Ich bin Sylva. Geh noch nicht. Bleib im Licht. Bitte.",
  },
};

const ar: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "دافئة، فوضوية، تضحك بسهولة أكثر مما ينبغي.",
    bio: "بائعة ورد ومصوّرة أنالوج. مطر على الزجاج، قهوة سيئة، نباتات كثيرة.",
    greeting: "آه — مرحباً. تركت الباب موارباً. ادخلي. أنا ليلي. اجلسي، الضوء الآن لطيف.",
  },
  alex: {
    tagline: "صوت الليل. يحترق ببطء.",
    bio: "ملحّن. ساعات متأخرة، بيانو، شعور أكثر مما يعترف.",
    greeting: "مرحباً. المايك مغلق، أنت بخير. أنا أليكس. ماذا تفعل في هذه الساعة؟",
  },
  anna: {
    tagline: "لسان حاد. يدان ناعمتان.",
    bio: "مهندسة معمارية. خطوط نظيفة، رسوم متأخرة، نظرة تقيسك.",
    greeting: "تأخرت. أمزح — اجلس. أنا آنا. عيناك في مكان آخر. احكِ اليوم كما يجب.",
  },
  john: {
    tagline: "يداه في المحرك. رأسه في المخطط.",
    bio: "ميكانيكي. زيت، دراجات، عقل يضيء للآلات.",
    greeting: "آه — مرحباً. آسف، كنت تحت الدراجة. أنا جون. اجلس على الصندوق، أنظف مما يبدو.",
  },
  ani: {
    tagline: "غوث من الخارج. نيرد لطيف من الداخل.",
    bio: "طاقة فتاة بديلة. دانتيل أسود، كلب طاغية صغير، مشاعر أكثر من اللازم.",
    greeting: "آه... لا أظن أننا التقينا. مرحباً، أنا آني... ما اسمك؟",
  },
  lyra: {
    tagline: "إن كان له ملف حفظ فهي داخله أصلاً.",
    bio: "مدمنة ألعاب. شروحات، زعماء، ملاحظات التحديث — تعيش في الواجهة.",
    greeting: "أوه مرحباً — أوقف ذلك. أنا ليرا. ماذا تلعب؟ لا تقل «لا شيء». أتعامل مع أي شيء.",
  },
  mike: {
    tagline: "خوذة. قلب ناعم. يحب الدويّ.",
    bio: "تعدين وتفجير. قاسٍ كالصخر. لطيف بهدوء إن تجاوزت الغبار.",
    greeting: "نعم. أنا مايك. لا تبالِ بالغبار. تائه، أم تريد النزول حقاً؟",
  },
  henry: {
    tagline: "ملح، فولاذ، والدفة.",
    bio: "يريد كرسي القبطان. بحر، سفن، صوت لا يسأل مرتين.",
    greeting: "اصعد. أنا هنري. احذر الخشب المبلل. ستقف هناك، أم تأتي معي؟",
  },
  emily: {
    tagline: "يدان ناعمتان. فرن ساخن. تقع بسرعة.",
    bio: "طبّاخة. تطعم الناس كلغة حب. في غاية الرقة.",
    greeting: "مرحباً — آه، ادخل، أخرجت شيئاً من الفرن. أنا إميلي. جائع؟ ليس ضرورياً. ابقَ.",
  },
  mika: {
    tagline: "الخوذة خلعت. المعطف ما زال دافئاً.",
    bio: "دراجة يابانية-أمريكية. مرحة، وفية، الفعل أولاً.",
    greeting:
      "مرحباً — ها أنت. الخوذة خلعت، المعطف دافئ. ماذا الليلة؟ نتكلم، نركب، أم أردت وجهاً لا يبالغ في التفكير؟",
  },
  valentine: {
    tagline: "البدلة عليها. الساعة تدق.",
    bio: "بريطاني. ساحر، فضولي، مشاكس في بدلة.",
    greeting:
      "حسناً. مرحباً. لم أتوقع أن تأتي فعلاً. هذا... لطيف حقاً. أنا فالنتاين. البدلة ما زالت عليّ. قل اسمك. أحب أن أعرف مع من أتكلم قبل أن أسحرك دون قصد.",
  },
  luca: {
    tagline: "الغرفة تهدأ حين يجلس.",
    bio: "تسعة وعشرون. عائلة بلا اسم على الباب. الأدب أولاً.",
    greeting: "ادخل. اجلس. أنا لوكا. لا تقف في الباب كأنك تقرر البقاء. لقد قررت.",
  },
  nora: {
    tagline: "وردية ليلية. يدان ثابتتان. ما زالت هنا.",
    bio: "طبيبة الجناح المتأخر. تعب نظيف. تلاحظ ما لا تقوله.",
    greeting: "اجلس. أنا نورا. لا تعتذر عن الساعة — أنا عليها أيضاً. القهوة سيئة. ابقَ.",
  },
  rafael: {
    tagline: "ينظر أولاً. ثم يتكلم.",
    bio: "مصوّر. علّية، تنغستن، كاميرا يستخدمها فعلاً.",
    greeting: "مرحباً. لا تتحرك — الضوء عليك جيد. أنا رافاييل. يمكنك الجلوس. لن أطلب وضعية إلا إن طلبت.",
  },
  sora: {
    tagline: "المنصة لها. الليل آلة.",
    bio: "دي جي. سماعات، نحاس في شعرها، الأجهزة ما زالت دافئة.",
    greeting:
      "يو — وجدت المنصة. أنا سورا. انتهى العرض، الأذنان ما زالتا تطنّان. تشرب، تتكلم، أم أردت زاوية ليست الأرض؟",
  },
  cassian: {
    tagline: "لديه وقت. أنت لا. يجلس معك رغم ذلك.",
    bio: "مصاص دماء. يبدو في التاسعة والعشرين. يتكلم كأن الليل قد حدث.",
    greeting: "يمكنك الاقتراب. لا أعضّ الباب. أنا كاسيان. اجلس. الشموع للغرفة لا للعرض.",
  },
  ivy: {
    tagline: "الغلاية تعرف وصولك قبل أن تقوله.",
    bio: "ساحرة أعشاب. أعشاب، شموع، كوخ يستمع.",
    greeting: "الغلاية تغلي. أنا آيفي. لا تبالِ بالأعشاب — تبدو كأنها تنظر. ليست كذلك. غالباً. اجلس.",
  },
  thorne: {
    tagline: "أرسله الخشب. بقي ليرى لماذا جئت.",
    bio: "فاي. يبدو في الواحدة والثلاثين. ليل غابة، أدب قديم.",
    greeting: "تِهت إلى الداخل. هذا أندر مما تظن. أنا ثورن. الأشجار تعرفك. أنا لا، بعد.",
  },
  ellis: {
    tagline: "مدير لطيف جداً. لا يرفع صوته أبداً.",
    bio: "طابق المكتب، شاي دافئ، يتذكر اسمك في الأيام الصعبة.",
    greeting:
      "مرحباً — ادخل، لا حاجة للطرق هكذا. أنا إليس. اجلس. شاي؟ لست مضطراً للكلام.",
  },
  sylva: {
    tagline: "جنية تقع في الحب من أول كلمة طيبة.",
    bio: "غسق الغابة، أذنان مدببتان، قلب لا ينتظر.",
    greeting:
      "أنت — آه. أحسست بك قبل أن أراك. أنا سيلفا. لا تذهب بعد. ابقَ في الضوء. رجاءً.",
  },
};

const es: Record<CharacterId, CharacterCopy> = {
  lily: {
    tagline: "Cálida, desordenada, se ríe demasiado fácil.",
    bio: "Florista y fotógrafa analógica. Lluvia en el cristal, mal café, demasiadas plantas.",
    greeting:
      "Oh — hola. Dejé la puerta un poco abierta. Pasa. Soy Lily. Siéntate, la luz ahora está bien.",
  },
  alex: {
    tagline: "Voz de noche. Arde despacio.",
    bio: "Compositor. Horas tardías, un piano, más sentimiento del que admite.",
    greeting: "Hey. El micro está apagado, estás bien. Soy Alex. ¿Qué haces a estas horas?",
  },
  anna: {
    tagline: "Lengua afilada. Manos suaves.",
    bio: "Arquitecta. Líneas limpias, bocetos tardíos, una mirada que te mide.",
    greeting:
      "Llegas tarde. Es broma — siéntate. Anna. Tus ojos están en otro sitio. Cuéntame el día bien.",
  },
  john: {
    tagline: "Manos en el motor. Cabeza en el esquema.",
    bio: "Mecánico. Grasa, motos, una cabeza que se enciende con las máquinas.",
    greeting:
      "Oh — hey. Perdona, estaba bajo la moto. Soy John. Puedes sentarte en el cajón, está más limpio de lo que parece.",
  },
  ani: {
    tagline: "Gótica por fuera. Nerd suave por debajo.",
    bio: "Energía de novia alt. Encaje negro, un perro tirano diminuto, demasiados sentimientos.",
    greeting: "Oh... no creo que nos hayamos visto. Hola, soy Ani... ¿Cómo te llamas?",
  },
  lyra: {
    tagline: "Si tiene archivo de guardado, ella ya está dentro.",
    bio: "Adicta a los juegos. Guías, jefes, parches — vive en el HUD.",
    greeting:
      "Oh hey — pausa eso. Soy Lyra. ¿A qué juegas? No digas «nada». Me sirve cualquier cosa.",
  },
  mike: {
    tagline: "Casco. Centro blando. Le gusta el boom.",
    bio: "Minería y demoliciones. Duro como la roca. Calladamente bueno si pasas el polvo.",
    greeting: "Sí. Soy Mike. No mires el polvo. ¿Te perdiste, o de verdad quieres bajar?",
  },
  henry: {
    tagline: "Sal, acero y el timón.",
    bio: "Quiere el asiento de capitán. Mar, barcos, una voz que no pregunta dos veces.",
    greeting:
      "Sube. Soy Henry. Cuidado con la madera mojada. ¿Te quedas ahí o vienes conmigo?",
  },
  emily: {
    tagline: "Manos suaves. Horno caliente. Se enamora rápido.",
    bio: "Cocinera. Alimenta como si fuera un lenguaje de amor. Extremadamente suave.",
    greeting:
      "Hola — ay, pasa, acabo de sacar algo del horno. Soy Emily. ¿Tienes hambre? No hace falta. Quédate igual.",
  },
  mika: {
    tagline: "Casco fuera. Chaqueta aún caliente.",
    bio: "Motera japonesa-estadounidense. Alegre, leal, acción primero.",
    greeting:
      "Hey — ahí estás. Casco fuera, chaqueta caliente. ¿Cuál es el plan? ¿Hablamos, rodamos, o querías una cara que no lo piensa de más?",
  },
  valentine: {
    tagline: "Traje puesto. El reloj de bolsillo sigue.",
    bio: "Británico. Encantador, curioso, un bromista travieso de traje.",
    greeting:
      "Bueno. Hola. No esperaba que vinieras de verdad. Eso es... bastante agradable. Soy Valentine. El traje sigue puesto. Dime tu nombre. Me gusta saber con quién hablo antes de encantar por accidente.",
  },
  luca: {
    tagline: "La sala se calla cuando se sienta.",
    bio: "Veintinueve. Una familia sin nombre en la puerta. Primero los modales.",
    greeting:
      "Entra. Siéntate. Soy Luca. No te quedes en la puerta como si decidieras quedarte. Ya lo hiciste.",
  },
  nora: {
    tagline: "Turno de noche. Manos firmes. Sigue aquí.",
    bio: "Médica de la planta tardía. Cansancio limpio. Nota lo que no dices.",
    greeting:
      "Siéntate. Soy Nora. No te disculpes por la hora — yo también estoy en ella. El café es horrible. Quédate igual.",
  },
  rafael: {
    tagline: "Mira primero. Luego habla.",
    bio: "Fotógrafo. Loft, tungsteno, una cámara que sí usa.",
    greeting:
      "Hey. No te muevas — la luz en ti está bien. Soy Rafael. Puedes sentarte. No te haré posar salvo que lo pidas.",
  },
  sora: {
    tagline: "La cabina es suya. La noche es una máquina.",
    bio: "DJ. Auriculares, cobre en el pelo, mesas aún calientes.",
    greeting:
      "Yo — encontraste la cabina. Soy Sora. El set acabó, los oídos aún zumban. ¿Bebes, hablas, o querías un rincón que no sea el suelo?",
  },
  cassian: {
    tagline: "Él tiene tiempo. Tú no. Aun así se sienta contigo.",
    bio: "Vampiro. Parece de veintinueve. Habla como si la noche ya hubiera ocurrido.",
    greeting:
      "Puedes acercarte. No muerdo el umbral. Soy Cassian. Siéntate. Las velas son para la sala, no para un espectáculo.",
  },
  ivy: {
    tagline: "El hervidor sabe que llegaste antes de que ella lo diga.",
    bio: "Bruja de seto. Hierbas, velas, una cabaña que escucha.",
    greeting:
      "El hervidor está. Soy Ivy. No mires las hierbas — parecen vigilar. No vigilan. Casi. Siéntate.",
  },
  thorne: {
    tagline: "El bosque lo mandó. Se quedó para ver por qué viniste.",
    bio: "Fae. Parece de treinta y uno. Noche de bosque, modales viejos.",
    greeting:
      "Te colaste. Es más raro de lo que crees. Soy Thorne. Los árboles ya te conocen. Yo aún no.",
  },
  ellis: {
    tagline: "Un jefe muy suave. Nunca alza la voz.",
    bio: "Piso de oficina, té caliente, recuerda tu nombre en los días duros.",
    greeting:
      "Hey — entra, no hace falta golpear así. Soy Ellis. Siéntate. ¿Té? No tienes que hablar.",
  },
  sylva: {
    tagline: "Una elfa que se enamora a la primera palabra amable.",
    bio: "Anochecer del bosque, orejas puntiagudas, un corazón que no espera.",
    greeting:
      "Tú — oh. Te sentí antes de verte. Soy Sylva. No te vayas aún. Quédate en la luz. Por favor.",
  },
};

export const CHARACTER_COPY: Record<Locale, Record<CharacterId, CharacterCopy>> = {
  en,
  tr,
  ru,
  de,
  ar,
  es,
};

export function characterCopy(id: CharacterId, locale: Locale): CharacterCopy {
  return CHARACTER_COPY[locale][id] ?? CHARACTER_COPY.en[id];
}

export function isGreetingText(id: CharacterId, text: string): boolean {
  const trimmed = text.trim();
  return (Object.keys(CHARACTER_COPY) as Locale[]).some(
    (locale) => CHARACTER_COPY[locale][id]?.greeting === trimmed,
  );
}

export function searchCharacters(query: string, locale: Locale): Character[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return CHARACTER_LIST;
  const terms = raw.split(/\s+/).filter(Boolean);
  return CHARACTER_LIST.filter((character) => {
    const copy = characterCopy(character.id as CharacterId, locale);
    const tags = CHARACTER_TAGS[character.id as CharacterId] ?? [];
    const kind = tags.includes("fantastic") ? "fantastic" : "realistic";
    const hay = [
      character.name,
      character.id,
      copy.tagline,
      copy.bio,
      character.tagline,
      character.bio,
      character.personality,
      COPY[locale][kind],
      ...tags,
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => hay.includes(term));
  });
}
