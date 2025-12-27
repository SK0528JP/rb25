const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // コマンドの定義
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('ボットの応答速度を確認します。'),

    // 実行時の処理
    async execute(interaction) {
        // 送信までのレイテンシを計算
        const sent = await interaction.reply({ content: '測定中...', fetchReply: true, ephemeral: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        const pingEmbed = new EmbedBuilder()
            .setColor(0x00FF00) // 安定のグリーン
            .setTitle('📡 System Latency')
            .addFields(
                { name: 'Roundtrip', value: `\`${latency}ms\``, inline: true },
                { name: 'Websocket', value: `\`${interaction.client.ws.ping}ms\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Rb m/25 (Generic Edition)' });

        await interaction.editReply({ content: null, embeds: [pingEmbed] });
    },
};
