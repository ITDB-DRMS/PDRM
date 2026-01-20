import api from './axios';

export interface EmailLog {
    _id: string;
    recipient: string;
    type: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
    retryCount: number;
    createdAt: string;
    updatedAt: string;
}

export const getEmailLogs = async (params: any = {}) => {
    const response = await api.get('/email-logs', { params });
    return response.data;
};

export const resendEmail = async (id: string) => {
    const response = await api.post(`/email-logs/${id}/resend`);
    return response.data;
};
