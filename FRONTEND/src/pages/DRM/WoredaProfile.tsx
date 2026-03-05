import React from 'react';
import { useLocation } from 'react-router';
import PageMeta from "../../components/common/PageMeta";

const WoredaProfile: React.FC = () => {
    const location = useLocation();
    const path = location.pathname.split('/').pop() || '';

    const pageTitle = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <>
            <PageMeta
                title={`${pageTitle || 'Woreda Profile'} | IDRMIS`}
                description={`Woreda Profile - ${pageTitle}`}
            />
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <span className="text-xl font-bold">W</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-gray-900 leading-none">
                            {pageTitle || 'Woreda Profile'}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1 uppercase tracking-widest font-bold">Woreda Profile Section</p>
                    </div>
                </div>

                <div className="p-20 border-2 border-dashed border-gray-100 rounded-[32px] text-center">
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Module Under Construction</h3>
                        <p className="text-gray-400"> This section of the Woreda Profile is currently being prepared. You will soon be able to manage {pageTitle.toLowerCase()} data here.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WoredaProfile;
