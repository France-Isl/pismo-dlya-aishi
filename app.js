const baseMessages = [
  "Забыть можно многое, но только не твои красивые глаза — они остаются в памяти даже тогда, когда тебя нет рядом.",
  "Знаешь, я прекрасно умею плавать, но каждый раз, когда смотрю в твои глаза, всё равно тону.",
  "Твоя улыбка обладает удивительной силой: появляется на твоём лице, а счастливее почему-то становлюсь я.",
  "Иногда хочется остановить время, чтобы ещё немного побыть рядом с тобой.",
  "Айша, ты умеешь делать красивым даже самый обычный день — достаточно одного сообщения от тебя.",
  "Когда ты улыбаешься, мне хочется улыбаться в ответ, даже если до этого настроение было совсем другим.",
  "Рядом с тобой часы пролетают как минуты, а без тебя минуты иногда кажутся часами.",
  "Я могу забыть, о чём мы говорили, но никогда не забуду, что чувствовал в тот момент, когда смотрел на тебя.",
  "Ты прекрасна даже тогда, когда сама этого не замечаешь.",
  "Если бы за каждую мысль о тебе появлялась звезда, ночное небо стало бы намного ярче.",
  "Иногда я открываю нашу переписку без причины. Просто там есть человек, который заставляет меня улыбаться.",
  "Айша, ты прекрасна во всём: во взгляде, в улыбке, в голосе и в тех добрых качествах, за которые я так сильно тебя ценю.",
  "Есть люди, которых встречаешь и забываешь. А есть те, после появления которых сердце уже не остаётся прежним.",
  "Я скучаю не только по твоему голосу или взгляду. Я скучаю по тому спокойствию, которое чувствую рядом с тобой.",
  "Ты стала частью тех мыслей, с которыми я просыпаюсь и к которым возвращаюсь перед сном.",
  "Иногда сердце выбирает человека тихо — без громких слов. А потом ты понимаешь, насколько этот человек стал дорог.",
  "Самые прекрасные мгновения — не обязательно самые громкие. Иногда это просто тишина, спокойствие и ты рядом.",
  "Красивые глаза встречаются часто, но только в твоих мне хочется задержаться подольше.",
  "Я не ищу идеальных слов, чтобы впечатлить тебя. Мне хочется говорить искренне: ты очень дорога мне, Айша.",
  "Когда человек действительно важен, расстояние не помогает забыть его — оно лишь показывает, как сильно его не хватает.",
  "В твоём взгляде есть что-то, что невозможно объяснить. Можно только почувствовать — и потом долго вспоминать.",
  "Ты не просто появляешься в моих мыслях. Иногда кажется, что ты оттуда вообще не уходишь.",
  "Настоящая привязанность — это когда хочется не только видеть человека рядом, но и знать, что его сердце спокойно.",
  "Возможно, я не всегда умею красиво выражать чувства, но одно знаю точно: время рядом с тобой для меня бесценно."
];

const tracks = [
  { name: "Мураджан · slowed", source: "audio/track-1.mp3", fallback: "audio/track-1.b64" },
  { name: "Азан · nasheed", source: "audio/track-2.mp3", fallback: "audio/track-2.b64" },
  { name: "Лучшие нашиды", source: "audio/track-3.mp3", fallback: "audio/track-3.b64" }
];

const relationshipLabels = {
  mother: "мама", father: "папа", wife: "жена", husband: "муж", daughter: "дочь", son: "сын",
  grandmother: "бабушка", grandfather: "дедушка", sister: "сестра", brother: "брат",
  relative: "родной человек", teacher: "учитель"
};

const senderRoleLabels = {
  son: "сын", daughter: "дочь", husband: "муж", wife: "жена", parent: "родитель",
  sibling: "брат или сестра", relative: "родственник", student: "ученик"
};

const toneLabels = {
  grateful: "благодарное и искреннее", warm: "тёплое и спокойное", supportive: "поддерживающее",
  apology: "искреннее извинение", celebration: "поздравительное к важному дню", dua: "с добрым пожеланием и уместным дуа"
};

const lengthLabels = { short: "70–90 слов", medium: "110–150 слов", long: "170–220 слов" };

const blockedRules = [
  { reason: "Темы 18+ и откровенное содержание здесь строго запрещены.", re: /\b(секс\w*|эрот\w*|порн\w*|интим\w*|обнаж\w*|генитал\w*|оргазм\w*|фетиш\w*|возбужд\w*|мастурб\w*|проститу\w*|sex\w*|porn\w*|erotic\w*|nude\w*|naked\w*)\b/iu },
  { reason: "Нельзя создавать тексты про алкоголь, наркотики или азартные игры.", re: /\b(алкогол\w*|водк\w*|коньяк\w*|пиво\w*|вино\b|наркот\w*|кокаин\w*|героин\w*|марихуан\w*|казино\w*|азарт\w*|букмекер\w*|ставк\w*)\b/iu },
  { reason: "Нельзя создавать унижающие, оскорбительные или жестокие тексты.", re: /\b(унизи\w*|оскорб\w*|ненавиж\w*|отомст\w*|убить\w*|избить\w*|шантаж\w*|угрож\w*)\b/iu },
  { reason: "Тайные и запретные отношения не поддерживаются.", re: /\b(любовниц\w*|измен\w*|внебрач\w*|тайн\w*\s+свидан\w*|скрыт\w*\s+отношен\w*)\b/iu }
];

const nonSpouseRomance = /\b(страст\w*|соблазн\w*|поцелу\w*|романтическ\w*\s+свидан\w*)\b/iu;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);

let fromName = cleanName(params.get("from")) || cleanName(localStorage.getItem("warmLetterFrom")) || "Ислам";
let toName = cleanName(params.get("to")) || cleanName(localStorage.getItem("warmLetterTo")) || "Айша";
let recipientGender = (params.get("gender") || localStorage.getItem("warmLetterGender")) === "m" ? "m" : "f";
let sharedMessage = decodeSharedMessage(params.get("msg"));
let letterDeck = sharedMessage ? [sharedMessage, ...baseMessages] : [...baseMessages];
let currentIndex = sharedMessage ? 0 : Math.min(Number(localStorage.getItem("warmLetterIndex") || 0), letterDeck.length - 1);
let selectedTrack = Math.min(Number(localStorage.getItem("warmLetterTrack") || 0), 3);
let currentObjectUrl = null;
let customAudioBlob = null;
let isPlaying = false;
let storyOpened = false;
let toastTimer;
let aiWorker = null;
let aiResolve = null;
let aiReject = null;
let generatedMessage = "";

const audio = $("#nasheed");
const homeScreen = $("#homeScreen");
const letterStage = $("#letterStage");
const aiLayer = $("#aiLayer");
const settingsLayer = $("#settingsLayer");

function cleanName(value) {
  return String(value || "").replace(/[<>\n\r]/g, "").trim().slice(0, 28);
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
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const text = new TextDecoder().decode(bytes).trim();
    return text.length <= 1800 && !checkSafety(text).blocked ? text : "";
  } catch { return ""; }
}

function personalized(text) {
  let result = text.replaceAll("Айша", toName);
  if (recipientGender === "m") result = result.replaceAll("ты прекрасна", "ты прекрасен").replaceAll("ты очень дорога мне", "ты очень дорог мне");
  return result;
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("from", fromName);
  url.searchParams.set("to", toName);
  url.searchParams.set("gender", recipientGender);
  if (sharedMessage) url.searchParams.set("msg", encodeSharedMessage(sharedMessage));
  else url.searchParams.delete("msg");
  history.replaceState({}, "", url);
}

function setNames(from, to) {
  fromName = cleanName(from) || "Ислам";
  toName = cleanName(to) || "Айша";
  $("#homeFrom").textContent = fromName;
  $("#letterFrom").textContent = fromName;
  $("#letterTo").textContent = toName;
  $("#fromInput").value = fromName;
  $("#toInput").value = toName;
  $("#aiSenderName").value = fromName;
  $("#aiRecipientName").value = toName;
  document.title = `Письмо: ${toName} — от ${fromName}`;
  localStorage.setItem("warmLetterFrom", fromName);
  localStorage.setItem("warmLetterTo", toName);
  updateUrl();
}

async function setupBackground() {
  try {
    const response = await fetch("assets/campfire-lake.png", { method: "HEAD", cache: "no-store" });
    if (response.ok) return;
    const fallback = await fetch("assets/campfire-lake.png.b64");
    if (!fallback.ok) return;
    const blob = base64ToBlob((await fallback.text()).trim(), "image/png");
    const url = URL.createObjectURL(blob);
    document.documentElement.style.setProperty("--scene-image", `url("${url}")`);
  } catch {}
}

function createAtmosphere() {
  const leafColors = ["#b7634b", "#d48a59", "#d59aa8", "#8c684c", "#d6a75c"];
  for (let i = 0; i < 18; i++) {
    const leaf = document.createElement("i");
    leaf.className = "leaf";
    leaf.style.setProperty("--left", `${-5 + Math.random() * 106}%`);
    leaf.style.setProperty("--size", `${8 + Math.random() * 11}px`);
    leaf.style.setProperty("--duration", `${10 + Math.random() * 12}s`);
    leaf.style.setProperty("--delay", `${-Math.random() * 19}s`);
    leaf.style.setProperty("--opacity", `${.22 + Math.random() * .5}`);
    leaf.style.setProperty("--leaf-color", leafColors[Math.floor(Math.random() * leafColors.length)]);
    $("#leaves").append(leaf);
  }
  for (let i = 0; i < 14; i++) {
    const ember = document.createElement("i");
    ember.className = "ember";
    ember.style.setProperty("--left", `${58 + Math.random() * 30}%`);
    ember.style.setProperty("--size", `${1 + Math.random() * 3}px`);
    ember.style.setProperty("--duration", `${3.2 + Math.random() * 3}s`);
    ember.style.setProperty("--delay", `${-Math.random() * 5}s`);
    ember.style.setProperty("--drift", `${-35 + Math.random() * 70}px`);
    $("#embers").append(ember);
  }
  for (let i = 0; i < 20; i++) {
    const rain = document.createElement("i");
    rain.className = "rain-line";
    rain.style.setProperty("--left", `${Math.random() * 100}%`);
    rain.style.setProperty("--height", `${15 + Math.random() * 24}px`);
    rain.style.setProperty("--duration", `${1.8 + Math.random() * 1.6}s`);
    rain.style.setProperty("--delay", `${-Math.random() * 4}s`);
    $("#rainVeil").append(rain);
  }
}

function openStory() {
  if (storyOpened) return;
  storyOpened = true;
  playAudio(true);
  homeScreen.classList.add("is-leaving");
  setTimeout(() => {
    homeScreen.hidden = true;
    letterStage.hidden = false;
    letterStage.classList.add("is-entering");
    renderLetter();
  }, 650);
}

function renderLetter() {
  $("#letterNumber").textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${letterDeck.length}`;
  const text = $("#letterText");
  text.classList.remove("is-changing");
  void text.offsetWidth;
  text.textContent = personalized(letterDeck[currentIndex]);
  text.classList.add("is-changing");
  const captions = [
    "Вечер сохранил эти слова для тебя", "У костра даже тишина становится теплее", "Озеро помнит то, что трудно сказать вслух",
    `${fromName} вложил тепло в каждую строку`, "Пусть эти слова принесут спокойствие", "Некоторые письма находят нас вовремя"
  ];
  $("#stageCaption").textContent = captions[currentIndex % captions.length];
  localStorage.setItem("warmLetterIndex", String(currentIndex));
}

function moveLetter(direction) {
  currentIndex = (currentIndex + direction + letterDeck.length) % letterDeck.length;
  renderLetter();
}

function openPanel(layer) {
  layer.classList.add("is-open");
  layer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePanel(layer) {
  layer.classList.remove("is-open");
  layer.setAttribute("aria-hidden", "true");
  if (!aiLayer.classList.contains("is-open") && !settingsLayer.classList.contains("is-open")) document.body.style.overflow = "";
}

function showToast(message, duration = 2300) {
  clearTimeout(toastTimer);
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

function normalizeSafetyText(text) {
  return String(text || "").toLowerCase().replaceAll("ё", "е").replace(/[.*+?^${}()|[\]\\]/g, " ");
}

function checkSafety(text, relationship = "") {
  const normalized = normalizeSafetyText(text);
  for (const rule of blockedRules) if (rule.re.test(normalized)) return { blocked: true, reason: rule.reason };
  if (!['wife', 'husband'].includes(relationship) && nonSpouseRomance.test(normalized)) {
    return { blocked: true, reason: "Романтические формулировки доступны только для супругов. Выберите семейное и уважительное содержание." };
  }
  return { blocked: false, reason: "" };
}

function showSafety(reason) {
  $("#safetyReason").textContent = reason;
  $("#safetyMessage").hidden = false;
  $("#generatedCard").hidden = true;
  $("#generationStatus").hidden = true;
}

function buildSafeFallback(data) {
  const openings = {
    grateful: `${data.name}, хочу от всего сердца поблагодарить тебя.`,
    warm: `${data.name}, мне давно хотелось сказать тебе несколько простых и тёплых слов.`,
    supportive: `${data.name}, пусть эти строки напомнят: рядом есть человек, который верит в тебя и желает тебе спокойствия.`,
    apology: `${data.name}, я искренне прошу прощения за то, чем мог огорчить тебя.`,
    celebration: `${data.name}, в этот важный день хочу пожелать тебе самого доброго и светлого.`,
    dua: `${data.name}, пусть Всевышний дарует тебе спокойствие, здоровье и благополучие.`
  };
  const middle = data.idea
    ? `Особенно хочу сказать: ${data.idea.trim().replace(/[!?]+/g, ".").slice(0, 360)}`
    : "Я ценю твою заботу, терпение и то добро, которым ты делишься каждый день. Такие вещи не всегда замечают сразу, но именно они остаются в сердце надолго.";
  const closings = [
    "Спасибо за всё, что ты делаешь. Пусть в твоём сердце будет больше лёгкости, а в доме — мира и тепла.",
    "Я дорожу тобой и хочу чаще подтверждать это не только словами, но и добрыми поступками.",
    "Пусть впереди будет много спокойных дней, искренних улыбок и поводов благодарить Всевышнего."
  ];
  const extra = data.length === "long" ? " Твоя поддержка учит меня быть внимательнее, терпеливее и благодарнее. Я помню добро, которое получил от тебя, и прошу простить меня за моменты, когда не умел показать это достаточно ясно." : "";
  return `${openings[data.tone]} ${middle}. ${closings[Math.floor(Math.random() * closings.length)]}${extra}`.replace(/\.\./g, ".");
}

function getAiData() {
  return {
    name: cleanName($("#aiRecipientName").value) || "дорогой человек",
    relationship: $("#aiRelationship").value,
    sender: cleanName($("#aiSenderName").value) || fromName,
    senderRole: $("#aiSenderRole").value,
    tone: $("#aiTone").value,
    length: $("#aiLength").value,
    idea: $("#aiIdea").value.trim()
  };
}

function buildAiPrompt(data) {
  const system = `Ты — редактор искренних семейных писем на русском языке. Пиши уважительно, естественно и тепло, соблюдая исламский адаб и скромность. Строго запрещены темы 18+, эротика, намёки на интимность, грубость, алкоголь, наркотики, азартные игры, ложь, унижение, давление и отношения вне брака. Романтическое содержание допустимо только между супругами. Не приписывай человеку факты, которых нет в запросе. Не давай религиозных постановлений и не выдумывай цитаты. Если уместно дуа, сформулируй его просто, без ложной атрибуции. Верни только готовое письмо без заголовка, пояснений, кавычек и подписи. Объём: ${lengthLabels[data.length]}.`;
  const user = `Напиши ${toneLabels[data.tone]} письмо. Получатель: ${data.name}; отношение к автору: ${relationshipLabels[data.relationship]}; автор: ${data.sender}; роль автора: ${senderRoleLabels[data.senderRole]}. Что важно передать: ${data.idea || "благодарность, уважение, заботу и добрые пожелания"}. Текст должен звучать лично, но не чрезмерно пафосно.`;
  return { system, user };
}

function ensureAiWorker() {
  if (aiWorker) return aiWorker;
  aiWorker = new Worker("ai-worker.js", { type: "module" });
  aiWorker.addEventListener("message", event => {
    const data = event.data;
    if (data.type === "progress") {
      const progress = Math.max(2, Math.min(98, Math.round(data.progress || 0)));
      $("#statusBar").style.width = `${progress}%`;
      $("#statusPercent").textContent = `${progress}%`;
      $("#statusText").textContent = data.label || "Загружаю языковую модель…";
    } else if (data.type === "ready") {
      $("#statusBar").style.width = "99%";
      $("#statusPercent").textContent = "99%";
      $("#statusText").textContent = "Подбираю тёплые слова…";
    } else if (data.type === "result") {
      aiResolve?.(data.text);
      aiResolve = aiReject = null;
    } else if (data.type === "error") {
      aiReject?.(new Error(data.message || "Локальный ИИ недоступен"));
      aiResolve = aiReject = null;
    }
  });
  aiWorker.addEventListener("error", event => {
    aiReject?.(new Error(event.message || "Ошибка локального ИИ"));
    aiResolve = aiReject = null;
  });
  return aiWorker;
}

function askLocalAi(prompt) {
  return new Promise((resolve, reject) => {
    aiResolve = resolve;
    aiReject = reject;
    ensureAiWorker().postMessage({ type: "generate", ...prompt });
  });
}

async function generateLetter() {
  const data = getAiData();
  const safety = checkSafety(`${data.idea} ${data.name} ${data.sender}`, data.relationship);
  $("#safetyMessage").hidden = true;
  $("#generatedCard").hidden = true;
  if (safety.blocked) return showSafety(safety.reason);

  const button = $("#generateButton");
  button.disabled = true;
  button.querySelector(".generate-label").textContent = "ИИ создаёт письмо…";
  $("#generationStatus").hidden = false;
  $("#statusBar").style.width = "2%";
  $("#statusPercent").textContent = "2%";
  $("#statusText").textContent = "Проверяю запрос и готовлю модель…";

  let result;
  try {
    result = (await askLocalAi(buildAiPrompt(data))).trim();
  } catch {
    result = buildSafeFallback(data);
    showToast("Создан безопасный вариант: локальный ИИ недоступен на этом устройстве", 3800);
  }

  const outputSafety = checkSafety(result, data.relationship);
  if (outputSafety.blocked || result.length < 40 || result.length > 2200) {
    result = buildSafeFallback(data);
    showToast("Ответ ИИ заменён безопасным вариантом", 3000);
  }
  generatedMessage = result.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/^['\"«]|['\"»]$/g, "").trim();
  $("#generatedText").value = generatedMessage;
  $("#generationStatus").hidden = true;
  $("#generatedCard").hidden = false;
  button.disabled = false;
  button.querySelector(".generate-label").textContent = "Сгенерировать письмо";
  $("#generatedCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function useGeneratedLetter() {
  const edited = $("#generatedText").value.trim();
  const data = getAiData();
  const safety = checkSafety(edited, data.relationship);
  if (!edited || safety.blocked) return showSafety(safety.reason || "Письмо не должно быть пустым.");
  sharedMessage = edited.slice(0, 1800);
  letterDeck = [sharedMessage, ...baseMessages];
  currentIndex = 0;
  const femaleRelations = ["mother", "wife", "daughter", "grandmother", "sister"];
  recipientGender = femaleRelations.includes(data.relationship) ? "f" : "m";
  setNames(data.sender, data.name);
  localStorage.setItem("warmLetterGender", recipientGender);
  $$('[data-gender]').forEach(option => option.classList.toggle("is-active", option.dataset.gender === recipientGender));
  closePanel(aiLayer);
  if (!storyOpened) openStory();
  else renderLetter();
  updateUrl();
  showToast("Письмо добавлено. Его текст сохранён в ссылке ♡", 3100);
}

function base64ToBlob(base64, mime = "audio/mpeg") {
  const sliceSize = 512 * 1024;
  const arrays = [];
  for (let offset = 0; offset < base64.length; offset += sliceSize) {
    const binary = atob(base64.slice(offset, offset + sliceSize));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    arrays.push(bytes);
  }
  return new Blob(arrays, { type: mime });
}

async function builtinTrackBlob(index) {
  const response = await fetch(tracks[index].source);
  if (response.ok) return response.blob();
  const fallback = await fetch(tracks[index].fallback);
  if (!fallback.ok) throw new Error("Трек не найден");
  return base64ToBlob((await fallback.text()).trim());
}

async function setAudioSource(index) {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  const blob = index === 3 ? customAudioBlob : await builtinTrackBlob(index);
  if (!blob) throw new Error("Сначала выберите аудиофайл");
  currentObjectUrl = URL.createObjectURL(blob);
  audio.src = currentObjectUrl;
  audio.load();
}

async function playAudio(quiet = false) {
  try {
    if (!audio.src) await setAudioSource(selectedTrack);
    await audio.play();
    isPlaying = true;
    $("#soundButton").classList.add("is-playing");
    $("#soundButton").setAttribute("aria-pressed", "true");
    $("#volumePopover").classList.add("is-open");
  } catch { if (!quiet) showToast("Нажмите ещё раз, чтобы включить нашид"); }
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  $("#soundButton").classList.remove("is-playing");
  $("#soundButton").setAttribute("aria-pressed", "false");
}

async function selectTrack(index, resume = isPlaying) {
  selectedTrack = index;
  localStorage.setItem("warmLetterTrack", String(index));
  $$(".track-option").forEach(option => option.classList.toggle("is-active", Number(option.dataset.track) === index || (index === 3 && option.id === "customTrackButton")));
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  try {
    await setAudioSource(index);
    if (resume) await playAudio();
    showToast(`Выбрано: ${index === 3 ? $("#customTrackName").textContent : tracks[index].name}`);
  } catch (error) { showToast(error.message); }
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("warm-letter-audio", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("tracks");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveCustomAudio(file) {
  const db = await openAudioDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.objectStore("tracks").put({ blob: file, name: file.name }, "custom");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadCustomAudio() {
  try {
    const db = await openAudioDb();
    const saved = await new Promise((resolve, reject) => {
      const request = db.transaction("tracks").objectStore("tracks").get("custom");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (saved?.blob) {
      customAudioBlob = saved.blob;
      $("#customTrackName").textContent = saved.name;
    } else if (selectedTrack === 3) selectedTrack = 0;
  } catch { if (selectedTrack === 3) selectedTrack = 0; }
  $$(".track-option").forEach(option => option.classList.toggle("is-active", Number(option.dataset.track) === selectedTrack || (selectedTrack === 3 && option.id === "customTrackButton")));
}

async function shareLetter() {
  updateUrl();
  const data = { title: `Письмо: ${toName}`, text: `${toName}, это письмо для тебя — от ${fromName} ♡`, url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(location.href); showToast("Персональная ссылка скопирована"); }
  } catch (error) { if (error.name !== "AbortError") showToast("Скопируйте ссылку из адресной строки"); }
}

function bindEvents() {
  $("#openStoryButton").addEventListener("click", openStory);
  $("#nextLetter").addEventListener("click", () => moveLetter(1));
  $("#previousLetter").addEventListener("click", () => moveLetter(-1));
  $("#shareButton").addEventListener("click", shareLetter);
  [$("#aiOpenTop"), $("#aiOpenHome"), $("#aiOpenLetter")].forEach(button => button.addEventListener("click", () => openPanel(aiLayer)));
  $("#aiClose").addEventListener("click", () => closePanel(aiLayer));
  $("#aiBackdrop").addEventListener("click", () => closePanel(aiLayer));
  $("#settingsButton").addEventListener("click", () => openPanel(settingsLayer));
  $("#settingsClose").addEventListener("click", () => closePanel(settingsLayer));
  $("#settingsBackdrop").addEventListener("click", () => closePanel(settingsLayer));
  $("#aiForm").addEventListener("submit", event => { event.preventDefault(); generateLetter(); });
  $("#regenerateButton").addEventListener("click", generateLetter);
  $("#useGenerated").addEventListener("click", useGeneratedLetter);
  $("#copyGenerated").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#generatedText").value);
    showToast("Текст скопирован");
  });
  $("#saveSettings").addEventListener("click", () => {
    setNames($("#fromInput").value, $("#toInput").value);
    localStorage.setItem("warmLetterGender", recipientGender);
    closePanel(settingsLayer);
    if (storyOpened) renderLetter();
    showToast("Настройки сохранены в ссылке");
  });
  $$('[data-gender]').forEach(button => button.addEventListener("click", () => {
    recipientGender = button.dataset.gender;
    $$('[data-gender]').forEach(option => option.classList.toggle("is-active", option.dataset.gender === recipientGender));
  }));
  $$('[data-track]').forEach(button => button.addEventListener("click", () => selectTrack(Number(button.dataset.track))));
  $("#customTrackButton").addEventListener("click", () => $("#customTrackInput").click());
  $("#customTrackInput").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 35 * 1024 * 1024) return showToast("Выберите файл меньше 35 МБ");
    customAudioBlob = file;
    $("#customTrackName").textContent = file.name;
    try { await saveCustomAudio(file); } catch { showToast("Трек включится сейчас, но может не сохраниться"); }
    await selectTrack(3, isPlaying);
  });
  $("#soundButton").addEventListener("click", () => isPlaying ? pauseAudio() : playAudio());
  $("#volume").addEventListener("input", event => {
    audio.volume = Number(event.target.value);
    localStorage.setItem("warmLetterVolume", event.target.value);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (aiLayer.classList.contains("is-open")) closePanel(aiLayer);
    else if (settingsLayer.classList.contains("is-open")) closePanel(settingsLayer);
  });
}

audio.volume = Number(localStorage.getItem("warmLetterVolume") || .62);
$("#volume").value = String(audio.volume);
setNames(fromName, toName);
$$('[data-gender]').forEach(option => option.classList.toggle("is-active", option.dataset.gender === recipientGender));
createAtmosphere();
setupBackground();
loadCustomAudio();
bindEvents();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

