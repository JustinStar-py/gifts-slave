import { Telegraf, Context, Markup } from "telegraf";
import { Api, TelegramClient } from "telegram-gifts";
import bigInt from "big-integer";
import delay from "delay";
import { User, getUser, updateUser, readDb } from "./database.js";
import { env } from "./env.js";
import { Language, t } from "./i18n.js";

// A simple in-memory state for multi-step operations (like adding a filter).
// This is cleared when the user navigates to a new menu to avoid getting stuck.
const userSteps: Record<string, { step: string, data: any }> = {};

/**
 * Creates a unique payload for Telegram invoices to track payments.
 * @param userId The user's Telegram ID.
 * @param type The type of payment ('subscription' or 'deposit').
 * @param amount Optional amount for deposits.
 * @returns A unique string payload.
 */
const createInvoicePayload = (userId: number, type: 'subscription' | 'deposit', amount?: number) => {
    return `invoice-${userId}-${type}-${Date.now()}${amount ? `-${amount}` : ''}`;
};

/**
 * The main function to set up all bot commands, actions, and handlers.
 * @param client The authenticated TelegramClient instance.
 */
export function setupBot(client: TelegramClient) {
    const bot = new Telegraf(env.BOT_TOKEN);

    // --- Start & Language Commands ---

    bot.start(async (ctx) => {
        const userId = ctx.from.id.toString();
        await updateUser(userId, {}); // Ensure user exists in the database.
        return showMainMenu(ctx);
    });

    bot.command("language", (ctx) => {
        return showLanguageMenu(ctx);
    });

    // --- Action Handlers (for button clicks) ---

    bot.action("change_language", (ctx) => {
        return showLanguageMenu(ctx);
    });

    bot.action(/set_lang_(.+)/, async (ctx) => {
        const lang = ctx.match[1] as Language;
        await updateUser(ctx.from.id.toString(), { language: lang });
        await ctx.answerCbQuery(`Language set to ${lang}`);
        return showMainMenu(ctx);
    });

    bot.action("main_menu", async (ctx) => {
        await ctx.deleteMessage().catch(() => {});
        return showMainMenu(ctx);
    });

    bot.action("subscribe", async (ctx) => {
        const user = await getUser(ctx.from!.id.toString());
        const lang = user?.language || 'en';
        const payload = createInvoicePayload(ctx.from.id, 'subscription');
        await ctx.answerCbQuery();
        await ctx.replyWithInvoice({
            title: t(lang, 'subscribe_title') as string,
            description: t(lang, 'subscribe_description') as string,
            payload,
            provider_token: '', // IMPORTANT: Get this from @BotFather
            currency: "XTR",
            prices: [{ label: "Subscription Cost", amount: 200 }],
        });
    });

    bot.action('deposit_prompt', async (ctx) => {
        const user = await getUser(ctx.from.id.toString());
        const lang = user?.language || 'en';
        await ctx.answerCbQuery();
        await ctx.editMessageText(t(lang, 'deposit_prompt') as string);
    });

    // --- Settings Menu & Filter Flow ---

    bot.action("settings", async (ctx) => {
        delete userSteps[ctx.from.id];
        const user = await getUser(ctx.from.id.toString());
        const lang = user?.language || 'en';
        await ctx.deleteMessage().catch(() => {});

        let filterListText = user && user.filters.length > 0
            ? user.filters.map((f, i) => t(lang, 'filter_line')(i + 1, f.min_price, f.max_price, f.purchased_count, f.max_repeats)).join("\n\n")
            : t(lang, 'no_filters_set') as string;

        const menuText = t(lang, 'settings_menu_title')(filterListText);

        await ctx.reply(menuText, Markup.inlineKeyboard([
            [Markup.button.callback(t(lang, 'add_filter_button') as string, "add_filter_start")],
            [Markup.button.callback(t(lang, 'clear_filters_button') as string, "clear_filters")],
            [Markup.button.callback(t(lang, 'back_button') as string, "main_menu")]
        ]));
    });

    bot.action("add_filter_start", async (ctx) => {
        const user = await getUser(ctx.from.id.toString());
        const lang = user?.language || 'en';
        userSteps[ctx.from.id] = { step: "min_price", data: {} };
        await ctx.editMessageText(t(lang, 'min_price_prompt') as string);
    });

    bot.action("clear_filters", async (ctx) => {
        const user = await getUser(ctx.from.id.toString());
        const lang = user?.language || 'en';
        await updateUser(ctx.from.id.toString(), { filters: [] });
        await ctx.answerCbQuery(t(lang, 'filters_cleared_success') as string);
        const settingsCtx = { ...ctx, callbackQuery: { ...ctx.callbackQuery, data: 'settings' } };
        return bot.handleUpdate({ update_id: 0, callback_query: settingsCtx.callbackQuery });
    });

    // --- Admin Commands ---

    const isAdmin = (ctx: Context) => ctx.from?.id.toString() === env.ADMIN_ID;

    bot.command("addsub", async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ');
        if (args.length !== 2) return ctx.reply("Usage: /addsub <user_id>");
        
        const targetId = args[1];
        if (!/^\d+$/.test(targetId)) return ctx.reply("Invalid User ID.");
        
        await updateUser(targetId, {}); // Ensure user exists

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        await updateUser(targetId, { subscription_active: true, subscription_expires_at: expiryDate.toISOString() });
        
        const result = await createPrivateChannelForUser(client, targetId);
        
        let replyMessage = `✅ Subscription granted to user ${targetId} for one month.`;
        if (result) {
            replyMessage += `\n\nPlease send this private invite link to the user:\n${result.inviteLink}`;
            // Start the process of checking for join and promoting to admin
            handleAdminPromotion(client, bot, targetId);
        } else {
            replyMessage += `\n\nUser may already have a channel, or an error occurred.`;
        }
        
        await ctx.reply(replyMessage);
    });

    bot.command("addstars", async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ');
        if (args.length !== 3) return ctx.reply("Usage: /addstars <user_id> <amount>");
        const [, targetId, amountStr] = args;
        const amount = parseInt(amountStr, 10);
        if (isNaN(amount)) return ctx.reply("Invalid amount.");
        const user = await getUser(targetId);
        if (!user) return ctx.reply("User not found.");
        const newBalance = (user.balance || 0) + amount;
        await updateUser(targetId, { balance: newBalance });
        await ctx.reply(`✅ Successfully added ${amount} Stars to user ${targetId}. New balance: ${newBalance}.`);
    });

    bot.command("stats", async (ctx) => {
        if (!isAdmin(ctx)) return;
        const db = await readDb();
        const users = Object.values(db.users);
        const activeSubs = users.filter(u => u.subscription_active && new Date(u.subscription_expires_at!) > new Date()).length;
        let totalBalance = 0;
        users.forEach(u => totalBalance += u.balance);
        await ctx.reply(`📊 Bot Statistics:\n- Total Users: ${users.length}\n- Active Subscriptions: ${activeSubs}\n- Total Deposited Balance: ${totalBalance} Stars`);
    });

    bot.command("userinfo", async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ');
        if (args.length !== 2) return ctx.reply("Usage: /userinfo <user_id>");
        const targetId = args[1];
        const user = await getUser(targetId);
        if (!user) return ctx.reply("User not found.");
        const lang = user.language;
        const subStatus = user.subscription_active && new Date(user.subscription_expires_at!) > new Date() ? `${t(lang, 'active')} (Expires: ${new Date(user.subscription_expires_at!).toLocaleDateString()})` : t(lang, 'inactive');
        const filtersInfo = user.filters.length > 0 ? user.filters.map(f => `${f.min_price}-${f.max_price} (${f.purchased_count}/${f.max_repeats})`).join(', ') : t(lang, 'no_filters_set');
        await ctx.reply(`👤 User Info: ${targetId}\n\nLanguage: ${user.language}\nSubscription: ${subStatus}\nBalance: ${user.balance} Stars\nChannel ID: ${user.channel_id || "Not set"}\nFilters: ${filtersInfo}`);
    });

    // --- Payment and Text Handlers ---

    bot.on("pre_checkout_query", (ctx) => ctx.answerPreCheckoutQuery(true));

    bot.on("successful_payment", async (ctx) => {
        const userId = ctx.from.id.toString();
        const user = await getUser(userId);
        const lang = user?.language || 'en';
        const payload = ctx.message.successful_payment.invoice_payload;

        if (payload.includes('subscription')) {
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            await updateUser(userId, { subscription_active: true, subscription_expires_at: expiryDate.toISOString() });
            
            const result = await createPrivateChannelForUser(client, userId);
            const successMessage = t(lang, 'subscription_success') as string;
            
            if (result) {
                await ctx.reply(successMessage + "\n" + t(lang, 'channel_creation_success')(result.inviteLink));
                handleAdminPromotion(client, bot, userId);
            } else {
                await ctx.reply(successMessage);
            }
        } else if (payload.includes('deposit')) {
            const amount = ctx.message.successful_payment.total_amount;
            const newBalance = (user?.balance || 0) + amount;
            await updateUser(userId, { balance: newBalance });
            await ctx.reply(t(lang, 'deposit_success')(amount, newBalance));
        }
    });

    bot.on('text', async (ctx) => {
        const userId = ctx.from.id.toString();
        const user = await getUser(userId);
        const lang = user?.language || 'en';
        const stepData = userSteps[userId];
        const text = ctx.message.text;

        if (stepData) {
            const value = parseInt(text, 10);
            if (isNaN(value) || value < 0) return ctx.reply(t(lang, 'invalid_number_error') as string);
            switch (stepData.step) {
                case "min_price":
                    stepData.data.min_price = value; stepData.step = "max_price";
                    await ctx.reply(t(lang, 'max_price_prompt') as string);
                    break;
                case "max_price":
                    if (value < stepData.data.min_price) return ctx.reply(t(lang, 'max_price_error') as string);
                    stepData.data.max_price = value; stepData.step = "max_repeats";
                    await ctx.reply(t(lang, 'max_repeats_prompt') as string);
                    break;
                case "max_repeats":
                    stepData.data.max_repeats = value; stepData.data.purchased_count = 0;
                    const newFilters = [...(user?.filters || []), stepData.data];
                    await updateUser(userId, { filters: newFilters });
                    delete userSteps[userId];
                    await ctx.reply(t(lang, 'filter_added_success') as string);
                    const settingsCtx = { ...ctx, callbackQuery: { data: 'settings', from: ctx.from, message: await ctx.reply(".") } };
                    return bot.handleUpdate({ update_id: 0, callback_query: settingsCtx.callbackQuery });
            }
        } else {
            const amount = parseInt(text, 10);
            if (!isNaN(amount) && amount > 0) {
                if (!user?.subscription_active) return ctx.reply(t(lang, 'subscribe_first_prompt') as string);
                const payload = createInvoicePayload(ctx.from.id, 'deposit', amount);
                await ctx.replyWithInvoice({ title: t(lang, 'deposit_title') as string, description: t(lang, 'deposit_description')(amount), payload, provider_token: '', currency: "XTR", prices: [{ label: "Deposit Amount", amount }], });
            }
        }
    });

    bot.launch();
    console.log("Bot (final version) with 15s timed-check promotion has been launched.");
}

// --- Helper Functions ---

async function showMainMenu(ctx: Context) {
    delete userSteps[ctx.from!.id];
    const user = await getUser(ctx.from!.id.toString());
    const lang = user?.language || 'en';
    const subIsActive = user?.subscription_active && new Date(user.subscription_expires_at!) > new Date();
    const subStatus = subIsActive ? t(lang, 'active') as string : t(lang, 'inactive') as string;
    const text = t(lang, 'welcome')(subStatus, user?.balance || 0);
    const keyboard = subIsActive
        ? Markup.inlineKeyboard([
            [Markup.button.callback(t(lang, 'deposit_button') as string, "deposit_prompt")],
            [Markup.button.callback(t(lang, 'settings_button') as string, "settings")],
            [Markup.button.callback(t(lang, 'language_button') as string, "change_language")]
        ])
        : Markup.inlineKeyboard([
            [Markup.button.callback(t(lang, 'subscribe_button') as string, "subscribe")],
            [Markup.button.callback(t(lang, 'language_button') as string, "change_language")]
        ]);
    if (ctx.callbackQuery) await ctx.editMessageText(text, keyboard).catch(() => {});
    else await ctx.reply(text, keyboard);
}

async function showLanguageMenu(ctx: Context) {
    delete userSteps[ctx.from.id];
    const user = await getUser(ctx.from!.id.toString());
    const lang = user?.language || 'en';
    const text = t(lang, 'language_menu_title') as string;
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback("🇬🇧 English", "set_lang_en")],
        [Markup.button.callback("🇮🇷 فارسی", "set_lang_fa")],
        [Markup.button.callback("🇷🇺 Русский", "set_lang_ru")],
        [Markup.button.callback(t(lang, 'back_button') as string, "main_menu")]
    ]);
    if (ctx.callbackQuery) await ctx.editMessageText(text, keyboard).catch(() => {});
    else await ctx.reply(text, keyboard);
}

async function createPrivateChannelForUser(client: TelegramClient, userId: string): Promise<{ inviteLink: string; } | null> {
    const user = await getUser(userId);
    if (user && user.subscription_active && !user.channel_id) {
        try {
            const users = await client.invoke(new Api.users.GetUsers({ id: [new Api.InputUser({ userId: bigInt(userId), accessHash: bigInt(0) })] }));
            const userFirstName = (users[0] as Api.User).firstName || `User ${userId}`;
            const result = await client.invoke(new Api.channels.CreateChannel({ title: `⭐ Gifts for ${userFirstName}`, about: `Managed by bot for user ID: ${userId}`, megagroup: false })) as Api.Updates;
            const channel = result.chats[0] as Api.Channel;
            const channelId = bigInt(channel.id);
            const accessHash = bigInt(channel.accessHash!);
            await updateUser(userId, { channel_id: `-${channelId.toString()}`, channel_access_hash: accessHash.toString() });
            const inviteLinkResult = (await client.invoke(new Api.messages.ExportChatInvite({ peer: new Api.InputChannel({ channelId, accessHash }), usageLimit: 1 }))) as Api.ChatInviteExported;
            return { inviteLink: inviteLinkResult.link };
        } catch (error) {
            console.error(`Failed to create channel for user ${userId}:`, error);
            return null;
        }
    }
    return null;
}

async function handleAdminPromotion(client: TelegramClient, bot: Telegraf<Context>, userId: string) {
    const checkAndPromote = async (): Promise<boolean> => {
        const user = await getUser(userId);
        if (!user || !user.channel_id || !user.channel_access_hash) return false;
        const channelId = bigInt(user.channel_id.substring(1));
        const accessHash = bigInt(user.channel_access_hash);
        try {
            const participants = await client.invoke(new Api.channels.GetParticipants({
                channel: new Api.InputPeerChannel({ channelId, accessHash }),
                filter: new Api.ChannelParticipantsRecent(), limit: 100, hash: bigInt(0)
            }));
            const isMember = participants.users.some(u => u.id.toString() === userId);
            if (isMember) {
                console.log(`User ${userId} found in channel. Promoting...`);
                await client.invoke(new Api.channels.EditAdmin({
                    channel: new Api.InputPeerChannel({ channelId, accessHash }),
                    userId: new Api.InputUser({ userId: bigInt(userId), accessHash: bigInt(0) }),
                    adminRights: new Api.ChatAdminRights({ changeInfo: true, postMessages: true, editMessages: true, deleteMessages: true, banUsers: true, inviteUsers: true, pinMessages: true, addAdmins: true, anonymous: false, manageCall: true, other: true }),
                    rank: "Owner"
                }));
                await client.sendMessage(user.channel_id, { message: "✅ You have been promoted to Admin." });
                console.log(`User ${userId} successfully promoted.`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error during check/promotion for user ${userId}:`, error);
            return false;
        }
    };

    // First check after 10 seconds
    console.log(`Waiting 10 seconds to check for user ${userId} join...`);
    await delay(15000); // Changed from 60000 to 10000
    let isPromoted = await checkAndPromote();
    
    // If not promoted, send warning and check again after 15 seconds
    if (!isPromoted) {
        await bot.telegram.sendMessage(userId, "⚠️ We noticed you haven't joined your private channel yet. Please join within the next 15 seconds to be granted admin rights.");
        console.log(`Warning sent to user ${userId}. Waiting another 15 seconds...`);
        await delay(15000); // Changed from 60000 to 15000
        isPromoted = await checkAndPromote();
    }
    
    // If still not promoted, send final message
    if (!isPromoted) {
        console.log(`User ${userId} failed to join the channel in time.`);
        await bot.telegram.sendMessage(userId, "❌ You did not join the channel in time. Please contact support to be manually promoted.");
    }
}
