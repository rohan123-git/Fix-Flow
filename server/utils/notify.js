import Notification from '../models/Notification.js';
export async function notify(recipient, message, relatedTicket, type = 'ticket') {
  if (recipient) await Notification.create({ recipient, message, relatedTicket, type });
}
