module.exports = {
  apps: [
    {
      // A descriptive name for your application in PM2
      name: 'telegram-gift-bot',

      // The command that starts your application.
      // We use 'npm' to run the 'start' script from your package.json
      script: 'npm',
      args: 'start',

      // Interpreter is not needed when using npm as the script
      // interpreter: 'node',

      // Automatically restart the application if it crashes
      autorestart: true,

      // Do not watch for file changes to restart.
      // This is ideal for a production environment.
      watch: false,

      // The maximum amount of memory your app can use before being restarted.
      // e.g., "512M" for 512 megabytes. Adjust as needed.
      max_memory_restart: '256M',

      // Environment variables for your application
      env: {
        NODE_ENV: 'production',
        // You can add other environment variables here if needed,
        // but it's better to keep them in your .env file
        // since you are using the dotenv-safe package.
      },

      // --- Logging ---
      // File path for standard output logs
      out_file: './logs/bot-out.log',

      // File path for error logs
      error_file: './logs/bot-error.log',

      // Merge logs from all instances of the app
      merge_logs: true,

      // Format for log timestamps
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};