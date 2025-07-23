// This file centralizes all user-facing text for easy translation.

export const languages = {
    // --- English Translations ---
    en: {
        // Main Menu & General
        welcome: (status: string, balance: number) => `Welcome! Here you can manage your gift auto-buyer.\n\n▫️ Subscription: ${status}\n▫️ Balance: ${balance} Stars`,
        active: "Active",
        inactive: "Inactive",
        back_button: "⬅️ Back",
        
        // Main Menu Buttons
        subscribe_button: "💎 Subscribe (200 Stars/month)",
        deposit_button: "💰 Deposit Stars",
        settings_button: "⚙️ Settings",
        language_button: "🌐 Language",

        // Subscription & Deposit
        subscribe_title: "Monthly Subscription",
        subscribe_description: "Unlock full access to the gift auto-buyer bot for one month.",
        deposit_title: "Deposit Stars",
        deposit_description: (amount: number) => `Add ${amount} Stars to your gift-buying balance.`,
        deposit_prompt: "Please enter the amount of Stars you want to deposit:",
        subscribe_first_prompt: "Please subscribe first before depositing Stars.",
        
        // Success & Error Messages
        subscription_success: "✅ Subscription successful! Your access is valid for one month.",
        deposit_success: (amount: number, newBalance: number) => `✅ Deposit successful! ${amount} Stars added. New balance is ${newBalance} Stars.`,
        channel_creation_success: (link: string) => `🎉 Your private channel has been created! You can access it here: ${link}`,
        channel_creation_error: "There was an error creating your private channel. Please contact support.",
        invalid_number_error: "Please enter a valid, non-negative number.",
        max_price_error: "Max price cannot be less than min price. Please enter a valid max price:",

        // Settings Menu
        settings_menu_title: (filters: string) => `Your current filters:\n\n${filters}`,
        no_filters_set: "You have no filters set.",
        filter_line: (i: number, min: number, max: number, p_count: number, m_repeats: number) => `Filter #${i}: Price ${min}-${max}, Repeats: ${p_count}/${m_repeats}`,
        add_filter_button: "➕ Add New Filter",
        clear_filters_button: "🗑️ Clear All Filters",
        filters_cleared_success: "All your filters have been cleared!",

        // Filter Creation Flow
        min_price_prompt: "Enter the minimum price for the new filter (e.g., 0):",
        max_price_prompt: "Great. Now enter the maximum price:",
        max_repeats_prompt: "Excellent. Finally, how many times should this be repeated?:",
        filter_added_success: "✅ New filter added successfully!",

        // Language Menu
        language_menu_title: "Please choose your language:",
    },

    // --- Persian (Farsi) Translations ---
    fa: {
        welcome: (status: string, balance: number) => `خوش آمدید! از اینجا می‌توانید ربات خریدار خودکار گیفت را مدیریت کنید.\n\n▫️ وضعیت اشتراک: ${status}\n▫️ موجودی: ${balance} استارز`,
        active: "فعال",
        inactive: "غیرفعال",
        back_button: "⬅️ بازگشت",

        subscribe_button: "💎 خرید اشتراک (200 استارز در ماه)",
        deposit_button: "💰 واریز استارز",
        settings_button: "⚙️ تنظیمات",
        language_button: "🌐 تغییر زبان",

        subscribe_title: "اشتراک ماهانه",
        subscribe_description: "دسترسی کامل به ربات خریدار خودکار گیفت به مدت یک ماه.",
        deposit_title: "واریز استارز",
        deposit_description: (amount: number) => `افزودن ${amount} استارز به موجودی خرید گیفت شما.`,
        deposit_prompt: "لطفاً مقدار استارزی که می‌خواهید واریز کنید را وارد نمایید:",
        subscribe_first_prompt: "لطفاً ابتدا اشتراک تهیه کنید و سپس استارز واریز نمایید.",

        subscription_success: "✅ اشتراک شما با موفقیت فعال شد و به مدت یک ماه اعتبار دارد.",
        deposit_success: (amount: number, newBalance: number) => `✅ واریز موفقیت‌آمیز بود! ${amount} استارز به موجودی شما اضافه شد. موجودی جدید: ${newBalance} استارز.`,
        channel_creation_success: (link: string) => `🎉 کانال خصوصی شما ساخته شد! از طریق لینک زیر می‌توانید به آن دسترسی پیدا کنید: ${link}`,
        channel_creation_error: "خطایی در ساخت کانال خصوصی شما رخ داد. لطفاً با پشتیبانی تماس بگیرید.",
        invalid_number_error: "لطفاً یک عدد صحیح و معتبر وارد کنید.",
        max_price_error: "قیمت حداکثر نمی‌تواند کمتر از قیمت حداقل باشد. لطفاً یک قیمت معتبر وارد کنید:",

        settings_menu_title: (filters: string) => `فیلترهای فعلی شما:\n\n${filters}`,
        no_filters_set: "شما هیچ فیلتری تنظیم نکرده‌اید.",
        filter_line: (i: number, min: number, max: number, p_count: number, m_repeats: number) => `فیلتر #${i}: قیمت ${min}-${max}، تکرار: ${p_count} از ${m_repeats}`,
        add_filter_button: "➕ افزودن فیلتر جدید",
        clear_filters_button: "🗑️ پاک کردن همه فیلترها",
        filters_cleared_success: "تمام فیلترهای شما پاک شدند!",

        min_price_prompt: "حداقل قیمت برای فیلتر جدید را وارد کنید (مثلاً 0):",
        max_price_prompt: "عالی. حالا حداکثر قیمت را وارد کنید:",
        max_repeats_prompt: "بسیار خب. در نهایت، این قانون چند بار تکرار شود؟:",
        filter_added_success: "✅ فیلتر جدید با موفقیت اضافه شد!",

        language_menu_title: "لطفاً زبان خود را انتخاب کنید:",
    },

    // --- Russian Translations ---
    ru: {
        welcome: (status: string, balance: number) => `Добро пожаловать! Здесь вы можете управлять вашим авто-покупателем подарков.\n\n▫️ Статус подписки: ${status}\n▫️ Баланс: ${balance} звёзд`,
        active: "Активна",
        inactive: "Неактивна",
        back_button: "⬅️ Назад",

        subscribe_button: "💎 Подписаться (200 звёзд/месяц)",
        deposit_button: "💰 Внести звёзды",
        settings_button: "⚙️ Настройки",
        language_button: "🌐 Язык",

        subscribe_title: "Месячная подписка",
        subscribe_description: "Полный доступ к боту авто-покупки подарков на один месяц.",
        deposit_title: "Внести звёзды",
        deposit_description: (amount: number) => `Добавить ${amount} звёзд на ваш баланс для покупки подарков.`,
        deposit_prompt: "Пожалуйста, введите количество звёзд, которое вы хотите внести:",
        subscribe_first_prompt: "Пожалуйста, сначала подпишитесь, прежде чем вносить звёзды.",

        subscription_success: "✅ Подписка успешно оформлена! Ваш доступ действителен в течение одного месяца.",
        deposit_success: (amount: number, newBalance: number) => `✅ Внесение успешно! ${amount} звёзд добавлено на ваш баланс. Новый баланс: ${newBalance} звёзд.`,
        channel_creation_success: (link: string) => `🎉 Ваш личный канал был создан! Вы можете получить к нему доступ здесь: ${link}`,
        channel_creation_error: "Произошла ошибка при создании вашего личного канала. Пожалуйста, свяжитесь с поддержкой.",
        invalid_number_error: "Пожалуйста, введите действительное, неотрицательное число.",
        max_price_error: "Максимальная цена не может быть меньше минимальной. Пожалуйста, введите действительную максимальную цену:",

        settings_menu_title: (filters: string) => `Ваши текущие фильтры:\n\n${filters}`,
        no_filters_set: "У вас нет настроенных фильтров.",
        filter_line: (i: number, min: number, max: number, p_count: number, m_repeats: number) => `Фильтр #${i}: Цена ${min}-${max}, Повторы: ${p_count}/${m_repeats}`,
        add_filter_button: "➕ Добавить новый фильтр",
        clear_filters_button: "🗑️ Очистить все фильтры",
        filters_cleared_success: "Все ваши фильтры были очищены!",

        min_price_prompt: "Введите минимальную цену для нового фильтра (например, 0):",
        max_price_prompt: "Отлично. Теперь введите максимальную цену:",
        max_repeats_prompt: "Прекрасно. Наконец, сколько раз это следует повторить?:",
        filter_added_success: "✅ Новый фильтр успешно добавлен!",

        language_menu_title: "Пожалуйста, выберите ваш язык:",
    },
};

export type Language = keyof typeof languages;
const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Gets a translated string for a given key and language.
 * Falls back to the default language (English) if the key or language is not found.
 * @param lang The user's selected language.
 * @param key The key of the string to translate.
 * @returns The translated string, which might be a function.
 */
export function t(lang: Language | undefined, key: keyof (typeof languages['en'])) {
    const language = lang && languages[lang] ? lang : DEFAULT_LANGUAGE;
    const translation = languages[language][key] || languages[DEFAULT_LANGUAGE][key];
    return translation;
}