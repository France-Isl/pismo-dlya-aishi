# Backend GlowLetter

Cloudflare Worker выполняет две независимые задачи:

- `POST /api/generate` — семейно-безопасная генерация письма (`mode: "letter"`) или ответа (`mode: "reply"`) через Workers AI; режим ответа принимает необязательную главную мысль `goal`, чтобы модель не придумывала решение пользователя;
- `POST /v1/google-play/verify` — серверная проверка одноразовой покупки `full_access`, Play Integrity, устойчивый D1-журнал и acknowledgement.

Платёжный endpoint работает **fail-closed**: при отсутствии D1, миграции, Play Integrity, service account или секрета хэширования он возвращает ошибку и не открывает полный доступ.

## Как сохраняется покупка

1. Android получает `purchaseToken` только из Google Play Billing для текущего Google-аккаунта.
2. Приложение связывает этот токен с одноразовым Play Integrity `requestHash` и отправляет его Worker по HTTPS.
3. Worker проверяет свежий Integrity verdict: официальный пакет из Google Play, лицензированный аккаунт и целостное устройство.
4. Worker всегда заново запрашивает состояние покупки в Google Play Developer API. D1 никогда не является единственным доказательством оплаты.
5. В D1 записывается только HMAC-SHA-256 токена с доменным разделением, версия ключа и безопасная техническая информация. Raw purchase token, Integrity token, service-account key и полный order ID в D1 не записываются.
6. Покупка со статусом `PURCHASED` и `NOT_CONSUMED` записывается идемпотентно, затем подтверждается сервером. Повторный запрос обновляет ту же строку; конкурентный acknowledgement перепроверяется у Google.
7. После переустановки Android снова получает эту покупку через тот же Google-аккаунт и повторяет серверную проверку — второй платёж не нужен.

`PENDING`, отменённые, возвращённые и consumed-покупки не открывают доступ. Журнал D1 нужен для устойчивости и аудита, но не превращается в «вечный флаг», который продолжит работать после отмены у Google.

## 1. Создание D1 и миграция

```powershell
cd outputs/aisha-letter/backend/cloudflare
npm install
npx wrangler login
npm run db:create
```

Wrangler напечатает `database_id`. В `wrangler.toml` раскомментируйте блок `[[d1_databases]]` и замените `REPLACE_WITH_D1_DATABASE_ID` на этот UUID. Затем примените схему:

```powershell
npm run db:migrate:local
npm run db:migrate:remote
```

Миграция `migrations/0001_entitlements.sql` создаёт таблицу с уникальным `token_hash`, явными состояниями покупки и версией схемы. Worker проверяет версию схемы перед каждым платёжным запросом.

## 2. Секреты Worker

```powershell
npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
npx wrangler secret put ENTITLEMENT_HASH_SECRET
```

- `GOOGLE_SERVICE_ACCOUNT_JSON` — полный JSON service account одной строкой через закрытый prompt Wrangler.
- `ENTITLEMENT_HASH_SECRET` — случайный секрет не короче 32 байт. Создайте его в менеджере паролей и сохраните резервную копию. Не используйте обычный пароль.
- `ENTITLEMENT_HASH_KEY_ID = "v1"` уже указан в `wrangler.toml`. При сознательной ротации секрета смените его на `v2`; старые строки останутся обезличенными, а новая проверка Google создаст новую запись.

Никогда не добавляйте эти секреты, private key, IBAN/BIC, пароли или raw purchase token в GitHub, APK, логи либо клиентский JavaScript.

## 3. Google Play Console и Google Cloud

1. Создайте/выберите Google Cloud project и включите **Google Play Android Developer API** и **Play Integrity API**.
2. Свяжите Cloud project с Play Console. Service account выдайте только права, необходимые для чтения покупок и acknowledgement.
3. В Play Console создайте активный одноразовый **нерасходуемый** товар с точным ID `full_access` и задайте цену €4.99.
4. Включите Play App Signing, Automatic Protection и Play Integrity.
5. Банковский счёт задаётся только в закрытом Google Payments profile в Play Console; в Worker и репозитории он не нужен.

Google рекомендует проверять покупку и подтверждать non-consumable на защищённом backend: <https://developer.android.com/google/play/billing/security>.

## 4. Проверка и deploy

```powershell
npm run check
npm run deploy
```

Проверьте:

```powershell
Invoke-RestMethod https://nurpismo-api.<account>.workers.dev/health
```

`billingConfigured: true` означает, что обязательные bindings/vars/secrets видны Worker. Реальный платёж всё равно нужно проверить во внутреннем тесте Play; отсутствие миграции даст `entitlement_store_not_ready`, а ошибка записи — `entitlement_store_unavailable`.

Для Android production build передайте:

- `verification_url`: `https://nurpismo-api.<account>.workers.dev/v1/google-play/verify`;
- `cloud_project_number`: числовой номер связанного Google Cloud project.

Для ИИ в `config.js` укажите:

```js
aiEndpoint: "https://nurpismo-api.<account>.workers.dev/api/generate"
```

## 5. Что обязательно протестировать

- новая покупка и мгновенное открытие полного доступа;
- повторный запуск и ручное восстановление на том же Google-аккаунте;
- переустановка на другом устройстве с тем же Google-аккаунтом;
- `PENDING`, отмена диалога оплаты и отсутствие сети;
- refund/revoke в Play Console и последующий запуск приложения;
- одновременные повторные запросы одного токена;
- недоступность D1/Google API: доступ должен оставаться закрытым;
- production AAB, доставленный из внутреннего трека Google Play, а не debug APK.

Для глобального ограничения частоты добавьте Cloudflare WAF/rate limiting на оба POST endpoint. Встроенный Map-ли́мит — только дополнительная защита внутри одного Worker isolate.

## 6. Честные ограничения

- До коммерческого включения Workers AI endpoint нужно связать с короткоживущим подписанным entitlement‑grant. Проверка `Origin` и ограничение по IP не доказывают покупку и сами по себе не защищают платную генерацию от прямых запросов. Пока такая связка не настроена, оставьте `config.js.aiEndpoint` пустым — приложение использует локальные проверенные сценарии без расходов на облачную модель.
- RTDN endpoint намеренно не добавлен: принимать неподписанный Pub/Sub push небезопасно. Сейчас отмена/возврат обнаруживается при следующей свежей проверке Google (Android делает её при запуске/возврате в приложение). Для мгновенной серверной блокировки нужен отдельно настроенный Google Pub/Sub RTDN с проверкой OIDC/JWT и обработкой duplicate `messageId`.
- Worker не хранит raw token, поэтому не может сам опрашивать Google по старым покупкам без нового запроса приложения. Это уменьшает последствия утечки D1.
- В приложении пока нет собственного аккаунта. «Купил один раз» восстанавливается через Google Play-аккаунт. Для привязки к отдельному профилю приложения понадобятся безопасная авторизация и `obfuscatedAccountId`; Play Integrity не раскрывает стабильный ID Google-аккаунта.
- Нельзя гарантировать абсолютную невзламываемость APK. Production-защита строится на Play Billing, свежей server-side verification, Play Integrity, Play App Signing и выдаче через Google Play.

Публичный адрес поддержки приложения: `ggooglov9@gmail.com`.
