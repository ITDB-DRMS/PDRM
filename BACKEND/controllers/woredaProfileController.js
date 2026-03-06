import WoredaProfile from '../models/WoredaProfile.js';
import * as XLSX from 'xlsx';

// @desc    Get all Woreda Profiles
// @route   GET /api/woreda-profiles
export const getWoredaProfiles = async (req, res) => {
    try {
        const { region, woreda, status } = req.query;
        let query = {};
        if (region) query['location.region'] = { $regex: region, $options: 'i' };
        if (woreda) query['location.woreda'] = { $regex: woreda, $options: 'i' };
        if (status) query.status = status;

        const profiles = await WoredaProfile.find(query)
            .sort({ updatedAt: -1 })
            .populate('assessed_by', 'fullname')
            .populate('createdBy', 'fullname');

        res.json(profiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single Woreda Profile
// @route   GET /api/woreda-profiles/:id
export const getWoredaProfileById = async (req, res) => {
    try {
        const profile = await WoredaProfile.findById(req.params.id)
            .populate('assessed_by', 'fullname')
            .populate('createdBy', 'fullname');

        if (!profile) return res.status(404).json({ message: 'Woreda Profile not found' });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new Woreda Profile
// @route   POST /api/woreda-profiles
export const createWoredaProfile = async (req, res) => {
    try {
        const profile = new WoredaProfile({
            ...req.body,
            createdBy: req.user?._id,
            assessed_by: req.user?._id
        });
        const saved = await profile.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Woreda Profile
// @route   PUT /api/woreda-profiles/:id
export const updateWoredaProfile = async (req, res) => {
    try {
        const profile = await WoredaProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Woreda Profile not found' });

        Object.assign(profile, req.body);
        const updated = await profile.save();
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete Woreda Profile
// @route   DELETE /api/woreda-profiles/:id
export const deleteWoredaProfile = async (req, res) => {
    try {
        const profile = await WoredaProfile.findByIdAndDelete(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Woreda Profile not found' });
        res.json({ message: 'Woreda Profile deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get summary stats
// @route   GET /api/woreda-profiles/stats
export const getWoredaProfileStats = async (req, res) => {
    try {
        const total = await WoredaProfile.countDocuments();
        const submitted = await WoredaProfile.countDocuments({ status: 'Submitted' });
        const draft = await WoredaProfile.countDocuments({ status: 'Draft' });
        const reviewed = await WoredaProfile.countDocuments({ status: 'Reviewed' });

        const totalPopulation = await WoredaProfile.aggregate([
            { $group: { _id: null, sum: { $sum: '$demographics.total_population' } } }
        ]);

        res.json({
            total,
            submitted,
            draft,
            reviewed,
            totalPopulation: totalPopulation[0]?.sum || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Import Woreda Profile from Excel
// @route   POST /api/woreda-profiles/import
export const importWoredaProfile = async (req, res) => {
    try {
        const { dryRun, status } = req.query;
        const commit = dryRun !== 'true';
        const finalStatus = status || 'Submitted';

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = {};

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            data[sheetName.trim()] = XLSX.utils.sheet_to_json(worksheet);
        });

        // Basic validation - check if required sheets exist
        const requiredSheets = ['admin_location', 'community', 'demographics'];
        const missingSheets = requiredSheets.filter(s => !data[s]);
        if (missingSheets.length > 0) {
            return res.status(400).json({ message: `Missing required sheets: ${missingSheets.join(', ')}` });
        }

        const adminRows = data['admin_location'];
        const commRows = data['community'];
        const demoRows = data['demographics'];
        const liveRows = data['livelihoods'] || [];
        const serviceRows = data['Basic service'] || [];
        const facilityRows = data['Critical_Facilities'] || [];
        const vulnerableRows = data['vulnerable_groups'] || [];
        const capacityRows = data['community_capacity'] || [];

        // For now, we assume one profile per file or at least we take the first valid one
        // More sophisticated logic would handle multiple profiles if IDs match
        
        const importedProfiles = [];

        // Map data from the sheets
        // Note: Column names in Excel might have spaces
        for (let i = 0; i < adminRows.length; i++) {
            const admin = adminRows[i];
            const location_id = admin.location_id;

            // Find matching rows in other sheets by location_id/community_id
            const comm = commRows.find(c => c.location_id === location_id);
            if (!comm) continue;

            const community_id = comm.community_id;
            const demo = demoRows.find(d => d.community_id === community_id);
            const livelihoods = liveRows.filter(l => l.community_id === community_id);
            const services = serviceRows.find(s => s.community_id === community_id);
            const facilities = facilityRows.filter(f => f['community_id\xa0'] === community_id || f.community_id === community_id);
            const vulnerable = vulnerableRows.filter(v => v.community_id === community_id);
            const capacity = capacityRows.filter(c => c.community_id === community_id);

            const profileData = {
                location: {
                    region: admin.region,
                    zone: admin.zone,
                    woreda: admin.woreda,
                    kebele: admin.kebele,
                    got: admin.got
                },
                assessment_date: comm.assessment_date,
                remarks: comm.remarks,
                demographics: demo ? {
                    total_population: demo.total_population,
                    male_population: demo.male_population,
                    female_population: demo.female_population,
                    children_0_17: demo.children_0_17,
                    youth_18_29: demo.youth_18_29,
                    adults_30_59: demo.adults_30_59,
                    elderly_60_plus: demo.elderly_60_plus,
                    total_households: demo.total_households,
                    female_headed_households: parseInt(demo['Numberof_female_headed _households']) || 0,
                    informal_settlement_population: 0,
                    low_income_households: demo.Low_income_households,
                    unemployment_rate: 0,
                    internally_displaced_population: 0,
                    education_levels: []
                } : undefined,
                livelihoods: livelihoods.map(l => ({
                    livelihood_type: l.livelihood_type,
                    households: l.households,
                    percentage: l.percentage
                })),
                basic_services: services ? {
                    water_source: services.water_source,
                    electricity: services.electricity === 'Yes',
                    road_access: services.road_access,
                    drainage_system_coverage: services['drainage_system_coverage '] === 'yes',
                    solid_waste_management_coverage: services.solid_waste_management_coverage === 'yes',
                    telecommunications_access: services['Telecommunications_ access'] === 'yes',
                    critical_lifeline_redundancy: services.critical_lifeline_redundancy === 'yes'
                } : undefined,
                critical_facilities: facilities.map(f => ({
                    facility_type: f.facility_type,
                    distance_to_nearest_emergency_service: 0,
                    structural_safety: 'Fair',
                    emergency_equipment_available: false
                })),
                vulnerable_groups: vulnerable.map(v => ({
                    group_type: v.group_type,
                    number: v.number
                })),
                community_capacity: capacity.map(c => ({
                    capacity_type: c.capacity_type,
                    available: c.available === 'Yes',
                    remarks: c.remarks
                })),
                status: finalStatus,
                createdBy: req.user?._id,
                assessed_by: req.user?._id
            };

            if (commit) {
                const profile = new WoredaProfile(profileData);
                const saved = await profile.save();
                importedProfiles.push(saved);
            } else {
                importedProfiles.push(profileData);
            }
        }

        res.status(commit ? 201 : 200).json({ 
            message: commit ? `Successfully imported ${importedProfiles.length} profiles` : 'Preview generated successfully',
            count: importedProfiles.length,
            profiles: importedProfiles
        });

    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ message: error.message });
    }
};
