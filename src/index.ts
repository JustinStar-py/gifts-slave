// @ts-ignore
import input from "input";
import { sessions, TelegramClient } from "telegram-gifts";
import { env } from "./env.js";
import { setupBot } from "./bot.js";
import { startCore } from "./core.js";

async function main() {
    console.log("Initializing client...");

    const stringSession = new sessions.StringSession(env.API_SESSION);
    const client = new TelegramClient(stringSession, env.API_ID, env.API_HASH, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: async () => await input.text("Phone number:"),
        password: async () => await input.text("TFA Password:"),
        phoneCode: async () => await input.text("Telegram code:"),
        onError: (err) => {
            console.error("Fatal Telegram Client error:", err);
            process.exit(1);
        },
    });

    if (!env.API_SESSION) {
        console.log("Save this session string to your .env file to avoid logging in again:");
        console.log(client.session.save());
    }

    console.log("Client connected successfully.");

    setupBot(client);
    startCore(client);
    
    console.log("Application is now fully running.");
}

main().catch(err => {
    console.error("Unhandled error in main function:", err);
    process.exit(1);
});