function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
    let random = Math.random() * totalWeight

    for (const item of items) {
        random -= item.weight
        if (random <= 0) {
            return item
        }
    }

    return items[items.length - 1]
}

module.exports = weightedRandom