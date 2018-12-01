const request = require('request');
const tunnel = require('tunnel');
const WebSocket = require('ws');
const chalk = require('chalk');
const fs = require('fs');
const Discord = {};

var proxies = [];

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});

function startBot(token) {
    try {
        var proxy = proxies[Math.floor(Math.random() * proxies.length)].split(':');
        var agent = new tunnel.httpsOverHttp({ proxy: { hostname: proxy[0], port: parseInt(proxy[1]) } });
        new Discord.Status(agent).login(token);
    } catch(err) {
        startBot(token);
    }
}
    
fs.readFile('tokens.txt', (err, data) => {
    if (err) throw err;
    request.get("https://proxyscrape.com/proxies/HTTP_Working_Proxies.txt", (err, res, body) => {
        proxies = body.toString().replace(/\r/gi, '').split('\n');
        data.toString().replace(/\r/gi, '').split('\n').forEach(token => {
            try {
                startBot(token);
            } catch(err) {}
        });
    });
});

Discord.Status = class {
    constructor(agent) {
        this.ws = new WebSocket(`wss://gateway.discord.gg/?v=7&encoding=json`, { agent: agent });
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
