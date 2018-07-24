const fetch = require('isomorphic-fetch');
const Discord = require('discord.js');
const columnify = require('columnify');
const NodeCache = require('node-cache');

const {prefix, token} = require('../config.json');
const client = new Discord.Client();

// TODO: Change ttl and checkperiod vals once done testing
const item_cache = new NodeCache({ stdTTL: 15, checkperiod: 15 });

// Runescape IDs of nex unique items
const item_id = [20147, 20159, 20151, 25068, 20155, 25058, 20135, 20139, 20143, 25060, 25064, 20163, 20167, 25062, 25066, 25664, 25654, 20171];

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    // Cancels if message doesn't start with prefix or is from a bot
    if (!msg.content.startsWith(prefix) || msg.author.bot) { return };

    // Getting the command following the prefix
    const args = msg.content.slice(prefix.length + 1).split(/ +/);
    const cmd = args.shift().toLowerCase();

    // Unique drop prices
    if (cmd === 'drops') {
        msg.channel.send('Fetching data...')
        .then((return_msg) => {
            // Retrieve drop info from cache
            item_cache.get("drops", function( err, value ) {
                if (!err) {
                    if (value == undefined) {
                        // Values don't exist -- have been deleted
                        getData()
                        .then((result) => {
                            // Cache new values
                            item_cache.set("drops", result, function(error, success) {
                                if (!error && success) {
                                    console.log("Item results cached")
                                    return_msg.edit(result)
                                }
                            })
                        })
                    } else {
                        // Values exist. Edit original message with result
                        return_msg.edit(value)
                    }
                } else {
                    return_msg.edit("Data could not be retrieved. Please try again later.")
                }
            })
        })
    }

    // Regular duo guide
    else if (cmd === 'duo') {
        msg.channel.send({
            file: "../assets/nex_duo_guide.png"
        })
    }

    // Advanced duo guide
    else if (cmd === 'duo-adv') {
        msg.channel.send({
            file: "../assets/nex_duo_advanced.png"
        })
    }

    // Nex Preset
    else if (cmd === 'preset') {
        msg.channel.send({
            file: "../assets/nex_preset.png"
        })
    }
})

// Retrieves item data from RS db
async function getData() {
    var tmp;
    var data = []
    var fmt_string = `\`\`\``

    try {
        await Promise.all(item_id.map(async item => {
            await fetch(`http://services.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=${item}`)
            .then((res) => res.text())
            .then((resText) => {
                tmp = JSON.parse(resText)
                // Retrieve the required values from JSON
                data.push({name: tmp['item']['name'], value: tmp['item']['current']['price']})
            });
        }));
    } catch (err) {
        return 'Could not fetch data, please try again later.'
    }
    
    
    data.sort((a, b) => {
        var name_a = a.name.toLowerCase();
        var name_b = b.name.toLowerCase();

        if (name_a < name_b){
            return -1;
        }
        else if (name_a > name_b) {
            return 1;
        }
        return 0;
    });

    var columns = columnify(data, {
        columns: ['name', 'value'],
        minWidth: 10,
        columnSplitter: '  |',
        config: {
            value: {align: 'right'}
        }
    })
    fmt_string += columns;
    fmt_string += `\`\`\``;

    // Returns the final prices formatted in a code block
    return fmt_string;
}

// Token comes from config file -- make sure not to release token publicly
client.login(token)