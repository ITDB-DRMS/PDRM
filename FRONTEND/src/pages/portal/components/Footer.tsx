import React from "react";
import {
    MapPin, Phone, Mail, Globe,
    Facebook, Twitter, Linkedin, Instagram,
    Send, ShieldIcon, HelpCircle
} from "lucide-react";

const Footer: React.FC = () => {
    return (
        <footer id="contact" className="bg-slate-950 text-slate-300 pt-24 pb-12 overflow-hidden relative">
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16 mb-20">

                    {/* Column 1: Location & Brand */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-2 group cursor-pointer inline-block">
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                                <Globe className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-white">
                                IDRM<span className="text-indigo-600">IS</span>
                            </span>
                        </div>

                        <p className="text-slate-500 leading-relaxed max-w-xs">
                            Pioneering disaster management technology for safer and more resilient future. Our platform connects data with decision making.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 group">
                                <div className="p-2 rounded-lg bg-indigo-900/40 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Location</h4>
                                    <p className="text-slate-500 text-sm">Addis Ababa, Ethiopia</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="p-2 rounded-lg bg-teal-900/40 text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Contact</h4>
                                    <p className="text-slate-500 text-sm">+251 911 22 33 44</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="p-2 rounded-lg bg-blue-900/40 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold">Email</h4>
                                    <p className="text-slate-500 text-sm">support@idrms.org</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-white relative inline-block pb-2 border-b-2 border-indigo-600">
                            Quick Links
                        </h3>
                        <ul className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <li><a href="#" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>Home</a></li>
                            <li><a href="#about" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>About Us</a></li>
                            <li><a href="#contact" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>Contact</a></li>
                            <li><a href="/login" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group font-bold text-indigo-400"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>My Portal</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-indigo-500 transition-colors flex items-center gap-2 group"><span className="w-1 h-1 bg-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-all"></span>Services</a></li>
                        </ul>

                        <div className="pt-8">
                            <h4 className="text-white font-semibold mb-4">Connect With us</h4>
                            <div className="flex gap-4">
                                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all transform hover:-translate-y-1">
                                        <Icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Other Info & Newsletter */}
                    <div className="space-y-8">
                        <h3 className="text-xl font-bold text-white relative inline-block pb-2 border-b-2 border-indigo-600">
                            Stay Updated
                        </h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                            Subscribe to our newsletter for the latest updates in disaster management technology and insights.
                        </p>

                        <form className="relative group">
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-4 pr-14 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 transition-all"
                            />
                            <button className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                                <Send className="w-4 h-4" />
                            </button>
                        </form>

                        <div className="grid grid-cols-1 gap-4 pt-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer">
                                <ShieldIcon className="w-5 h-5 text-indigo-500" />
                                <span className="text-xs text-white">ISO 27001 Certified Security</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer">
                                <HelpCircle className="w-5 h-5 text-teal-500" />
                                <span className="text-xs text-white">24/7 Premium Support Desk</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} IDRMIS. All rights reserved by Innovation Management Team.
                    </p>
                    <div className="flex gap-8 text-xs text-slate-600">
                        <a href="#" className="hover:text-indigo-500">Terms of Service</a>
                        <a href="#" className="hover:text-indigo-500">Privacy Policy</a>
                        <a href="#" className="hover:text-indigo-500">Cookie Policy</a>
                    </div>
                </div>
            </div>

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none" />
        </footer>
    );
};

export default Footer;
