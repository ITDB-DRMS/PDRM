import * as userService from '../services/userService.js';
import * as auditService from '../services/auditService.js';
import { validateUser, transformUserInput, formatUserResponse } from '../dto/userDTO.js';
import { sendVerificationEmail, sendAccountSetupEmail } from '../services/emailService.js';

// Create User
export const createUser = async (req, res) => {
    try {
        const transformed = transformUserInput(req.body);

        // Use default password if not provided
        if (!transformed.password) {
            transformed.password = process.env.DEFAULT_PASSWORD;
        }
        if (req.file) {
            transformed.profileImage = req.file;
        }

        // Generate Setup Token (using verificationCode field but long string)
        const crypto = await import('crypto');
        const setupToken = crypto.randomBytes(32).toString('hex');
        transformed.verificationCode = setupToken;
        transformed.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const validation = validateUser(transformed);
        if (!validation.isValid) return res.status(400).json({ errors: validation.errors });

        const user = await userService.createUser(transformed);

        // Send Account Setup Email
        try {
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const setupUrl = `${clientUrl}/setup-account?token=${setupToken}`;
            console.log('--- ACCOUNT SETUP LINK (DEV) ---');
            console.log(setupUrl);
            console.log('-------------------------------');
            await sendAccountSetupEmail(user.email, setupUrl);
        } catch (emailError) {
            console.error("Failed to send setup email:", emailError);
        }

        if (req.user) {
            await auditService.logAction({
                userId: req.user.id,
                action: 'USER_CREATE',
                resource: 'User',
                after: { id: user._id, email: user.email },
                ip: req.ip
            });
        }

        res.status(201).json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all users
export const getUsers = async (req, res) => {
    try {
        const query = req.dataScope || {};
        const users = await userService.getAllUsers(query);
        res.json(users.map(formatUserResponse));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const transformed = transformUserInput(req.body);
        if (req.file) {
            transformed.profileImage = req.file;
        }
        // Validation for update can be partial or stricter depending on needs.
        // For now allowing partial updates without strict validation of all fields.

        // Get 'before' state for audit logging
        const beforeUser = await userService.getUserById(req.params.id);
        if (!beforeUser) return res.status(404).json({ message: 'User not found' });

        const user = await userService.updateUserById(req.params.id, transformed);

        if (req.user) {
            const beforeFormatted = formatUserResponse(beforeUser);
            const afterFormatted = formatUserResponse(user);

            console.log('Audit Log Debug - Before:', JSON.stringify(beforeFormatted, null, 2));
            console.log('Audit Log Debug - After:', JSON.stringify(afterFormatted, null, 2));

            await auditService.logAction({
                userId: req.user.id,
                action: 'USER_UPDATE',
                resource: 'User',
                before: beforeFormatted,
                after: afterFormatted,
                ip: req.ip
            });
        }

        res.json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete user
export const deleteUser = async (req, res) => {
    try {
        const user = await userService.deleteUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.user) {
            await auditService.logAction({
                userId: req.user.id,
                action: 'USER_DELETE',
                resource: 'User',
                before: { id: user._id, email: user.email },
                ip: req.ip
            });
        }

        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
