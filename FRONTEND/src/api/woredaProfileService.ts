import api from './axios';

export interface AdminLocation {
    region: string;
    zone: string;
    woreda: string;
    kebele: string;
    got?: string;
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
    region?: string;
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
