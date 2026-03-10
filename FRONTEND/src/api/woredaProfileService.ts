import api from './axios';

export interface AdminLocation {
    subcity?: string;
    woreda: string;
    block?: string;
    house_no?: string;
}

export interface EducationLevel {
    category: string;
    count: number;
}

export interface Demographics {
    total_population?: number;
    male_population?: number;
    female_population?: number;
    children_0_17?: number;
    youth_18_29?: number;
    adults_30_59?: number;
    elderly_60_plus?: number;
    total_households?: number;
    female_headed_households?: number;
    informal_settlement_population?: number;
    low_income_households?: number;
    unemployment_rate?: number;
    internally_displaced_population?: number;
    education_levels?: EducationLevel[];
}

export interface Livelihood {
    livelihood_type: string;
    households?: number;
    percentage?: number;
}

export interface BasicService {
    water_source?: string;
    electricity?: boolean;
    road_access?: string;
    drainage_system_coverage?: boolean;
    solid_waste_management_coverage?: boolean;
    telecommunications_access?: boolean;
    critical_lifeline_redundancy?: boolean;
}

export interface CriticalFacility {
    facility_type: string;
    distance_to_nearest_emergency_service?: number;
    structural_safety?: string;
    emergency_equipment_available?: boolean;
}

export interface VulnerableGroup {
    group_type: string;
    number?: number;
}

export interface CommunityCapacity {
    capacity_type: string;
    available?: boolean;
    remarks?: string;
}

export interface Hazard {
    hazard_name?: string;
    frequency?: string;
    severity?: string;
    seasonality?: string;
    historical_events?: string;
}

export interface VulnerabilityAssessment {
    hazard_name?: string;
    element_at_risk?: string;
    vulnerability_level?: string;
    reasons?: string;
}

export interface HousingIndicators {
    percent_non_durable_materials?: number;
    age_buildings_over_30_years?: number;
    compliance_with_building_codes?: number;
    housing_density_overcrowding?: number;
    informal_housing_coverage?: number;
    proximity_to_hazard_zones?: number;
    fire_resistant_materials_availability?: number;
}

export interface CapacityAssessment {
    hazard_name?: string;
    capacity_type?: string;
    capacity_level?: string;
    remarks?: string;
}

export interface EconomicRiskIndicators {
    concentration_small_informal_businesses?: string;
    market_exposure?: string;
    daily_labor_dependency?: string;
    business_interruption_risk?: string;
    industrial_hazard_exposure?: string;
    insurance_coverage_level?: string;
}

export interface EnvironmentalIndicators {
    green_space_per_capita?: string;
    wetland_encroachment?: string;
    soil_sealing_coverage?: string;
    waste_dumping_sites?: string;
    urban_drainage_blockage_frequency?: string;
    pollution_hotspots?: string;
}

export interface PreparednessIndicators {
    emergency_shelters_availability?: string;
    evacuation_routes_mapped?: string;
    firefighting_equipment_availability?: string;
    ambulance_coverage?: string;
    emergency_drills_frequency?: string;
    community_awareness_level?: string;
    stockpiled_emergency_supplies?: string;
}

export interface RecoveryIndicators {
    post_disaster_recovery_plans?: string;
    livelihood_diversification?: string;
    access_to_credit_safety_nets?: string;
    community_self_help_groups?: string;
    urban_upgrading_programs?: string;
    climate_adaptation_initiatives?: string;
}

export interface RiskIndex {
    hazard_index?: number;
    vulnerability_index?: number;
    exposure_index?: number;
    capacity_index?: number;
    overall_woreda_risk_score?: number;
}

export interface RiskAssessment {
    hazard_name?: string;
    risk_level?: string;
    risk_score?: number;
    priority_rank?: number;
    recommended_action?: string;
}

export interface WoredaProfileInput {
    location: AdminLocation;
    assessment_date: string;
    remarks?: string;
    demographics?: Demographics;
    livelihoods?: Livelihood[];
    basic_services?: BasicService;
    critical_facilities?: CriticalFacility[];
    vulnerable_groups?: VulnerableGroup[];
    community_capacity?: CommunityCapacity[];
    hazards?: Hazard[];
    vulnerability_assessments?: VulnerabilityAssessment[];
    housing_indicators?: HousingIndicators;
    capacity_assessments?: CapacityAssessment[];
    economic_risk_indicators?: EconomicRiskIndicators;
    environmental_indicators?: EnvironmentalIndicators;
    preparedness_indicators?: PreparednessIndicators;
    recovery_indicators?: RecoveryIndicators;
    risk_index?: RiskIndex;
    risk_assessments?: RiskAssessment[];
    status?: 'Draft' | 'Submitted' | 'Reviewed';
}

export interface WoredaProfile extends WoredaProfileInput {
    _id: string;
    assessed_by?: { _id: string; fullname: string };
    createdBy?: { _id: string; fullname: string };
    createdAt: string;
    updatedAt: string;
}

export interface WoredaProfileStats {
    total: number;
    submitted: number;
    draft: number;
    reviewed: number;
    totalPopulation: number;
}

export const getWoredaProfiles = async (params?: {
    woreda?: string;
    status?: string;
}): Promise<WoredaProfile[]> => {
    const response = await api.get('/woreda-profiles', { params });
    return response.data;
};

export const getWoredaProfileById = async (id: string): Promise<WoredaProfile> => {
    const response = await api.get(`/woreda-profiles/${id}`);
    return response.data;
};

export const createWoredaProfile = async (data: WoredaProfileInput): Promise<WoredaProfile> => {
    const response = await api.post('/woreda-profiles', data);
    return response.data;
};

export const updateWoredaProfile = async (id: string, data: Partial<WoredaProfileInput>): Promise<WoredaProfile> => {
    const response = await api.put(`/woreda-profiles/${id}`, data);
    return response.data;
};

export const deleteWoredaProfile = async (id: string): Promise<void> => {
    await api.delete(`/woreda-profiles/${id}`);
};

export const getWoredaProfileStats = async (): Promise<WoredaProfileStats> => {
    const response = await api.get('/woreda-profiles/stats');
    return response.data;
};

export const importWoredaProfile = async (file: File, options?: { dryRun?: boolean; status?: string }): Promise<{ message: string; count: number; profiles: WoredaProfile[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const params = new URLSearchParams();
    if (options?.dryRun) params.append('dryRun', 'true');
    if (options?.status) params.append('status', options.status);

    const response = await api.post(`/woreda-profiles/import?${params.toString()}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
