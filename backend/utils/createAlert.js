const Alert = require('../models/Alert');

/**
 * Creates an alert without interrupting the calling operation if an error occurs.
 * @param {Object} data - Alert document data (type, message, recipient, recipientRole, equipment, transaction)
 * @returns {Promise<Object|null>} The created alert or null on error
 */
async function createAlert(data) {
  try {
    const alert = await Alert.create(data);
    return alert;
  } catch (error) {
    console.error('Failed to create alert:', error.message || error);
    return null;
  }
}

module.exports = createAlert;
