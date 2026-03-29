// /backend/utils/cron.js
const cron = require('node-cron');
const db = require('../config/db'); // MySQL connection

function startCronJobs() {
  // Clean token_blacklist every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await db.query(`
        DELETE FROM token_blacklist
        WHERE created_at < NOW() - INTERVAL 12 HOUR
      `);
      console.log('✅ token_blacklist cleaned');
    } catch (err) {
      console.error('❌ Error cleaning token_blacklist:', err);
    }
  });

  // Clean notifications every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await db.query(`
        DELETE FROM notifications
        WHERE is_read = TRUE
          AND created_at < NOW() - INTERVAL 1 DAY
      `);
      console.log('✅ notifications cleaned');
    } catch (err) {
      console.error('❌ Error cleaning notifications:', err);
    }
  });

  console.log('🕒 Cron jobs started');
}

module.exports = startCronJobs;