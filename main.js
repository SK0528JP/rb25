const { Client, GatewayIntentBits, Collection } = require('discord.js');
require('dotenv').config();

// ボットのインスタンス作成（全ての権限を要求する設定）
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// コマンドを格納するためのコレクション（PythonのCogに近い役割）
client.commands = new Collection();

// 起動確認イベント
client.once('ready', () => {
    console.log('-----------------------------------');
    console.log(`Rb m/25: Online`);
    console.log(`Logged in as: ${client.user.tag}`);
    console.log('-----------------------------------');
});

// ログイン
client.login(process.env.DISCORD_TOKEN);
