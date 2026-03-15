const generateAviatorSignal = require("./aviatorGenerator")
const generateMinesSignal = require("./minesGenerator")
const generateChickenSignal = require("./chickenGenerator")
const generatePenaltySignal = require("./penaltyGenerator")
const generateLuckyJetSignal = require("./luckyjetGenerator")

function generateSignal(game, options = {}) {
    switch (game) {
        case "aviator":
            return generateAviatorSignal()

        case "mines":
            return generateMinesSignal(options)

        case "chicken":
            return generateChickenSignal(options)

        case "penalty":
            return generatePenaltySignal()

        case "luckyjet":
            return generateLuckyJetSignal()

        default:
            throw new Error("Unsupported game")
    }
}

module.exports = generateSignal