const fetch = require('isomorphic-fetch'); // Retrieving data from web
const Discord = require('discord.js'); // Discord bot module
const columnify = require('columnify'); // Column formatting
const NodeCache = require('node-cache'); // Caching data
const numeral = require('numeral'); // Formatting numbers
var GoogleSpreadsheet = require('google-spreadsheet'); // Google sheets module
var async = require('async'); // Used for async series

/**
 * prefix - string the bot listens for
 * token - token for running the bot
 * id_data - contains arrays of both common and unique ids
 */
const {prefix, token, id_data} = require('./config.json');
const client = new Discord.Client();

// TODO: Change ttl and checkperiod vals once done testing
const item_cache = new NodeCache({ stdTTL: 15, checkperiod: 15 });


var doc = new GoogleSpreadsheet('1RnVGPcgEElxxjju39YRdfw6ZhnTwh3vkZQektsj6S1g');
var sheet;

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
                        // Values don't exist -- cache has been deleted
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

    // All non unique drops
    else if (cmd === 'commons') {
        msg.channel.send('Fetching data...')
        .then((return_msg) => {
            // Retrieve drop info from cache
            item_cache.get("commons", function( err, value ) {
                if (!err) {
                    if (value == undefined) {
                        // Values don't exist -- cache has been deleted
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

    // Nex records
    else if (cmd === 'records') {
        msg.channel.send('Loading records...')
        .then((return_msg) => {
            const trio_data = []
            const duo_data = []
            const solo_data = []
            
            // Execute functions in order
            async.series([ function getInfoAndWorksheets(step) {
                doc.getInfo(function(err, info) {
                    sheet = info.worksheets[17] // Worksheet 16 is the nex page
                    step();
                })
            },
            async function trioData(step) {
                sheet.getCells({
                    'min-row': 3,
                    'max-row': 6,
                    'max-col': 6,
                    'return-empty': true
                }, await function(err, cells) {
                    var rowNum = 3
                    var tmp = []
                    // Add each relevant cell to array
                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i].row > rowNum) {
                            rowNum++
                            trio_data.push({ 
                                rank: tmp[0], 
                                time: tmp[1], 
                                player_1: tmp[2], 
                                player_2: tmp[3], 
                                player_3: tmp[4], 
                                date: tmp[5]
                                })
                            tmp = []
                        }
                        // Tmp array holds each row
                        tmp.push(cells[i].value)
                    }
                    step();
                })
            },
            
            async function duoData(step) {
                sheet.getCells({
                    'min-row': 10,
                    'max-row': 13,
                    'max-col': 5,
                    'return-empty': true
                }, await function(err, cells) {
                    var rowNum = 10
                    var tmp = []
                    // Same as for trio, just without  player_3
                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i].row > rowNum) {
                            rowNum++
                            duo_data.push({ 
                                rank: tmp[0], 
                                time: tmp[1], 
                                player_1: tmp[2], 
                                player_2: tmp[3], 
                                date: tmp[4]
                            })
                            tmp = []
                        }
                        tmp.push(cells[i].value)
                    }
                    step();
                })
            },
            
            async function soloData(step){
                sheet.getCells({
                    'min-row': 17,
                    'max-row': 20,
                    'max-col': 4,
                    'return-empty': true
                }, await function(err, cells) {
                    var rowNum = 17
                    var tmp = []
                    // Same as for duo, just without player_2
                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i].row > rowNum) {
                            rowNum++
                            solo_data.push({ rank: tmp[0], time: tmp[1], player_1: tmp[2], date: tmp[3]})
                            tmp = []
                        }
                        tmp.push(cells[i].value)
                    }
                    step()
                })
            },
            function results(step) {
                // Neatly arrange all the rows for the response 
                var trio_columns = columnify(trio_data, {
                    columns: ['rank', 'time', 'player_1', 'player_2', 'player_3', 'date'],
                    minWidth: 5,
                    columnSplitter: ' | '
                })

                var duo_columns = columnify(duo_data, {
                    columns: ['rank', 'time', 'player_1', 'player_2', 'date'],
                    minWidth: 5,
                    columnSplitter: ' | '
                })
                var solo_columns = columnify(solo_data, {
                    columns: ['rank', 'time', 'player_1', 'date'],
                    minWidth: 5,
                    columnSplitter: ' | '
                })
                // Building return string
                records_results = '**Trio**:```\n' + trio_columns + '```\n**Duo**:```\n' + duo_columns + '```\n**Solo**:```\n' + solo_columns + '```'
                return_msg.edit(records_results)
            }])
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