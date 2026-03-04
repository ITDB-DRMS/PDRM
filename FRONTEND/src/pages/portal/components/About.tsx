import React from "react";
import { motion } from "framer-motion";
import { Info, Target, Users, Layout } from "lucide-react";

const aboutItems = [
    {
        icon: <Target className="w-8 h-8 text-indigo-500" />,
        title: "Mission",
        description: "To build resilient communities through advanced data management and strategic risk mitigation.",
    },
    {
        icon: <Users className="w-8 h-8 text-indigo-500" />,
        title: "Community First",
        description: "Centering disaster management around people, ensuring rapid response and inclusive safety measures.",
    },
    {
        icon: <Layout className="w-8 h-8 text-indigo-500" />,
        title: "Smart Integration",
        description: "Seamlessly connecting various disaster management modules for a unified visibility and control.",
    },
];

const About: React.FC = () => {
    return (
        <section id="about" className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-sm border border-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-800">
                            <Info className="w-4 h-4" />
                            <span>About IDRMIS</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                            Pioneering Innovative <span className="text-indigo-600">Disaster Management</span> Solutions
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                            Our platform provides a comprehensive ecosystem for managing disaster risks, ensuring that organizations can respond faster, plan smarter, and save lives through data-driven decisions.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                            {aboutItems.map((item, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ x: 10 }}
                                    className="flex items-start gap-5 p-6 rounded-2xl bg-slate-50 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
                                >
                                    <div className="flex-shrink-0 p-3 rounded-xl bg-indigo-50">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-xl mb-1">{item.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Graphic */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="flex-1 relative perspective-1000 hidden lg:block"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_22px_70px_-15px_rgba(79,70,229,0.3)] transform hover:rotate-3 transition-transform duration-500">
                            <img
                                src="/assets/images/hero2.png"
                                alt="IDRMIS dashboard"
                                className="w-full h-[600px] object-cover"
                            />
                            <div className="absolute inset-0 bg-indigo-600/10 mix-blend-overlay"></div>
                        </div>
                        {/* Soft Neumorphism accents */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-400/20 blur-3xl rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-600/20 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
