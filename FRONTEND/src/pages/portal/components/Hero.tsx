import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Database } from "lucide-react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const slides = [
    {
        title: "Secure Disaster Risk Management",
        subtitle: "Empowering communities with smart data and real-time response capabilities.",
        image: "/assets/images/hero1.png",
        icon: <Shield className="w-12 h-12 text-indigo-400" />,
    },
    {
        title: "Digital Workflow & Efficiency",
        subtitle: "Streamlining complex administrative processes with automated approval systems.",
        image: "/assets/images/hero2.png",
        icon: <Zap className="w-12 h-12 text-teal-400" />,
    },
    {
        title: "Advanced Reporting & Analytics",
        subtitle: "Get deep insights into risks, mitigation strategies, and resource allocation.",
        image: "/assets/images/hero3.png",
        icon: <Database className="w-12 h-12 text-blue-400" />,
    },
];

const NodeNetwork: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                    }}
                    animate={{
                        x: [
                            Math.random() * 100 + "%",
                            Math.random() * 100 + "%",
                            Math.random() * 100 + "%",
                        ],
                        y: [
                            Math.random() * 100 + "%",
                            Math.random() * 100 + "%",
                            Math.random() * 100 + "%",
                        ],
                    }}
                    transition={{
                        duration: 20 + Math.random() * 20,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(99, 102, 241, 0)" />
                        <stop offset="50%" stopColor="rgba(99, 102, 241, 0.4)" />
                        <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
                    </linearGradient>
                </defs>
                {[...Array(10)].map((_, i) => (
                    <motion.line
                        key={i}
                        x1={`${Math.random() * 100}%`}
                        y1={`${Math.random() * 100}%`}
                        x2={`${Math.random() * 100}%`}
                        y2={`${Math.random() * 100}%`}
                        stroke="url(#lineGrad)"
                        strokeWidth="1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 5 + Math.random() * 5,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};

const Hero: React.FC = () => {
    return (
        <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-slate-900">
            <Swiper
                modules={[Autoplay, EffectFade, Pagination]}
                effect="fade"
                speed={1500}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true, el: ".swiper-custom-pagination" }}
                className="h-full w-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={index} className="relative h-full w-full">
                        {/* Background Image with Gradient Overlay */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] scale-110 group-active:scale-100"
                            style={{ backgroundImage: `url(${slide.image})` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                        </div>

                        {/* Content */}
                        <div className="container relative z-10 mx-auto px-4 h-full flex flex-col justify-center items-start text-white max-w-4xl pt-20">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="mb-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 inline-block shadow-lg border border-white/10"
                            >
                                {slide.icon}
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
                            >
                                {slide.title}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl font-light"
                            >
                                {slide.subtitle}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                                className="flex flex-wrap gap-4"
                            >
                                <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-2xl shadow-indigo-600/30 transition-all hover:translate-y-[-2px] flex items-center gap-2 group">
                                    Learn More
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all flex items-center gap-2">
                                    View Demo
                                </button>
                            </motion.div>
                        </div>
                        {/* Animated Graphics background */}
                        <NodeNetwork />
                    </SwiperSlide>
                ))}
                {/* Custom Pagination */}
                <div className="swiper-custom-pagination absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 flex gap-2" />
            </Swiper>
        </section>
    );
};

export default Hero;
