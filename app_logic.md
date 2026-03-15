# APP_LOGIC.md

## Назначение проекта
Predictor Signal System — это веб-приложение с разделением на client/server, которое:
- авторизует пользователя по ID + access code
- определяет роль пользователя (`lead` или `vip`)
- генерирует игровые сигналы в реальном времени
- показывает визуализацию сигнала в UI
- хранит сигналы и пользователей в MongoDB
- поддерживает ручную отправку сигналов админом через Socket.IO :contentReference[oaicite:22]{index=22}

---

## Основной user flow

### 1. Открытие приложения
Пользователь открывает `client/index.html` и видит экран логина `Access Login` с полями для ID и VIP code. :contentReference[oaicite:23]{index=23}

### 2. Подключение к серверу
Фронтенд подключается к Socket.IO серверу по адресу `http://localhost:3000`. :contentReference[oaicite:24]{index=24}

### 3. Логин пользователя
На сервер уходит событие `login_user` с:
- `user_id`
- `code` :contentReference[oaicite:25]{index=25}

Сервер:
- проверяет формат `user_id` — должен начинаться с `159` и содержать 10 цифр
- нормализует code
- ищет `AccessKey`
- проверяет:
  - существует ли код
  - активен ли он
  - не истек ли
  - можно ли использовать его повторно
- создает или обновляет пользователя в MongoDB :contentReference[oaicite:26]{index=26}

### 4. Назначение роли и попыток
После успешного логина пользователю назначается:
- `role`: `lead` или `vip`
- `attempts_left`

Для `vip` количество попыток берется из ключа доступа.
Для `lead` попытки тоже ограничены, но логика их обновления мягче. :contentReference[oaicite:27]{index=27}

### 5. Успешный вход
Сервер отправляет `login_success` с:
- `user_id`
- `attempts_left`
- `role` :contentReference[oaicite:28]{index=28}

После этого пользователь попадает в основной экран Predictor Signals. Это видно по структуре интерфейса в `index.html`. :contentReference[oaicite:29]{index=29}

---

## Логика генерации сигнала

### 1. Выбор игры
Во фронтенде пользователь выбирает игру:
- Aviator
- Mines
- Lucky Jet
- Chicken
- Penalty :contentReference[oaicite:30]{index=30}

### 2. Передача параметров
При нажатии `GET SIGNAL` на сервер уходит `request_signal` с:
- `game`
- `options` :contentReference[oaicite:31]{index=31}

### 3. Проверка ограничений
Сервер перед генерацией проверяет:
- пользователь залогинен или нет
- существует ли пользователь
- есть ли attempts left
- не пытается ли `lead` открыть VIP-only режимы

Ограничения:
- `mines` + `highrisk` доступен только `vip`
- `chicken` + `hard`/`hardcore` доступен только `vip` :contentReference[oaicite:32]{index=32}

### 4. Генерация
Сервер вызывает `generateSignal(game, options)`, а тот уже маршрутизирует в конкретный генератор игры. :contentReference[oaicite:33]{index=33}

### 5. Сохранение сигнала
После генерации сигнал сохраняется в коллекцию `Signal` со значениями:
- `game`
- `data`
- `type: "auto"`
- `telegram_id`
- `sent_at` :contentReference[oaicite:34]{index=34}

### 6. Списание попытки
Если роль пользователя не `vip`, сервер уменьшает `attempts_left` на 1 и отправляет `attempts_update`. Во фронтенде при 0 попыток кнопка отключается и меняет текст на `NO ATTEMPTS LEFT`. :contentReference[oaicite:35]{index=35}

### 7. Отправка сигнала клиенту
Сервер эмитит событие `signal`, и фронтенд обновляет текущий экран игры и историю. :contentReference[oaicite:36]{index=36}

---

## Логика по играм

### Aviator
Aviator использует bucket-based генерацию:
- `low`
- `mid`
- `high`
- `epic`

Каждый bucket имеет свой диапазон множителя и свой вес вероятности.
После выбора bucket генерируется случайный multiplier в нужном диапазоне.
Также используется `signalMemory`, чтобы не допускать слишком частых повторов `low` и `epic`. :contentReference[oaicite:37]{index=37}

Во фронтенде для Aviator есть разный рендер для:
- `lead`
- `vip` :contentReference[oaicite:38]{index=38}

### Mines
Mines принимает настройки:
- `grid` (`3x3` или `5x5`)
- `mode` (`safe` или `highrisk`)
- `mines`

Дальше:
- считается количество клеток
- считается число safe cells
- в `safe` режиме показывается ограниченное число safe cells
- в `highrisk` режиме может раскрываться максимум безопасных ячеек
- повторяемость профиля контролируется через `signalMemory` :contentReference[oaicite:39]{index=39}

### Chicken
Chicken работает через уровни сложности:
- `easy`
- `medium`
- `hard`
- `hardcore`

Для каждой сложности есть свой набор множителей.
Генератор выбирает длину пути по weighted profile, затем строит сигнал с учетом сложности и memory-антиповторов. :contentReference[oaicite:40]{index=40}

### Lucky Jet
Lucky Jet выделен в отдельный генератор и отдельную визуализацию на клиенте. Точный код генератора отдельно не открылся, но игра полностью встроена в роутинг генерации и фронтенд-рендер. :contentReference[oaicite:41]{index=41}

### Penalty
Penalty выделен в отдельный генератор и отдельный UI-рендер. Во фронтенде есть penalty board с target zones и списком ударов, а сервер поддерживает ручную и автоматическую отправку данных вида `targets`. :contentReference[oaicite:42]{index=42}

---

## Логика ролей

### Lead
Обычный пользователь:
- имеет ограниченное число попыток
- не может использовать `Mines High Risk`
- не может использовать `Chicken Hard/Hardcore`
- для части UI имеет упрощенный режим отображения сигнала :contentReference[oaicite:43]{index=43}

### VIP
Пользователь с расширенным доступом:
- получает роль из access key
- может использовать закрытые режимы
- для Aviator имеет отдельный визуальный режим
- количество попыток управляется через access key и логику сервера :contentReference[oaicite:44]{index=44}

---

## Логика access key

При логине сервер использует `AccessKey` и проверяет:
- `code`
- `is_active`
- `expires_at`
- `multi_use`
- `used_by`

Также ключ задает:
- `role`
- `attempts` :contentReference[oaicite:45]{index=45}

Это значит, что access key — центральная точка управления доступом, сроком действия и типом пользователя.

---

## Онлайн-статус пользователей
Сервер хранит у пользователя:
- `is_online`
- `last_socket_id`

После логина или регистрации пользователь помечается онлайн.
На disconnect он переводится в offline.
Есть отдельное событие `get_online_users`, а сервер умеет собирать и эмитить список онлайн-пользователей. :contentReference[oaicite:46]{index=46}

---

## История сигналов
Сигналы сохраняются в MongoDB в модели `Signal`.
Есть REST endpoint `/signals`, который возвращает последние 50 сигналов.
Во фронтенде история фильтруется по активной игре и рендерится в блоке `Last Signals`. :contentReference[oaicite:47]{index=47}

---

## Админ-логика
Сервер поддерживает ручную отправку сигналов:

### admin_send_signal_to_user
Позволяет админу по `admin_password` отправить ручной сигнал конкретному пользователю по `telegram_id`. :contentReference[oaicite:48]{index=48}

### admin_send_signal_to_all
Позволяет отправить ручной сигнал всем онлайн-пользователям. :contentReference[oaicite:49]{index=49}

Для ручных сигналов сервер строит payload через `buildManualSignal(...)`:
- Aviator / LuckyJet → `multiplier`
- Mines → `safeCells`
- Chicken → `path`
- Penalty → `targets` :contentReference[oaicite:50]{index=50}

---

## Антиповторы
Важная часть системы — `signalMemory.js`.

Он хранит последние значения по играм:
- aviator
- luckyjet
- chicken
- penalty
- mines

Функции:
- `pushRecent`
- `getRecent`
- `countRecentRepeats`

Это нужно, чтобы сигналы выглядели менее однообразными и не повторяли один и тот же паттерн слишком часто. :contentReference[oaicite:51]{index=51}