const readline = require('readline')
const pyrand = require('pyrand')

const { jsons, colors, saveJson, paginate, getScore, sortAnimals, getAmount, checkAmount, clearConsole, newShop } = require('./exports.js')
const { itemUse } = require('./misc/items.js')
let state = "command"
let cooldown;

let shop = [];
// shop[0] is the cooldown, rest is the items

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
   
const commands = {
    rescue: (args) => {

        const now = new Date()
        console.log(now.getMinutes(), now.getSeconds())
        if ((now.getMinutes() < cooldown?.neededMinute && now.getSeconds() > cooldown?.neededSeconds) || (now.getMinutes() >= cooldown?.neededMinute && now.getSeconds() < cooldown?.neededSeconds)) {
            console.log(`You can rescue again at ${cooldown.neededMinute}m:${cooldown.neededSeconds}s`)
            return;
        }

        const random = pyrand.randint(0, jsons.commonAnimals.length - 1);
        const itemRand = pyrand.randint(1, 10);
        const animal = jsons.commonAnimals[random];

        var item;
        if (itemRand == 1) {
            item = jsons.items[pyrand.randint(0, jsons.items.length - 1)];
        }

        var itemText = item ? `\n${item.emoji} They were holding a ${item.name}.` : ''

        console.log(`${animal.emoji} You found a ${colors.bright}${animal.name}${colors.reset}, ${animal.flavourText} ${itemText}`);

        const date = new Date()
        cooldown = {
            neededMinute: date.getMinutes() < 59 ? date.getMinutes() + 1 : 0,
            neededSeconds: date.getSeconds(),
        }

        checkAmount(animal.name, 'animals')
        if (item) checkAmount(item.name, 'items')
        
        saveJson()
    },
    animals: (args) => {

        sortAnimals()

        const page = args[0] ?? 1
        const sortAmount = (a, b) => {return a.amount - b.amount}

        const all = paginate(page, jsons.allAnimals, 7, jsons.save.animals)
        const rares = []
        const common = []

        if (!all[page - 1]) {
            console.log("Page does not exist")
            return;
        }

        for (const x of all[page - 1]) {
            if (x.type == "common") common.push(x)
            if (x.type == "rare") rares.push(x)
        }
        rares.sort(sortAmount).reverse()
        common.sort(sortAmount).reverse()
        const newAll = rares.concat(common)
        
        const amounts = getAmount()
        var text = '';
        text += `${jsons.save.zooName} (⨯${amounts.common} + ${amounts.rare}★ = ${getScore()}✧)\n`
        for (const x of newAll) {
            text += '\n'
            if (x.type == "common") text += `${x.emoji} ${x.name} ⨯${x.amount}`
            else text += `${x.emoji} ${colors.blue}${x.name}${colors.reset} ⨯${x.amount}`
        }

        text += `\n\nPage ${page} of ${all.length} \nanimals [page] to go to a page.`

        console.log(text)
    },
    items: (args) => {
        const page = args[0] ?? 1
        const all = paginate(page, jsons.items, 7, jsons.save.items)

        const currentPage = all[page - 1]
        currentPage.sort().reverse()

        var text = '';
        text += `Items (⨯${jsons.save.items.length})\n`
        for (const item of currentPage) text += `\n${item.emoji} ${item.name} ⨯${item.amount}`
        text += `\n\n${page} of ${all.length} \nItems [page] to go to a page.`

        console.log(text)
    },
    exchange: (args) => {
        const animal = args[0]
        const common = jsons.commonAnimals.find(x => x.name == animal)
        const rare = jsons.rareAnimals.find(x => x.name == find.ex)

        const saveAnimal = jsons.save.animals.find(x => x.name == animal)
        const saveRare = jsons.save.animals.find(x => x.name == find.ex)

        if (!animal || !common || common.amount < 5) {
            console.log("Choose a valid animal.")
            return;
        }

        state = "confirm"

        rl.question(`Are you sure you want to exchange? (y/n) You have ${saveAnimal.amount} ${animal}${find.plural} and ${saveRare.amount ?? 0} ${saveRare.name}${rare.plural}: `, (input) => {
            if (input == "y") {
                checkAmount(rare.name, 'animals')
                saveAnimal.amount -= 5;

                if (saveAnimal.amount == 0) {
                    jsons.save.animals = jsons.save.animals.filter(item => item.name !== saveAnimal.name)
                }

                saveJson()
            }

            clearConsole()
            if (input == "y") console.log(`Exchanged 5 ${common.name}${common.plural} for 1 ${rare.name}, ${rare.flavourText}`)
            else console.log("Cancelled exchange.")

            state = "command"
            promptCommand()
        })
    },
    use: (args) => {
        if (!args[0] || !jsons.save.items.find(x => x.name == args[0])) {
            console.log("You dont have that item.");
            return;
        }

        console.log(itemUse(args[0]))

        const saveItem = jsons.save.items.find(x => x.name == args[0])

        saveItem.amount -= 1
        if (saveItem.amount == 0) {
            jsons.save.items = jsons.save.items.filter(item => item.name !== saveItem.name)
        }
        saveJson()
    },
    shop: (args) => {
        const minutes = new Date().getMinutes()
        if ((shop[0] && shop[0] < minutes) || !shop[0]) {
            shop = [minutes + 3].concat(newShop())
        }


        if (!args[0]) {
            // showing shop

            var index = 1
            var text = ''
            for (const x of shop) {
                if (typeof x != "object") {
                    continue;
                }

                text += `${index != 1 ? '\n' : ''}[${index}] » ${x.recieve.type == "rare" ? colors.blue : ''}${x.recieve.emoji} ⨯${x.amountRecieve}${colors.reset} (price: ${x.animalPay.emoji} ⨯${x.amountPay})`

                index++
            }

            text += `\n\nDo shop [number] to buy something \nShop refreshes in ${shop[0] - minutes} minutes.`

            console.log(text)
        } else {
            // buying from shop

            if (!shop[args[0]]) {
                console.log("Item does not exist.")
                return
            }

            const shopItem = shop[args[0]]
            const haveEnough = jsons.save.animals.find(x => x.name == shopItem.animalPay.name)?.amount >= shopItem.amountPay

            if (haveEnough) {
                switch (shopItem.type) {
                    case 'animal':
                        checkAmount(shopItem.recieve.name, 'animals', shopItem.amountRecieve)
                    break;
                    case 'item':
                        checkAmount(shopItem.recieve.name, 'items', shopItem.amountRecieve)
                    break;
                }

                const remove = jsons.save.animals.find(x => x.name == shopItem.animalPay.name)
                remove.amount -= shopItem.amountPay
                if (remove.amount == 0) jsons.save.animals = jsons.save.animals.filter(item => item.name !== shopItem.animalPay.name)
                saveJson()

                console.log(`You exchanged ${shopItem.amountPay} ${shopItem.animalPay.name}'${shopItem.animalPay.plural} for ${shopItem.amountRecieve} ${shopItem.recieve.name}'${shopItem.recieve.plural}.`)
            } else {
                console.log("You dont have enough.")
            }
        }
    },
    test: (args) => {
        for (const x of jsons.save.animals) {
            x.amount += 6
        }
        saveJson()
    }
}

function promptCommand() {
    rl.question('\nEnter a command: ', (input) => {
        const [command, ...args] = input.split(' ');
        if (commands.hasOwnProperty(command)) {
            process.stdout.write('\x1Bc');
            commands[command](args)
        } else {
            process.stdout.write('\x1Bc');
            console.log("Unknown command.")
        }
        if (state == "command") promptCommand()
    })
}

process.stdout.write('\x1Bc');
promptCommand()