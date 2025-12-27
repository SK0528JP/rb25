const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

// 1. Clientインスタンスの生成
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// 2. コマンド格納用のコレクションを作成
client.commands = new Collection();

// 3. commandsフォルダからコマンドファイルを読み込む
const commandsPath = path.join(__dirname, 'commands');
// フォルダが存在しない場合のエラー回避
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    // コマンドファイルに必要なプロパティがあるか確認して登録
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`[LOADED]: /${command.data.name}`);
    } else {
        console.log(`[WARNING]: ${filePath} には 'data' または 'execute' プロパティがありません。`);
    }
}

// 4. スラッシュコマンド（Interaction）の受け取り設定
client.on(Events.InteractionCreate, async interaction => {
    // チャットコマンド以外は無視
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`${interaction.commandName} というコマンドは見つかりませんでした。`);
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

// 5. 起動時イベント
client.once(Events.ClientReady, c => {
    console.log('-----------------------------------');
    console.log(`Rb m/25 (Generic Edition)`);
    console.log(`Status: Online`);
    console.log(`Logged in as: ${c.user.tag}`);
    console.log('-----------------------------------');
});

// 6. ログイン
client.login(process.env.DISCORD_TOKEN);
