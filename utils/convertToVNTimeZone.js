const moment = require('moment-timezone');

function formatTimeInVietnamTimeZone(timestamp) {
  return moment(timestamp).tz('Asia/Ho_Chi_Minh').format('DD-MM-YYYY HH:mm:ss');
}

module.exports = {
  formatTimeInVietnamTimeZone,
};
