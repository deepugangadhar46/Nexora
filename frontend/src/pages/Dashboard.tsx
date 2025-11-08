import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Lightbulb, 
  TrendingUp, 
  FileText, 
  Rocket, 
  Users, 
  ArrowRight,
  Sparkles,
  DollarSign,
  User,
  Presentation,
  Search,
  CreditCard,
  Gift,
  Github
} from "lucide-react";
import OnboardingTour from "@/components/OnboardingTour";
import GuidedTour from "@/components/GuidedTour";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useStore } from "@/store/useStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [userCredits, setUserCredits] = useState(20);
  const { hasCompletedOnboarding } = useStore();

  useEffect(() => {
    // Set user info from localStorage with validation
    const storedName = localStorage.getItem("userName");
    const storedCredits = localStorage.getItem("userCredits");
    const userId = localStorage.getItem("userId");
    
    // Validate user session
    if (!userId) {
      console.warn("No user ID found - redirecting to login");
      navigate("/login");
      return;
    }
    
    // User session validated successfully
    
    if (storedName) setUserName(storedName);
    if (storedCredits) {
      const credits = parseInt(storedCredits);
      setUserCredits(isNaN(credits) ? 20 : credits);
    }
  }, [navigate]);

  // Dashboard cards data
  const dashboardCards = [
    {
      title: "Idea Validation",
      description: "Validate your startup ideas with AI-powered market analysis",
      icon: Lightbulb,
      path: "/idea-validation",
      gradient: "from-blue-500 to-purple-600",
      stats: "3 ideas validated"
    },
    {
      title: "Marketing Strategy",
      description: "Deep market research, competitive intelligence, and comprehensive marketing plans",
      icon: TrendingUp,
      path: "/marketing-strategy",
      gradient: "from-green-500 to-teal-600",
      stats: "All-in-one solution",
      tourId: "marketing-strategy"
    },
    {
      title: "Business Plan",
      description: "Generate detailed business plans with financial projections", 
      icon: FileText,
      path: "/business-plan",
      gradient: "from-purple-500 to-pink-600",
      stats: "1 plan created"
    },
    {
      title: "MVP Development",
      description: "Build your minimum viable product with AI assistance",
      icon: Rocket,
      path: "/mvp-development", 
      gradient: "from-pink-500 to-rose-600",
      stats: "Ready to start",
      tourId: "mvp-builder"
    },
    {
      title: "Pitch Deck",
      description: "Create professional pitch decks with AI-powered content generation",
      icon: Presentation,
      path: "/pitch-deck",
      gradient: "from-orange-500 to-red-500",
      stats: "Ready to present",
      tourId: "pitch-deck"
    },
    {
      title: "Team Collaboration",
      description: "Manage team tasks, projects, and communication",
      icon: Users,
      path: "/team-collaboration",
      gradient: "from-indigo-500 to-purple-600",
      stats: "Collaborate now"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Breadcrumbs />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Welcome back, {userName}! 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 dark:text-gray-400"
          >
            Ready to build your next startup? Choose a tool below to get started.
          </motion.p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => navigate(card.path)}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer group overflow-hidden transition-all"
                data-tour={(card as any).tourId || card.path.substring(1)}
              >
                {/* Subtle gradient accent on hover only */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${card.gradient} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                    {card.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {card.stats}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-pulse-500 transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Buy Credits */}
          <button
            onClick={() => navigate("/pricing")}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-500 transition-all flex items-center space-x-3 group"
          >
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-500 transition-colors">
              <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400 group-hover:text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Buy Credits</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current: {userCredits} credits</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
          </button>

          {/* Referrals */}
          <button
            onClick={() => navigate("/profile?tab=referrals")}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all flex items-center space-x-3 group"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-500 transition-colors">
              <Gift className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Refer & Earn</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get 100 credits per referral</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
          </button>

          {/* GitHub Integration */}
          <button
            onClick={() => navigate("/mvp-development")}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white transition-all flex items-center space-x-3 group"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors">
              <Github className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white dark:group-hover:text-gray-900" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Export to GitHub</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Push your projects</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </button>
        </motion.div>

        {/* Quick Start Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-pulse-500 to-orange-600 rounded-xl p-8 text-white shadow-lg relative overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 animate-pulse" />
                Start Your Journey
              </h2>
              <p className="text-white/90 text-lg">
                Transform your idea into a complete startup in minutes ⚡
              </p>
              <p className="text-white/70 text-sm mt-1">
                AI-powered validation, planning, and development
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/idea-validation")}
              className="px-8 py-4 bg-white text-pulse-600 rounded-full font-bold hover:bg-gray-100 transition-all shadow-xl"
            >
              Validate Your Idea →
            </motion.button>
          </div>
        </motion.div>
        
      </main>
      
      {/* Guided Tour */}
      <GuidedTour tourType="dashboard" />
    </div>
  );
};

export default Dashboard;