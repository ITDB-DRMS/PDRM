import WoredaProfile from '../models/WoredaProfile.js';
import ProfileMapping from '../models/ProfileMapping.js';
import FormResponse from '../models/FormResponse.js';
import * as MappingService from '../services/MappingService.js';
import * as auditService from '../services/auditService.js';
import * as XLSX from 'xlsx';

const aggregateProfiles = (profiles, level) => {
    const grouped = {};

    // Deduplicate profiles by full location to avoid double counting
    const uniqueProfiles = [];
    const seenLocations = new Set();
    profiles.forEach(p => {
        const sc = (p.location?.subcity || '').toLowerCase().replace(/\bsub[\s-]?city\b/g, '').trim();
        const wo = (p.location?.woreda || '').toLowerCase().replace(/\bworeda\b/g, '').trim();
        const bl = (p.location?.block || '').toLowerCase().replace(/\bblock\b/g, '').trim();
        const hn = (p.location?.house_no || '').toString().toLowerCase().trim();
        const locKey = `${sc}-${wo}-${bl}-${hn}`;
        if (!seenLocations.has(locKey)) {
            seenLocations.add(locKey);
            uniqueProfiles.push(p);
        }
    });

    uniqueProfiles.forEach(p => {
        const normalize = (str, type) => {
            if (!str) return 'Unknown';
            let norm = str.toLowerCase().replace(/_/g, ' ').trim();
            if (type === 'subcity') norm = norm.replace(/\bsub[\s-]?city\b/gi, '').trim();
            if (type === 'woreda') norm = norm.replace(/\bworeda\b/gi, '').trim();
            if (type === 'block') norm = norm.replace(/\bblock\b/gi, '').trim();
            return norm.split(/\s+/).filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown';
        };

        const subcity = normalize(p.location?.subcity, 'subcity');
        const woreda = normalize(p.location?.woreda, 'woreda');
        const block = level === 'block' ? normalize(p.location?.block, 'block') : 'Unknown';
        
        let key = 'all';
        if (level === 'subcity') key = subcity;
        else if (level === 'woreda') key = `${subcity}-${woreda}`;
        else if (level === 'block') key = `${subcity}-${woreda}-${block}`;
        
        if (!grouped[key]) {
            grouped[key] = {
                _id: key,
                location: {
                    subcity: level === 'all' ? 'All Subcities' : subcity,
                    woreda: level === 'woreda' || level === 'block' ? woreda : 'All Woredas',
                    block: level === 'block' ? block : 'All Blocks',
                    house_no: 'Aggregated Data'
                },
                assessment_date: p.assessment_date || new Date(),
                remarks: `Aggregated data at ${level} level.`,
                status: 'Reviewed',
                demographics: {
                    total_population: 0, male_population: 0, female_population: 0,
                    children_0_17: 0, youth_18_29: 0, adults_30_59: 0, elderly_60_plus: 0,
                    total_households: 0, female_headed_households: 0, informal_settlement_population: 0,
                    low_income_households: 0, unemployment_rate: 0, internally_displaced_population: 0,
                    education_levels: []
                },
                livelihoods: [],
                basic_services: { water_source: 'Mixed', electricity_count: 0, road_access: 'Mixed', drainage_count: 0, waste_count: 0, telecom_count: 0, lifeline_count: 0 },
                critical_facilities: [],
                vulnerable_groups: [],
                community_capacity: [],
                hazards: [],
                vulnerability_assessments: [],
                housing_indicators: { percent_non_durable_materials: 0, age_buildings_over_30_years: 0, compliance_with_building_codes: 0, housing_density_overcrowding: 0, informal_housing_coverage: 0, proximity_to_hazard_zones: 0, fire_resistant_materials_availability: 0 },
                economic_risk_indicators: {}, environmental_indicators: {}, preparedness_indicators: {}, recovery_indicators: {},
                risk_index: { hazard_index: 0, vulnerability_index: 0, exposure_index: 0, capacity_index: 0, overall_woreda_risk_score: 0 },
                risk_assessments: [],
                _count: 0
            };
        }

        const g = grouped[key];
        g._count += 1;
        
        if (new Date(p.assessment_date) > new Date(g.assessment_date)) g.assessment_date = p.assessment_date;

        // Demographics
        if (p.demographics) {
            const d = p.demographics;
            ['total_population', 'male_population', 'female_population', 'children_0_17', 'youth_18_29', 'adults_30_59', 'elderly_60_plus', 'total_households', 'female_headed_households', 'informal_settlement_population', 'low_income_households', 'unemployment_rate', 'internally_displaced_population'].forEach(k => {
                g.demographics[k] += (d[k] || 0);
            });
            if (d.education_levels) {
                d.education_levels.forEach(ed => {
                    const existing = g.demographics.education_levels.find(e => e.category === ed.category);
                    if (existing) existing.count += (ed.count || 0);
                    else g.demographics.education_levels.push({ category: ed.category, count: (ed.count || 0) });
                });
            }
        }

        // Livelihoods (Sum households)
        if (p.livelihoods) {
            p.livelihoods.forEach(l => {
                const existing = g.livelihoods.find(el => el.livelihood_type === l.livelihood_type);
                if (existing) existing.households += (l.households || 0);
                else g.livelihoods.push({ livelihood_type: l.livelihood_type, households: (l.households || 0), percentage: 0 });
            });
        }

        // Basic Services (Counts for majority rule)
        if (p.basic_services) {
            const s = p.basic_services;
            if (s.electricity) g.basic_services.electricity_count++;
            if (s.drainage_system_coverage) g.basic_services.drainage_count++;
            if (s.solid_waste_management_coverage) g.basic_services.waste_count++;
            if (s.telecommunications_access) g.basic_services.telecom_count++;
            if (s.critical_lifeline_redundancy) g.basic_services.lifeline_count++;
        }

        // Vulnerable Groups (Sum)
        if (p.vulnerable_groups) {
            p.vulnerable_groups.forEach(vg => {
                const existing = g.vulnerable_groups.find(evg => evg.group_type === vg.group_type);
                if (existing) existing.number += (vg.number || 0);
                else g.vulnerable_groups.push({ group_type: vg.group_type, number: (vg.number || 0) });
            });
        }

        // Risk Index (Sum for average)
        if (p.risk_index) {
            Object.keys(g.risk_index).forEach(k => g.risk_index[k] += (p.risk_index[k] || 0));
        }

        // Housing Indicators (Sum for average)
        if (p.housing_indicators) {
            Object.keys(g.housing_indicators).forEach(k => g.housing_indicators[k] += (p.housing_indicators[k] || 0));
        }

        // Indicators (Collect for majority vote)
        ['economic_risk_indicators', 'environmental_indicators', 'preparedness_indicators', 'recovery_indicators'].forEach(cat => {
            if (p[cat]) {
                Object.entries(p[cat]).forEach(([key, val]) => {
                    if (val) {
                        if (!g[cat][key]) g[cat][key] = {};
                        g[cat][key][val] = (g[cat][key][val] || 0) + 1;
                    }
                });
            }
        });

        // Unique lists for facilities, hazards, assessments
        const collectUnique = (targetArr, sourceArr, keyField) => {
            if (!sourceArr) return;
            sourceArr.forEach(item => {
                if (!targetArr.find(t => t[keyField] === item[keyField])) {
                    targetArr.push(item);
                }
            });
        };
        collectUnique(g.critical_facilities, p.critical_facilities, 'facility_type');
        collectUnique(g.hazards, p.hazards, 'hazard_name');
        collectUnique(g.community_capacity, p.community_capacity, 'capacity_type');
        collectUnique(g.vulnerability_assessments, p.vulnerability_assessments, 'hazard_name');
        collectUnique(g.risk_assessments, p.risk_assessments, 'hazard_name');
    });

    // Finalize averages, percentages, and votes
    return Object.values(grouped).map(g => {
        if (g._count > 0) {
            g.demographics.unemployment_rate = Math.round(g.demographics.unemployment_rate / g._count);
            
            const totalLivelihoodHH = g.livelihoods.reduce((acc, l) => acc + l.households, 0);
            if (totalLivelihoodHH > 0) {
                g.livelihoods.forEach(l => l.percentage = Math.round((l.households / totalLivelihoodHH) * 100));
            }

            // Majority rule for booleans
            g.basic_services = {
                water_source: g.basic_services.water_source,
                road_access: g.basic_services.road_access,
                electricity: g.basic_services.electricity_count > (g._count / 2),
                drainage_system_coverage: g.basic_services.drainage_count > (g._count / 2),
                solid_waste_management_coverage: g.basic_services.waste_count > (g._count / 2),
                telecommunications_access: g.basic_services.telecom_count > (g._count / 2),
                critical_lifeline_redundancy: g.basic_services.lifeline_count > (g._count / 2)
            };

            // Averages
            Object.keys(g.risk_index).forEach(k => g.risk_index[k] = Math.round(g.risk_index[k] / g._count * 10) / 10);
            Object.keys(g.housing_indicators).forEach(k => g.housing_indicators[k] = Math.round(g.housing_indicators[k] / g._count * 10) / 10);

            // Votes for categorical indicators
            ['economic_risk_indicators', 'environmental_indicators', 'preparedness_indicators', 'recovery_indicators'].forEach(cat => {
                const finalCat = {};
                Object.entries(g[cat]).forEach(([key, votes]) => {
                    const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
                    finalCat[key] = sorted[0][0]; // Take majority
                });
                g[cat] = finalCat;
            });
        }
        delete g._count;
        return g;
    });
};








// @desc    Get all Woreda Profiles
// @route   GET /api/woreda-profiles
export const getWoredaProfiles = async (req, res) => {
    try {
        const { subcity, woreda, block, status, level } = req.query;
        let query = {};
        
        // Use soft regex matching to catch variations like "Bole" vs "Bole Subcity" during drill-down fetches.
        if (subcity) query['location.subcity'] = { $regex: new RegExp(`^${subcity.replace(/\bsub[\s-]?city\b/ig, '').trim()}`, 'i') };
        if (woreda) query['location.woreda'] = { $regex: new RegExp(`^${woreda.replace(/\bworeda\b/ig, '').trim()}`, 'i') };
        if (block) query['location.block'] = { $regex: new RegExp(`^${block.replace(/\bblock\b/ig, '').trim()}`, 'i') };
        
        if (status) query.status = status;

        const profiles = await WoredaProfile.find(query)
            .sort({ updatedAt: -1 })
            .populate('assessed_by', 'fullname')
            .populate('createdBy', 'fullname');

        if (['all', 'subcity', 'woreda', 'block'].includes(level)) {
            const aggregated = aggregateProfiles(profiles, level);
            return res.json(aggregated);
        }

        // For Household Level, guarantee exactly one card per house (taking latest update)
        const uniqueHouseholds = [];
        const seen = new Set();
        for (const p of profiles) {
            const sc = (p.location?.subcity||'').toLowerCase().replace(/\bsub[\s-]?city\b/g, '').trim();
            const wo = (p.location?.woreda||'').toLowerCase().replace(/\bworeda\b/g, '').trim();
            const bl = (p.location?.block||'').toLowerCase().replace(/\bblock\b/g, '').trim();
            const hn = (p.location?.house_no||'').toString().toLowerCase().trim();
            
            const hKey = `${sc}-${wo}-${bl}-${hn}`;
            if (!seen.has(hKey)) {
                seen.add(hKey);
                uniqueHouseholds.push(p);
            }
        }
        return res.json(uniqueHouseholds);
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
        const { location } = req.body;
        
        // Ensure no duplicate location (subcity + woreda + block + house_no)
        const matchCriteria = {
            'location.subcity': location.subcity,
            'location.woreda': location.woreda,
            'location.block': location.block || '',
            'location.house_no': location.house_no || ''
        };

        const existing = await WoredaProfile.findOne(matchCriteria);
        if (existing) {
            return res.status(400).json({ 
                message: `A profile already exists for ${location.subcity}, Woreda ${location.woreda}, Block ${location.block || 'N/A'}, House ${location.house_no || 'N/A'}.` 
            });
        }

        const profile = new WoredaProfile({
            ...req.body,
            createdBy: req.user?._id,
            assessed_by: req.user?._id
        });
        const saved = await profile.save();

        await auditService.logAction({
            userId: req.user?._id,
            action: 'WOREDA_PROFILE_CREATE',
            resource: 'WoredaProfile',
            resourceId: saved._id,
            after: saved,
            ip: req.ip
        });

        res.status(201).json(saved);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A profile for this location already exists. (Duplicate Index)' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Woreda Profile
// @route   PUT /api/woreda-profiles/:id
export const updateWoredaProfile = async (req, res) => {
    try {
        const { location } = req.body;
        const profile = await WoredaProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Woreda Profile not found' });

        // If location is changing, check for duplicates elsewhere
        if (location) {
            const matchCriteria = {
                _id: { $ne: req.params.id },
                'location.subcity': location.subcity,
                'location.woreda': location.woreda,
                'location.block': location.block || '',
                'location.house_no': location.house_no || ''
            };
            const duplicate = await WoredaProfile.findOne(matchCriteria);
            if (duplicate) {
                return res.status(400).json({ 
                    message: `Cannot update location. Another profile already exists for this house/location.` 
                });
            }
        }

        const before = profile.toObject();
        Object.assign(profile, req.body);
        const updated = await profile.save();

        await auditService.logAction({
            userId: req.user?._id,
            action: 'WOREDA_PROFILE_UPDATE',
            resource: 'WoredaProfile',
            resourceId: updated._id,
            before,
            after: updated,
            ip: req.ip
        });

        res.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Update failed: This location is already occupied by another profile.' });
        }
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete Woreda Profile
// @route   DELETE /api/woreda-profiles/:id
export const deleteWoredaProfile = async (req, res) => {
    try {
        const profile = await WoredaProfile.findById(req.params.id);
        if (!profile) return res.status(404).json({ message: 'Woreda Profile not found' });

        const before = profile.toObject();
        await WoredaProfile.findByIdAndDelete(req.params.id);

        await auditService.logAction({
            userId: req.user?._id,
            action: 'WOREDA_PROFILE_DELETE',
            resource: 'WoredaProfile',
            resourceId: req.params.id,
            before,
            ip: req.ip
        });

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

// @desc    Import Woreda Profile from Excel (Hardcoded Legacy Logic)
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

        // Validation of required sheets and columns
        const REQUIRED_SHEETS = ['admin_location', 'community', 'demographics', 'livelihoods'];
        const missingSheets = REQUIRED_SHEETS.filter(s => !data[s]);
        
        if (missingSheets.length > 0) {
            return res.status(400).json({ 
                message: `Invalid Excel structure. Missing required sheets: ${missingSheets.join(', ')}`,
                details: 'Please use the standardized Woreda Profile template.'
            });
        }

        const adminRows = data['admin_location'] || [];
        const commRows = data['community'] || [];
        const demoRows = data['demographics'] || [];
        const liveRows = data['livelihoods'] || [];

        // Validate columns in admin_location
        if (adminRows.length > 0) {
            const requiredCols = ['location_id', 'subcity', 'woreda'];
            const firstRow = adminRows[0];
            const missingCols = requiredCols.filter(c => !(c in firstRow));
            if (missingCols.length > 0) {
                return res.status(400).json({ 
                    message: `Invalid columns in 'admin_location' sheet. Missing: ${missingCols.join(', ')}`
                });
            }
        }

        const hazardRows = data['hazard'] || [];
        const chRows = data['community_hazard'] || [];
        const vulnRows = data['vulnerability_assessment'] || [];
        const housingRows = data['housing_indicators'] || [];
        const vGroupsRows = data['vulnerable_groups'] || [];
        const capacityRows = data['community_capacity'] || [];
        const riskIndexRows = data['risk_index'] || [];
        const serviceRows = data['Basic service'] || data['Basic service '] || [];
        const facilityRows = data['Critical_Facilities'] || data['Critical_Facilities '] || [];
        const riskAssessRows = data['risk_assessment'] || [];
        const econRows = data['economic_risk_indicators'] || [];
        const envRows = data['environmental_indicators'] || [];
        const prepRows = data['preparedness_indicators'] || [];
        const recRows = data['recovery_indicators'] || [];
        const capAssessRows = data['capacity_assessment'] || [];

        const getHazardName = (id) => {
            const h = hazardRows.find(hr => hr.hazard_id == id);
            return h ? h.hazard_name : `Hazard ${id}`;
        };

        const toBool = (val) => {
            if (val === undefined || val === null) return false;
            if (typeof val === 'boolean') return val;
            const s = String(val).toLowerCase().trim();
            return s === 'yes' || s === 'true' || s === '1' || s === 'y';
        };

        // Utility to find row by community_id, handling leading/trailing/hidden spaces in keys
        const findByCommId = (rows, commId) => {
            if (!rows || !commId) return null;
            return rows.find(r => {
                const key = Object.keys(r).find(k => k.trim() === 'community_id');
                return key && r[key] == commId;
            });
        };

        // Utility to filter rows by community_id
        const filterByCommId = (rows, commId) => {
            if (!rows || !commId) return [];
            return rows.filter(r => {
                const key = Object.keys(r).find(k => k.trim() === 'community_id');
                return key && r[key] == commId;
            });
        };

        const importedProfiles = [];

        for (let i = 0; i < adminRows.length; i++) {
            const admin = adminRows[i];
            const location_id = admin.location_id;

            const comm = commRows.find(c => c.location_id == location_id) || {};
            const community_id = comm.community_id;
            
            const demo = findByCommId(demoRows, community_id);
            const livelihoods = filterByCommId(liveRows, community_id);
            const services = findByCommId(serviceRows, community_id);
            const facilities = filterByCommId(facilityRows, community_id);
            const housing = findByCommId(housingRows, community_id);
            const compHazards = filterByCommId(chRows, community_id);
            const vAssessments = filterByCommId(vulnRows, community_id);
            const vGroups = filterByCommId(vGroupsRows, community_id);
            const capacities = filterByCommId(capacityRows, community_id);
            const riskIndex = findByCommId(riskIndexRows, community_id);
            const riskAssessments = filterByCommId(riskAssessRows, community_id);
            const capAssess = filterByCommId(capAssessRows, community_id);
            const econ = findByCommId(econRows, community_id);
            const env = findByCommId(envRows, community_id);
            const prep = findByCommId(prepRows, community_id);
            const rec = findByCommId(recRows, community_id);

            const profileData = {
                location: {
                    subcity: admin.subcity,
                    woreda: String(admin.woreda),
                    block: String(admin.block || ''),
                    house_no: String(admin['house no'] || admin.house_no || '')
                },
                assessment_date: comm.assessment_date || new Date(),
                remarks: comm.remarks,
                demographics: demo ? {
                    total_population: Number(demo.total_population) || 0,
                    male_population: Number(demo.male_population) || 0,
                    female_population: Number(demo.female_population) || 0,
                    children_0_17: Number(demo.children_0_17) || 0,
                    youth_18_29: Number(demo.youth_18_29) || 0,
                    adults_30_59: Number(demo.adults_30_59) || 0,
                    elderly_60_plus: Number(demo.elderly_60_plus) || 0,
                    total_households: Number(demo.total_households) || 0,
                    female_headed_households: Number(demo['Numberof_female_headed _households']) || Number(demo.Numberof_female_headed_households) || 0,
                    informal_settlement_population: Number(demo['Informal_settlement_population ']) || Number(demo.Informal_settlement_population) || 0,
                    low_income_households: Number(demo.Low_income_households) || 0,
                    unemployment_rate: Number(demo.Unemployment_rate) || 0,
                    internally_displaced_population: Number(demo['Internally_displaced_population _presence']) || Number(demo.Internally_displaced_population_presence) || 0
                } : undefined,
                livelihoods: livelihoods.map(l => ({
                    livelihood_type: l.livelihood_type || 'Unknown',
                    households: Number(l.households) || 0,
                    percentage: Number(l.percentage) || 0
                })),
                basic_services: services ? {
                    water_source: services.water_source,
                    electricity: toBool(services.electricity),
                    road_access: services.road_access,
                    drainage_system_coverage: toBool(services['drainage_system_coverage ']) || toBool(services.drainage_system_coverage),
                    solid_waste_management_coverage: toBool(services.solid_waste_management_coverage),
                    telecommunications_access: toBool(services['Telecommunications_ access']) || toBool(services.Telecommunications_access),
                    critical_lifeline_redundancy: toBool(services.critical_lifeline_redundancy)
                } : undefined,
                critical_facilities: facilities.map(f => ({
                    facility_type: f.facility_type || 'Unknown',
                    distance_to_nearest_emergency_service: Number(f.distance_to_nearest_emergency_service || 0),
                    structural_safety: f.structural_safety || '',
                    emergency_equipment_available: toBool(f.emergency_equipment_available)
                })),
                vulnerable_groups: vGroups.map(g => ({
                    group_type: g.group_type || 'Unknown',
                    number: Number(g.number) || 0
                })),
                community_capacity: capacities.map(c => ({
                    capacity_type: c.capacity_type || 'Unknown',
                    available: toBool(c.available),
                    remarks: c.remarks
                })),
                hazards: compHazards.map(h => ({
                    hazard_name: getHazardName(h.hazard_id),
                    frequency: h.frequency,
                    severity: h.severity,
                    seasonality: h.seasonality,
                    historical_events: h.historical_events
                })),
                vulnerability_assessments: vAssessments.map(v => ({
                    hazard_name: getHazardName(v.hazard_id),
                    element_at_risk: v.element_at_risk,
                    vulnerability_level: v.vulnerability_level,
                    reasons: v.reasons
                })),
                housing_indicators: housing ? {
                    percent_non_durable_materials: Number(housing.percent_non_durable_materials) || 0,
                    age_buildings_over_30_years: Number(housing.age_buildings_over_30_years) || 0,
                    compliance_with_building_codes: Number(housing.compliance_with_building_codes) || 0,
                    housing_density_overcrowding: Number(housing.housing_density_overcrowding) || 0,
                    informal_housing_coverage: Number(housing.informal_housing_coverage) || 0,
                    proximity_to_hazard_zones: Number(housing.proximity_to_hazard_zones) || 0,
                    fire_resistant_materials_availability: Number(housing.fire_resistant_materials_availability) || 0
                } : undefined,
                capacity_assessments: capAssess.map(ca => ({
                    hazard_name: getHazardName(ca.hazard_id),
                    capacity_type: ca.capacity_type,
                    capacity_level: ca.capacity_level,
                    remarks: ca.remarks
                })),
                economic_risk_indicators: econ ? {
                    concentration_small_informal_businesses: String(econ.concentration_small_informal_businesses || ''),
                    market_exposure: String(econ.market_exposure || ''),
                    daily_labor_dependency: String(econ['daily_labor_dependency '] || econ.daily_labor_dependency || ''),
                    business_interruption_risk: String(econ.business_interruption_risk || ''),
                    industrial_hazard_exposure: String(econ.industrial_hazard_exposure || ''),
                    insurance_coverage_level: String(econ['insurance_coverage_level '] || econ.insurance_coverage_level || '')
                } : undefined,
                environmental_indicators: env ? {
                    green_space_per_capita: String(env.green_space_per_capita || ''),
                    wetland_encroachment: String(env.wetland_encroachment || ''),
                    soil_sealing_coverage: String(env.soil_sealing_coverage || ''),
                    waste_dumping_sites: String(env.waste_dumping_sites || ''),
                    urban_drainage_blockage_frequency: String(env['urban_drainage_blockage_frequency '] || env.urban_drainage_blockage_frequency || ''),
                    pollution_hotspots: String(env.pollution_hotspots || '')
                } : undefined,
                preparedness_indicators: prep ? {
                    emergency_shelters_availability: String(prep.emergency_shelters_availability || ''),
                    evacuation_routes_mapped: String(prep['evacuation_routes_mapped '] || prep.evacuation_routes_mapped || ''),
                    firefighting_equipment_availability: String(prep.firefighting_equipment_availability || ''),
                    ambulance_coverage: String(prep.ambulance_coverage || ''),
                    emergency_drills_frequency: String(prep.emergency_drills_frequency || ''),
                    community_awareness_level: String(prep.community_awareness_level || ''),
                    stockpiled_emergency_supplies: String(prep.stockpiled_emergency_supplies || '')
                } : undefined,
                recovery_indicators: rec ? {
                    post_disaster_recovery_plans: String(rec.post_disaster_recovery_plans || ''),
                    livelihood_diversification: String(rec.livelihood_diversification || ''),
                    access_to_credit_safety_nets: String(rec.access_to_credit_safety_nets || ''),
                    community_self_help_groups: String(rec.community_self_help_groups || ''),
                    urban_upgrading_programs: String(rec.urban_upgrading_programs || ''),
                    climate_adaptation_initiatives: String(rec.climate_adaptation_initiatives || '')
                } : undefined,
                risk_index: riskIndex ? {
                    hazard_index: Number(riskIndex.hazard_index) || 0,
                    vulnerability_index: Number(riskIndex.vulnerability_index) || 0,
                    exposure_index: Number(riskIndex.exposure_index) || 0,
                    capacity_index: Number(riskIndex.capacity_index) || 0,
                    overall_woreda_risk_score: Number(riskIndex.overall_woreda_risk_score) || 0
                } : undefined,
                risk_assessments: riskAssessments.map(ra => ({
                    hazard_name: getHazardName(ra.hazard_id),
                    risk_level: ra.risk_level,
                    risk_score: Number(ra.risk_score) || 0,
                    priority_rank: Number(ra.priority_rank) || 0,
                    recommended_action: ra.recommended_action
                })),
                status: finalStatus,
                createdBy: req.user?._id,
                assessed_by: req.user?._id
            };

            if (commit) {
                // Determine uniqueness based on full location signature
                const matchCriteria = { 
                    'location.woreda': profileData.location.woreda,
                    'location.subcity': profileData.location.subcity,
                    'location.block': profileData.location.block,
                    'location.house_no': profileData.location.house_no
                };

                const existing = await WoredaProfile.findOne(matchCriteria);

                if (existing) {
                    // Update existing profile with new Excel data
                    Object.assign(existing, profileData);
                    // Explicitly mark status and update metadata
                    existing.status = finalStatus;
                    existing.updatedAt = new Date();
                    importedProfiles.push(await existing.save());
                } else {
                    // Create new profile if identity doesn't exist
                    importedProfiles.push(await WoredaProfile.create(profileData));
                }
            } else {
                importedProfiles.push(profileData);
            }
        }

        // Final audit for bulk import
        if (commit && importedProfiles.length > 0) {
            await auditService.logAction({
                userId: req.user?._id,
                action: 'WOREDA_PROFILE_IMPORT',
                resource: 'WoredaProfile',
                details: { count: importedProfiles.length, status: finalStatus },
                ip: req.ip
            });
        }

        return res.status(commit ? 201 : 200).json({
            message: commit ? `Successfully processed ${importedProfiles.length} profiles` : 'Preview generated',
            count: importedProfiles.length,
            profiles: importedProfiles
        });
    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sync Woreda Profile from Interview Response
// @route   POST /api/woreda-profiles/sync-interview
export const syncFromInterview = async (req, res) => {
    try {
        const { responseId, mappingId, dryRun } = req.body;

        const response = await FormResponse.findById(responseId);
        if (!response) return res.status(404).json({ message: 'Interview response not found' });

        const mapping = await ProfileMapping.findById(mappingId);
        if (!mapping) return res.status(404).json({ message: 'Profile mapping not found' });
        
        if (mapping.status !== 'Published') {
            return res.status(403).json({ 
                message: 'Only published profile mappings can perform live synchronization' 
            });
        }

        const answersObj = Object.fromEntries(response.answers);

        const validationErrors = MappingService.validateData(answersObj, mapping);
        if (validationErrors.length > 0 && dryRun !== 'true') {
            return res.status(400).json({ 
                message: 'Validation failed for interview data', 
                errors: validationErrors 
            });
        }

        const syncResult = MappingService.transformData(answersObj, mapping);
        const transformedData = syncResult.data;

        transformedData.assessed_by = response.respondentMetadata?.enumeratorId || req.user?._id;
        transformedData.createdBy = req.user?._id;
        transformedData.assessment_date = response.submittedAt;
        transformedData.status = 'Draft';

        if (dryRun === true || dryRun === 'true') {
            return res.json({
                message: 'Preview generated',
                data: transformedData,
                validationErrors
            });
        }

        // Robust search criteria matching Excel import to find EXACT household
        const matchCriteria = { 
            'location.woreda': transformedData.location?.woreda,
            'location.subcity': transformedData.location?.subcity
        };
        if (transformedData.location?.block) matchCriteria['location.block'] = transformedData.location.block;
        if (transformedData.location?.house_no) matchCriteria['location.house_no'] = transformedData.location.house_no;
        
        console.log("Matching Criteria:", matchCriteria);
        const existing = await WoredaProfile.findOne(matchCriteria);

        // Prepare syncSources update
        const syncSources = {};
        Object.entries(syncResult.metadata).forEach(([path, meta]) => {
            syncSources[path.replace(/\./g, '_')] = {
                responseId: response._id,
                answerId: meta.answerId,
                sourceKey: meta.sourceKey,
                syncedAt: new Date()
            };
        });

        let saved;
        if (existing) {
            // Use path-based update to avoid clobbering siblings in nested objects
            const recursiveSet = (doc, obj, prefix = '') => {
                Object.entries(obj).forEach(([key, val]) => {
                    const fullPath = prefix ? `${prefix}.${key}` : key;
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        recursiveSet(doc, val, fullPath);
                    } else {
                        doc.set(fullPath, val);
                    }
                });
            };
            
            recursiveSet(existing, transformedData);

            // Update syncSources using the Map set method
            if (!existing.syncSources) existing.syncSources = new Map();
            Object.entries(syncSources).forEach(([k, v]) => {
                existing.syncSources.set(k, v);
            });
            
            saved = await existing.save();
        } else {
            const profile = new WoredaProfile({
                ...transformedData,
                syncSources
            });
            saved = await profile.save();
        }

        // Update the source response status
        response.syncStatus = 'SYNCED';
        response.lastSyncedAt = new Date();
        await response.save();

        await auditService.logAction({
            userId: req.user?._id,
            action: 'WOREDA_PROFILE_SYNC',
            resource: 'WoredaProfile',
            resourceId: saved._id,
            details: { responseId },
            after: saved,
            ip: req.ip
        });

        await auditService.logAction({
            userId: req.user?._id,
            action: 'RESPONSE_SYNC',
            resource: 'FormResponse',
            resourceId: response._id,
            details: { profileId: saved._id },
            after: response,
            ip: req.ip
        });

        res.status(201).json(saved);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
