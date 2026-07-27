# НурПисьмо: Тёплые слова

Атмосферное PWA/Android/iOS‑приложение для персональных писем: 50 оригинальных текстов на RU/EN/FR, умный безопасный редактор, живая погода, дождь, звуки природы, свой фон, свой нашид, открытки и персональные ссылки.

- Сайт: <https://france-isl.github.io/pismo-dlya-aishi/>
- Тестовые Android‑сборки: <https://github.com/France-Isl/pismo-dlya-aishi/releases/tag/v1.0.0-preview>
- Поддержка: <ggooglov9@gmail.com>

## Доступ и оплата

Первые 10 писем открыты бесплатно. Полная коллекция использует одноразовый нерасходуемый Google Play product `full_access` с базовой ценой €4.99. Цена и банковский счёт для выплат задаются только в Play Console/Google Payments, а не в исходниках.

Android release работает fail‑closed: полный доступ выдаётся только после Google Play Billing, серверной проверки покупки, acknowledgement и Play Integrity. Покупка восстанавливается через тот же Google‑аккаунт без повторной оплаты.

## Структура

- `index.html`, `styles.css`, `app.js`, `letters.js` — PWA;
- `mobile/android` — Android WebView wrapper, Billing и Play Integrity;
- `mobile/ios` — XcodeGen/SwiftUI/WKWebView scaffold;
- `backend/cloudflare` — Workers AI (Qwen3 30B) и серверная проверка Google Play;
- `.github/workflows/mobile-build.yml` — ручная сборка preview APK и unsigned AAB.

Подробные шаги: [`mobile/README.md`](mobile/README.md) и [`backend/cloudflare/README.md`](backend/cloudflare/README.md).

## Важно перед продажей

Preview APK подписан debug‑ключом и предназначен только для проверки. Для Google Play нужны собственный developer account, Play App Signing/upload key, активный `full_access`, production backend, Data Safety, возрастной рейтинг, права на аудио/изображения и прохождение review. Новые приложения публикуются через подписанный AAB.
