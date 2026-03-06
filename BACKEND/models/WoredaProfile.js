import mongoose from 'mongoose';

const adminLocationSchema = new mongoose.Schema({
    region: { type: String, required: true },
    zone: { type: String, required: true },
    woreda: { type: String, required: true },
    kebele: { type: String, required: true },
    got: { type: String }
});

const demographicsSchema = new mongoose.Schema({
    total_population: { type: Number },
    male_population: { type: Number },
    female_population: { type: Number },
    children_0_17: { type: Number },
    youth_18_29: { type: Number },
    adults_30_59: { type: Number },
    elderly_60_plus: { type: Number },
    total_households: { type: Number },
    female_headed_households: { type: Number },
    informal_settlement_population: { type: Number },
    low_income_households: { type: Number },
    unemployment_rate: { type: Number }, // stored as percentage e.g. 33
    internally_displaced_population: { type: Number },
    education_levels: [{
        category: String,
        count: Number
    }]
});

const livelihoodSchema = new mongoose.Schema({
    livelihood_type: { type: String, required: true },
    households: { type: Number },
    percentage: { type: Number }
});

const basicServiceSchema = new mongoose.Schema({
    water_source: { type: String },
    electricity: { type: Boolean },
    road_access: { type: String, enum: ['All-weather', 'Seasonal', 'No road', ''] },
    drainage_system_coverage: { type: Boolean },
    solid_waste_management_coverage: { type: Boolean },
    telecommunications_access: { type: Boolean },
    critical_lifeline_redundancy: { type: Boolean }
});

const criticalFacilitySchema = new mongoose.Schema({
    facility_type: { type: String, required: true },
    distance_to_nearest_emergency_service: { type: Number }, // in km
    structural_safety: { type: String, enum: ['Good', 'Fair', 'Poor', ''] },
    emergency_equipment_available: { type: Boolean }
});

const vulnerableGroupSchema = new mongoose.Schema({
    group_type: { type: String, required: true },
    number: { type: Number }
});

const communityCapacitySchema = new mongoose.Schema({
    capacity_type: { type: String, required: true },
    available: { type: Boolean },
    remarks: { type: String }
});

const woredaProfileSchema = new mongoose.Schema({
    location: { type: adminLocationSchema, required: true },
    assessment_date: { type: Date, required: true },
    assessed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    demographics: { type: demographicsSchema },
    livelihoods: [livelihoodSchema],
    basic_services: { type: basicServiceSchema },
    critical_facilities: [criticalFacilitySchema],
    vulnerable_groups: [vulnerableGroupSchema],
    community_capacity: [communityCapacitySchema],
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Reviewed'],
        default: 'Draft'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

woredaProfileSchema.index({ 'location.region': 1, 'location.woreda': 1 });

export default mongoose.model('WoredaProfile', woredaProfileSchema);
