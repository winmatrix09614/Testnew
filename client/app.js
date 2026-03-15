const TELEGRAM_ID = "726482948"
const USERNAME = "test_user"

const state = {
    activeGame: "aviator",
    signals: [],
    attemptsLeft: 5,
    loggedIn: false,
    userId: null,
    role: "lead",
    gameOptions: {
        mines: {
            grid: "3x3",
            mode: "safe",
            mines: 3
        },
        chicken: {
            difficulty: "easy"
        }
    }
}

function openVipModal(message) {
    const modal = document.getElementById("vipModal")
    const text = document.getElementById("vipModalText")

    if (!modal || !text) return

    text.textContent = message
    modal.classList.remove("hidden")
}

function closeVipModal() {
    const modal = document.getElementById("vipModal")
    if (!modal) return
    modal.classList.add("hidden")
}

function setupVipModal() {
    const backdrop = document.getElementById("vipModalBackdrop")
    const closeBtn = document.getElementById("vipModalClose")
    const okBtn = document.getElementById("vipModalOk")

    if (backdrop) backdrop.addEventListener("click", closeVipModal)
    if (closeBtn) closeBtn.addEventListener("click", closeVipModal)
    if (okBtn) okBtn.addEventListener("click", closeVipModal)
}

function applyRoleRestrictions() {
    const modeButtons = document.querySelectorAll("[data-mode]")
    const chickenSelect = document.getElementById("chickenDifficultySelect")

    modeButtons.forEach(button => {
        const isHighRisk = button.dataset.mode === "highrisk"
        const locked = state.role !== "vip" && isHighRisk

        button.disabled = false
        button.classList.toggle("locked-option", locked)
        button.style.opacity = locked ? "0.55" : "1"
        button.style.cursor = locked ? "not-allowed" : "pointer"
    })

    if (state.role !== "vip" && state.gameOptions.mines.mode === "highrisk") {
        state.gameOptions.mines.mode = "safe"
    }

    if (chickenSelect) {
        const hardOption = chickenSelect.querySelector('option[value="hard"]')
        const hardcoreOption = chickenSelect.querySelector('option[value="hardcore"]')

        if (hardOption) {
            hardOption.disabled = state.role !== "vip"
            hardOption.textContent = state.role !== "vip" ? "HARD • VIP" : "HARD"
        }

        if (hardcoreOption) {
            hardcoreOption.disabled = state.role !== "vip"
            hardcoreOption.textContent = state.role !== "vip" ? "HARDCORE • VIP" : "HARDCORE"
        }

        if (state.role !== "vip" && ["hard", "hardcore"].includes(state.gameOptions.chicken.difficulty)) {
            state.gameOptions.chicken.difficulty = "medium"
        }

        chickenSelect.value = state.gameOptions.chicken.difficulty
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll(".tab")

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(btn => btn.classList.remove("active"))
            tab.classList.add("active")

            const game = tab.dataset.game
            state.activeGame = game

            ui.setCurrentGame(game)

            if (window.updateMinesControlsVisibility) {
                window.updateMinesControlsVisibility()
            }

            if (window.updateChickenControlsVisibility) {
                window.updateChickenControlsVisibility()
            }

            applyRoleRestrictions()

            ui.renderHistory(state.signals, state.activeGame)

            const latestForGame = state.signals.find(signal => signal.game === game)

            if (latestForGame) {
                ui.setCurrentSignal(latestForGame, {
                    animate: false,
                    role: state.role
                })
            } else {
                ui.setEmptySignal(game)
            }
        })
    })
}

async function loadSignalHistory() {
    try {
        const res = await fetch("http://localhost:3000/signals")
        const signals = await res.json()

        state.signals = signals
        ui.renderHistory(state.signals, state.activeGame)

        const latestForGame = signals.find(signal => signal.game === state.activeGame)

        if (latestForGame) {
            ui.setCurrentSignal(latestForGame, {
                animate: false,
                role: state.role
            })
        } else {
            ui.setEmptySignal(state.activeGame)
        }
    } catch (error) {
        console.error("Failed to load signals:", error)
    }
}

function setupLogin() {
    const loginBtn = document.getElementById("loginBtn")

    loginBtn.addEventListener("click", () => {
        const user_id = document.getElementById("userIdInput").value.trim()
        const code = document.getElementById("codeInput").value.trim()

        socket.emit("login_user", {
            user_id,
            code
        })
    })
}

function buildRequestOptions() {
    switch (state.activeGame) {
        case "mines":
            return state.gameOptions.mines
        case "chicken":
            return state.gameOptions.chicken
        default:
            return {}
    }
}

function setupMinesControls() {
    const minesControls = document.getElementById("minesControls")
    const gridButtons = document.querySelectorAll("[data-grid]")
    const modeButtons = document.querySelectorAll("[data-mode]")
    const minesCountText = document.getElementById("minesCountText")
    const decreaseBtn = document.getElementById("decreaseMinesBtn")
    const increaseBtn = document.getElementById("increaseMinesBtn")

    function syncMinesButtons() {
        gridButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.grid === state.gameOptions.mines.grid)
        })

        modeButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === state.gameOptions.mines.mode)
        })

        minesCountText.textContent = state.gameOptions.mines.mines
    }

    function updateMinesControlsVisibility() {
        if (state.activeGame === "mines") {
            minesControls.classList.remove("hidden-control")
        } else {
            minesControls.classList.add("hidden-control")
        }

        syncMinesButtons()
    }

    gridButtons.forEach(button => {
        button.addEventListener("click", () => {
            state.gameOptions.mines.grid = button.dataset.grid

            const max = state.gameOptions.mines.grid === "5x5" ? 24 : 8
            if (state.gameOptions.mines.mines > max) {
                state.gameOptions.mines.mines = max
            }

            syncMinesButtons()
        })
    })

    modeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const isLocked = state.role !== "vip" && button.dataset.mode === "highrisk"

            if (isLocked) {
                openVipModal("High Risk mode is available only for VIP access.")
                return
            }

            state.gameOptions.mines.mode = button.dataset.mode
            syncMinesButtons()
        })
    })

    decreaseBtn.addEventListener("click", () => {
        const min = 1
        if (state.gameOptions.mines.mines > min) {
            state.gameOptions.mines.mines -= 1
            syncMinesButtons()
        }
    })

    increaseBtn.addEventListener("click", () => {
        const max = state.gameOptions.mines.grid === "5x5" ? 24 : 8
        if (state.gameOptions.mines.mines < max) {
            state.gameOptions.mines.mines += 1
            syncMinesButtons()
        }
    })

    updateMinesControlsVisibility()
    return updateMinesControlsVisibility
}

function setupChickenControls() {
    const chickenControls = document.getElementById("chickenControls")
    const select = document.getElementById("chickenDifficultySelect")

    function updateChickenControlsVisibility() {
        if (state.activeGame === "chicken") {
            chickenControls.classList.remove("hidden-control")
        } else {
            chickenControls.classList.add("hidden-control")
        }

        select.value = state.gameOptions.chicken.difficulty
    }

    select.addEventListener("change", () => {
        const value = select.value

        if (state.role !== "vip" && ["hard", "hardcore"].includes(value)) {
            state.gameOptions.chicken.difficulty = "medium"
            select.value = "medium"
            openVipModal("Hard and Hardcore difficulties are available only for VIP access.")
            return
        }

        state.gameOptions.chicken.difficulty = value
    })

    updateChickenControlsVisibility()
    return updateChickenControlsVisibility
}

function setupGetSignal() {
    const btn = document.getElementById("getSignalBtn")

    btn.addEventListener("click", () => {
        if (!state.loggedIn) return

        btn.disabled = true
        ui.showSignalLoading()

        setTimeout(() => {
            socket.emit("request_signal", {
                game: state.activeGame,
                options: buildRequestOptions()
            })
        }, 700)

        setTimeout(() => {
            btn.disabled = false
            ui.updateAttempts(state.attemptsLeft)
        }, 1000)
    })
}

function initSocket() {
    socket.on("connect", () => {
        ui.setConnectionStatus(true)

        socket.emit("register_user", {
            telegram_id: TELEGRAM_ID,
            username: USERNAME
        })
    })

    socket.on("disconnect", () => {
        ui.setConnectionStatus(false)
    })

    socket.on("login_success", (data) => {
        state.loggedIn = true
        state.userId = data.user_id
        state.attemptsLeft = data.attempts_left
        state.role = data.role || "lead"

        document.getElementById("loginScreen").classList.add("hidden")
        document.getElementById("mainApp").classList.remove("hidden")
        document.getElementById("userIdText").textContent = data.user_id

        ui.updateAttempts(state.attemptsLeft)

        if (window.updateMinesControlsVisibility) {
            window.updateMinesControlsVisibility()
        }

        if (window.updateChickenControlsVisibility) {
            window.updateChickenControlsVisibility()
        }

        applyRoleRestrictions()
        loadSignalHistory()
    })

    socket.on("login_error", (data) => {
        document.getElementById("loginError").textContent = data.message
    })

    socket.on("signal", (signal) => {
        state.signals.unshift(signal)

        if (signal.game === state.activeGame) {
            ui.setCurrentSignal(signal, {
                animate: signal.game === "aviator" && state.role === "vip",
                role: state.role
            })
            ui.renderHistory(state.signals, state.activeGame)
        }
    })

    socket.on("attempts_update", (data) => {
        state.attemptsLeft = data.attempts_left
        ui.updateAttempts(state.attemptsLeft)
    })

    socket.on("register_success", () => {
        console.log("Socket user registered")
    })

    socket.on("error_message", (err) => {
        alert(err.message)
    })
}

function initApp() {
    ui.setCurrentGame(state.activeGame)
    ui.setEmptySignal(state.activeGame)
    ui.updateAttempts(state.attemptsLeft)

    setupTabs()
    setupLogin()
    setupGetSignal()
    setupVipModal()

    window.updateMinesControlsVisibility = setupMinesControls()
    window.updateChickenControlsVisibility = setupChickenControls()

    initSocket()
}

initApp()