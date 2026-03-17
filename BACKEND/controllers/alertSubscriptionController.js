import AlertSubscription from '../models/AlertSubscription.js';

const sanitizeIncomingPayload = (payload) => {
  const clean = payload && typeof payload === 'object' ? { ...payload } : {};
  delete clean._id;
  delete clean.createdAt;
  delete clean.updatedAt;
  return clean;
};

// Public: create or update a subscription by email/phone
// POST /api/alert-subscriptions
export const upsertAlertSubscriptionPublic = async (req, res) => {
  try {
    const payload = sanitizeIncomingPayload(req.body || {});

    const email = (payload?.contact?.email || '').toString().trim().toLowerCase();
    const phone = (payload?.contact?.phone || '').toString().trim();

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    const query = email
      ? { 'contact.email': email }
      : { 'contact.phone': phone };

    const now = new Date();
    if (payload?.consent?.accepted === true && !payload?.consent?.acceptedAt) {
      payload.consent.acceptedAt = now;
    }

    const doc = await AlertSubscription.findOneAndUpdate(
      query,
      {
        $set: {
          ...payload,
          contact: { ...(payload.contact || {}), ...(email ? { email } : {}) },
          ...(req.user?._id ? { createdByUser: req.user._id, lastUpdatedByUser: req.user._id } : {}),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(doc);
  } catch (error) {
    console.error('upsertAlertSubscriptionPublic error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: list subscriptions
// GET /api/alert-subscriptions
export const listAlertSubscriptions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { 'contact.fullName': { $regex: search, $options: 'i' } },
        { 'contact.email': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.region': { $regex: search, $options: 'i' } },
      ];
    }

    const docs = await AlertSubscription.find(query).sort({ updatedAt: -1 }).lean();
    res.json(docs);
  } catch (error) {
    console.error('listAlertSubscriptions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: get single subscription
// GET /api/alert-subscriptions/:id
export const getAlertSubscriptionById = async (req, res) => {
  try {
    const doc = await AlertSubscription.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Subscription not found' });
    res.json(doc);
  } catch (error) {
    console.error('getAlertSubscriptionById error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin: update subscription
// PUT /api/alert-subscriptions/:id
export const updateAlertSubscription = async (req, res) => {
  try {
    const payload = sanitizeIncomingPayload(req.body || {});
    const doc = await AlertSubscription.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Subscription not found' });
    res.json(doc);
  } catch (error) {
    console.error('updateAlertSubscription error:', error);
    res.status(500).json({ message: error.message });
  }
};

