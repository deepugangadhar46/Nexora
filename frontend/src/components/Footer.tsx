
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Linkedin, 
  Github, 
  Youtube,
  ArrowRight,
  Heart,
  Shield,
  Zap,
  Users,
  BookOpen,
  HelpCircle,
  FileText,
  Lock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubscribing(false);
      setEmail("");
      // You can add toast notification here
    }, 1500);
  };

  const footerLinks = {
    product: [
      { name: "Idea Validation", href: "/idea-validation" },
      { name: "Marketing Strategy", href: "/marketing-strategy" },
      { name: "Business Plan", href: "/business-plan" },
      { name: "MVP Development", href: "/mvp-development" },
      { name: "Team Collaboration", href: "/team-collaboration" },
      { name: "Pitch Deck", href: "/pitch-deck" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Blog", href: "/blog" },
      { name: "Press Kit", href: "/press" },
      { name: "Contact", href: "/contact" },
      { name: "Partners", href: "/partners" },
    ],
    resources: [
      { name: "Documentation", href: "/docs" },
      { name: "Help Center", href: "/help" },
      { name: "API Reference", href: "/api" },
      { name: "Templates", href: "/templates" },
      { name: "Community", href: "/community" },
      { name: "Status", href: "/status" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR", href: "/gdpr" },
      { name: "Security", href: "/security" },
      { name: "Compliance", href: "/compliance" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/nexora", color: "hover:text-blue-400" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/nexora", color: "hover:text-blue-600" },
    { name: "GitHub", icon: Github, href: "https://github.com/nexora", color: "hover:text-gray-900 dark:hover:text-white" },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com/nexora", color: "hover:text-red-500" },
  ];

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black border-t border-gray-200 dark:border-gray-800">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-pulse-500 to-pulse-600 dark:from-pulse-600 dark:to-pulse-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <h3 className="text-3xl font-bold text-white mb-4">
                Stay Updated with NEXORA
              </h3>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Get the latest updates, startup tips, and exclusive features delivered to your inbox.
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={handleNewsletterSubmit}
              className="max-w-md mx-auto flex gap-3"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-full border-none bg-white/10 backdrop-blur-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubscribing}
                className="px-6 py-3 bg-white text-pulse-600 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubscribing ? (
                  <div className="w-5 h-5 border-2 border-pulse-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-8 h-8 text-pulse-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent">
                  NEXORA
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Empowering entrepreneurs to build startups faster with AI. From idea to MVP to market - all automated.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>hello@nexora.ai</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors ${social.color}`}
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-pulse-500" />
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-gray-600 dark:text-gray-400 hover:text-pulse-500 dark:hover:text-pulse-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2 text-pulse-500" />
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-gray-600 dark:text-gray-400 hover:text-pulse-500 dark:hover:text-pulse-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-pulse-500" />
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-gray-600 dark:text-gray-400 hover:text-pulse-500 dark:hover:text-pulse-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-pulse-500" />
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.href)}
                    className="text-gray-600 dark:text-gray-400 hover:text-pulse-500 dark:hover:text-pulse-400 transition-colors text-sm"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h5 className="font-semibold text-gray-900 dark:text-white mb-1">SOC 2 Compliant</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enterprise-grade security</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <Lock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h5 className="font-semibold text-gray-900 dark:text-white mb-1">GDPR Ready</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Privacy by design</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h5 className="font-semibold text-gray-900 dark:text-white mb-1">99.9% Uptime</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">Always available</p>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center md:text-left">
              © 2025 NEXORA. All rights reserved. 
              <span className="text-pulse-500 font-medium ml-2">
                Build Your Dream. Launch Your Future.
              </span>
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>in Bengaluru</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
