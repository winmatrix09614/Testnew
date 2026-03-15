require("dotenv").config()

const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")
const mongoose = require("mongoose")

const generateSignal = require("./generators/generateSignal")

const User = require("./models/user")
const Signal = require("./models/Signal")
const AccessKey = require("./models/AccessKey")

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ""

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err.message))

function normalizeCode(code) {
    return String(code || "").trim().toUpperCase()
}

function isValidAdminPassword(password) {
    return ADMIN_PASSWORD && String(password || "") === ADMIN_PASSWORD
}

async function resolveAccessByCode(code, userId) {
    const normalized = normalizeCode(code)

    const keyDoc = await AccessKey.findOne({ code: normalized })

    if (!keyDoc) {
        return {
            ok: false,
            message: "Invalid access code"
        }
    }

    if (!keyDoc.is_active) {
        return {
            ok: false,
            message: "This access code is disabled"
        }
    }

    if (keyDoc.expires_at && new Date(keyDoc.expires_at) < new Date()) {
        return {
            ok: false,
            message: "This access code has expired"
        }
    }

    if (!keyDoc.multi_use && keyDoc.used_by && keyDoc.used_by !== userId) {
        return {
            ok: false,
            message: "This access code is already used by another user"
        }
    }

    return {
        ok: true,
        keyDoc
    }
}

function buildManualSignal(game, value) {
    const normalizedGame = String(game || "").trim().toLowerCase()
    const rawValue = String(value || "").trim()

    switch (normalizedGame) {
        case "aviator":
            return {
                game: "aviator",
                data: {
                    multiplier: rawValue || "2.00x",
                    bucket: "manual"
                }
            }

        case "luckyjet":
            return {
                game: "luckyjet",
                data: {
                    multiplier: rawValue || "2.00x",
                    bucket: "manual"
                }
            }

        case "mines": {
            const cells = rawValue
                .split(",")
                .map(item => Number(item.trim()))
                .filter(num => Number.isInteger(num))

            return {
                game: "mines",
                data: {
                    safeCells: cells,
                    mode: "manual"
                }
            }
        }

        case "chicken": {
            const steps = rawValue
                .split(",")
                .map(item => item.trim())
                .filter(Boolean)

            return {
                game: "chicken",
                data: {
                    path: steps,
                    difficulty: "manual"
                }
            }
        }

        case "penalty": {
            const targets = rawValue
                .split(",")
                .map(item => Number(item.trim()))
                .filter(num => Number.isInteger(num))

            return {
                game: "penalty",
                data: {
                    shotsCount: targets.length,
                    targets
                }
            }
        }

        default:
            return null
    }
}

async function emitOnlineUsers(targetSocket = null) {
    const onlineUsers = await User.find({ is_online: true })
        .sort({ updatedAt: -1 })

    const payload = onlineUsers.map(user => ({
        username: user.username || "Unknown",
        telegram_id: user.telegram_id || "",
        user_id: user.user_id || "",
        socketId: user.last_socket_id || "",
        role: user.role || "lead"
    }))

    if (targetSocket) {
        targetSocket.emit("online_users", payload)
        return
    }

    io.emit("online_users", payload)
}

app.get("/", (req, res) => {
    res.send("Server is running")
})

app.get("/signals", async (req, res) => {
    try {
        const signals = await Signal.find().sort({ sent_at: -1 }).limit(50)
        res.json(signals)
    } catch (error) {
        res.status(500).json({ message: "Failed to load signals" })
    }
})

io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("register_user", async (data) => {
        try {
            const { telegram_id, username } = data || {}

            if (!telegram_id) {
                socket.emit("error_message", {
                    message: "telegram_id is required"
                })
                return
            }

            let user = await User.findOne({ telegram_id })

            if (!user) {
                user = await User.create({
                    telegram_id,
                    username: username || "test_user",
                    is_online: true,
                    last_socket_id: socket.id
                })
            } else {
                user.is_online = true
                user.last_socket_id = socket.id
                user.username = username || user.username
                await user.save()
            }

            socket.emit("register_success", {
                message: "User registered successfully",
                telegram_id: user.telegram_id,
                username: user.username
            })

            await emitOnlineUsers()
        } catch (error) {
            console.log("register_user error:", error.message)
            socket.emit("error_message", {
                message: "Failed to register user"
            })
        }
    })

    socket.on("login_user", async (data) => {
        try {
            const { user_id, code } = data || {}

            if (!/^159\d{7}$/.test(String(user_id || "").trim())) {
                socket.emit("login_error", {
                    message: "User ID must start with 159 and contain 10 digits"
                })
                return
            }

            const access = await resolveAccessByCode(code, user_id)

            if (!access.ok) {
                socket.emit("login_error", {
                    message: access.message
                })
                return
            }

            const keyDoc = access.keyDoc

            let user = await User.findOne({ user_id })

            if (!user) {
                user = await User.create({
                    telegram_id: `temp_${user_id}`,
                    username: `user_${user_id}`,
                    user_id,
                    code: normalizeCode(code),
                    role: keyDoc.role,
                    attempts_left: keyDoc.attempts,
                    is_online: true,
                    last_socket_id: socket.id
                })
            } else {
                user.code = normalizeCode(code)
                user.role = keyDoc.role

                if (keyDoc.role === "vip") {
                    user.attempts_left = keyDoc.attempts
                } else {
                    if (typeof user.attempts_left !== "number" || user.attempts_left <= 0) {
                        user.attempts_left = keyDoc.attempts
                    }
                }

                user.is_online = true
                user.last_socket_id = socket.id
                await user.save()
            }

            if (!keyDoc.used_by) {
                keyDoc.used_by = user_id
                await keyDoc.save()
            }

            socket.data.user_id = user.user_id
            socket.data.role = user.role
            socket.data.telegram_id = user.telegram_id

            socket.emit("login_success", {
                user_id: user.user_id,
                attempts_left: user.attempts_left,
                role: user.role
            })

            await emitOnlineUsers()
        } catch (error) {
            console.log("login_user error:", error.message)
            socket.emit("login_error", {
                message: "Login failed"
            })
        }
    })

    socket.on("request_signal", async (payload) => {
        try {
            const { game, options = {} } = payload || {}
            const userId = socket.data.user_id

            if (!userId) {
                socket.emit("error_message", {
                    message: "Please login first"
                })
                return
            }

            const user = await User.findOne({ user_id: userId })

            if (!user) {
                socket.emit("error_message", {
                    message: "User not found"
                })
                return
            }

            if (user.role !== "vip" && user.attempts_left <= 0) {
                socket.emit("error_message", {
                    message: "No attempts left"
                })
                return
            }

            if (game === "mines" && user.role === "lead" && options.mode === "highrisk") {
                socket.emit("error_message", {
                    message: "High Risk mode is available only for VIP access"
                })
                return
            }

            if (
                game === "chicken" &&
                user.role === "lead" &&
                ["hard", "hardcore"].includes(String(options.difficulty || "").toLowerCase())
            ) {
                socket.emit("error_message", {
                    message: "Hard and Hardcore are available only for VIP access"
                })
                return
            }

            const signalPayload = generateSignal(game, options)

            const savedSignal = await Signal.create({
                game: signalPayload.game,
                data: signalPayload.data,
                type: "auto",
                telegram_id: user.telegram_id || null,
                sent_at: new Date()
            })

            if (user.role !== "vip") {
                user.attempts_left -= 1
                await user.save()

                socket.emit("attempts_update", {
                    attempts_left: user.attempts_left
                })
            }

            socket.emit("signal", savedSignal)
        } catch (error) {
            console.log("request_signal error:", error.message)
            socket.emit("error_message", {
                message: "Failed to generate signal"
            })
        }
    })

    socket.on("get_online_users", async () => {
        try {
            await emitOnlineUsers(socket)
        } catch (error) {
            console.log("get_online_users error:", error.message)
            socket.emit("error_message", {
                message: "Failed to get online users"
            })
        }
    })

    socket.on("admin_send_signal_to_user", async (payload) => {
        try {
            const {
                admin_password,
                telegram_id,
                game,
                value
            } = payload || {}

            if (!isValidAdminPassword(admin_password)) {
                socket.emit("error_message", {
                    message: "Invalid admin password"
                })
                return
            }

            if (!telegram_id) {
                socket.emit("error_message", {
                    message: "telegram_id is required"
                })
                return
            }

            const targetUser = await User.findOne({ telegram_id })

            if (!targetUser) {
                socket.emit("error_message", {
                    message: "User not found"
                })
                return
            }

            if (!targetUser.last_socket_id) {
                socket.emit("error_message", {
                    message: "User is offline"
                })
                return
            }

            const manualSignal = buildManualSignal(game, value)

            if (!manualSignal) {
                socket.emit("error_message", {
                    message: "Unsupported game"
                })
                return
            }

            const savedSignal = await Signal.create({
                game: manualSignal.game,
                data: manualSignal.data,
                type: "manual",
                telegram_id: targetUser.telegram_id,
                sent_at: new Date()
            })

            io.to(targetUser.last_socket_id).emit("signal", savedSignal)

            socket.emit("signal_sent", {
                success: true,
                mode: "single",
                telegram_id: targetUser.telegram_id,
                signal: savedSignal
            })
        } catch (error) {
            console.log("admin_send_signal_to_user error:", error.message)
            socket.emit("error_message", {
                message: "Failed to send signal to user"
            })
        }
    })

    socket.on("admin_send_signal_to_all", async (payload) => {
        try {
            const {
                admin_password,
                game,
                value
            } = payload || {}

            if (!isValidAdminPassword(admin_password)) {
                socket.emit("error_message", {
                    message: "Invalid admin password"
                })
                return
            }

            const manualSignal = buildManualSignal(game, value)

            if (!manualSignal) {
                socket.emit("error_message", {
                    message: "Unsupported game"
                })
                return
            }

            const onlineUsers = await User.find({
                is_online: true,
                last_socket_id: { $ne: "" }
            })

            if (!onlineUsers.length) {
                socket.emit("error_message", {
                    message: "No online users found"
                })
                return
            }

            const results = []

            for (const user of onlineUsers) {
                const savedSignal = await Signal.create({
                    game: manualSignal.game,
                    data: manualSignal.data,
                    type: "manual",
                    telegram_id: user.telegram_id,
                    sent_at: new Date()
                })

                io.to(user.last_socket_id).emit("signal", savedSignal)

                results.push({
                    telegram_id: user.telegram_id,
                    socket_id: user.last_socket_id
                })
            }

            socket.emit("signal_sent", {
                success: true,
                mode: "broadcast",
                total: results.length,
                users: results
            })
        } catch (error) {
            console.log("admin_send_signal_to_all error:", error.message)
            socket.emit("error_message", {
                message: "Failed to send signal to all users"
            })
        }
    })

    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id)

        try {
            await User.findOneAndUpdate(
                { last_socket_id: socket.id },
                { is_online: false }
            )

            await emitOnlineUsers()
        } catch (error) {
            console.log("disconnect error:", error.message)
        }
    })
})

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})