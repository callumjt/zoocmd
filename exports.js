const fs = require('node:fs');
const pyrand = require('pyrand')

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

function getJson(url) {
    return JSON.parse(fs.readFileSync(url, 'utf-8'))
}
const clearConsole = () => process.stdout.write('\x1Bc');

const jsons = {
    allAnimals: getJson('./jsons/animals.json')[0].concat(getJson('./jsons/animals.json')[1]),
    commonAnimals: getJson('./jsons/animals.json')[0],
    rareAnimals: getJson('./jsons/animals.json')[1],
    items: getJson('./jsons/items.json'),
    save: getJson('./save.json')
}

function saveJson() {
    fs.writeFileSync('./save.json', JSON.stringify(jsons.save))
}

function getScore() {
    var score = 0;
    for (const x of jsons.save.animals) {
        const find = jsons.allAnimals.find(y => y.name == x.name)

        if (find.type == "common") score += x.amount;
        if (find.type == "rare") score += x.amount * 5
    }

    return score
}

function paginate(page2, json, perPage, save) {
    const page = page2 - 1
    const pages = []
    for (var x = 0; x < Math.ceil(save.length / perPage); x++) {
        const first = x * perPage
        const thisPage = []
    
        for (var y = 0; y <= perPage; y++) {
            if (save[first + y]) {
                const current = json.find(z => z.name == save[first + y].name)
                const currentAmount = save[first + y].amount
                const push = {
                    emoji: current.emoji,
                    name: current.name,
                    amount: currentAmount,
                    type: current.type,
                }
                thisPage.push(push)
            } else {
                break;
            }
        }
        pages.push(thisPage)
    }

    // var text = ''
    // var index = 0;
    // for (const x of pages[page]) {
    //     if (index != 0) text += '\n'
    //     if (x.type == "common") text += `${x.emoji} ${x.name} x${x.amount}`
    //     else text += `${x.emoji} ${colors.blue}${x.name}${colors.reset} x${x.amount}`
    //     index++
    // }

    // text += `\n\nPage ${page2} of ${pages.length} \n${command} [page] to go to a page.`

    return pages;
}

function sortAnimals() {
    const sortAmount = (a, b) => {return a.amount - b.amount}
    const common = []
    const rares = []
    for (const x of jsons.save.animals) {
        const find = jsons.allAnimals.find(y => y.name == x.name)
        if (find.type == "common") common.push(x)
        if (find.type == "rare") rares.push(x)
    }
    rares.sort(sortAmount).reverse()
    common.sort(sortAmount).reverse()
    const newAll = rares.concat(common)

    jsons.save.animals = newAll
    saveJson()
}

function getAmount() {
    var common = 0;
    var rare = 0;
    for (const x of jsons.save.animals) {
        const find = jsons.allAnimals.find(y => y.name == x.name)

        if (find.type == "common") common += x.amount;
        if (find.type == "rare") rare += x.amount
    }

    return {common, rare}
}

const checkAmount = (find, json, amount) => {
    const findJson = jsons.save[json].find(x => x.name == find);
    if (findJson) {
        findJson.amount += 1;
    } else {
        const push = {
            name: find,
            amount: amount ?? 1,
        };
        jsons.save[json].push(push)
    }
}

function newShop() {
    const array = []
    for (var shopItem = 0; shopItem < 5; shopItem++) {
        const random = pyrand.randint(1, 3)
        // if the number is 3 then its an item shop but if its less than 3 then its an animal shop

        var type;
        var recieve;
        var rare = undefined
        if (random < 3) {
            type = "animal"

            rare = pyrand.randint(1, 3) == 3
            const array = rare ? jsons.rareAnimals : jsons.commonAnimals
            recieve = array[pyrand.randint(0, array.length - 1)]
        } else {
            type = "item"

            recieve = jsons.items[pyrand.randint(0, jsons.items.length - 1)]
        }

        const animalPay = jsons.commonAnimals[pyrand.randint(0, jsons.commonAnimals.length - 1)]
        const amountPay = type == "animal" ? 6 : 3
        const amountRecieve = rare || type == "item" ? 1 : amountPay - 1
        const object = {
            animalPay,
            amountPay,
            recieve,
            amountRecieve,
            type,
        }
        array.push(object)
    }
    return array
}

module.exports = {
    jsons,
    colors,
    saveJson,
    paginate,
    getScore,
    sortAnimals,
    getAmount,
    checkAmount,
    clearConsole,
    newShop,
}