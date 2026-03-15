window.ui = {
    aviatorAnimationTimer: null,

    setConnectionStatus(isConnected) {
        const statusText = document.getElementById("connectionStatus")
        const statusDot = document.getElementById("statusDot")

        if (isConnected) {
            statusText.textContent = "Connected"
            statusDot.style.background = "#00e676"
            statusDot.style.boxShadow = "0 0 12px #00e676"
        } else {
            statusText.textContent = "Disconnected"
            statusDot.style.background = "orange"
            statusDot.style.boxShadow = "0 0 12px orange"
        }
    },

    clearGameRenderArea() {
    if (this.aviatorAnimationTimer) {
        cancelAnimationFrame(this.aviatorAnimationTimer)
        this.aviatorAnimationTimer = null
    }

    if (this.chickenStepTimers && this.chickenStepTimers.length) {
        this.chickenStepTimers.forEach(timer => clearTimeout(timer))
    }

    this.chickenStepTimers = []

    const area = document.getElementById("gameRenderArea")
    if (area) area.innerHTML = ""
},

    setCurrentGame(gameKey) {
        const config = window.gamesConfig[gameKey]
        document.getElementById("currentGameTitle").textContent = config.title
        document.getElementById("selectedGameText").textContent = config.title
    },

    setEmptySignal(gameKey) {
        const config = window.gamesConfig[gameKey]
        document.getElementById("currentGameTitle").textContent = config.title
        document.getElementById("currentSignalValue").textContent = "Loading..."
        document.getElementById("currentSignalTime").textContent = "Preparing signal"
        this.clearGameRenderArea()
    },

    showSignalLoading() {
        document.getElementById("currentSignalValue").textContent = "Loading..."
        document.getElementById("currentSignalTime").textContent = "Preparing signal"
        this.clearGameRenderArea()
    },

    getSignalDisplayValue(signal) {
        if (!signal || !signal.data) return "No data"

        switch (signal.game) {
            case "aviator":
                return signal.data.multiplier || "No multiplier"

            case "luckyjet":
                return signal.data.multiplier || "No multiplier"

            case "mines": {
                const grid = signal.data.grid || "3x3"
                const mode = signal.data.mode || "safe"
                const safeCells = Array.isArray(signal.data.safeCells) ? signal.data.safeCells : []
                return `${grid} • ${mode} • ${safeCells.join(", ")}`
            }

            case "chicken": {
                const steps = Array.isArray(signal.data.steps) ? signal.data.steps : []
                return steps.length ? steps.join(" → ") : "No steps"
            }

            case "penalty": {
                const shotsCount = signal.data.shotsCount || 0
                const targets = Array.isArray(signal.data.targets) ? signal.data.targets.join(", ") : "-"
                return `shots: ${shotsCount} • ${targets}`
            }

            default:
                return "Unknown signal"
        }
    },

    getSignalSubtitle(signal) {
        if (!signal || !signal.data) return ""

        switch (signal.game) {
            case "aviator":
                return "Multiplier signal"

            case "luckyjet":
                return "Jet multiplier"

            case "mines":
                return `Mines: ${signal.data.mines ?? "-"}`

            case "chicken":
                return `Difficulty: ${signal.data.difficulty || "easy"}`

            case "penalty":
                return `Targets: ${Array.isArray(signal.data.targets) ? signal.data.targets.join(", ") : "-"}`

            default:
                return ""
        }
    },

    renderAviatorLeadBoard(signal) {
        const area = document.getElementById("gameRenderArea")
        const multiplier = signal.data.multiplier || "1.00x"

        const board = document.createElement("div")
        board.className = "aviator-lead-board"

        board.innerHTML = `
            <div class="aviator-lead-circle-wrap">
                <div class="aviator-lead-circle">
                    <div class="aviator-lead-ring"></div>
                    <div class="aviator-lead-glow"></div>
                    <div class="aviator-lead-value pulse">${multiplier}</div>
                    <div class="aviator-lead-status">Signal synchronized</div>
                </div>
            </div>
            <div class="aviator-lead-footer">Fast access mode</div>
        `

        area.appendChild(board)
    },

    renderAviatorVipBoard(signal, animate = false) {
        const area = document.getElementById("gameRenderArea")
        const multiplier = signal.data.multiplier || "1.00x"

        const board = document.createElement("div")
        board.className = "aviator-board"

        board.innerHTML = `
            <div class="aviator-chart">
                <div class="aviator-glow"></div>

                <svg class="aviator-curve-svg" viewBox="0 0 420 260" preserveAspectRatio="none">
                    <path
                        class="aviator-path-bg"
                        d="M 42 220
                           C 120 220, 185 220, 235 185
                           C 280 152, 315 100, 350 38" />
                    <path
                        id="aviatorLivePath"
                        class="aviator-path ${animate ? "" : "aviator-path-static"}"
                        d="M 42 220
                           C 120 220, 185 220, 235 185
                           C 280 152, 315 100, 350 38" />
                </svg>

                <img src="./assets/aviator/plane.png" id="aviatorLivePlane" class="aviator-plane-board" alt="plane">
                <div id="aviatorLiveMultiplier" class="aviator-live-multiplier">1.00x</div>
                <div id="aviatorLoadingText" class="aviator-loading">Loading flight...</div>
            </div>
        `

        area.appendChild(board)

        const plane = document.getElementById("aviatorLivePlane")
        const liveValue = document.getElementById("aviatorLiveMultiplier")
        const loadingText = document.getElementById("aviatorLoadingText")

        if (!animate) {
            plane.style.left = `${350 - 24}px`
            plane.style.top = `${38 - 16}px`
            plane.style.transform = `rotate(6deg)`
            liveValue.textContent = multiplier
            liveValue.classList.add("done")
            loadingText.classList.add("hidden")
            return
        }

        this.startAviatorAnimation(signal)
    },

    startAviatorAnimation(signal) {
        const finalMultiplier = parseFloat(String(signal.data.multiplier).replace("x", "")) || 1.0
        const plane = document.getElementById("aviatorLivePlane")
        const liveValue = document.getElementById("aviatorLiveMultiplier")
        const loadingText = document.getElementById("aviatorLoadingText")
        const livePath = document.getElementById("aviatorLivePath")

        if (!plane || !liveValue || !loadingText || !livePath) return

        const totalLength = livePath.getTotalLength()
        livePath.style.strokeDasharray = totalLength
        livePath.style.strokeDashoffset = totalLength

        let start = null
        const duration = 2200

        const startX = 42
        const startY = 220
        const endX = 350
        const endY = 38

        const control1X = 120
        const control1Y = 220
        const control2X = 185
        const control2Y = 220
        const control3X = 235
        const control3Y = 185
        const control4X = 280
        const control4Y = 152
        const control5X = 315
        const control5Y = 100

        function cubicBezier(t, p0, p1, p2, p3) {
            const mt = 1 - t
            return mt * mt * mt * p0 +
                3 * mt * mt * t * p1 +
                3 * mt * t * t * p2 +
                t * t * t * p3
        }

        function getPoint(t) {
            if (t < 0.5) {
                const nt = t / 0.5
                return {
                    x: cubicBezier(nt, startX, control1X, control2X, control3X),
                    y: cubicBezier(nt, startY, control1Y, control2Y, control3Y)
                }
            } else {
                const nt = (t - 0.5) / 0.5
                return {
                    x: cubicBezier(nt, control3X, control4X, control5X, endX),
                    y: cubicBezier(nt, control3Y, control4Y, control5Y, endY)
                }
            }
        }

        const step = (timestamp) => {
            if (!start) start = timestamp
            const elapsed = timestamp - start
            const progress = Math.min(elapsed / duration, 1)

            const point = getPoint(progress)

            plane.style.left = `${point.x - 24}px`
            plane.style.top = `${point.y - 16}px`

            const angle = -12 + progress * 18
            plane.style.transform = `rotate(${angle}deg)`

            const currentMultiplier = 1 + (finalMultiplier - 1) * progress
            liveValue.textContent = `${currentMultiplier.toFixed(2)}x`

            livePath.style.strokeDashoffset = totalLength * (1 - progress)

            if (progress >= 0.12) {
                loadingText.classList.add("hidden")
            }

            if (progress < 1) {
                this.aviatorAnimationTimer = requestAnimationFrame(step)
            } else {
                liveValue.textContent = signal.data.multiplier
                liveValue.classList.add("done")
                loadingText.classList.add("hidden")

                document.getElementById("currentSignalValue").textContent = signal.data.multiplier
                document.getElementById("currentSignalTime").textContent =
                    `Multiplier signal • ${new Date(signal.sent_at).toLocaleTimeString()}`
            }
        }

        this.aviatorAnimationTimer = requestAnimationFrame(step)
    },

    renderLuckyJetBoard(signal) {
        const area = document.getElementById("gameRenderArea")
        const multiplier = signal.data.multiplier || "1.00x"

        const board = document.createElement("div")
        board.className = "luckyjet-board"

        board.innerHTML = `
            <div class="luckyjet-screen">
                <div class="luckyjet-grid"></div>
                <div class="luckyjet-ring"></div>
                <div class="luckyjet-glow"></div>
                <img src="./assets/luckyjet/menu_luckyjet.jpg" class="luckyjet-ship" alt="luckyjet">
                <div class="luckyjet-multiplier">${multiplier}</div>
                <div class="luckyjet-subtext">READY FOR TAKEOFF</div>
            </div>
        `

        area.appendChild(board)
    },

    renderMinesGrid(signal) {
        const area = document.getElementById("gameRenderArea")
        const grid = signal.data.grid || "3x3"
        const safeCells = Array.isArray(signal.data.safeCells) ? signal.data.safeCells : []
        const totalCells = grid === "5x5" ? 25 : 9

        const wrapper = document.createElement("div")
        wrapper.className = `mines-grid ${grid === "5x5" ? "grid-5" : "grid-3"}`

        for (let i = 1; i <= totalCells; i++) {
            const cell = document.createElement("div")
            cell.className = "mines-cell"

            if (safeCells.includes(i)) {
                cell.classList.add("safe")
                cell.textContent = "★"
            }

            wrapper.appendChild(cell)
        }

        area.appendChild(wrapper)

        const note = document.createElement("div")
        note.className = "render-note"
        note.textContent = `Safe cells: ${safeCells.join(", ")}`
        area.appendChild(note)
    },

    renderChickenRoad(signal) {
    const area = document.getElementById("gameRenderArea")
    const steps = Array.isArray(signal.data.steps) ? signal.data.steps : []

    const road = document.createElement("div")
    road.className = "chicken-road"

    const stepElements = []
    const connectorElements = []

    steps.forEach((coef, index) => {
        const wrapper = document.createElement("div")
        wrapper.className = "road-step-wrapper"

        const isFinal = index === steps.length - 1

        wrapper.innerHTML = `
            <div class="road-step ${isFinal ? "final" : ""}">
                <span class="step-coef">${coef}</span>
                <span class="step-label">STEP ${index + 1}</span>
                <div class="cashout-label">CASHOUT</div>
            </div>
        `

        road.appendChild(wrapper)

        const stepEl = wrapper.querySelector(".road-step")
        stepElements.push(stepEl)

        if (index < steps.length - 1) {
            const connector = document.createElement("div")
            connector.className = "road-connector"
            road.appendChild(connector)
            connectorElements.push(connector)
        }
    })

    area.appendChild(road)

    this.chickenStepTimers = []

    stepElements.forEach((stepEl, index) => {
        const timer = setTimeout(() => {
            stepEl.classList.add("active")

            if (connectorElements[index - 1]) {
                connectorElements[index - 1].classList.add("active")
            }

            if (index === stepElements.length - 1) {
                stepEl.classList.add("safe", "final")
            } else {
                stepEl.classList.add("safe")
            }
        }, 300 * (index + 1))

        this.chickenStepTimers.push(timer)
    })
},

    renderPenaltyBoard(signal) {
        const area = document.getElementById("gameRenderArea")
        const targets = Array.isArray(signal.data.targets) ? signal.data.targets : []

        const board = document.createElement("div")
        board.className = "penalty-board"

        const goal = document.createElement("div")
        goal.className = "penalty-goal"

        const net = document.createElement("div")
        net.className = "penalty-net"
        goal.appendChild(net)

        const keeper = document.createElement("div")
        keeper.className = "penalty-keeper"
        goal.appendChild(keeper)

        const ball = document.createElement("div")
        ball.className = "penalty-ball"
        goal.appendChild(ball)

        for (let i = 1; i <= 5; i++) {
            const target = document.createElement("div")
            target.className = `penalty-target t${i}`

            if (targets.includes(i)) {
                target.classList.add("active")
            }

            target.textContent = i
            goal.appendChild(target)
        }

        board.appendChild(goal)

        const shots = document.createElement("div")
        shots.className = "penalty-shots"

        targets.forEach((targetNumber, index) => {
            const badge = document.createElement("div")
            badge.className = "penalty-shot-badge active"
            badge.textContent = `Shot ${index + 1}: zone ${targetNumber}`
            shots.appendChild(badge)
        })

        board.appendChild(shots)
        area.appendChild(board)
    },

    setCurrentSignal(signal, options = {}) {
        const animate = options.animate === true
        const role = options.role || "lead"
        const config = window.gamesConfig[signal.game]
        const signalValueEl = document.getElementById("currentSignalValue")
signalValueEl.classList.remove("is-compact")

        this.clearGameRenderArea()
        document.getElementById("currentGameTitle").textContent = config.title

        if (signal.game === "aviator") {
    if (role === "vip" && animate) {
        document.getElementById("currentSignalValue").textContent = "Loading..."
        document.getElementById("currentSignalTime").textContent = "Flight initializing"
    } else {
        document.getElementById("currentSignalValue").textContent = signal.data.multiplier
        document.getElementById("currentSignalTime").textContent =
            `Multiplier signal • ${new Date(signal.sent_at).toLocaleTimeString()}`
    }
} else if (signal.game === "mines") {
    document.getElementById("currentSignalValue").textContent = `${signal.data.grid} • ${signal.data.mode}`
    document.getElementById("currentSignalTime").textContent =
        `Mines: ${signal.data.mines} • ${new Date(signal.sent_at).toLocaleTimeString()}`
} else if (signal.game === "chicken") {
    const steps = Array.isArray(signal.data.steps) ? signal.data.steps : []
    document.getElementById("currentSignalValue").textContent = steps.join(" → ")
    document.getElementById("currentSignalValue").classList.add("is-compact")
    document.getElementById("currentSignalTime").textContent =
        `Difficulty: ${signal.data.difficulty || "easy"} • ${new Date(signal.sent_at).toLocaleTimeString()}`
} else if (signal.game === "penalty") {
    document.getElementById("currentSignalValue").textContent = `Shots: ${signal.data.shotsCount}`
    document.getElementById("currentSignalTime").textContent =
        `Targets: ${signal.data.targets.join(", ")} • ${new Date(signal.sent_at).toLocaleTimeString()}`
} else {
    document.getElementById("currentSignalValue").textContent = this.getSignalDisplayValue(signal)
    document.getElementById("currentSignalTime").textContent =
        `${this.getSignalSubtitle(signal)} • ${new Date(signal.sent_at).toLocaleTimeString()}`
}

        if (signal.game === "aviator") {
            if (role === "vip") {
                this.renderAviatorVipBoard(signal, animate)
            } else {
                this.renderAviatorLeadBoard(signal)
            }
        }

        if (signal.game === "luckyjet") {
            this.renderLuckyJetBoard(signal)
        }

        if (signal.game === "mines") {
            this.renderMinesGrid(signal)
        }

        if (signal.game === "chicken") {
            this.renderChickenRoad(signal)
        }

        if (signal.game === "penalty") {
            this.renderPenaltyBoard(signal)
        }
    },

    renderHistory(signals, activeGame) {
        const history = document.getElementById("signalHistory")
        history.innerHTML = ""

        const filteredSignals = signals.filter(signal => signal.game === activeGame)

        if (!filteredSignals.length) {
            history.innerHTML = `<div class="history-item">No signals yet for ${window.gamesConfig[activeGame].title}</div>`
            return
        }

        filteredSignals.forEach(signal => {
            this.addHistoryItem(signal)
        })
    },

    addHistoryItem(signal) {
        const history = document.getElementById("signalHistory")

        const item = document.createElement("div")
        item.className = "history-item"
        item.innerHTML = `
            <div class="history-top">
                <span class="history-game">${window.gamesConfig[signal.game].title}</span>
                <span class="history-value">${this.getSignalDisplayValue(signal)}</span>
            </div>
            <div class="history-time">${new Date(signal.sent_at).toLocaleString()}</div>
        `

        history.prepend(item)
    },

    updateAttempts(value) {
        const attemptsText = document.getElementById("attemptsLeftText")
        const getSignalBtn = document.getElementById("getSignalBtn")

        attemptsText.textContent = value

        if (value <= 0) {
            getSignalBtn.disabled = true
            getSignalBtn.textContent = "NO ATTEMPTS LEFT"
        } else {
            getSignalBtn.disabled = false
            getSignalBtn.textContent = "GET SIGNAL"
        }
    }
}