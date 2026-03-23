import mongoose from 'mongoose';

const EmailLogSchema = new mongoose.Schema({
    recipient: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String }, // Plain text version or snippet
    template: { type: String }, // Template name used
    status: { type: String, enum: ['pending', 'sent', 'failed', 'read', 'unread'], default: 'pending' },
    messageId: { type: String }, // ID from Nodemailer
    error: { type: String }, // Error message if failed
    retryCount: { type: Number, default: 0 },
    type: { type: String, enum: ['Verification', 'Welcome', 'PasswordReset', 'AccountSetup', 'Alert', 'Notification', 'Manual', 'Other'], default: 'Other' },
    folder: { type: String, enum: ['inbox', 'sent', 'draft', 'trash'], default: 'sent' },
    openedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('EmailLog', EmailLogSchema);
