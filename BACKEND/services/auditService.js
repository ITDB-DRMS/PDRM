import AuditLog from '../models/AuditLog.js';

export const logAction = async ({ userId, action, resource, resourceId, before, after, ip, details }) => {
    try {
        const logEntry = new AuditLog({
            userId,
            action,
            resource,
            resourceId, // Adding this to model might be useful if strictly needed, but current model has 'resource' string. 
            // I'll stick to 'resource' as generic description or "Type: ID" string.
            // Or I can add 'details' object to store extra info.
            before,
            after,
            ip,
            details // If model allows mixed or specific field. Current model has 'before'/'after' as Object.
        });

        // Adjusting to match existing model structure:
        // Model: userId, action, resource, before, after, ip.

        await logEntry.save();
        console.log(`Audit Log: ${action} on ${resource} by ${userId}`);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't block main flow if logging fails? 
    }
};
