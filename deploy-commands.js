const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// 各コマンドファイルの data (JSON) を配列に集める
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    }
}

// RESTインスタンスの作成
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// デプロイ（登録）の実行
(async () => {
    try {
        console.log(`${commands.length} 個のアプリケーションコマンドを登録（更新）中...`);

        // グローバルコマンドとして登録
        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`${data.length} 個のアプリケーションコマンドを正常に登録しました！`);
        console.log('※グローバル登録の場合、反映に数分〜1時間ほどかかる場合があります。');
    } catch (error) {
        console.error(error);
    }
})();
