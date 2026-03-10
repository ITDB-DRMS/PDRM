import WoredaProfile from '../models/WoredaProfile.js';
import * as XLSX from 'xlsx';

// @desc    Get all Woreda Profiles
// @route   GET /api/woreda-profiles
export const getWoredaProfiles = async (req, res) => {
    try {
        const { woreda, status } = req.query;
        let query = {};
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
        const serviceRows = data['Basic service'] || data['Basic service '] || [];
        const facilityRows = data['Critical_Facilities'] || data['Critical_Facilities '] || [];
        const vulnerableRows = data['vulnerable_groups'] || [];
        const capacityRows = data['community_capacity'] || [];
        const hazardRows = data['hazard'] || [];
        const chRows = data['community_hazard'] || [];
        const vulnRows = data['vulnerability_assessment'] || [];
        const housingRows = data['housing_indicators'] || [];
        const capAssessRows = data['capacity_assessment'] || [];
        const economicRows = data['economic_risk_indicators'] || [];
        const envRows = data['environmental_indicators'] || [];
        const prepRows = data['preparedness_indicators'] || [];
        const recoveryRows = data['recovery_indicators'] || [];
        const riskIndexRows = data['risk_index'] || [];
        const riskAssessRows = data['risk_assessment'] || [];

        const hazardMap = {};
        hazardRows.forEach(h => {
            hazardMap[h.hazard_id] = h.hazard_name;
        });
        
        const importedProfiles = [];

        for (let i = 0; i < adminRows.length; i++) {
            const admin = adminRows[i];
            const location_id = admin.location_id;

            const comm = commRows.find(c => c.location_id === location_id);
            if (!comm) continue;

            const community_id = comm.community_id;
            const demo = demoRows.find(d => d.community_id === community_id);
            const livelihoods = liveRows.filter(l => l.community_id === community_id);
            const services = serviceRows.find(s => s.community_id === community_id);
            const facilities = facilityRows.filter(f => f.community_id === community_id || f['community_id\xa0'] === community_id);
            const vulnerable = vulnerableRows.filter(v => v.community_id === community_id);
            const capacity = capacityRows.filter(c => c.community_id === community_id);

            const hazards = chRows.filter(ch => ch.community_id === community_id).map(ch => ({
                hazard_name: hazardMap[ch.hazard_id] || 'Unknown',
                frequency: ch.frequency,
                severity: ch.severity,
                seasonality: ch.seasonality,
                historical_events: ch.historical_events
            }));

            const vulnerabilities = vulnRows.filter(v => v.community_id === community_id).map(v => ({
                hazard_name: hazardMap[v.hazard_id] || 'Unknown',
                element_at_risk: v.element_at_risk,
                vulnerability_level: v.vulnerability_level,
                reasons: v.reasons
            }));

            const housing = housingRows.find(h => h.community_id === community_id);
            const capAssessments = capAssessRows.filter(ca => ca.community_id === community_id).map(ca => ({
                hazard_name: hazardMap[ca.hazard_id] || 'Unknown',
                capacity_type: ca.capacity_type,
                capacity_level: ca.capacity_level,
                remarks: ca.remarks
            }));

            const economic = economicRows.find(e => e.community_id === community_id);
            const env = envRows.find(e => e.community_id === community_id);
            const prep = prepRows.find(p => p.community_id === community_id);
            const recovery = recoveryRows.find(r => r.community_id === community_id);
            const riskIndex = riskIndexRows.find(ri => ri.community_id === community_id);
            const riskAssessments = riskAssessRows.filter(ra => ra.community_id === community_id).map(ra => ({
                hazard_name: hazardMap[ra.hazard_id] || 'Unknown',
                risk_level: ra.risk_level,
                risk_score: ra.risk_score,
                priority_rank: ra.priority_rank,
                recommended_action: ra.recommended_action
            }));

            const profileData = {
                location: {
                    subcity: admin.subcity,
                    woreda: String(admin.woreda),
                    block: admin.block,
                    house_no: admin['house no']
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
                    informal_settlement_population: parseInt(demo['Informal_settlement_population']) || 0,
                    low_income_households: demo.Low_income_households,
                    unemployment_rate: parseInt(demo.Unemployment_rate) || 0,
                    internally_displaced_population: parseInt(demo['Internally_displaced_population _presence']) || 0,
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
                    drainage_system_coverage: services['drainage_system_coverage '] === 'yes' || services.drainage_system_coverage === 'yes',
                    solid_waste_management_coverage: services.solid_waste_management_coverage === 'yes',
                    telecommunications_access: services['Telecommunications_ access'] === 'yes' || services.telecommunications_access === 'yes',
                    critical_lifeline_redundancy: services.critical_lifeline_redundancy === 'yes'
                } : undefined,
                critical_facilities: facilities.map(f => ({
                    facility_type: f.facility_type,
                    distance_to_nearest_emergency_service: f.distance_to_nearest_emergency_service || 0,
                    structural_safety: f['Structural_safety_of _critical _facilities'] || 'Fair',
                    emergency_equipment_available: f['Availability_o-emergency_equipment'] === 'Yes'
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
                hazards,
                vulnerability_assessments: vulnerabilities,
                housing_indicators: housing ? {
                    percent_non_durable_materials: housing.percent_non_durable_materials,
                    age_buildings_over_30_years: housing.age_buildings_over_30_years,
                    compliance_with_building_codes: housing.compliance_with_building_codes,
                    housing_density_overcrowding: housing.housing_density_overcrowding,
                    informal_housing_coverage: housing.informal_housing_coverage,
                    proximity_to_hazard_zones: housing.proximity_to_hazard_zones,
                    fire_resistant_materials_availability: housing.fire_resistant_materials_availability
                } : undefined,
                capacity_assessments: capAssessments,
                economic_risk_indicators: economic ? {
                    concentration_small_informal_businesses: economic.concentration_small_informal_businesses,
                    market_exposure: economic.market_exposure,
                    daily_labor_dependency: economic.daily_labor_dependency,
                    business_interruption_risk: economic.business_interruption_risk,
                    industrial_hazard_exposure: economic.industrial_hazard_exposure,
                    insurance_coverage_level: economic.insurance_coverage_level
                } : undefined,
                environmental_indicators: env ? {
                    green_space_per_capita: env.green_space_per_capita,
                    wetland_encroachment: env.wetland_encroachment,
                    soil_sealing_coverage: env.soil_sealing_coverage,
                    waste_dumping_sites: env.waste_dumping_sites,
                    urban_drainage_blockage_frequency: env.urban_drainage_blockage_frequency,
                    pollution_hotspots: env.pollution_hotspots
                } : undefined,
                preparedness_indicators: prep ? {
                    emergency_shelters_availability: prep.emergency_shelters_availability,
                    evacuation_routes_mapped: prep.evacuation_routes_mapped,
                    firefighting_equipment_availability: prep.firefighting_equipment_availability,
                    ambulance_coverage: prep.ambulance_coverage,
                    emergency_drills_frequency: prep.emergency_drills_frequency,
                    community_awareness_level: prep.community_awareness_level,
                    stockpiled_emergency_supplies: prep.stockpiled_emergency_supplies
                } : undefined,
                recovery_indicators: recovery ? {
                    post_disaster_recovery_plans: recovery.post_disaster_recovery_plans,
                    livelihood_diversification: recovery.livelihood_diversification,
                    access_to_credit_safety_nets: recovery.access_to_credit_safety_nets,
                    community_self_help_groups: recovery.community_self_help_groups,
                    urban_upgrading_programs: recovery.urban_upgrading_programs,
                    climate_adaptation_initiatives: recovery.climate_adaptation_initiatives
                } : undefined,
                risk_index: riskIndex ? {
                    hazard_index: riskIndex.hazard_index,
                    vulnerability_index: riskIndex.vulnerability_index,
                    exposure_index: riskIndex.exposure_index,
                    capacity_index: riskIndex.capacity_index,
                    overall_woreda_risk_score: riskIndex.overall_woreda_risk_score
                } : undefined,
                risk_assessments: riskAssessments,
                status: finalStatus,
                createdBy: req.user?._id,
                assessed_by: req.user?._id
            };

            if (commit) {
                // Check if profile exists, if so update, otherwise create
                const existing = await WoredaProfile.findOne({ 
                    'location.woreda': profileData.location.woreda,
                    'location.subcity': profileData.location.subcity
                });

                if (existing) {
                    Object.assign(existing, profileData);
                    const updated = await existing.save();
                    importedProfiles.push(updated);
                } else {
                    const profile = new WoredaProfile(profileData);
                    const saved = await profile.save();
                    importedProfiles.push(saved);
                }
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
