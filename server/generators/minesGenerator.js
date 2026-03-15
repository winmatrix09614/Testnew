const { pushRecent, countRecentRepeats } = require("./signalMemory")

function pickRandomCells(total, count) {
    const cells = new Set()

    while (cells.size < count) {
        cells.add(Math.floor(Math.random() * total) + 1)
    }

    return Array.from(cells).sort((a, b) => a - b)
}

function generateMinesSignal(options = {}) {
    const grid = options.grid || "3x3"
    const mode = options.mode || "safe"
    const mines = Number(options.mines || 3)

    const totalCells = grid === "5x5" ? 25 : 9
    const maxSafeCells = totalCells - mines

    let revealCount

    if (mode === "highrisk") {
        revealCount = maxSafeCells
    } else {
        revealCount = Math.min(maxSafeCells, Math.floor(Math.random() * 4) + 1)
    }

    const profileKey = `${grid}-${mode}-${revealCount}`
    const repeats = countRecentRepeats("mines", profileKey)

    if (mode === "safe" && repeats >= 2 && revealCount < maxSafeCells) {
        revealCount += 1
    }

    const safeCells = pickRandomCells(totalCells, revealCount)

    pushRecent("mines", `${grid}-${mode}-${revealCount}`)

    return {
        game: "mines",
        data: {
            grid,
            mode,
            mines,
            safeCells
        }
    }
}

module.exports = generateMinesSignal