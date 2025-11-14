
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Play, Sparkles, Zap, Users, TrendingUp, ChevronRight } from "lucide-react";
import LottieAnimation from "./LottieAnimation";
import ParticlesBackground from "./ParticlesBackground";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useStore } from "@/store/useStore";

const Hero = memo(() => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [lottieData, setLottieData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  
  const { theme } = useStore();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  // Memoized mobile check
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Load Lottie animation with error handling
  useEffect(() => {
    const loadLottieData = async () => {
      try {
        const response = await fetch('/loop-header.lottie');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setLottieData(data);
      } catch (error) {
        console.warn("Lottie animation not available, using fallback:", error);
        setLottieData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLottieData();
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId);
  }, []);

  // Memoized mouse handlers for better performance
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !imageRef.current || isMobile) return;
    
    const {
      left,
      top,
      width,
      height
    } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    imageRef.current.style.transform = `perspective(1000px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg) scale3d(1.02, 1.02, 1.02)`;
  }, [isMobile]);
  
  const handleMouseLeave = useCallback(() => {
    if (!imageRef.current || isMobile) return;
    imageRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
  }, [isMobile]);

  useEffect(() => {
    // Skip effect on mobile
    if (isMobile) return;
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [isMobile, handleMouseMove, handleMouseLeave]);
  
  // Memoized scroll handler for parallax
  const handleScroll = useCallback(() => {
    if (isMobile) return;
    
    const scrollY = window.scrollY;
    const elements = document.querySelectorAll('.parallax');
    elements.forEach(el => {
      const element = el as HTMLElement;
      const speed = parseFloat(element.dataset.speed || '0.1');
      const yPos = -scrollY * speed;
      element.style.setProperty('--parallax-y', `${yPos}px`);
    });
  }, [isMobile]);

  useEffect(() => {
    // Skip parallax on mobile
    if (isMobile) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, handleScroll]);
  
  const stats = [
    { icon: Users, value: "25K+", label: "Entrepreneurs Served", color: "text-blue-500" },
    { icon: Zap, value: "8.7K", label: "Startups Launched", color: "text-green-500" },
    { icon: TrendingUp, value: "96%", label: "Success Rate", color: "text-pulse-500" },
  ];

  return (
    <section 
      ref={heroRef}
      className={cn(
        "overflow-hidden relative flex items-center",
        "bg-gradient-to-br from-white via-gray-50 to-pulse-50",
        "dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
      )}
      id="hero" 
    >
      {/* Particles Background */}
      <ParticlesBackground theme={theme} />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y }}
          className="absolute -top-[20%] -right-[10%] w-96 h-96 bg-gradient-to-br from-pulse-400/20 to-pulse-600/20 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: useTransform(scrollY, [0, 500], [0, -100]) }}
          className="absolute -bottom-[10%] -left-[10%] w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-pulse-300/10 rounded-full blur-2xl"
        />
      </div>
      
      <div className="container px-4 sm:px-6 lg:px-8 relative z-10" ref={containerRef}>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center py-16 md:py-20">
          {/* Left Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 dark:bg-gray-800/50 backdrop-blur-md text-gray-900 dark:text-white border border-pulse-200/30 mb-6"
            >
              <Sparkles className="w-4 h-4 mr-2 text-pulse-500" />
              <span className="font-semibold">AI-Powered Innovation</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold leading-tight mb-4 bg-gradient-to-r from-gray-900 via-pulse-600 to-gray-900 dark:from-white dark:via-pulse-400 dark:to-white bg-clip-text text-transparent"
            >
              Transform Ideas Into{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-pulse-500 to-pulse-600 bg-clip-text text-transparent">
                  Successful Startups
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-pulse-400 to-pulse-600 opacity-30 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </span>
              <br />
              <span className="text-gray-700 dark:text-gray-300">in Minutes</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed max-w-2xl mx-auto lg:mx-0"
            >
              🚀 <strong>AI-Powered Startup Generation:</strong> From market research and business planning to MVP development and pitch deck creation - all automated with cutting-edge AI technology.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(249, 115, 22, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")}
                className="flex items-center justify-center group bg-gradient-to-r from-pulse-500 via-pulse-600 to-pulse-700 text-white font-semibold rounded-full px-8 py-3.5 text-base shadow-xl hover:shadow-pulse-500/25 transition-all duration-300 relative overflow-hidden"
                aria-label={isLoggedIn ? "Go to Dashboard" : "Start Building Your Startup"}
              >
                <span className="relative z-10 flex items-center">
                  {isLoggedIn ? "Go to Dashboard" : "Start Building Your Startup"}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-2" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pulse-400 to-pulse-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVideo(true)}
                className="flex items-center justify-center group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white font-medium rounded-full px-6 py-3.5 text-base border-2 border-gray-200 dark:border-gray-600 hover:border-pulse-400 dark:hover:border-pulse-400 hover:bg-pulse-50 dark:hover:bg-pulse-900/20 transition-all duration-300"
              >
                <Play className="mr-2 w-5 h-5 text-pulse-500" />
                Watch Demo
              </motion.button>
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 max-w-2xl mx-auto lg:mx-0"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex flex-col items-center lg:items-start p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300"
                  >
                    <Icon className={`w-6 h-6 mb-2 ${stat.color}`} />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs text-center lg:text-left">{stat.label}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
          
          {/* Right Content - Visual */}
          <div className="w-full lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="relative"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-3xl">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse-600"></div>
                </div>
              ) : lottieData ? (
                <div className="relative">
                  <LottieAnimation 
                    animationPath={lottieData} 
                    className="w-full h-auto max-w-lg mx-auto"
                    loop={true}
                    autoplay={true}
                  />
                </div>
              ) : (
                <div className="relative group">
                  {/* Main Visual Card */}
                  <motion.div
                    whileHover={{ 
                      rotateY: !isMobile ? 5 : 0,
                      rotateX: !isMobile ? -5 : 0,
                      scale: 1.02 
                    }}
                    className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pulse-500/10 to-purple-600/10 opacity-50" />
                    
                    {/* Content */}
                    <div className="relative p-8">
                      <div className="text-center mb-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="inline-flex p-4 bg-gradient-to-br from-pulse-500 to-pulse-600 rounded-2xl mb-4"
                        >
                          <Sparkles className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          AI-Powered Generation
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Complete startup in minutes
                        </p>
                      </div>

                      {/* Feature List */}
                      <div className="space-y-3">
                        {[
                          "Market Research & Analysis",
                          "Business Plan Generation",
                          "MVP Development",
                          "Pitch Deck Creation"
                        ].map((feature, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-pulse-500 rounded-full" />
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {feature}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <motion.div
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center"
                    >
                      <Zap className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.div
                      animate={{ y: [10, -10, 10] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg flex items-center justify-center"
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Background Decorations */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-pulse-500/20 to-purple-600/20 rounded-3xl blur-xl -z-10" />
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Trust Indicators Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-12 text-center"
        >
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 mb-10 font-medium">
            ⭐ Trusted by entrepreneurs worldwide • Featured in TechCrunch, Forbes & Entrepreneur
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 mb-12">
            {[
              { name: "AI-Powered", icon: "🤖" },
              { name: "Secure & Private", icon: "🔒" },
              { name: "24/7 Support", icon: "💬" },
              { name: "Money-Back Guarantee", icon: "💯" },
            ].map((badge, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="flex items-center space-x-2 md:space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-5 py-3 md:px-6 md:py-3.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
              >
                <span className="text-xl md:text-2xl">{badge.icon}</span>
                <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">{badge.name}</span>
              </motion.div>
            ))}
          </div>

          {/* Social Proof Numbers */}
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-80">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pulse-600">4.9/5</div>
              <div className="text-sm md:text-base text-gray-500 mt-1">User Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pulse-600">50+</div>
              <div className="text-sm md:text-base text-gray-500 mt-1">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pulse-600">$2M+</div>
              <div className="text-sm md:text-base text-gray-500 mt-1">Funding Raised</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
