import IncidentReport from '../models/IncidentReport.js';
import * as auditService from '../services/auditService.js';

const sanitizeIncomingPayload = (payload) => {
  const clean = payload && typeof payload === 'object' ? { ...payload } : {};
  delete clean._id;
  delete clean.createdAt;
  delete clean.updatedAt;
  delete clean.reportCode;
  return clean;
};

const generateReportCode = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

// Public: create an incident report
// POST /api/incident-reports
export const createIncidentReportPublic = async (req, res) => {
  try {
    const payload = sanitizeIncomingPayload(req.body || {});

    const category = (payload.category || '').toString().trim();
    const severity = (payload.severity || '').toString().trim();
    const details = (payload.details || '').toString().trim();

    if (!category) {
      return res.status(400).json({ message: 'Incident category is required' });
    }
    if (!severity) {
      return res.status(400).json({ message: 'Severity is required' });
    }
    if (!details) {
      return res.status(400).json({ message: 'Details are required' });
    }

    let reportCode = generateReportCode();
    let attempts = 0;
    while (attempts < 3) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await IncidentReport.findOne({ reportCode }).lean();
      if (!existing) break;
      reportCode = generateReportCode();
      attempts += 1;
    }

    const doc = await IncidentReport.create({
      ...payload,
      reportCode,
      ...(req.user?._id ? { createdByUser: req.user._id, lastUpdatedByUser: req.user._id } : {}),
    });

    await auditService.logAction({
        userId: req.user?._id || 'PUBLIC_USER',
        action: 'INCIDENT_REPORT_CREATE',
        resource: 'IncidentReport',
        resourceId: doc._id,
        after: doc,
        ip: req.ip
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('createIncidentReportPublic error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: list incident reports
// GET /api/incident-reports
export const listIncidentReports = async (req, res) => {
  try {
    const { status, search, category, severity } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (search) {
      query.$or = [
        { reportCode: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { severity: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { 'location.addressLine': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.region': { $regex: search, $options: 'i' } },
      ];
    }

    const docs = await IncidentReport.find(query).sort({ updatedAt: -1 }).lean();
    res.json(docs);
  } catch (error) {
    console.error('listIncidentReports error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: get single report
// GET /api/incident-reports/:id
export const getIncidentReportById = async (req, res) => {
  try {
    const doc = await IncidentReport.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Report not found' });
    res.json(doc);
  } catch (error) {
    console.error('getIncidentReportById error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: update report
// PUT /api/incident-reports/:id
export const updateIncidentReport = async (req, res) => {
  try {
    const payload = sanitizeIncomingPayload(req.body || {});
    const beforeDoc = await IncidentReport.findById(req.params.id);
    if (!beforeDoc) return res.status(404).json({ message: 'Report not found' });
    const before = beforeDoc.toObject();

    const doc = await IncidentReport.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    await auditService.logAction({
        userId: req.user?._id,
        action: 'INCIDENT_REPORT_UPDATE',
        resource: 'IncidentReport',
        resourceId: doc._id,
        before,
        after: doc,
        ip: req.ip
    });

    res.json(doc);
  } catch (error) {
    console.error('updateIncidentReport error:', error);
    res.status(500).json({ message: error.message });
  }
};
