import PortalContent from '../models/PortalContent.js';

export const getPortalContent = async (req, res) => {
  try {
    const doc = await PortalContent.findOne({ key: 'default' }).lean();
    res.json(doc || null);
  } catch (error) {
    console.error('getPortalContent error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const upsertPortalContent = async (req, res) => {
  try {
    const payload = req.body || {};
    delete payload._id;
    delete payload.key;
    delete payload.createdAt;
    delete payload.updatedAt;

    const doc = await PortalContent.findOneAndUpdate(
      { key: 'default' },
      { $set: { key: 'default', ...payload } },
      { new: true, upsert: true }
    );

    res.json(doc);
  } catch (error) {
    console.error('upsertPortalContent error:', error);
    res.status(500).json({ message: error.message });
  }
};

