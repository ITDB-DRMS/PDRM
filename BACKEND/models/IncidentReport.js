import mongoose from 'mongoose';

const IncidentLocationSchema = new mongoose.Schema(
  {
    addressLine: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    region: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false }
);

const IncidentAttachmentSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: '' }, // image/video
    name: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const IncidentReportSchema = new mongoose.Schema(
  {
    reportCode: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'received', 'dispatched', 'closed'],
      default: 'submitted',
    },
    category: { type: String, trim: true, default: '' },
    severity: { type: String, trim: true, default: 'moderate' },
    location: { type: IncidentLocationSchema, default: () => ({}) },
    details: { type: String, trim: true, default: '' },
    fireInfo: {
      smellOfGas: { type: Boolean, default: false },
      estimatedSize: { type: String, trim: true, default: '' },
    },
    attachments: { type: [IncidentAttachmentSchema], default: [] },
    contact: {
      phone: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, lowercase: true, default: '' },
    },
    anonymous: { type: Boolean, default: false },
    createdByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastUpdatedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

IncidentReportSchema.index({ reportCode: 1 });
IncidentReportSchema.index({ status: 1 });
IncidentReportSchema.index({ category: 1 });
IncidentReportSchema.index({ severity: 1 });

export default mongoose.model('IncidentReport', IncidentReportSchema);
