import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, LogIn } from "lucide-react";
import { Link } from "react-router";

const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Home", href: "#" },
        { name: "About", href: "#about" },
        { name: "Contact Us", href: "#contact" },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg py-3"
                    : "bg-transparent py-5"
                }`}
        >
            <div className="container mx-auto px-4 md:px-6">
                <nav className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                            <Globe className="text-white w-6 h-6" />
                        </div>
                        <span className={`text-xl font-bold tracking-tight ${isScrolled ? "text-slate-900 dark:text-white" : "text-slate-900 dark:text-white md:text-white"
                            }`}>
                            IDRM<span className="text-indigo-600">IS</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`text-sm font-medium relative group transition-colors ${isScrolled ? "text-slate-600 hover:text-indigo-600" : "text-white/90 hover:text-white"
                                    }`}
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-300 group-hover:w-full"></span>
                            </a>
                        ))}
                        <Link
                            to="/login"
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-full transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-indigo-500/25 flex items-center gap-2"
                        >
                            My Portal
                            <LogIn className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? "text-slate-900" : "text-white"
                            }`}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </nav>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white dark:bg-slate-800 border-t dark:border-slate-700 overflow-hidden"
                    >
                        <div className="flex flex-col p-4 gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-slate-600 dark:text-slate-300 font-medium py-2 px-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.name}
                                </a>
                            ))}
                            <Link
                                to="/login"
                                className="mx-4 mt-2 px-6 py-3 bg-indigo-600 text-white text-center font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                My Portal
                                <LogIn className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
