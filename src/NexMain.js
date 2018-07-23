const fetch = require('isomorphic-fetch');
const Discord = require('discord.js');
const {prefix, token} = require('../config.json');
const client = new Discord.Client();
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
    console.log(cmd)
    // Unique drop prices
    if (cmd === 'drops') {
        msg.channel.send('Fetching data...')
        .then((return_msg) => {
            getData()
            .then((result) => return_msg.edit(result));
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
    var fmt_string = `\`\`\``

    // not sure if await is necessary; makes it return items in the same order each time but it may take longer?
    for (var i = 0; i < item_id.length; i ++) {
        await fetch(`http://services.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=${item_id[i]}`)
        .then((res) => res.text())
        .then((resText) => {
            tmp = JSON.parse(resText)
            // Retrieve the required values from JSON
            fmt_string += `${tmp['item']['name']}\t\t\t ${tmp['item']['current']['price']}\n`
        });
    }
    fmt_string += `\`\`\``

    // Returns the final prices formatted in a code block
    return fmt_string;
}

// Token comes from config file -- make sure not to release token publicly
client.login(token)