const weightedRandom = require("../utils/weightedRandom")
const { pushRecent, countRecentRepeats } = require("./signalMemory")

const CHICKEN_DATA = {
    easy: ["1.03x","1.07x","1.12x","1.17x","1.23x","1.29x","1.36x","1.44x","1.53x","1.63x","1.75x","1.88x","2.04x","2.22x","2.45x","2.72x","3.06x","3.50x","4.08x","4.90x","6.13x","6.61x","9.81x","19.44x"],
    medium: ["1.12x","1.28x","1.47x","1.70x","1.98x","2.33x","2.76x","3.32x","4.03x","4.96x","6.20x","6.91x","8.90x","11.76x","15.99x","22.61x","33.58x","53.20x","92.17x","182.51x","451.71x","1778.80x"],
    hard: ["1.23x","1.55x","1.98x","2.56x","3.36x","4.49x","5.49x","7.53x","10.56x","15.21x","22.59x","34.79x","55.97x","94.99x","172.42x","341.40x","760.46x","2007.63x","6956.47x","41321.43x"],
    hardcore: ["1.63x","2.80x","4.95x","9.08x","15.21x","30.12x","62.96x","140.24x","337.19x","890.19x","2643.89x","9161.08x","39301.05x","233448.29x","254112.51x"]
}

function getStepCountByDifficulty(difficulty) {
    const profiles = {
        easy: [
            { value: 3, weight: 30 },
            { value: 4, weight: 28 },
            { value: 5, weight: 20 },
            { value: 6, weight: 12 },
            { value: 7, weight: 7 },
            { value: 8, weight: 3 }
        ],
        medium: [
            { value: 2, weight: 30 },
            { value: 3, weight: 28 },
            { value: 4, weight: 20 },
            { value: 5, weight: 12 },
            { value: 6, weight: 7 },
            { value: 7, weight: 3 }
        ],
        hard: [
            { value: 1, weight: 30 },
            { value: 2, weight: 28 },
            { value: 3, weight: 22 },
            { value: 4, weight: 12 },
            { value: 5, weight: 6 },
            { value: 6, weight: 2 }
        ],
        hardcore: [
            { value: 1, weight: 45 },
            { value: 2, weight: 30 },
            { value: 3, weight: 15 },
            { value: 4, weight: 7 },
            { value: 5, weight: 2 },
            { value: 6, weight: 1 }
        ]
    }

    return weightedRandom(profiles[difficulty] || profiles.easy).value
}

function generateChickenSignal(options = {}) {
    const difficulty = options.difficulty || "easy"

    let count = getStepCountByDifficulty(difficulty)

    const repeatKey = `${difficulty}-${count}`
    const repeats = countRecentRepeats("chicken", repeatKey)

    if (repeats >= 2) {
        count = Math.max(1, count - 1)
    }

    const allSteps = CHICKEN_DATA[difficulty] || CHICKEN_DATA.easy
    const steps = allSteps.slice(0, count)

    pushRecent("chicken", `${difficulty}-${count}`)

    return {
        game: "chicken",
        data: {
            difficulty,
            steps,
            stepsCount: count
        }
    }
}

module.exports = generateChickenSignal