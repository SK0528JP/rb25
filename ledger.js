const axios = require('axios');

class Ledger {
    constructor(gistId, token) {
        this.gistId = gistId;
        this.token = token;
        this.data = {
            global_chats: [],
            users: {} // ユーザーごとの所持金やXPを格納
        };
    }

    /**
     * Gistからデータを読み込む
     */
    async load() {
        if (!this.gistId || !this.token) {
            console.error('❌ [Ledger] Gist ID or Token is missing.');
            return;
        }
        try {
            const res = await axios.get(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    Authorization: `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const content = res.data.files['ledger.json'].content;
            this.data = JSON.parse(content);
            console.log('✅ [Ledger] Data synchronized with Gist.');
        } catch (err) {
            console.error('❌ [Ledger] Load failed:', err.response?.status || err.message);
        }
    }

    /**
     * Gistにデータを保存する
     */
    async save() {
        if (!this.gistId || !this.token) return;
        try {
            await axios.patch(`https://api.github.com/gists/${this.gistId}`, {
                files: {
                    'ledger.json': {
                        content: JSON.stringify(this.data, null, 4)
                    }
                }
            }, {
                headers: {
                    Authorization: `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            console.log('💾 [Ledger] Data saved to Gist.');
        } catch (err) {
            console.error('❌ [Ledger] Save failed:', err.message);
        }
    }

    /**
     * 特定のユーザーデータを取得（なければ初期化）
     */
    getUser(userId) {
        if (!this.data.users) this.data.users = {};
        if (!this.data.users[userId]) {
            this.data.users[userId] = {
                money: 100,
                xp: 0,
                level: 1,
                inventory: []
            };
        }
        return this.data.users[userId];
    }
}

module.exports = Ledger;
