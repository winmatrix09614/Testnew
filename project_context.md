# PROJECT_CONTEXT.md

## Project
Predictor Signal System

## Project type
Client-server web application for generating game signals with role-based access.

---

## Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose

---

## Architecture

Project is split into 2 main parts:

### client/
Frontend UI of the application.

Responsibilities:
- login screen
- game tabs
- signal rendering
- signal history
- attempts counter
- VIP warnings / locked modes
- Socket.IO connection to backend

### server/
Backend logic of the application.

Responsibilities:
- user authentication by ID + access code
- role assignment (`lead` / `vip`)
- signal generation
- restrictions for locked game modes
- saving users and signals to MongoDB
- online users tracking
- admin manual signal sending
- REST + Socket.IO communication

---

## Main features

- login by `user_id` and access code
- role system: `lead` and `vip`
- real-time signal generation
- separate generators for multiple games
- signal history
- attempts system
- locked VIP-only modes
- online user tracking
- admin manual signal sending
- MongoDB persistence

---

## Supported games

- Aviator
- Mines
- Lucky Jet
- Chicken
- Penalty

---

## Roles

### Lead
Regular user with limited access.

Rules:
- has limited number of attempts
- cannot use some VIP-only modes
- sees simplified access flow
- some UI behavior differs from VIP

### VIP
Extended access user.

Rules:
- can access locked modes
- role is assigned by access key
- has separate rendering/experience for some games
- attempts behavior is controlled through access rules

---

## Login logic

User enters:
- `user_id`
- `code`

Backend checks:
- valid `user_id` format
- whether access key exists
- whether key is active
- whether key is expired
- whether key can be reused
- what role and attempts the key gives

If login is successful:
- user is created or updated in MongoDB
- user becomes online
- frontend receives `login_success`

---

## Access key logic

Access key controls:
- role (`lead` or `vip`)
- attempts count
- active/inactive status
- expiration
- one-time or multi-use behavior
- who used the code

Access key is the main source of access control.

---

## User flow

1. User opens the app
2. User sees login screen
3. User enters ID and access code
4. Backend validates access
5. User enters main signal interface
6. User selects a game
7. User requests a signal
8. Backend checks permissions and attempts
9. Backend generates signal
10. Signal is saved
11. Signal is sent to frontend
12. UI updates current signal and history

---

## Signal request flow

When user presses `GET SIGNAL`:

1. frontend sends `request_signal`
2. backend checks:
   - is user logged in
   - does user exist
   - does user have attempts left
   - is requested mode allowed for this role
3. backend calls game generator
4. generated signal is saved in database
5. signal is emitted to frontend
6. attempts may decrease
7. UI updates signal block and history

---

## Restrictions

Examples of role-based restrictions:

- `Mines + High Risk` is VIP-only
- `Chicken + Hard / Hardcore` is VIP-only

If restricted mode is requested by a lead user:
- backend blocks it
- frontend should show VIP warning / locked state

---

## Core backend logic

Main backend responsibilities:
- connect to MongoDB
- run Express server
- run Socket.IO
- validate login
- manage users
- generate signals
- save signal history
- track online users
- send manual signals from admin tools

---

## Database models

### User
Stores:
- telegram_id / username if available
- user_id
- code
- role
- attempts_left
- online status
- last socket id

### Signal
Stores:
- game
- signal payload
- type (`auto` or manual-related flow)
- telegram_id
- sent time

### AccessKey
Stores access configuration:
- code
- role
- attempts
- active flag
- expiration
- multi-use setting
- used_by tracking

---

## Signal generation system

There is a central generator router that sends generation requests to specific game generators.

Game-specific generators exist for:
- aviator
- mines
- luckyjet
- chicken
- penalty

---

## Signal memory

Project uses signal memory logic to reduce repetitive outputs.

Purpose:
- prevent identical patterns from repeating too often
- make generated signals look more natural
- improve diversity of recent outputs

Functions include logic like:
- store recent values by game
- read recent values
- count recent repeats

---

## Game logic summary

### Aviator
- bucket-based generation
- multiplier ranges depend on bucket
- probabilities are weighted
- anti-repeat logic is used

### Mines
- supports different grid sizes
- supports safe / highrisk modes
- generates safe cells
- output depends on settings and anti-repeat logic

### Chicken
- supports multiple difficulties
- uses weighted path/profile selection
- difficulty affects generated signal behavior

### Lucky Jet
- separate generator and frontend renderer
- integrated into the same signal system

### Penalty
- separate generator and frontend renderer
- uses target/shot style payload for display

---

## Frontend logic

Frontend responsibilities:
- connect to backend through Socket.IO
- process login state
- switch between games
- request signals
- render each game differently
- render signal history
- update attempts counter
- disable signal button when attempts are exhausted
- show VIP-related lock/warning states

---

## History logic

Signals are saved in MongoDB.
Frontend displays recent signal history.
Backend also provides recent signals through REST endpoint.

---

## Admin logic

Backend supports manual signal sending.

Admin actions include:
- send signal to one user
- send signal to all online users

Admin actions require admin password validation.

---

## Important files

### Frontend
- `client/index.html`
- `client/ui.js`
- `client/socket.js`
- `client/app.js`
- `client/games.js`
- `client/admin.html`

### Backend
- `server/server.js`
- `server/models/User.js`
- `server/models/Signal.js`
- `server/models/AccessKey.js`
- `server/generators/generateSignal.js`
- `server/generators/aviatorGenerator.js`
- `server/generators/minesGenerator.js`
- `server/generators/chickenGenerator.js`
- `server/generators/luckyjetGenerator.js`
- `server/generators/penaltyGenerator.js`
- `server/generators/signalMemory.js`
- `server/utils/weightedRandom.js`

---

## Current project status

Already implemented:
- frontend + backend split
- login system
- access key validation
- lead / vip roles
- attempts system
- multiple games
- signal generators
- MongoDB models
- signal history
- online user tracking
- admin manual signal sending

---

## How to use this file in new chats

When starting a new chat, paste this file and add a short task, for example:

- "Work with this project"
- "Analyze frontend only"
- "Help me with backend signal logic"
- "Now we continue UI work for this project"

This file is the main context snapshot of the application.