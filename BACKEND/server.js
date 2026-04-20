import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import sectorRoutes from './routes/sectorRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import rolePermissionRoutes from './routes/rolePermissionRoutes.js';
import hierarchyRoutes from './routes/hierarchyRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import formResponseRoutes from './routes/formResponseRoutes.js';
import woredaProfileRoutes from './routes/woredaProfileRoutes.js';
import profileMappingRoutes from './routes/profileMappingRoutes.js';
import portalContentRoutes from './routes/portalContentRoutes.js';
import incidentReportRoutes from './routes/incidentReportRoutes.js';
import alertSubscriptionRoutes from './routes/alertSubscriptionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminLogRoutes from './routes/adminLogRoutes.js';
import emailLogRoutes from './routes/emailLogRoutes.js';
import profileMappingRoutes from './routes/profileMappingRoutes.js';
import portalContentRoutes from './routes/portalContentRoutes.js';
import incidentReportRoutes from './routes/incidentReportRoutes.js';
import alertSubscriptionRoutes from './routes/alertSubscriptionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import cors from 'cors';

dotenv.config();
connectDB();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// app.use(cors());
// for external access
app.use(cors({
    origin: "*"
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
import fs from 'fs';
const logFile = fs.createWriteStream('server_logs.txt', { flags: 'a' });



//request logging middleware
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (data) {
        const logLine = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - STATUS: ${res.statusCode}\n`;
        console.log(logLine.trim());
        logFile.write(logLine);
        return originalSend.apply(res, arguments);
    };
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/roles', rolePermissionRoutes); // Mounts on /api/roles to support /api/roles/:id/permissions
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/responses', formResponseRoutes);
app.use('/api/woreda-profiles', woredaProfileRoutes);
app.use('/api/profile-mappings', profileMappingRoutes);
app.use('/api/site-settings', portalContentRoutes);
app.use('/api/incident-reports', incidentReportRoutes);
app.use('/api/alert-subscriptions', alertSubscriptionRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin-logs', adminLogRoutes);
app.use('/api/email-logs', emailLogRoutes);
app.use('/api/profile-mappings', profileMappingRoutes);
app.use('/api/site-settings', portalContentRoutes);
app.use('/api/incident-reports', incidentReportRoutes);
app.use('/api/alert-subscriptions', alertSubscriptionRoutes);
app.use('/api/uploads', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Diagnostic for FormResponse model
import FormResponse from './models/FormResponse.js';
console.log("FormResponse Schema Keys:", Object.keys(FormResponse.schema.paths));
if (FormResponse.schema.paths.moduleContextType.enumValues) {
    console.log("WARNING: moduleContextType still has enums:", FormResponse.schema.paths.moduleContextType.enumValues);
} else {
    console.log("SUCCESS: moduleContextType enum has been removed.");
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// for external access
app.listen(5000, "0.0.0.0", () => {
    console.log("Server running");
});





