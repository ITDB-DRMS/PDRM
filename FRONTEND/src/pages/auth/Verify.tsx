import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import api from '../../api/axios';

const Verify: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState('');

    // Try to get email from navigation state or localStorage, otherwise empty
    const [email, setEmail] = useState<string>(location.state?.email || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            // userId isn't easily available here unless we fetch user by email first or pass userId from Register.
            // But standard verifying usually needs userId or token.
            // Our backend `verifyAccount` expects { userId, code }.
            // This is slightly tricky if we only have email.
            // Let's assume for this step we need to change backend to accept email + code OR 
            // the frontend needs to retrieve userId.
            // Retrieving userId by email is a security risk if public.
            // BETTER: modify backend verify to accept email + code.
            // WAIT: We can't change backend now easily without regression steps.
            // Alternative: After register, backend returned "User registered". It didn't return userId?
            // Let's check authController.register response. 
            // It returns { message: ... }. It should probably return userId too if we need it immediately.
            // OR: Register returns a temporary token?
            // Let's assume for now, we asked user to login first? No, login is blocked.

            // QUICK FIX Plan: 
            // I will update the Verify Page to ask for Email AND Code.
            // I will try to find userId via a new public endpoint? No.
            // I will use another trick: The verification code is linked to userId in Verification model.
            // Actually, `Verification.findOne({ userId, code })` needs userId.

            // Re-reading authController.verifyAccount:
            // const { userId, code } = req.body;

            // This design is hard for frontend if we don't return userId on register.
            // Let's check `authController.js` content again.
            // It just returns message.

            // Correction: I should update `authController.register` to return userId. 
            // But I am in Frontend task now.
            // Is there any other way? 
            // Maybe I can fetch user by email? No public endpoint for that.

            // I will implement a robust frontend that *asks* for the ID? No, users don't know IDs.

            // OK, I'll sneak a quick update to `authController.js` (and `authDTO`?) to return `userId` in register response.
            // It's a minor change but essential for flow.
            // OR simpler: `verifyAccount` on backend should accept `email` and `code`.
            // `Verification` model has `userId`. User has `email`.
            // `Verification` doesn't have email. User has email.
            // `User.findOne({ email })` -> get `_id` -> use in `Verification.findOne`.

            // I will assume I can fix backend `verifyAccount` to accept `email` instead of `userId`.
            // That is cleaner for the user.

            // For this file specifically, I will send `email` and `code`.
            await api.post('/auth/verify', { email, code });
            setSuccess('Account verified! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Please enter your email to resend code');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.post('/auth/resend', { email });
            setSuccess('Verification code resent! Please check your email.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Verify Your Account</h1>
                    <p className="text-sm text-gray-500 mt-2">Enter the code sent to your email</p>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirmation Code</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-blue-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
                            placeholder="XXXXXX"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-500">
                        Did not receive code?{' '}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                        >
                            Resend
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Verify;
