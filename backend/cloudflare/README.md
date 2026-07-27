# Backend НурПисьмо

Один Cloudflare Worker выполняет две задачи:

- `/api/generate` — Qwen3 30B через Workers AI, строгая проверка входа и результата;
- `/v1/google-play/verify` — Play Integrity, проверка одноразовой покупки `full_access` через Google Play Developer API и acknowledgement.

Секретов в APK, сайте и GitHub нет. Проверенный локальный компоновщик в `app.js` остаётся fail-safe вариантом, если Worker временно недоступен.

## 1. Развёртывание

```powershell
cd outputs/aisha-letter/backend/cloudflare
npm install
npx wrangler login
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
npm run deploy
```

В `GOOGLE_SERVICE_ACCOUNT_JSON` передаётся полный JSON service account одной строкой через закрытый prompt Wrangler. Никогда не добавляйте этот JSON, private key, IBAN/BIC или пароли в GitHub.

После deploy появится адрес вида `https://nurpismo-api.<account>.workers.dev`.

## 2. Подключение ИИ

В `config.js` укажите:

```js
aiEndpoint: "https://nurpismo-api.<account>.workers.dev/api/generate"
```

Workers AI имеет бесплатную дневную квоту; при её исчерпании приложение автоматически использует проверенный локальный компоновщик и не показывает случайный/непроверенный ответ.

## 3. Google Play purchase backend

1. Создайте Google Cloud project и включите **Google Play Android Developer API** и **Play Integrity API**.
2. Свяжите Cloud project с Play Console и выдайте service account минимально необходимые права для просмотра покупок, управления заказами/acknowledgement и Play Integrity.
3. В Play Console создайте одноразовый нерасходуемый товар `full_access`, задайте базовую цену **€4.99** и активируйте его.
4. Включите Play App Signing, Automatic Protection и Play Integrity.
5. Запустите GitHub workflow `Mobile preview build`, передав:
   - `verification_url`: `https://nurpismo-api.<account>.workers.dev/v1/google-play/verify`
   - `cloud_project_number`: числовой номер связанного Google Cloud project.

Backend проверяет hash конкретного purchase token, свежий Play Integrity verdict, установку из Google Play, лицензию аккаунта, целостность устройства и активное состояние покупки. После проверки он подтверждает покупку. Android немедленно вызывает `window.onNativeEntitlement(true, localizedPrice, reason)`, а при переустановке снова находит покупку через Google‑аккаунт и восстанавливает доступ без второй оплаты.

## 4. Выплаты и поддержка

Банковский счёт настраивается только в закрытом Google Payments profile внутри Play Console. Он не должен находиться в Worker, APK или репозитории. Публичный адрес поддержки приложения: `ggooglov9@gmail.com`.

## 5. Перед production

- загрузите подписанный AAB во внутренний тест и проверьте purchase, pending, cancel, refund и restore;
- оставьте `REQUIRE_PLAY_INTEGRITY = "true"`;
- ограничьте production origin в `ALLOWED_ORIGINS`;
- настройте Cloudflare WAF/rate limiting для `/api/generate` и `/v1/google-play/verify` (встроенный лимит Worker — дополнительный, но не глобальный);
- настройте RTDN/voided purchases для оперативной обработки возвратов;
- не публикуйте debug APK как платный релиз: Automatic Protection применяется к AAB, доставленному Google Play.
