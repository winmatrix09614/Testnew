const mongoose = require("mongoose")

const AccessKeySchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },

    role: {
        type: String,
        enum: ["lead", "vip"],
        required: true
    },

    attempts: {
        type: Number,
        default: 5
    },

    is_active: {
        type: Boolean,
        default: true
    },

    used_by: {
        type: String,
        default: null
    },

    multi_use: {
        type: Boolean,
        default: false
    },

    expires_at: {
        type: Date,
        default: null
    }
}, { timestamps: true })

module.exports = mongoose.model("AccessKey", AccessKeySchema)