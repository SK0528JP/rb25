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
} else {
    console.error("❌ 'commands' フォルダが見つかりません。");
}

// 2. 起動時の処理
client.once('ready', async () => {
    // 状態を「退席中 (idle)」に設定
    client.user.setStatus('idle');

    // ステータス（アクティビティ）を更新する関数
    const updateStatus = () => {
        // 日本時間 (JST) の取得
        const now = new Date();
        const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        
        const year = jstNow.getUTCFullYear();
        const month = jstNow.getUTCMonth() + 1;
        const date = jstNow.getUTCDate();
        const dayList = ["日", "月", "火", "水", "木", "金", "土"];
        const day = dayList[jstNow.getUTCDay()];
        
        // 稼働時間 (Uptime) の計算
        const totalSeconds = (client.uptime / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const uptimeStr = `${days}d ${hours}h ${minutes}m`;

        // 遅延 (Ping)
        const ping = client.ws.ping;

        // ステータステキストの構築 (m/25E 仕様)
        // 例: 2025/12/27(土) | Up: 0d 0h 5m | 42ms
        const statusText = `${year}/${month}/${date}(${day}) | Up: ${uptimeStr} | ${ping}ms`;

        client.user.setActivity(statusText, { type: ActivityType.Watching });
    };

    // 初回実行
    updateStatus();
    
    // 1分ごとにステータスを更新
    setInterval(updateStatus, 60000);

    console.log('-----------------------------------');
    console.log('Rb m/25 (Generic Edition)');
    console.log('System Mode: Perpetual Patrol');
    console.log('Status: Idle (Away)');
    console.log(`Logged in as: ${client.user.tag}`);
    console.log('-----------------------------------');
});

// 3. インタラクション（コマンド）の受信
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`Command ${interaction.commandName} not found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        } else {
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        }
    }
});

// Discord へのログイン
client.login(process.env.DISCORD_TOKEN);
