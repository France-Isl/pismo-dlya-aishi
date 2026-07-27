# НурПисьмо: мобильная упаковка

Этот каталог превращает статическое приложение в Android WebView-приложение и содержит заготовку iOS на SwiftUI/WKWebView. Android package/application ID: `com.franceisl.nurpismo`. Веб-файлы при сборке берутся из актуального корня `aisha-letter`, поэтому их не нужно копировать вручную.

## Что уже реализовано

- полноэкранный Android WebView на `WebViewAssetLoader` с HTTPS-origin `appassets.androidplatform.net`;
- локальные HTML/CSS/JS, фоновые изображения и аудио внутри приложения; `.b64`-резервы декодируются при сборке;
- каталог `backend` никогда не попадает в APK/iOS bundle, а декодированные `.b64`-резервы удаляются из пакета, чтобы не дублировать тяжёлые медиа;
- выбор пользовательского аудиофайла через системный file picker без разрешения на всё хранилище;
- приблизительная/точная геолокация с системным runtime-запросом для погоды и только для локального origin;
- интернет для Open-Meteo, шрифтов и ИИ-модели; незашифрованный HTTP запрещён;
- Google Play Billing Library `9.1.0`, одноразовый нерасходуемый товар `full_access`;
- 10 бесплатных писем как значение `freeLetterLimit` в нативном entitlement. Сам счётчик и экран оплаты должны применяться веб-слоем;
- release работает fail-closed: локальная запись или один ответ BillingClient не считаются достаточной проверкой покупки;
- debug-mock доступен только по явному флагу и никогда не компилируется в release;
- R8/minify для release и необязательные параметры upload key вне репозитория;
- XcodeGen-проект iOS без подписи. StoreKit 2 пока намеренно возвращает `storekit2_not_configured` и не разблокирует доступ;
- Pillow-генератор иконок Android/iOS, Play icon 512×512 и feature graphic 1024×500 из `assets/campfire-lake.png` (с fallback на `.png.b64`).

## Контракт веб-приложения с Android

В доверенной локальной странице доступен объект:

```js
const state = JSON.parse(window.NurBilling.getEntitlement());
// { entitled, priceLabel, reason, productId, freeLetterLimit, mock }

window.NurBilling.purchaseFullAccess();
window.NurBilling.restorePurchases();

window.onNativeEntitlement = (entitled, priceLabel, reason) => {
  // Обновить paywall и доступ. Release нельзя разблокировать по localStorage.
};
```

Приложение также отправляет событие `nur-entitlement` с теми же данными в `event.detail`. Нативный мост не отдаёт JavaScript-слою purchase token.

Важно: ограничение «первые 10 писем бесплатно» должно считать реально открытые/созданные письма в `app.js` и после десятого показывать кнопку покупки. Нативная часть сообщает лимит и проверенное право, но не знает бизнес-событий веб-интерфейса.

## Локальная сборка Android

Требуются JDK 17, Android SDK Platform 36.1, Build Tools 36.1.0 и Gradle 9.4.1.

```powershell
python ..\scripts\generate_store_assets.py
gradle :app:assembleDebug
```

Команды выполняются из `mobile/android`. APK появится в `app/build/outputs/apk/debug/app-debug.apk`.

Для интерфейсного теста оплаты без денег можно собрать отдельный debug APK:

```powershell
gradle :app:assembleDebug -PenableBillingMock=true
```

После нажатия покупки такой APK вернёт `debug_mock_only_no_payment`. Это заметно в `reason` и `mock: true`. Этот режим нельзя использовать для скриншотов, приёмочных тестов платежей или публикации.

## Настройка Google Play и цены €4.99

1. Создайте приложение с package ID `com.franceisl.nurpismo`.
2. В Play Console создайте одноразовый нерасходуемый товар с точным ID `full_access`.
3. Установите базовую цену €4.99 и проверьте автоматически рассчитанные локальные цены. Цена задаётся и меняется в Play Console, а не в APK.
4. Активируйте товар, загрузите **подписанный** AAB во внутренний тест и добавьте license testers.
5. Проверьте успешную, отменённую и pending-покупку, восстановление на другом устройстве, возврат и отсутствие сети.

`€4.99` в коде — только запасная подпись до ответа каталога Play. В рабочем магазине UI получает локализованную цену из `ProductDetails`.

## Обязательный backend проверки покупок

Release не выдаёт `full_access`, пока HTTPS-backend не подтвердит покупку и её acknowledgement. URL передаётся во время сборки, например:

```powershell
$env:NURPISMO_VERIFICATION_URL = "https://api.example.com/v1/google-play/verify"
$env:NURPISMO_CLOUD_PROJECT_NUMBER = "123456789012"
gradle :app:bundleRelease
```

Перед этим свяжите указанный Google Cloud project с приложением в Play Console и включите Play Integrity API. При старте приложение прогревает Standard Integrity provider; при проверке покупки получает отдельный encrypted token.

Пример запроса приложения:

```json
{
  "packageName": "com.franceisl.nurpismo",
  "productId": "full_access",
  "purchaseToken": "token-from-google-play",
  "purchaseState": 1,
  "acknowledgedOnDevice": false,
  "appVersion": "1.0.0-preview",
  "requestHashVersion": "v1",
  "requestHash": "base64url-sha256-without-padding",
  "integrityToken": "encrypted-standard-integrity-token"
}
```

Для `v1` клиент вычисляет `requestHash` как Base64URL без padding от SHA-256 UTF-8 строки:

```text
com.franceisl.nurpismo\nfull_access\nPURCHASE_TOKEN
```

Backend обязан независимо вычислить тот же hash — не доверять присланному значению.

Минимальный успешный ответ:

```json
{
  "valid": true,
  "acknowledged": true,
  "integrityVerified": true,
  "productId": "full_access",
  "requestHash": "тот-же-base64url-hash",
  "reason": "server_verified"
}
```

Backend обязан:

1. независимо пересчитать `requestHash` из package/product/purchase token;
2. передать `integrityToken` в `playintegrity.googleapis.com/v1/com.franceisl.nurpismo:decodeIntegrityToken`;
3. проверить package name, timestamp/freshness и совпадение decoded `requestHash`; требовать как минимум `PLAY_RECOGNIZED`, `LICENSED` и выбранный вами device verdict (обычно `MEETS_DEVICE_INTEGRITY`);
4. проверить purchase token через Google Play Developer API `purchases.products.get` для правильных package/product;
5. проверить состояние `PURCHASED`, уникальность purchase token и ожидаемый аккаунт;
6. обработать pending, возвраты/voided purchases и RTDN;
7. выполнить `purchases.products.acknowledge` и только затем вернуть одновременно `valid`, `acknowledged` и `integrityVerified`;
8. хранить service-account credentials только на сервере.

Если отсутствует URL backend, Cloud project number, Integrity token, совпадающий hash или любой из трёх положительных флагов ответа, release немедленно остаётся закрытым. После валидного ответа callback сразу передаёт `entitled: true` веб-интерфейсу.

Play Integrity и R8 повышают стоимость атаки, но не делают APK «невзламываемым». Клиентскую проверку можно патчить; весь premium-контент, заранее вложенный в APK, можно извлечь. Для реальной защиты от перераспространения отдавайте дополнительные письма/модели с backend только после проверенного entitlement, используйте короткоживущие авторизованные ответы и привязку к аккаунту.

Официальные основы: [интеграция Play Billing](https://developer.android.com/google/play/billing/integrate), [защита от мошенничества](https://developer.android.com/google/play/billing/security), [backend и RTDN](https://developer.android.com/google/play/billing/backend).

## Подпись и Play App Signing

GitHub workflow специально выпускает debug APK и **неподписанный release AAB**. Секретов подписи в репозитории нет. Для локального/защищённого CI добавьте вне Git следующие Gradle properties или одноимённые environment variables:

```properties
NURPISMO_KEYSTORE_PATH=/absolute/path/to/upload-key.jks
NURPISMO_KEYSTORE_PASSWORD=change-me
NURPISMO_KEY_ALIAS=upload
NURPISMO_KEY_PASSWORD=change-me
```

Для магазина включите Play App Signing, храните app-signing key у Google, а отдельный upload key — в password manager/защищённых CI secrets. Не используйте debug keystore для магазина. Потеря upload key требует процедуры сброса; утечка паролей из Git необратимо компрометирует цепочку поставки.

Сборка без всех четырёх параметров остаётся unsigned. Это сделано намеренно, чтобы случайный workflow не подписал релиз неподходящим ключом.

## GitHub Actions

`.github/workflows/mobile-build.yml` запускается только вручную (`workflow_dispatch`). Он:

1. генерирует иконки/feature graphic через Pillow;
2. собирает `app-debug.apk` и unsigned `app-release.aab`;
3. загружает build artifact;
4. создаёт или обновляет prerelease `v1.0.0-preview` и прикладывает четыре файла.

Workflow использует только ограниченный `GITHUB_TOKEN` с `contents: write`; дополнительных секретов нет. При ручном запуске можно передать необязательные `verification_url` и `cloud_project_number` (оба значения не являются ключами). Если оставить их пустыми, preview AAB будет fail-closed. Debug APK можно установить для проверки. Unsigned AAB нельзя отправить в production Play до настройки подписи и backend.

## iOS / App Store

На Mac установите Xcode и XcodeGen:

```bash
cd mobile/ios
python3 ../scripts/generate_store_assets.py
python3 ../scripts/sync_web_assets.py
xcodegen generate
open NurPismo.xcodeproj
```

Проект собирается для симулятора без подписи (`CODE_SIGNING_ALLOWED=NO`). Для устройства/App Store нужно включить signing, выбрать собственную Team и provisioning profile, зарегистрировать Bundle ID и пройти App Store Connect.

StoreKit 2 ещё не реализован: iOS-мост имеет те же JS-имена, но всегда fail-closed. Перед продажей нужно создать non-consumable `full_access`, загрузить продукты через `Product.products(for:)`, проверять `VerificationResult` и `Transaction.currentEntitlements`, завершать verified-транзакции и слушать обновления. Цена задаётся в App Store Connect. Официальная отправная точка: [StoreKit 2](https://developer.apple.com/storekit/).

WKWebView загружает локальный `file:` bundle, поэтому Service Worker/PWA cache внутри iOS wrapper не является источником истины. Сетевые функции и file input нужно отдельно проверить на реальном iPhone.

## Что ещё требуется перед продажей

- собственная privacy policy и страница поддержки;
- Play Data safety / App Privacy: раскрыть приблизительную/точную геолокацию, сетевую погоду и любой внешний ИИ;
- понятное объяснение перед системным запросом геолокации и возможность работать без неё;
- права на все нашиды, изображения, шрифты и тексты для коммерческого распространения;
- moderation и возрастной рейтинг; локальный фильтр не гарантирует юридическое или религиозное соответствие каждого ИИ-ответа;
- тесты на малом экране, планшете, повороте, медленном устройстве, без сети и при нехватке памяти;
- store listing, скриншоты, локализация, content rating, ads declaration и декларация AI-функций;
- production backend, Play Integrity, возвраты, поддержка покупателя и восстановление доступа;
- внутренний/закрытый тест и прохождение review. Новый аккаунт разработчика может иметь дополнительные требования к тестированию.

Нельзя честно обещать публикацию «сегодня одним APK»: Play принимает для новых приложений AAB, требует аккаунт разработчика, подпись, карточку приложения, декларации и review. Наличие исходников и CI сокращает техническую часть, но не отменяет требования магазина.
