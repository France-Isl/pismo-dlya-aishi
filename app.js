const messages = [
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

const scenes = [
  { animal: "cat", recipient: "bear", name: "Лунное озеро", icon: "☾", title: "Розовый котёнок несёт письмо к тебе" },
  { animal: "bear", recipient: "bunny", name: "Тихий дождь", icon: "☂", title: "Медвежонок бережёт письмо от дождя" },
  { animal: "bunny", recipient: "cat", name: "Тропа среди гор", icon: "△", title: "Кролик прошёл горную тропу ради тебя" },
  { animal: "fox", recipient: "panda", name: "Звёздный лес", icon: "✦", title: "Лисёнок нашёл тебя среди звёзд" },
  { animal: "panda", recipient: "otter", name: "Розовый рассвет", icon: "☼", title: "Маленькая панда принесла тёплые слова" },
  { animal: "otter", recipient: "bear", name: "Река светлячков", icon: "⋆", title: "Выдра переплыла реку с письмом" }
];

const animalNames = {
  cat: "розовый котёнок",
  bear: "медвежонок",
  bunny: "кролик",
  fox: "лисёнок",
  panda: "маленькая панда",
  otter: "выдра"
};

const tracks = [
  { name: "Мураджан · slowed", source: "audio/track-1.mp3", fallback: "audio/track-1.b64" },
  { name: "Азан · nasheed", source: "audio/track-2.mp3", fallback: "audio/track-2.b64" },
  { name: "Лучшие нашиды", source: "audio/track-3.mp3", fallback: "audio/track-3.b64" }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const params = new URLSearchParams(location.search);
let fromName = cleanName(params.get("from")) || cleanName(localStorage.getItem("warmLetterFrom")) || "Ислам";
let toName = cleanName(params.get("to")) || cleanName(localStorage.getItem("warmLetterTo")) || "Айша";
let recipientGender = (params.get("gender") || localStorage.getItem("warmLetterGender")) === "m" ? "m" : "f";
let currentIndex = Math.min(Number(localStorage.getItem("warmLetterIndex") || 0), messages.length - 1);
let selectedTrack = Math.min(Number(localStorage.getItem("warmLetterTrack") || 0), 3);
let isPlaying = false;
let storyStarted = false;
let toastTimer;
let customAudioBlob = null;
let currentObjectUrl = null;

const audio = $("#nasheed");
const intro = $("#intro");
const story = $("#story");
const sceneCard = $("#sceneCard");
const courier = $("#courier");
const recipient = $("#recipient");
const acceptButton = $("#acceptButton");
const letterLayer = $("#letterLayer");
const sheetLayer = $("#sheetLayer");

function cleanName(value) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, 28);
}

function personalized(text) {
  let result = text.replaceAll("Айша", toName);
  if (recipientGender === "m") {
    result = result.replaceAll("ты прекрасна", "ты прекрасен").replaceAll("ты очень дорога мне", "ты очень дорог мне");
  }
  return result;
}

function setNames(from, to) {
  fromName = cleanName(from) || "Ислам";
  toName = cleanName(to) || "Айша";
  $("#headerTo").textContent = toName;
  $("#introTo").textContent = toName;
  $("#introFrom").textContent = fromName;
  $("#paperTo").textContent = toName;
  $("#paperFrom").textContent = fromName;
  $("#fromInput").value = fromName;
  $("#toInput").value = toName;
  document.title = `Письмо: ${toName} — от ${fromName}`;
  localStorage.setItem("warmLetterFrom", fromName);
  localStorage.setItem("warmLetterTo", toName);
  updateUrl();
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("from", fromName);
  url.searchParams.set("to", toName);
  url.searchParams.set("gender", recipientGender);
  history.replaceState({}, "", url);
}

function makeAtmosphere() {
  const stars = $("#stars");
  for (let i = 0; i < 44; i++) {
    const star = document.createElement("i");
    star.className = "star";
    star.style.left = `${3 + Math.random() * 94}%`;
    star.style.top = `${4 + Math.random() * 58}%`;
    star.style.setProperty("--twinkle", `${2.5 + Math.random() * 4}s`);
    star.style.setProperty("--delay", `${-Math.random() * 5}s`);
    stars.append(star);
  }
  const rain = $("#rain");
  for (let i = 0; i < 29; i++) {
    const drop = document.createElement("i");
    drop.className = "drop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.setProperty("--speed", `${1.35 + Math.random() * 1.4}s`);
    drop.style.setProperty("--delay", `${-Math.random() * 3}s`);
    rain.append(drop);
  }
  const fireflies = $("#fireflies");
  for (let i = 0; i < 16; i++) {
    const light = document.createElement("i");
    light.className = "firefly";
    light.style.setProperty("--left", `${5 + Math.random() * 90}%`);
    light.style.setProperty("--bottom", `${9 + Math.random() * 31}%`);
    light.style.setProperty("--delay", `${-Math.random() * 7}s`);
    fireflies.append(light);
  }
}

function updateScene() {
  const scene = scenes[currentIndex % scenes.length];
  courier.className = `animal courier animal-${scene.animal}`;
  courier.setAttribute("aria-label", `${animalNames[scene.animal]} несёт письмо`);
  recipient.className = `animal recipient animal-${scene.recipient}`;
  $("#sceneName").textContent = scene.name;
  $("#sceneIcon").textContent = scene.icon;
  $("#deliveryTitle").textContent = scene.title;
  $("#letterCount").textContent = `Письмо ${currentIndex + 1} из ${messages.length}`;
  $("#progressBar").style.width = `${((currentIndex + 1) / messages.length) * 100}%`;
  acceptButton.disabled = true;
  acceptButton.querySelector("span").textContent = "Письмо уже идёт к тебе";
  $("#deliveryKicker").textContent = "Письмо уже близко…";
  sceneCard.classList.remove("delivery-start", "delivery-ready", "hugging");
  void sceneCard.offsetWidth;
  sceneCard.classList.add("delivery-start");
  changeCaption();
  window.setTimeout(() => {
    sceneCard.classList.remove("delivery-start");
    sceneCard.classList.add("delivery-ready");
    acceptButton.disabled = false;
    acceptButton.querySelector("span").textContent = "Принять письмо";
    $("#deliveryKicker").textContent = "Оно пришло именно к тебе";
  }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 4600);
}

function changeCaption() {
  const captions = [
    `Пока ты читаешь это, ${fromName} думает о тебе`,
    `${toName}, это письмо пришло из места, где всегда тепло`,
    `Иногда письмо знает дорогу лучше слов`,
    `${toName}, сегодня даже звёзды светят чуть мягче`,
    `Тебя вспоминают в самых красивых моментах`,
    `Некоторые чувства говорят очень тихо — но остаются надолго`
  ];
  const el = $("#liveCaption");
  el.classList.add("is-changing");
  setTimeout(() => {
    el.textContent = captions[currentIndex % captions.length];
    el.classList.remove("is-changing");
  }, 330);
}

async function beginStory() {
  if (storyStarted) return;
  storyStarted = true;
  intro.classList.add("is-leaving");
  await playAudio(true);
  setTimeout(() => {
    intro.hidden = true;
    story.hidden = false;
    story.classList.add("is-entering");
    updateScene();
  }, 720);
}

function openLetter() {
  $("#paperNumber").textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${messages.length}`;
  const message = $("#letterMessage");
  message.textContent = personalized(messages[currentIndex]);
  message.classList.remove("revealing");
  void message.offsetWidth;
  message.classList.add("revealing");
  letterLayer.classList.add("is-open");
  letterLayer.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#nextButton").focus(), 700);
}

function closeLetter(next = false) {
  letterLayer.classList.remove("is-open");
  letterLayer.setAttribute("aria-hidden", "true");
  if (!next) return;
  const oldIndex = currentIndex;
  currentIndex = (currentIndex + 1) % messages.length;
  localStorage.setItem("warmLetterIndex", String(currentIndex));
  if ((oldIndex + 1) % 3 === 0) {
    sceneCard.classList.remove("delivery-ready");
    sceneCard.classList.add("hugging");
    showToast("Даже маленькие друзья иногда не могут сдержать объятий ♡", 2700);
    setTimeout(updateScene, 2900);
  } else {
    setTimeout(updateScene, 560);
  }
}

function showSheet() {
  sheetLayer.classList.add("is-open");
  sheetLayer.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#fromInput").focus(), 350);
}

function closeSheet() {
  sheetLayer.classList.remove("is-open");
  sheetLayer.setAttribute("aria-hidden", "true");
}

function showToast(text, duration = 2200) {
  clearTimeout(toastTimer);
  const toast = $("#toast");
  toast.textContent = text;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
}

function base64ToBlob(base64, mime = "audio/mpeg") {
  const sliceSize = 512 * 1024;
  const byteArrays = [];
  for (let offset = 0; offset < base64.length; offset += sliceSize) {
    const binary = atob(base64.slice(offset, offset + sliceSize));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    byteArrays.push(bytes);
  }
  return new Blob(byteArrays, { type: mime });
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

async function playAudio(quietFailure = false) {
  try {
    if (!audio.src) await setAudioSource(selectedTrack);
    await audio.play();
    isPlaying = true;
    $("#soundButton").classList.add("is-playing");
    $("#soundButton").setAttribute("aria-pressed", "true");
    $("#soundButton").setAttribute("aria-label", "Выключить музыку");
    $("#volumeWrap").classList.add("is-visible");
  } catch (error) {
    if (!quietFailure) showToast(selectedTrack === 3 ? "Выберите свой аудиофайл ещё раз" : "Не удалось включить нашид");
  }
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  $("#soundButton").classList.remove("is-playing");
  $("#soundButton").setAttribute("aria-pressed", "false");
  $("#soundButton").setAttribute("aria-label", "Включить музыку");
}

async function selectTrack(index, shouldPlay = isPlaying) {
  selectedTrack = index;
  localStorage.setItem("warmLetterTrack", String(index));
  $$(".track-option").forEach(option => option.classList.toggle("is-active", Number(option.dataset.track) === index || (index === 3 && option.id === "customTrackButton")));
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  try {
    await setAudioSource(index);
    if (shouldPlay) await playAudio();
    const name = index === 3 ? $("#customTrackName").textContent : tracks[index].name;
    showToast(`Выбрано: ${name}`);
  } catch (error) {
    showToast(error.message);
  }
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
      if (selectedTrack === 3) $$(".track-option").forEach(option => option.classList.toggle("is-active", option.id === "customTrackButton"));
    } else if (selectedTrack === 3) {
      selectedTrack = 0;
      localStorage.setItem("warmLetterTrack", "0");
    }
  } catch {
    if (selectedTrack === 3) selectedTrack = 0;
  }
}

async function shareLetter() {
  updateUrl();
  const data = {
    title: `Письмо: ${toName}`,
    text: `${toName}, это маленькое письмо для тебя — от ${fromName} ♡`,
    url: location.href
  };
  try {
    if (navigator.share && fromName.toLowerCase() === "ислам" && toName.toLowerCase() === "айша") {
      try {
        const response = await fetch("assets/share-card.png.b64");
        const card = new File([base64ToBlob((await response.text()).trim(), "image/png")], "письмо-для-айши.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [card] })) data.files = [card];
      } catch {}
    }
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      showToast("Персональная ссылка скопирована");
    }
  } catch (error) {
    if (error.name !== "AbortError") showToast("Скопируйте ссылку из адресной строки");
  }
}

$("#beginButton").addEventListener("click", beginStory);
acceptButton.addEventListener("click", openLetter);
$("#nextButton").addEventListener("click", () => closeLetter(true));
$("#letterBackdrop").addEventListener("click", () => closeLetter(false));
$("#personalizeButton").addEventListener("click", showSheet);
$("#sheetBackdrop").addEventListener("click", closeSheet);
$("#saveNamesButton").addEventListener("click", () => {
  setNames($("#fromInput").value, $("#toInput").value);
  localStorage.setItem("warmLetterGender", recipientGender);
  closeSheet();
  changeCaption();
  showToast("Имена сохранены в этой ссылке ♡");
});
$("#shareButton").addEventListener("click", shareLetter);
$("#soundButton").addEventListener("click", () => isPlaying ? pauseAudio() : playAudio());
$("#volume").addEventListener("input", event => {
  audio.volume = Number(event.target.value);
  localStorage.setItem("warmLetterVolume", event.target.value);
});
$$('[data-track]').forEach(button => button.addEventListener("click", () => selectTrack(Number(button.dataset.track))));
$$('[data-gender]').forEach(button => button.addEventListener("click", () => {
  recipientGender = button.dataset.gender;
  $$('[data-gender]').forEach(option => option.classList.toggle("is-active", option.dataset.gender === recipientGender));
}));
$("#customTrackButton").addEventListener("click", () => $("#customTrackInput").click());
$("#customTrackInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 35 * 1024 * 1024) return showToast("Выберите файл меньше 35 МБ");
  customAudioBlob = file;
  $("#customTrackName").textContent = file.name;
  try { await saveCustomAudio(file); } catch { showToast("Трек включится сейчас, но телефон может его не запомнить"); }
  await selectTrack(3, isPlaying);
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  if (letterLayer.classList.contains("is-open")) closeLetter(false);
  else if (sheetLayer.classList.contains("is-open")) closeSheet();
});

audio.volume = Number(localStorage.getItem("warmLetterVolume") || .62);
$("#volume").value = String(audio.volume);
setNames(fromName, toName);
$$('[data-gender]').forEach(option => option.classList.toggle("is-active", option.dataset.gender === recipientGender));
makeAtmosphere();
loadCustomAudio();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

