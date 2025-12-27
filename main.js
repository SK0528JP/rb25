const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// コマンドを格納するコレクション
client.commands = new Collection();

// 1. コマンドファイルの読み込み
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`[Loaded]: ${command.data.name}`);
        }
    }
}

// 2. 起動時の処理
client.once('ready', async () => {
    // 状態を「退席中 (idle)」に固定
    client.user.setStatus('idle');

    // システムステータス更新関数
    const updateStatus = () => {
        try {
            // 日本時間 (JST) の取得
            const now = new Date();
            const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
            
            const year = jstNow.getUTCFullYear();
            const month = jstNow.getUTCMonth() + 1;
            const date = jstNow.getUTCDate();
            
            const hoursTime = String(jstNow.getUTCHours()).padStart(2, '0');
            const minutesTime = String(jstNow.getUTCMinutes()).padStart(2, '0');
            const secondsTime = String(jstNow.getUTCSeconds()).padStart(2, '0');
            
            const dayList = ["日", "月", "火", "水", "木", "金", "土"];
            const day = dayList[jstNow.getUTCDay()];
            
            // 稼働時間 (Uptime) の計算
            const uptimeTotalMs = client.uptime;
            const d = Math.floor(uptimeTotalMs / 86400000);
            const h = Math.floor((uptimeTotalMs % 86400000) / 3600000);
            const m = Math.floor((uptimeTotalMs % 3600000) / 60000);
            const s = Math.floor((uptimeTotalMs % 60000) / 1000);
            const uptimeStr = `${d}d ${h}h ${m}m ${s}s`;

            // 遅延 (Ping)
            const ping = client.ws.ping;

            // ステータステキストの構築
            // 例: 2025/12/27(土) 12:45:05 | Up: 0d 0h 5m 5s | 42ms
            const statusText = `${year}/${month}/${date}(${day}) ${hoursTime}:${minutesTime}:${secondsTime} | Up: ${uptimeStr} | ${ping}ms`;

            client.user.setActivity(statusText, { type: ActivityType.Watching });
        } catch (err) {
            console.error('Status update error:', err);
        }
    };

    // 初回実行
    updateStatus();
    
    // 5000ミリ秒（5秒）ごとに更新を実行
    setInterval(updateStatus, 5000);

    console.log('-----------------------------------');
    console.log('Rb m/25 (Generic Edition)');
    console.log('System Mode: Stable Perpetual Patrol');
    console.log('Update Interval: 5000ms');
    console.log(`Logged in as: ${client.user.tag}`);
    console.log('-----------------------------------');
});

// 3. インタラクション（コマンド）の受信
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        const errorMsg = { content: 'コマンド実行中にエラーが発生しました。', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMsg);
        } else {
            await interaction.reply(errorMsg);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
