const weightedRandom = require("../utils/weightedRandom")
const { pushRecent, countRecentRepeats } = require("./signalMemory")

function getShotsCount() {
    return weightedRandom([
        { value: 1, weight: 35 },
        { value: 2, weight: 28 },
        { value: 3, weight: 20 },
        { value: 4, weight: 10 },
        { value: 5, weight: 7 }
    ]).value
}

function uniqueRandomTargets(count) {
    const available = [1, 2, 3, 4, 5]
    const result = []

    while (result.length < count && available.length > 0) {
        const index = Math.floor(Math.random() * available.length)
        result.push(available[index])
        available.splice(index, 1)
    }

    return result
}

function generatePenaltySignal() {
    let shotsCount = getShotsCount()

    const repeats = countRecentRepeats("penalty", String(shotsCount))
    if (repeats >= 2 && shotsCount > 1) {
        shotsCount -= 1
    }

    const targets = uniqueRandomTargets(shotsCount)

    pushRecent("penalty", String(shotsCount))

    return {
        game: "penalty",
        data: {
            shotsCount,
            targets
        }
    }
}

module.exports = generatePenaltySignal