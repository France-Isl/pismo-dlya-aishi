import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const origin = "https://france-isl.github.io";

function makeRequest(body, ip) {
  return new Request("https://api.example/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": ip },
    body: JSON.stringify(body)
  });
}

function envWithResponse(response, capture = []) {
  return {
    ALLOWED_ORIGINS: origin,
    AI: { run: async (_model, options) => { capture.push(options); return { response }; } }
  };
}

test("letter generation honors relationship and selected support style", async () => {
  const capture = [];
  const output = "Мама, я хочу напомнить, что тебе не нужно справляться со всеми заботами одной. Твоя доброта и терпение много значат для меня каждый день. Если станет трудно, я готов спокойно выслушать, помочь делом и дать тебе время для отдыха. Пусть рядом будут надёжные люди, добрые новости и больше тихих дней. Береги силы и помни, что твои чувства важны, а твоя забота всегда замечена и ценится.";
  const response = await worker.fetch(makeRequest({ mode: "letter", from: "Ислам", to: "Мама", language: "ru", relationship: "mother", tone: "support" }, "203.0.113.31"), envWithResponse(output, capture));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, output);
  assert.match(capture[0].messages[0].content, /Requested style: support/);
  assert.match(capture[0].messages[1].content, /Relationship: mother/);
});

test("romantic style is rejected unless the relationship is spouse", async () => {
  const capture = [];
  const response = await worker.fetch(makeRequest({ mode: "letter", from: "Ислам", to: "Мама", language: "ru", relationship: "mother", tone: "romantic" }, "203.0.113.32"), envWithResponse("unused", capture));
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "romantic_style_requires_spouse" });
  assert.equal(capture.length, 0);
});

test("reply generation treats the pasted message as context and returns only a safe answer", async () => {
  const capture = [];
  const output = "Я внимательно прочитал твоё сообщение и хочу понять тебя правильно. Давай спокойно обсудим всё вечером, без поспешных выводов. Для меня важно услышать твою точку зрения, сохранить уважение и вместе найти разумное решение, с которым нам обоим будет спокойнее.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Нам нужно спокойно поговорить о вчерашнем разговоре.", goal: "Я хочу обсудить это вечером", language: "ru", relationship: "spouse", tone: "calm" }, "203.0.113.33"), envWithResponse(output, capture));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, output);
  assert.match(capture[0].messages[0].content, /untrusted context/);
  assert.match(capture[0].messages[1].content, /Received message begins/);
  assert.match(capture[0].messages[1].content, /Я хочу обсудить это вечером/);
});

test("reply generation blocks prohibited incoming content before calling AI", async () => {
  const capture = [];
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "эротика", language: "ru" }, "203.0.113.34"), envWithResponse("unused", capture));
  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: "invalid_message" });
  assert.equal(capture.length, 0);
});

test("safe words are not blocked merely because letters meet across word boundaries", async () => {
  const output = "Thank you for the update. I appreciate the clear message and will consider the details carefully. I want to respond respectfully, without rushing, and continue the conversation once everything is clear and properly understood.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Thanks, excellent news.", language: "en", relationship: "friend", tone: "warm" }, "203.0.113.35"), envWithResponse(output));
  assert.equal(response.status, 200);
});

test("mixed-alphabet prohibited words are blocked", async () => {
  const capture = [];
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "sеx", language: "en" }, "203.0.113.36"), envWithResponse("unused", capture));
  assert.equal(response.status, 422);
  assert.equal(capture.length, 0);
});

test("separated and localized prohibited forms are blocked", async () => {
  const samples = ["s.e.x", "se.x", "s3x", "p0rn", "se\u200Bx", "с е к с", "p-o-r-n", "18+", "sexuelle", "embrasse"];
  for (let index = 0; index < samples.length; index += 1) {
    const capture = [];
    const response = await worker.fetch(makeRequest({ mode: "reply", incoming: samples[index], language: "fr" }, `203.0.113.${40 + index}`), envWithResponse("unused", capture));
    assert.equal(response.status, 422, samples[index]);
    assert.equal(capture.length, 0, samples[index]);
  }
});

test("romantic declarations are rejected for a friend", async () => {
  const output = "I am deeply in love with you, and you are the love of my life. This feeling matters more than every boundary, so I want to keep it secret between us forever.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Thank you for listening to me today.", language: "en", relationship: "friend", tone: "auto" }, "203.0.113.37"), envWithResponse(output));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "generation_rejected" });
});

test("pet names and soulmate declarations are rejected for a non-spouse", async () => {
  const samples = [
    "My darling, you are my soulmate, and I want you to know that my heart belongs to you forever. I will keep repeating this private declaration because nothing else matters to me, now or in the future.",
    "Ma chérie, tu es mon âme sœur et mon cœur t’appartient pour toujours. Je veux garder cette déclaration entre nous, la répéter chaque jour et placer ce sentiment au-dessus de toute autre considération."
  ];
  for (let index = 0; index < samples.length; index += 1) {
    const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Thank you for the thoughtful message today.", language: index ? "fr" : "en", relationship: "friend", tone: "auto" }, `203.0.113.${70 + index}`), envWithResponse(samples[index]));
    assert.equal(response.status, 503, samples[index]);
    assert.deepEqual(await response.json(), { error: "generation_rejected" });
  }
});

test("a romantic goal is rejected for a friend before AI is called", async () => {
  const capture = [];
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "What would you like to say?", goal: "I am deeply in love with you", language: "en", relationship: "friend", tone: "warm" }, "203.0.113.38"), envWithResponse("unused", capture));
  assert.equal(response.status, 422);
  assert.equal(capture.length, 0);
});

test("pet-name goals are rejected for a non-spouse before AI is called", async () => {
  const goals = ["My darling, I want to answer kindly", "You are my soulmate", "Ma chérie, je veux te répondre"];
  for (let index = 0; index < goals.length; index += 1) {
    const capture = [];
    const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "What would you like to say?", goal: goals[index], language: index === 2 ? "fr" : "en", relationship: "friend", tone: "auto" }, `203.0.113.${80 + index}`), envWithResponse("unused", capture));
    assert.equal(response.status, 422, goals[index]);
    assert.equal(capture.length, 0, goals[index]);
  }
});

test("reply validation rejects a generic answer that drops an exact time", async () => {
  const output = "Спасибо за сообщение. Мне важно ответить внимательно и спокойно. Я ценю наше общение и предлагаю продолжить разговор без спешки, чтобы сохранить ясность для нас обоих.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Во сколько ты придёшь домой?", goal: "Я приду домой в 19:00", language: "ru", relationship: "spouse", tone: "warm" }, "203.0.113.90"), envWithResponse(output));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "generation_rejected" });
});

test("reply validation accepts the intended time when the answer preserves it", async () => {
  const output = "Спасибо за сообщение. Я приду домой в 19:00 и заранее напишу, если дорога займёт больше времени. Мне важно ответить ясно, сохранить спокойствие и не оставлять тебя без точной информации.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Во сколько ты придёшь домой?", goal: "Я приду домой в 19:00", language: "ru", relationship: "spouse", tone: "warm" }, "203.0.113.91"), envWithResponse(output));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, output);
});

test("reply validation rejects a goal whose key topic was ignored", async () => {
  const output = "Спасибо за сообщение. Давай спокойно обсудим всё вечером и внимательно выслушаем друг друга. Мне важно сохранить уважение, не спешить с выводами и найти ясное решение вместе.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Когда мы поговорим?", goal: "Я хочу обсудить проект вечером", language: "ru", relationship: "colleague", tone: "calm" }, "203.0.113.92"), envWithResponse(output));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "generation_rejected" });
});

test("reply validation rejects an answer that ignores the requested boundary tone", async () => {
  const output = "Спасибо за сообщение. Я внимательно прочитал его и хочу продолжить разговор доброжелательно. Для меня важны ясность и открытость, поэтому можно спокойно обменяться мыслями и лучше понять ситуацию вместе.";
  const response = await worker.fetch(makeRequest({ mode: "reply", incoming: "Можем ли мы продолжить этот разговор?", language: "ru", relationship: "friend", tone: "boundary" }, "203.0.113.93"), envWithResponse(output));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "generation_rejected" });
});
