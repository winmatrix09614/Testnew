const recentSignals = {
    aviator: [],
    luckyjet: [],
    chicken: [],
    penalty: [],
    mines: []
}

function pushRecent(game, value, limit = 5) {
    if (!recentSignals[game]) {
        recentSignals[game] = []
    }

    recentSignals[game].unshift(value)

    if (recentSignals[game].length > limit) {
        recentSignals[game].length = limit
    }
}

function getRecent(game) {
    return recentSignals[game] || []
}

function countRecentRepeats(game, value) {
    const recent = getRecent(game)
    return recent.filter(item => item === value).length
}

module.exports = {
    pushRecent,
    getRecent,
    countRecentRepeats
}