
import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, Moon, Sun, Search, Bell, User as UserIcon, Sparkles, Settings, LogOut, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import NotificationCenter from "./NotificationCenter";

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    email: string;
    credits: number;
  } | null>(null);
  
  const { theme, setTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useStore();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check if user is logged in and load user info
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");
    const userCredits = localStorage.getItem("userCredits");
    
    if (userId) {
      setIsLoggedIn(true);
      setUserInfo({
        id: userId,
        name: userName || "User",
        email: userEmail || "",
        credits: parseInt(userCredits || "0")
      });
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  }, []);

  const toggleThemeMode = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => {
      const newState = !prev;
      // Prevent background scrolling when menu is open
      document.body.style.overflow = newState ? 'hidden' : '';
      return newState;
    });
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    closeMenu();
  }, [closeMenu]);

  const handleLogout = useCallback(() => {
    // Clear all user data from localStorage
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userCredits");
    localStorage.removeItem("token");
    
    // Update state
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowProfileMenu(false);
    
    // Redirect to home
    navigate("/");
  }, [navigate]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMenuOpen) closeMenu();
        if (showProfileMenu) setShowProfileMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showProfileMenu && !target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, showProfileMenu, closeMenu]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 py-2 sm:py-3 md:py-4 transition-all duration-300 bg-white/95 dark:bg-gray-900 backdrop-blur-md shadow-sm dark:shadow-gray-800/20"
    >
      <div className="container flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 group"
          aria-label="NEXORA"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className={cn(
              "w-6 h-6 transition-colors",
              isScrolled ? "text-orange-500 dark:text-white" : "text-orange-500 dark:text-white"
            )} />
            <span className={cn(
              "text-2xl font-bold transition-colors",
              isScrolled ? "text-orange-500 dark:text-white" : "text-orange-500 dark:text-white drop-shadow-lg"
            )}>NEXORA</span>
          </motion.div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
          <button 
            className={cn(
              "font-medium transition-colors",
              isScrolled ? "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300" : "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300"
            )}
            onClick={() => navigate("/")}
            aria-label="Go to homepage"
          >
            Home
          </button>
          <button 
            className={cn(
              "font-medium transition-colors",
              isScrolled ? "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300" : "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300"
            )}
            onClick={() => {
              if (window.location.pathname === '/') {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                navigate('/#features');
              }
            }}
            aria-label="View features section"
          >
            Features
          </button>
          <button 
            className={cn(
              "font-medium transition-colors",
              isScrolled ? "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300" : "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300"
            )}
            onClick={() => {
              if (window.location.pathname === '/') {
                const newsletterSection = document.getElementById('newsletter');
                if (newsletterSection) {
                  newsletterSection.scrollIntoView({ behavior: 'smooth' });
                }
              } else {
                navigate('/#newsletter');
              }
            }}
            aria-label="View newsletter section"
          >
            Newsletter
          </button>
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isScrolled ? "hover:bg-orange-50 dark:hover:bg-gray-800 text-orange-500 dark:text-white" : "hover:bg-orange-50 dark:hover:bg-gray-800 text-orange-500 dark:text-white"
              )}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleThemeMode}
              className={cn(
                "p-2 rounded-full transition-colors",
                isScrolled ? "hover:bg-orange-50 dark:hover:bg-gray-800 text-orange-500 dark:text-white" : "hover:bg-orange-50 dark:hover:bg-gray-800 text-orange-500 dark:text-white"
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {isLoggedIn ? (
              <>
                {/* Credits Badge */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/pricing")}
                  className={cn(
                    "hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full font-medium transition-all",
                    isScrolled 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl" 
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
                  )}
                  title="Click to upgrade"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold">{userInfo?.credits || 0}</span>
                  <span className="text-xs opacity-90">credits</span>
                </motion.button>

                {/* Notifications */}
                <NotificationCenter />

                {/* Profile Menu */}
                <div className="relative profile-menu-container">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={cn(
                      "px-4 py-2 rounded-full font-medium hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center space-x-2",
                      isScrolled 
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white focus:ring-orange-500" 
                        : "bg-white text-orange-600 focus:ring-white"
                    )}
                    aria-label="Profile menu"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{userInfo?.name || "User"}</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showProfileMenu && "rotate-180")} />
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {userInfo?.name || "User"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {userInfo?.email || ""}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Credits</span>
                            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                              {userInfo?.credits || 0}
                            </span>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate("/dashboard");
                              setShowProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            <UserIcon className="w-4 h-4" />
                            <span>Dashboard</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              navigate("/profile");
                              setShowProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              navigate("/pricing");
                              setShowProfileMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Billing & Credits</span>
                          </button>
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-3"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/login")}
                  className={cn(
                    "px-6 py-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg",
                    isScrolled ? "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300" : "text-orange-500 dark:text-white hover:text-orange-600 dark:hover:text-gray-300"
                  )}
                  aria-label="Sign in to your account"
                >
                  Login
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(249, 115, 22, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/register")}
                  className="px-6 py-2 bg-gradient-to-r from-pulse-500 to-pulse-600 text-white rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2"
                  aria-label="Create a new account"
                >
                  Get Started
                </motion.button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile menu button - increased touch target */}
        <button 
          className={cn(
            "md:hidden p-3 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg transition-colors",
            isScrolled ? "text-orange-500 dark:text-white" : "text-orange-500 dark:text-white"
          )}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation - improved for better touch experience */}
      <div 
        id="mobile-menu"
        className={cn(
          "fixed inset-0 z-40 bg-white flex flex-col pt-16 px-6 md:hidden transition-all duration-300 ease-in-out",
          isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <nav className="flex flex-col space-y-8 items-center mt-8">
          <button 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-colors" 
            onClick={() => {
              navigate("/");
              closeMenu();
            }}
            aria-label="Go to homepage"
          >
            Home
          </button>
          <button 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-colors" 
            onClick={() => {
              if (window.location.pathname === '/') {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
                closeMenu();
              } else {
                navigate('/#features');
                closeMenu();
              }
            }}
            aria-label="View features section"
          >
            Features
          </button>
          <button 
            className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-colors" 
            onClick={() => {
              if (window.location.pathname === '/') {
                const newsletterSection = document.getElementById('newsletter');
                if (newsletterSection) {
                  newsletterSection.scrollIntoView({ behavior: 'smooth' });
                }
                closeMenu();
              } else {
                navigate('/#newsletter');
                closeMenu();
              }
            }}
            aria-label="View newsletter section"
          >
            Newsletter
          </button>
          {isLoggedIn ? (
            <button 
              onClick={() => {
                navigate("/dashboard");
                closeMenu();
              }}
              className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg bg-gradient-to-r from-pulse-500 to-pulse-600 text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-all"
              aria-label="Go to dashboard"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button 
                onClick={() => {
                  navigate("/login");
                  closeMenu();
                }}
                className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg border-2 border-pulse-600 text-pulse-600 hover:bg-pulse-50 focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-all"
                aria-label="Sign in to your account"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  navigate("/register");
                  closeMenu();
                }}
                className="text-xl font-medium py-3 px-6 w-full text-center rounded-lg bg-gradient-to-r from-pulse-500 to-pulse-600 text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-pulse-500 focus:ring-offset-2 transition-all"
                aria-label="Create a new account"
              >
                Sign Up
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pages, features, documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearch(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Quick Links</div>
                <div className="space-y-1">
                  {[
                    { name: 'Dashboard', path: '/dashboard' },
                    { name: 'Idea Validation', path: '/idea-validation' },
                    { name: 'Marketing Strategy', path: '/marketing-strategy' },
                    { name: 'MVP Development', path: '/mvp-development' },
                    { name: 'Branding', path: '/branding' },
                    { name: 'Pricing', path: '/pricing' },
                  ].map((link) => (
                    <button
                      key={link.path}
                      onClick={() => {
                        navigate(link.path);
                        setShowSearch(false);
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {link.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
