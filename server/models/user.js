const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    telegram_id: {
        type: String,
        required: true,
        unique: true
    },

    username: {
        type: String,
        default: "test_user"
    },

    user_id: {
        type: String,
        unique: true,
        sparse: true,
        default: null
    },

    code: {
        type: String,
        default: ""
    },

    role: {
        type: String,
        enum: ["lead", "vip"],
        default: "lead"
    },

    attempts_left: {
        type: Number,
        default: 5
    },

    is_online: {
        type: Boolean,
        default: false
    },

    last_socket_id: {
        type: String,
        default: ""
    }
}, { timestamps: true })

module.exports = mongoose.model("User", UserSchema)