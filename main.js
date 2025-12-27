const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection, ActivityType, WebhookClient } = require('discord.js');
const dotenv = require('dotenv');
const axios = require('axios'); // Gist操作用

dotenv.config();

// --- 1. Ledger (帳簿) クラス定義 ---
class Ledger {
    constructor(gistId, token) {
        self.gistId = gistId;
        self.token = token;
        self.data = { global_chats: [] };
    }

    async load() {
        if (!self.gistId || !self.token) return;
        try {
            const res = await axios.get(`https://api.github.com/gists/${self.gistId}`, {
                headers: { Authorization: `token ${self.token}` }
            });
            const content = res.data.files['ledger.json'].content;
            self.data = JSON.parse(content);
            console.log('✅ Ledger Loaded.');
        } catch (err) {
            console.error('❌ Ledger Load Failed:', err.response?.status || err.message);
        }
    }

    async save() {
        if (!self.gistId || !self.token) return;
        try {
            await axios.patch(`https://api.github.com/gists/${self.gistId}`, {
                files: { 'ledger.json': { content: JSON.stringify(self.data, null, 4) } }
            }, {
                headers: { Authorization: `token ${self.token}` }
            });
            console.log('💾 Ledger Saved to Gist.');
        } catch (err) {
            console.error('❌ Ledger Save Failed:', err.message);
        }
    }
}

// --- 2. Bot クライアント設定 ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.commands = new Collection();
const self = client; // クラス内参照用
client.ledger = new Ledger(process.env.GIST_ID, process.env.GITHUB_TOKEN);

// コマンド読み込み
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    }
}

// --- 3. 起動イベント ---
client.once('ready', async () => {
    await client.ledger.load(); // 起動時に帳簿を同期
    client.user.setStatus('idle');

    const updateStatus = () => {
        const now = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
        const timeStr = `${now.getUTCFullYear()}/${now.getUTCMonth() + 1}/${now.getUTCDate()}(${["日", "月", "火", "水", "木", "金", "土"][now.getUTCDay()]}) ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;
        
        const uptimeTotalMs = client.uptime;
        const uptimeStr = `${Math.floor(uptimeTotalMs / 86400000)}d ${Math.floor((uptimeTotalMs % 86400000) / 3600000)}h ${Math.floor((uptimeTotalMs % 3600000) / 60000)}m ${Math.floor((uptimeTotalMs % 60000) / 1000)}s`;

        client.user.setActivity(`${timeStr} | Up: ${uptimeStr} | ${client.ws.ping}ms`, { type: ActivityType.Watching });
    };

    updateStatus();
    setInterval(updateStatus, 5000);

    console.log(`-----------------------------------\nRb m/25 Online: ${client.user.tag}\n-----------------------------------`);
});

// --- 4. グローバルチャット・リレーロジック ---
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild || !client.ledger.data.global_chats) return;

    const gcList = client.ledger.data.global_chats;
    const currentGC = gcList.find(gc => gc.channelId === message.channelId);
    
    if (!currentGC) return; // 送信元がGC設定済みでなければ無視

    // 他の全サーバーへリレー
    for (const gc of gcList) {
        if (gc.channelId === message.channelId) continue;

        try {
            const webhook = new WebhookClient({ url: gc.webhookUrl });
            await webhook.send({
                content: message.content || " ",
                username: `${message.author.username} [${message.guild.name}]`,
                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                files: message.attachments.map(a => a.url)
            });
        } catch (err) {
            console.error(`Relay failed to ${gc.guildName}:`, err.message);
        }
    }
});

// --- 5. インタラクション受信 ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        const msg = { content: 'エラーが発生しました。', ephemeral: true };
        interaction.replied || interaction.deferred ? await interaction.followUp(msg) : await interaction.reply(msg);
    }
});

client.login(process.env.DISCORD_TOKEN);
