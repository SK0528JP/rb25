const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gc_setup')
        .setDescription('このチャンネルをグローバルチャット網に接続します（オートWebhook）')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Webhookの作成
            const webhook = await interaction.channel.createWebhook({
                name: 'Rb-m25-GC',
                avatar: interaction.client.user.displayAvatarURL(),
                reason: 'Global Chat setup'
            });

            // --- Gist保存処理のシミュレート ---
            // 実際にはここで Ledger クラスを使って Gist に webhook.url を保存します
            // ledger.addGlobalChat(interaction.guildId, interaction.channelId, webhook.url);
            
            await interaction.editReply({ 
                content: `📡 通信網への接続に成功。Webhookを作成しました。\nチャンネル: ${interaction.channel.name}` 
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Webhookの作成に失敗しました。権限を確認してください。' });
        }
    },
};
