const weightedRandom = require("../utils/weightedRandom")
const { pushRecent, countRecentRepeats } = require("./signalMemory")

function randomInRange(min, max) {
    return Math.random() * (max - min) + min
}

function formatMultiplier(value) {
    return value.toFixed(2) + "x"
}

function getAviatorBucket() {
    return weightedRandom([
        { key: "low", min: 1.10, max: 2.00, weight: 45 },
        { key: "mid", min: 2.00, max: 10.00, weight: 40 },
        { key: "high", min: 10.00, max: 50.00, weight: 12 },
        { key: "epic", min: 50.00, max: 255.00, weight: 3 }
    ])
}

function generateAviatorSignal() {
    let bucket = getAviatorBucket()

    const lowRepeats = countRecentRepeats("aviator", "low")
    const epicRepeats = countRecentRepeats("aviator", "epic")

    if (bucket.key === "low" && lowRepeats >= 3) {
        bucket = weightedRandom([
            { key: "mid", min: 2.00, max: 10.00, weight: 75 },
            { key: "high", min: 10.00, max: 50.00, weight: 20 },
            { key: "epic", min: 50.00, max: 255.00, weight: 5 }
        ])
    }

    if (bucket.key === "epic" && epicRepeats >= 1) {
        bucket = weightedRandom([
            { key: "low", min: 1.10, max: 2.00, weight: 50 },
            { key: "mid", min: 2.00, max: 10.00, weight: 40 },
            { key: "high", min: 10.00, max: 50.00, weight: 10 }
        ])
    }

    const multiplier = formatMultiplier(randomInRange(bucket.min, bucket.max))

    pushRecent("aviator", bucket.key)

    return {
        game: "aviator",
        data: {
            multiplier,
            bucket: bucket.key
        }
    }
}

module.exports = generateAviatorSignal