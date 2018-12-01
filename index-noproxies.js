const request = require('request');
const WebSocket = require('ws');
const chalk = require('chalk');
const fs = require('fs');
const Discord = {};

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

function startBot(token) {
    try {
        new Discord.Status().login(token);
    } catch(err) {
        startBot(token);
    }
}
    
fs.readFile('tokens.txt', (err, data) => {
    if (err) throw err;
    data.toString().replace(/\r/gi, '').split('\n').forEach(token => {
        try {
            startBot(token);
        } catch(err) {}
    });
});

Discord.Status = class {
    constructor() {
        this.ws = new WebSocket(`wss://gateway.discord.gg/?v=7&encoding=json`);
        this.setInterval = setInterval;
    }

    login(token) {
        this.ws.onmessage = async event => {
            const payload = JSON.parse(event.data);

            switch (payload.op) {
                case 0:
                    switch (payload.t) {
                        case 'READY':
                            this.user = payload.d.user;
                            this.ws.send(JSON.stringify({ op: 1, d: null }));
                            console.log(chalk.hex('#00FF00')('Logged into %s#%s | ID: %s'), this.user.username, this.user.discriminator, this.user.id);
                            break;
                    }
                    break;

                case 10:
                    this.setInterval(() => (this.ws.CLOSED || this.ws.CLOSING) ? null : this.ws.send(JSON.stringify({ op: 1, d: null })), payload.d.heartbeat_interval);
                    this.ws.send(JSON.stringify({ op: 2, d: { token: token, properties: { os: "Windows", browser: "Chrome", device: "", browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36", browser_version: "70.0.3538.110", os_version: "10", referrer: "", referring_domain: "", referrer_current: "", referring_domain_current: "", release_channel: "stable", client_build_number: 28657, client_event_source: null }, presence: { status: "online", since: 0, activities: [], afk: false }, compress: false } }));
                    break;

                case 9:
                    if (!payload.d) {
                        this.ws.close()
                        clearInterval(this.interval);
                    }
                    break;

                default:
                    break;
            }
        };

        this.ws.onclose = async message => {
            message.code === 4004 ? null : startBot(token);
        };
    }
};
