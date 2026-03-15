const mongoose = require("mongoose")

const SignalSchema = new mongoose.Schema({
    game: {
        type: String,
        required: true
    },

    data: {
        type: Object,
        required: true
    },

    type: {
        type: String,
        default: "auto"
    },

    telegram_id: {
        type: String,
        default: null
    },

    sent_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

module.exports = mongoose.model("Signal", SignalSchema)