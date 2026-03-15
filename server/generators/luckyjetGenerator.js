const weightedRandom = require("../utils/weightedRandom")
const { pushRecent, countRecentRepeats } = require("./signalMemory")

function randomInRange(min, max) {
    return Math.random() * (max - min) + min
}

function formatMultiplier(value) {
    return value.toFixed(2) + "x"
}

function getLuckyJetBucket() {
    return weightedRandom([
        { key: "low", min: 1.10, max: 2.00, weight: 42 },
        { key: "mid", min: 2.00, max: 5.00, weight: 32 },
        { key: "high", min: 5.00, max: 10.00, weight: 16 },
        { key: "veryhigh", min: 10.00, max: 25.00, weight: 7 },
        { key: "epic", min: 25.00, max: 80.00, weight: 3 }
    ])
}

function generateLuckyJetSignal() {
    let bucket = getLuckyJetBucket()

    const lowRepeats = countRecentRepeats("luckyjet", "low")
    const epicRepeats = countRecentRepeats("luckyjet", "epic")

    if (bucket.key === "low" && lowRepeats >= 3) {
        bucket = weightedRandom([
            { key: "mid", min: 2.00, max: 5.00, weight: 65 },
            { key: "high", min: 5.00, max: 10.00, weight: 25 },
            { key: "veryhigh", min: 10.00, max: 25.00, weight: 8 },
            { key: "epic", min: 25.00, max: 80.00, weight: 2 }
        ])
    }

    if (bucket.key === "epic" && epicRepeats >= 1) {
        bucket = weightedRandom([
            { key: "low", min: 1.10, max: 2.00, weight: 50 },
            { key: "mid", min: 2.00, max: 5.00, weight: 35 },
            { key: "high", min: 5.00, max: 10.00, weight: 15 }
        ])
    }

    const multiplier = formatMultiplier(randomInRange(bucket.min, bucket.max))

    pushRecent("luckyjet", bucket.key)

    return {
        game: "luckyjet",
        data: {
            multiplier,
            bucket: bucket.key
        }
    }
}

module.exports = generateLuckyJetSignal