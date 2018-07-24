const fetch = require('isomorphic-fetch'); // Retrieving data from web
const Discord = require('discord.js'); // Discord bot module
const columnify = require('columnify'); // Column formatting
const NodeCache = require('node-cache'); // Caching data
const numeral = require('numeral'); // Formatting numbers

/**
 * prefix - string the bot listens for
 * token - token for running the bot
 * id_data - contains arrays of both common and unique ids
 */
const {prefix, token, id_data} = require('./config.json');
const client = new Discord.Client();

// TODO: Change ttl and checkperiod vals once done testing
const item_cache = new NodeCache({ stdTTL: 15, checkperiod: 15 });


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
                        getData(id_data['unique_ids'])
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

    if (cmd === 'commons') {
        msg.channel.send('Fetching data...')
        .then((return_msg) => {
            // Retrieve drop info from cache
            item_cache.get("commons", function( err, value ) {
                if (!err) {
                    if (value == undefined) {
                        // Values don't exist -- have been deleted
                        getData(id_data['common_ids'])
                        .then((result) => {
                            // Cache new values
                            item_cache.set("commons", result, function(error, success) {
                                if (!error && success) {
                                    console.log("Common results cached")
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

async function getData(id_array) {
    var data = [] // result array
    var fmt_string = `\`\`\``

    try {
        await Promise.all(id_array.map(async item => {
            await fetch(`http://services.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=${item['id']}`)
            .then((res) => res.text())
            .then((resText) => {
                var tmp = JSON.parse(resText)
                // If item has an amount property, apply it to name and price
                if (item.hasOwnProperty('amount')) {
                    // numeral formats the numbers since some are retrieved with 'k' or 'm' appended
                    var val = numeral(tmp['item']['current']['price']).value() * item['amount']
                    data.push({ name: tmp['item']['name'] + ' x' + item['amount'].toString(), value: numeral(val).format('0.0a') })
                } else {
                    data.push({name: tmp['item']['name'], value: tmp['item']['current']['price']})
                }
            });
        }));
    } catch (err) {
        return 'Could not fetch data, please try again later'
    }

    // Sorts data in alphabetical order using the name attribute
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

    // Formats the data into neat columns
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
    // Return strings contains all the columns in a markdown codeblock
    return fmt_string;
}


// Token comes from config file -- make sure not to release token publicly
client.login(token)