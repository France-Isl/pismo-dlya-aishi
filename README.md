# GlowLetter: Тёплые слова

Атмосферное PWA/Android/iOS‑приложение для персональных писем: 50 оригинальных текстов на RU/EN/FR, умный безопасный редактор, помощник ответов, живая погода, дождь, звуки природы, свой фон, свой нашид, открытки и персональные ссылки.

- Сайт: <https://france-isl.github.io/pismo-dlya-aishi/>
- Тестовые Android‑сборки: <https://github.com/France-Isl/pismo-dlya-aishi/releases/tag/v1.0.0-preview>
- Поддержка: <ggooglov9@gmail.com>

## Доступ и оплата

Первые 10 писем открыты бесплатно. Остальные 40 писем, генератор персональных писем и помощник ответов входят в единый полный доступ. Он использует одноразовый нерасходуемый Google Play product `full_access` с базовой ценой €7.99 — это не подписка и повторно платить не нужно. Цена и банковский счёт для выплат задаются только в Play Console/Google Payments, а не в исходниках.

Без облачного endpoint редактор использует встроенные проверенные сценарии, учитывающие отношение, стиль, тип сообщения и указанную пользователем главную мысль. После настройки Cloudflare Workers AI тот же интерфейс переключается на генеративную модель; сервер повторно применяет фильтр адаба и отклоняет небезопасный результат. При включении endpoint его точный origin нужно отдельно добавить в директиву `connect-src` CSP в `index.html`; широкие wildcard-домены намеренно запрещены.

Android release работает fail‑closed: полный доступ выдаётся только после Google Play Billing, серверной проверки покупки, acknowledgement и Play Integrity. Покупка восстанавливается через тот же Google‑аккаунт без повторной оплаты.

## Аккаунт и облачный прогресс

Вход реализован через Supabase Auth с браузерным PKCE flow. Веб‑версия возвращается на текущий `origin + pathname`; мобильные оболочки используют `com.franceisl.nurpismo://auth/callback`. Доступные OAuth‑кнопки определяются по `/auth/v1/settings`: Google показывается только при активном провайдере, а отключённый Facebook не имитируется кнопкой.

После входа таблица `public.glowletter_progress` синхронизирует имена, язык, текущее письмо, избранное, встроенный трек, громкость и атмосферные настройки. Личный фон, пользовательское аудио, координаты, сообщения помощника, сгенерированные тексты и beta capability остаются локальными. Явные имена из персональной ссылки не заменяют облачные имена; это происходит только после «Сохранить настройки». Локальный per-user envelope сохраняет офлайн-изменения до успешной отправки, а сравнение `revision` и трёхстороннее слияние защищают от молчаливой перезаписи при работе на нескольких устройствах.

Клиент `@supabase/supabase-js` закреплён на версии `2.110.9` и хранится локально в `vendor/`; publishable key допустим во фронтенде, тогда как secret/service-role ключи в клиент не добавляются.

## Структура

- `index.html`, `styles.css`, `app.js`, `letters.js` — PWA;
- `mobile/android` — Android WebView wrapper, Billing и Play Integrity;
- `mobile/ios` — XcodeGen/SwiftUI/WKWebView scaffold;
- `backend/cloudflare` — Workers AI (Qwen3 30B) и серверная проверка Google Play;
- `supabase/migrations` — схема прогресса и own-row RLS;
- `vendor` — закреплённый браузерный Supabase SDK и лицензия;
- `.github/workflows/mobile-build.yml` — ручная сборка preview APK и unsigned AAB.

Подробные шаги: [`mobile/README.md`](mobile/README.md) и [`backend/cloudflare/README.md`](backend/cloudflare/README.md).

## Важно перед продажей

Preview APK подписан debug‑ключом и предназначен только для проверки. В нём кнопка покупки выдаёт тестовый полный доступ без списания денег; в release AAB этот режим принудительно выключен. Для Google Play нужны собственный developer account, Play App Signing/upload key, активный `full_access`, production backend, Data Safety, возрастной рейтинг, права на аудио/изображения и прохождение review. Новые приложения публикуются через подписанный AAB.
