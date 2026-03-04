import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Workflow, CheckCircle, BarChart3, CloudIcon, Smartphone } from "lucide-react";

const features = [
    {
        icon: <ShieldCheck className="w-10 h-10 text-white" />,
        title: "Secure Management",
        description: "Multi-layered encryption and role-based access control to keep sensitive data protected and compliant with global standards.",
        color: "bg-indigo-600",
        shadow: "shadow-indigo-500/30",
    },
    {
        icon: <Workflow className="w-10 h-10 text-white" />,
        title: "Digital Workflow",
        description: "Automate complex approval loops and reporting tasks, reducing manual errors and speeding up response times.",
        color: "bg-teal-500",
        shadow: "shadow-teal-500/30",
    },
    {
        icon: <CheckCircle className="w-10 h-10 text-white" />,
        title: "Smart Approval System",
        description: "Dynamic approval routing based on hierarchy and department, ensuring the right people review at the right time.",
        color: "bg-blue-600",
        shadow: "shadow-blue-500/30",
    },
    {
        icon: <BarChart3 className="w-10 h-10 text-white" />,
        title: "Reporting & Analytics",
        description: "Real-time dashboards and detailed exporting features for audit-ready disaster reports and risk assessments.",
        color: "bg-purple-600",
        shadow: "shadow-purple-500/30",
    },
    {
        icon: <CloudIcon className="w-10 h-10 text-white" />,
        title: "Cloud Infrastructure",
        description: "Scalable cloud integration ensuring that disaster records are always available from any location, worldwide.",
        color: "bg-sky-500",
        shadow: "shadow-sky-500/30",
    },
    {
        icon: <Smartphone className="w-10 h-10 text-white" />,
        title: "Mobile Accessibility",
        description: "Fully responsive platform enabling field officers and responders to report and manage data directly from mobiles.",
        color: "bg-emerald-500",
        shadow: "shadow-emerald-500/30",
    },
];

const Features: React.FC = () => {
    return (
        <section className="py-24 bg-white dark:bg-slate-900 overflow-hidden relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-4"
                    >
                        Capabilities
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
                    >
                        Comprehensive Ecosystem for Resilience
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-lg text-slate-500 dark:text-slate-400"
                    >
                        Built by experts in disaster management and data technology, the IDRMIS provides end-to-end functionality for risk mitigation.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.8 }}
                            whileHover={{
                                y: -10,
                                scale: 1.02,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            className="group p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                        >
                            {/* Card Accent */}
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full ${feature.color}`} />

                            <div className={`w-16 h-16 ${feature.color} ${feature.shadow} rounded-2xl flex items-center justify-center mb-8 shadow-lg transform group-hover:rotate-6 transition-transform duration-500`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{feature.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                                {feature.description}
                            </p>
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center group-hover:gap-2 transition-all cursor-pointer">
                                <span className="text-indigo-600 font-bold text-sm">Read Details</span>
                                <div className="w-0 group-hover:w-4 overflow-hidden transition-all text-indigo-600">→</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background patterns */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-5 dark:opacity-10 overflow-hidden">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
        </section>
    );
};

export default Features;
