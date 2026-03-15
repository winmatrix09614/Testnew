# FILE_STRUCTURE.md

## Root

### client/
Фронтенд приложения. Содержит HTML, стили, логику интерфейса и подключение к Socket.IO.

### server/
Бэкенд приложения. Содержит Express/Socket.IO сервер, генераторы сигналов, модели MongoDB и утилиты.

---

## client/

### client/index.html
Главная страница приложения.

Что есть в интерфейсе:
- экран логина по ID и VIP code
- основной экран Predictor Signals
- выбор игр: Aviator, Mines, Lucky Jet, Chicken, Penalty
- настройки для Mines (3x3 / 5x5, Safe / High Risk)
- настройки для Chicken (Easy / Medium / Hard / Hardcore)
- блок Current Signal
- кнопка GET SIGNAL
- счетчик Attempts Left
- история сигналов
- блок User Status
- VIP modal / VIP warning для закрытых режимов :contentReference[oaicite:0]{index=0}

### client/ui.js
Основная логика интерфейса.

Отвечает за:
- рендер текущего сигнала
- разные визуализации для разных игр
- отдельный рендер Aviator для lead и vip
- рендер Lucky Jet
- рендер Mines grid
- рендер Chicken road
- рендер Penalty board
- рендер истории сигналов
- обновление attempts left и блокировку кнопки при 0 попыток :contentReference[oaicite:1]{index=1}

### client/socket.js
Создает подключение клиента к Socket.IO серверу по адресу `http://localhost:3000`. :contentReference[oaicite:2]{index=2}

### client/app.js
Вероятно, файл инициализации фронтенда и связки событий интерфейса. В репозитории файл есть, но его содержимое через просмотрщик GitHub у меня не открылось, поэтому точное назначение лучше подтвердить отдельно. :contentReference[oaicite:3]{index=3}

### client/games.js
Вероятно, конфигурация игр (`window.gamesConfig`) и метаданные для UI. Это косвенно видно по использованию `window.gamesConfig[...]` в `ui.js`, но содержимое самого файла у меня не открылось. :contentReference[oaicite:4]{index=4}

### client/assets/
Статические ресурсы по играм.

Подпапки:
- `client/assets/aviator`
- `client/assets/chicken`
- `client/assets/luckyjet`
- `client/assets/mines`
- `client/assets/penalty` :contentReference[oaicite:5]{index=5}

### client/admin.html
Отдельная HTML-страница для админки или ручного управления сигналами. Наличие файла согласуется с серверными событиями ручной отправки сигналов админом. :contentReference[oaicite:6]{index=6}

---

## server/

### server/server.js
Главный сервер приложения.

Что делает:
- загружает `.env`
- поднимает Express + HTTP server + Socket.IO
- подключается к MongoDB через Mongoose
- отдает `/`
- отдает `/signals` (последние 50 сигналов)
- обрабатывает Socket.IO события:
  - `register_user`
  - `login_user`
  - `request_signal`
  - `get_online_users`
  - `admin_send_signal_to_user`
  - `admin_send_signal_to_all`
  - `disconnect` :contentReference[oaicite:7]{index=7}

### server/package.json
Настройки Node.js-проекта.

Зависимости:
- `express`
- `socket.io`
- `mongoose`
- `cors`
- `dotenv` :contentReference[oaicite:8]{index=8}

### server/.env
Секреты и конфигурация окружения.

По серверному коду используются:
- `MONGO_URI`
- `ADMIN_PASSWORD`
- `PORT` (если не задан, используется 3000) :contentReference[oaicite:9]{index=9}

### server/models/

#### server/models/user.js
Модель пользователя.

Поля:
- `telegram_id`
- `username`
- `user_id`
- `code`
- `role` (`lead` или `vip`)
- `attempts_left`
- `is_online`
- `last_socket_id`
- timestamps :contentReference[oaicite:10]{index=10}

#### server/models/Signal.js
Модель сигнала.

Поля:
- `game`
- `data`
- `type` (`auto` по умолчанию)
- `telegram_id`
- `sent_at`
- timestamps :contentReference[oaicite:11]{index=11}

#### server/models/AccessKey.js
Модель access code / VIP key.

Точное содержимое файла я не открыл из-за ограничения GitHub, но по `server.js` видно, что модель используется для проверки:
- `code`
- `is_active`
- `expires_at`
- `multi_use`
- `used_by`
- `role`
- `attempts` :contentReference[oaicite:12]{index=12}

### server/utils/

#### server/utils/weightedRandom.js
Утилита взвешенного выбора. Используется генераторами сигналов для выбора исходов по вероятностям. Сам файл есть в репозитории, а его использование явно видно в генераторах. :contentReference[oaicite:13]{index=13}

### server/generators/

#### server/generators/generateSignal.js
Главный роутер генерации сигнала.

Перенаправляет запрос на:
- `aviatorGenerator`
- `minesGenerator`
- `chickenGenerator`
- `penaltyGenerator`
- `luckyjetGenerator` :contentReference[oaicite:14]{index=14}

#### server/generators/aviatorGenerator.js
Генератор сигнала для Aviator.

Логика:
- выбирает bucket по весам: `low`, `mid`, `high`, `epic`
- генерирует множитель в диапазоне bucket
- использует `signalMemory`, чтобы уменьшать повторяемость одинаковых исходов подряд
- возвращает `{ game: "aviator", data: { multiplier, bucket } }` :contentReference[oaicite:15]{index=15}

#### server/generators/minesGenerator.js
Генератор сигнала для Mines.

Логика:
- принимает `grid`, `mode`, `mines`
- поддерживает `safe` и `highrisk`
- рассчитывает число safe cells
- генерирует набор безопасных ячеек
- учитывает повторяемость через `signalMemory` :contentReference[oaicite:16]{index=16}

#### server/generators/chickenGenerator.js
Генератор сигнала для Chicken.

Логика:
- поддерживает сложности: `easy`, `medium`, `hard`, `hardcore`
- содержит таблицы множителей по сложности
- выбирает длину пути по weighted profiles
- использует memory-антиповторы :contentReference[oaicite:17]{index=17}

#### server/generators/luckyjetGenerator.js
Генератор сигнала для Lucky Jet. Файл есть в проекте, вызывается через `generateSignal.js`, но код отдельно я не открыл. :contentReference[oaicite:18]{index=18}

#### server/generators/penaltyGenerator.js
Генератор сигнала для Penalty. Файл есть в проекте, вызывается через `generateSignal.js`, а UI ожидает `targets` / `shotsCount`. :contentReference[oaicite:19]{index=19}

#### server/generators/signalMemory.js
Память последних сигналов по играм.

Функции:
- `pushRecent(game, value, limit = 5)`
- `getRecent(game)`
- `countRecentRepeats(game, value)`

Используется для уменьшения одинаковых повторов подряд. :contentReference[oaicite:20]{index=20}

### server/node_modules/
Локальные зависимости Node.js. Эту папку обычно не хранят в GitHub, если используется `.gitignore`, но сейчас она в репозитории есть. :contentReference[oaicite:21]{index=21}