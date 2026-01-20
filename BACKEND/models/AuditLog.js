import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    resource: String,
    before: Object,
    after: Object,
    timestamp: { type: Date, default: Date.now },
    ip: String
});

export default mongoose.model('AuditLog', AuditLogSchema);
