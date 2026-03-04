import React from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Features from "./components/Features";
import Footer from "./components/Footer";

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-white font-outfit transition-colors duration-300">
            <Header />
            <main>
                <Hero />
                <About />
                <Features />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
