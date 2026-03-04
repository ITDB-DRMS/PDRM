import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import api from '../../api/axios';

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                fullname: formData.fullname,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });
            // Redirect to Verify page, passing email state for convenience
            navigate('/verify', { state: { email: formData.email } });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-md w-full p-6 bg-white/90 rounded-2xl shadow-xl border border-transparent backdrop-blur-sm">
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM21 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 mt-4">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-1">Join IDRMIS — it's quick and easy</p>
                </div>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            name="fullname"
                            type="text"
                            placeholder="Your full name"
                            className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-transparent text-sm"
                            onChange={handleChange}
                            value={formData.fullname}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-transparent text-sm"
                            onChange={handleChange}
                            value={formData.email}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="Optional phone number"
                            className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-transparent text-sm"
                            onChange={handleChange}
                            value={formData.phone}
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            name="password"
                            type="password"
                            minLength={6}
                            placeholder="Choose a secure password"
                            className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-transparent text-sm"
                            onChange={handleChange}
                            value={formData.password}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input
                            name="confirmPassword"
                            type="password"
                            placeholder="Repeat your password"
                            className="mt-1 block w-full px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-transparent text-sm"
                            onChange={handleChange}
                            value={formData.confirmPassword}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
