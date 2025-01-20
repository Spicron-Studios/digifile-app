'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Clock, Users } from 'lucide-react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-sky-500"
            >
              DigiFile
            </motion.div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-sky-500 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-sky-500 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-sky-500 transition-colors">Contact</a>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-sky-500 text-white px-6 py-2 rounded-full hover:bg-sky-600 transition-colors"
              onClick={() => window.location.href = '/login/signin'}
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-sky-50 to-white">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={fadeIn}
            className="text-center"
          >
            <motion.h1 
              className="text-6xl md:text-7xl font-bold text-gray-900 mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-sky-500">Digi</span>File
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              variants={fadeIn}
            >
              Transform your medical practice with our innovative digital filing system.
              Secure, efficient, and designed for healthcare professionals.
            </motion.p>
            <motion.div
              className="flex justify-center gap-4"
              variants={fadeIn}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-sky-500 text-white px-8 py-3 rounded-full text-lg hover:bg-sky-600 transition-colors"
              >
                Contact Us
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-sky-500 text-sky-500 px-8 py-3 rounded-full text-lg hover:bg-sky-50 transition-colors"
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div
              variants={fadeIn}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <FileText className="w-12 h-12 text-sky-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Digital Records</h3>
              <p className="text-gray-600">Secure digital storage for all your medical records</p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Shield className="w-12 h-12 text-sky-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">POPIA Compliant</h3>
              <p className="text-gray-600">Full compliance with healthcare privacy standards</p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Clock className="w-12 h-12 text-sky-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Access</h3>
              <p className="text-gray-600">Instant access to patient information</p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <Users className="w-12 h-12 text-sky-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Seamless sharing between healthcare providers</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-sky-500">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center text-white"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Practice?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of healthcare professionals already using DigiFile</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-sky-500 px-8 py-3 rounded-full text-lg hover:bg-sky-50 transition-colors"
              onClick={() => window.location.href = '/login/signin'}
            >
              Get Started Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-sky-500 mb-4">DigiFile</h3>
              <p className="text-gray-600">Transforming healthcare through digital innovation</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Features</li>
                <li>Pricing</li>
                <li>Security</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>POPIA Compliance</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>&copy; 2024 DigiFile. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}