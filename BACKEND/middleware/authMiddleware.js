import jwt from 'jsonwebtoken';
import * as userService from '../services/userService.js';
import dotenv from 'dotenv';
dotenv.config();

// Middleware to protect routes 
export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Use userService to get fully populated user
            const user = await userService.getUserById(decoded.id);
            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Check if user is active
            if (user.status !== 'active') {
                return res.status(401).json({ message: 'Not authorized, user account is inactive' });
            }
            // Avoid attaching passwordHash to request
            user.passwordHash = undefined;
            // ... existing code ...
            req.user = user;
            next();
        } catch (err) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req, res, next) => {
    if (req.user && req.user.roles && req.user.roles.some(r => r.name === 'Admin' || r.name === 'Super Admin')) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
