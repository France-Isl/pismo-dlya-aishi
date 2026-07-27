# GlowLetter: Тёплые слова

Атмосферное PWA/Android/iOS‑приложение для персональных писем: 50 оригинальных текстов на RU/EN/FR, умный безопасный редактор, помощник ответов, живая погода, дождь, звуки природы, свой фон, свой нашид, открытки и персональные ссылки.

- Сайт: <https://france-isl.github.io/pismo-dlya-aishi/>
- Тестовые Android‑сборки: <https://github.com/France-Isl/pismo-dlya-aishi/releases/tag/v1.0.0-preview>
- Поддержка: <ggooglov9@gmail.com>

## Доступ и оплата

Первые 10 писем открыты бесплатно. Остальные 40 писем, генератор персональных писем и помощник ответов входят в единый полный доступ. Он использует одноразовый нерасходуемый Google Play product `full_access` с базовой ценой €4.99 — это не подписка и повторно платить не нужно. Цена и банковский счёт для выплат задаются только в Play Console/Google Payments, а не в исходниках.

Без облачного endpoint редактор использует встроенные проверенные сценарии, учитывающие отношение, стиль, тип сообщения и указанную пользователем главную мысль. После настройки Cloudflare Workers AI тот же интерфейс переключается на генеративную модель; сервер повторно применяет фильтр адаба и отклоняет небезопасный результат.

Android release работает fail‑closed: полный доступ выдаётся только после Google Play Billing, серверной проверки покупки, acknowledgement и Play Integrity. Покупка восстанавливается через тот же Google‑аккаунт без повторной оплаты.

## Структура

- `index.html`, `styles.css`, `app.js`, `letters.js` — PWA;
- `mobile/android` — Android WebView wrapper, Billing и Play Integrity;
- `mobile/ios` — XcodeGen/SwiftUI/WKWebView scaffold;
- `backend/cloudflare` — Workers AI (Qwen3 30B) и серверная проверка Google Play;
- `.github/workflows/mobile-build.yml` — ручная сборка preview APK и unsigned AAB.

Подробные шаги: [`mobile/README.md`](mobile/README.md) и [`backend/cloudflare/README.md`](backend/cloudflare/README.md).

## Важно перед продажей

Preview APK подписан debug‑ключом и предназначен только для проверки. В нём кнопка покупки выдаёт тестовый полный доступ без списания денег; в release AAB этот режим принудительно выключен. Для Google Play нужны собственный developer account, Play App Signing/upload key, активный `full_access`, production backend, Data Safety, возрастной рейтинг, права на аудио/изображения и прохождение review. Новые приложения публикуются через подписанный AAB.
