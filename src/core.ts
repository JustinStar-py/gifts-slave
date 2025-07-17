import { Api, TelegramClient } from "telegram-gifts";
import delay from "delay";
import BigInteger from "big-integer";
import { readDb, updateUser } from "./database.js";

interface NewGift {
  id: string;
  supply: number;
  price: number;
}

interface Status {
  new_gifts: NewGift[];
  status: string;
  error: null | string;
}

export async function startCore(client: TelegramClient) {
  console.log("Core logic started, monitoring for gifts...");

  while (true) {
    try {
      const response = await fetch("http://38.180.240.96:3001/status");
      const statusData = (await response.json()) as Status;

      if (statusData.status !== "ok" || !statusData.new_gifts.length) {
        await delay(5000);
        continue;
      }

      const db = await readDb();
      const userIds = Object.keys(db.users);

      for (const userId of userIds) {
        const user = db.users[userId];

        const subIsActive = user.subscription_active && new Date(user.subscription_expires_at!) > new Date();
        if (!subIsActive || !user.channel_id) {
          continue;
        }

        for (const gift of statusData.new_gifts) {
          if (user.balance < gift.price) {
            continue;
          }

          // Find a matching filter from the user's list of filters.
          const matchingFilter = user.filters.find(f => 
            gift.price >= f.min_price && 
            gift.price <= f.max_price && 
            f.purchased_count < f.max_repeats
          );

          if (matchingFilter) {
            console.log(`Found matching gift ${gift.id} for user ${userId}. Attempting to buy...`);
            const wasPurchased = await purchaseAndSendGift(client, user.channel_id, gift);
            
            if (wasPurchased) {
              user.balance -= gift.price;
              matchingFilter.purchased_count++;
              
              await updateUser(userId, { 
                balance: user.balance, 
                filters: user.filters 
              });
              
              console.log(`Successfully purchased gift ${gift.id} for user ${userId}. New balance: ${user.balance}`);
              
              await client.sendMessage(user.channel_id, {
                  message: `🎁 Gift purchased!\nID: ${gift.id}\nPrice: ${gift.price} Stars\nRemaining Balance: ${user.balance} Stars`
              });
            }
          }
        }
      }
      await delay(1000);
    } catch (error) {
      console.error("An error occurred in the core loop:", error);
      await delay(10000);
    }
  }
}

async function purchaseAndSendGift(client: TelegramClient, channelId: string, gift: NewGift): Promise<boolean> {
  try {
    const peerChannelId = BigInteger(channelId.substring(1));
    const invoice = new Api.InputInvoiceStarGift({
        peer: new Api.InputPeerChannel({ channelId: peerChannelId, accessHash: BigInteger(0) }),
        giftId: BigInteger(gift.id),
        hideName: true,
    });
    const paymentForm = await client.invoke(new Api.payments.GetPaymentForm({ invoice }));
    if (
        paymentForm.invoice instanceof Api.Invoice &&
        paymentForm.invoice.prices.length === 1 &&
        paymentForm.invoice.prices[0].amount.toJSNumber() === gift.price
    ) {
        await client.invoke(new Api.payments.SendStarsForm({ 
            invoice, 
            formId: paymentForm.formId 
        }));
        return true;
    }
    return false;
  } catch (error) {
    console.error(`Failed to purchase gift ${gift.id} for channel ${channelId}:`, error);
    return false;
  }
}