import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";
import { generateChartUrl } from "@/lib/chartUtils";
import { 
  ArrowLeft, 
  Presentation, 
  Download, 
  Eye, 
  Loader2, 
  Sparkles, 
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  BarChart3,
  PieChart,
  FileText,
  Image,
  Palette,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Plus,
  X,
  Upload,
  Mic,
  Video,
  MessageCircle,
  Settings,
  Wand2,
  ChevronRight,
  CheckCircle,
  Clock,
  Zap,
  Brain,
  Volume2,
  VolumeX,
  Edit3,
  Save,
  RefreshCw
} from "lucide-react";

// Types and Interfaces
interface SlideContent {
  slide_number: number;
  title: string;
  content: string[];
  notes: string;
  chart_data?: any;
  chart_type?: string;
}

interface DesignTheme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  style_description: string;
}

interface VoiceoverNarration {
  slide_number: number;
  text: string;
  audio_url?: string;
  duration_seconds: number;
}

interface DemoScript {
  full_script: string;
  slide_scripts: any[];
  total_duration_minutes: number;
  pacing_cues: string[];
  emphasis_points: string[];
}

interface InvestorQuestion {
  question: string;
  category: string;
  difficulty: string;
  suggested_answer: string;
  key_points: string[];
}

interface PitchDeckData {
  deck_id: string;
  business_name: string;
  tagline: string;
  slides: SlideContent[];
  design_theme: DesignTheme;
  voiceovers: VoiceoverNarration[];
  demo_script: DemoScript;
  investor_qa: InvestorQuestion[];
  pptx_url?: string;
  video_url?: string;
}

const PitchDeck = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form State
  const [formData, setFormData] = useState({
    businessIdea: "",
    businessName: "",
    targetMarket: "",
    fundingAsk: 100000
  });

  // App State
  const [currentModule, setCurrentModule] = useState("generator");
  const [pitchDeckData, setPitchDeckData] = useState<PitchDeckData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userCredits, setUserCredits] = useState(20);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<DesignTheme | null>(null);
  const [selectedGradientTheme, setSelectedGradientTheme] = useState<string | null>(null);
  const [voiceoverEnabled, setVoiceoverEnabled] = useState(false);
  const [demoScript, setDemoScript] = useState<DemoScript | null>(null);
  const [investorQA, setInvestorQA] = useState<InvestorQuestion[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Active theme for preview: prefer user-selected theme, fall back to backend-provided theme
  const activeTheme: DesignTheme | null = pitchDeckData
    ? (selectedTheme || pitchDeckData.design_theme)
    : selectedTheme;

  const currentSlideData: SlideContent | null =
    pitchDeckData && pitchDeckData.slides.length > 0
      ? pitchDeckData.slides[currentSlide]
      : null;

  const currentSlideChartUrl = currentSlideData?.chart_data && currentSlideData.chart_type
    ? generateChartUrl({
        type: currentSlideData.chart_type,
        data: currentSlideData.chart_data,
        width: 700,
        height: 400,
      })
    : "";

  useEffect(() => {
    if (!isPresenting) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pitchDeckData) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        if (currentSlide < pitchDeckData.slides.length - 1) {
          setCurrentSlide((prev) => Math.min(prev + 1, pitchDeckData.slides.length - 1));
        }
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        if (currentSlide > 0) {
          setCurrentSlide((prev) => Math.max(prev - 1, 0));
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        setIsPresenting(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresenting, currentSlide, pitchDeckData]);

  const handleThemeClick = (theme: { name: string; color: string }) => {
    setSelectedGradientTheme(theme.color);
    selectDesignTheme(theme.name);
  };

  useEffect(() => {
    const credits = localStorage.getItem('userCredits');
    if (credits) {
      setUserCredits(parseInt(credits));
    }

    // Pre-fill from previous steps if available
    if (location.state?.businessData) {
      setFormData(prev => ({ ...prev, ...location.state.businessData }));
    }
  }, [location.state]);

  // Module 1: Auto Slide Generator
  const generateSlides = async () => {
    if (!formData.businessIdea || !formData.businessName) {
      alert('Please fill in business idea and name.');
      return;
    }

    if (userCredits < 3) {
      alert('Insufficient credits. You need at least 3 credits to generate slides.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:8000/api/pitch-deck/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          business_idea: formData.businessIdea,
          business_name: formData.businessName,
          target_market: formData.targetMarket,
          funding_ask: formData.fundingAsk,
          userId: localStorage.getItem('userId')
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const data = await response.json();

      // Backend returns slides as a PitchDeckSlides object (named fields),
      // but the UI expects an array. Normalize it here.
      const rawDeck = data.data;
      let normalizedSlides: SlideContent[] = [];

      if (Array.isArray(rawDeck.slides)) {
        normalizedSlides = rawDeck.slides as SlideContent[];
      } else if (rawDeck.slides && typeof rawDeck.slides === "object") {
        normalizedSlides = Object.values(rawDeck.slides) as SlideContent[];
        normalizedSlides.sort((a, b) => (a.slide_number || 0) - (b.slide_number || 0));
      }

      setPitchDeckData({
        ...rawDeck,
        slides: normalizedSlides,
      });
      
      // Update credits
      const newCredits = userCredits - 3;
      setUserCredits(newCredits);
      localStorage.setItem('userCredits', newCredits.toString());
      
    } catch (error) {
      console.error('Error generating slides:', error);
      alert('Error generating slides. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Module 2: Voiceover Narration
  const generateVoiceovers = async () => {
    if (!pitchDeckData) return;

    try {
      const response = await fetch('http://localhost:8000/api/pitch-deck/voiceover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deck_id: pitchDeckData.deck_id,
          slides: pitchDeckData.slides
        }),
      });

      const data = await response.json();
      setPitchDeckData(prev => prev ? { ...prev, voiceovers: data.voiceovers } : null);
      setVoiceoverEnabled(true);
    } catch (error) {
      console.error('Error generating voiceovers:', error);
    }
  };

  // Module 3: AI Design Theme Selector
  const selectDesignTheme = async (themeName: string) => {
    if (!pitchDeckData) return;

    try {
      const response = await fetch('http://localhost:8000/api/pitch-deck/design-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          // Backend DesignThemeRequest expects business_idea and brand_tone
          business_idea: formData.businessIdea,
          brand_tone: themeName
        }),
      });

      const data = await response.json();
      const theme: DesignTheme = data.data;
      setSelectedTheme(theme);
      setPitchDeckData(prev => prev ? { ...prev, design_theme: theme } : null);
    } catch (error) {
      console.error('Error selecting theme:', error);
    }
  };

  // Module 4: Demo Script Writer
  const generateDemoScript = async () => {
    if (!pitchDeckData) return;

    try {
      const response = await fetch('http://localhost:8000/api/pitch-deck/demo-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deck_id: pitchDeckData.deck_id,
          slides: pitchDeckData.slides,
          target_duration: 10 // 10 minutes
        }),
      });

      const data = await response.json();
      setDemoScript(data.demo_script);
    } catch (error) {
      console.error('Error generating demo script:', error);
    }
  };

  // Module 5: Investor Q&A Simulator
  const generateInvestorQA = async () => {
    if (!pitchDeckData) return;

    try {
      const response = await fetch('http://localhost:8000/api/pitch-deck/investor-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deck_id: pitchDeckData.deck_id,
          business_idea: formData.businessIdea,
          target_market: formData.targetMarket,
          num_questions: 15
        }),
      });

      const data = await response.json();
      setInvestorQA(data.questions);
    } catch (error) {
      console.error('Error generating Q&A:', error);
    }
  };

  // Module 6: PPTX Export
  const exportToPPTX = async () => {
    if (!pitchDeckData) return;

    try {
      const response = await fetch("http://localhost:8000/api/pitch-deck/export/pptx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          deck_id: pitchDeckData.deck_id,
          business_name: pitchDeckData.business_name || formData.businessName,
          tagline: pitchDeckData.tagline,
          // Send the exact slides currently rendered in the UI
          slides: pitchDeckData.slides,
          // Use the active theme so export matches preview
          design_theme: activeTheme || pitchDeckData.design_theme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PPTX");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.businessName || pitchDeckData.business_name}_pitch_deck.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting PPTX:", error);
      alert("Failed to export PPTX. Please try again.");
    }
  };

  // Navigation helpers
  const nextSlide = () => {
    if (pitchDeckData && currentSlide < pitchDeckData.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Design themes
  const designThemes = [
    { name: "Modern Tech", color: "from-blue-500 to-purple-600" },
    { name: "Corporate", color: "from-gray-600 to-blue-800" },
    { name: "Creative", color: "from-pink-500 to-orange-500" },
    { name: "Minimal", color: "from-gray-300 to-gray-600" },
    { name: "Bold", color: "from-red-500 to-yellow-500" },
    { name: "Investor", color: "from-emerald-500 to-teal-700" },
    { name: "Premium", color: "from-indigo-500 to-purple-700" },
    { name: "Minimal Dark", color: "from-gray-800 to-gray-900" },
    { name: "Gradient Neon", color: "from-fuchsia-500 to-cyan-500" },
    { name: "Warm Sunset", color: "from-orange-500 to-rose-500" }
  ];

  // Module navigation
  const modules = [
    { id: "generator", name: "Slide Generator", icon: Presentation, description: "Generate 12 professional slides" },
    { id: "themes", name: "Design Themes", icon: Palette, description: "AI-powered theme selection" },
    { id: "voiceover", name: "Voiceover", icon: Mic, description: "Add AI narration" },
    { id: "qa", name: "Investor Q&A", icon: MessageCircle, description: "Practice questions" },
    { id: "export", name: "Export", icon: Download, description: "Download as PPTX" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <Breadcrumbs />
      
      {/* Header */}
      <header className="fixed top-16 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                  <Presentation className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Pitch Deck Studio</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Credits:</span>
              <span className="text-lg font-bold text-orange-600">{userCredits}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          
          {/* Module Navigation */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setCurrentModule(module.id)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all",
                      currentModule === module.id
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{module.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Content */}
          <AnimatePresence mode="wait">
            {currentModule === "generator" && (
              <motion.div
                key="generator"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
              >
                {/* Input Form */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Sparkles className="w-6 h-6 text-orange-500 mr-2" />
                    Business Information
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Idea <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={formData.businessIdea}
                        onChange={(e) => setFormData({ ...formData, businessIdea: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Describe your business idea, problem you're solving, and solution..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Market
                      </label>
                      <input
                        type="text"
                        value={formData.targetMarket}
                        onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="e.g., Small Businesses, Millennials, Healthcare"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Funding Ask (USD)
                      </label>
                      <input
                        type="number"
                        value={formData.fundingAsk}
                        onChange={(e) => setFormData({ ...formData, fundingAsk: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="100000"
                      />
                    </div>

                    <button
                      onClick={generateSlides}
                      disabled={isGenerating || userCredits < 3}
                      className={cn(
                        "w-full py-4 rounded-full font-medium text-white transition-all duration-300",
                        "bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "flex items-center justify-center space-x-2"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating Slides...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          <span>Generate 12 Slides (3 Credits)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview/Results */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700 xl:col-span-1">
                  {!pitchDeckData ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 mb-4">
                        <Presentation className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI-Powered Pitch Deck</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6">Generate professional slides automatically</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-left">
                        {[
                          "Title & Company Overview",
                          "Problem Statement", 
                          "Solution & Product",
                          "Market Opportunity",
                          "Business Model",
                          "Traction & Metrics",
                          "Competition Analysis", 
                          "Team & Advisors",
                          "Financial Projections",
                          "Funding Ask & Use",
                          "Vision & Roadmap",
                          "Call to Action"
                        ].map((slide, index) => (
                          <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg p-3 border border-orange-200 dark:border-orange-700/70">
                            <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">{index + 1}. {slide}</div>
                            <div className="h-8 bg-white dark:bg-gray-900 rounded border border-orange-200 dark:border-orange-700/70 flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-300">Slide {index + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Generated Slides</h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setIsPresenting(true)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                          >
                            <Play className="w-4 h-4" />
                            <span>Present</span>
                          </button>
                        </div>
                      </div>

                      {/* Slide Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={prevSlide}
                          disabled={currentSlide === 0}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Slide {currentSlide + 1} of {pitchDeckData.slides.length}
                        </span>
                        <button
                          onClick={nextSlide}
                          disabled={currentSlide === pitchDeckData.slides.length - 1}
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Current Slide */}
                      <div
                        className={cn(
                          "rounded-lg p-8 min-h-[300px] border",
                          selectedGradientTheme
                            ? `bg-gradient-to-br ${selectedGradientTheme}`
                            : !activeTheme && "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
                        )}
                        style={activeTheme ? {
                          backgroundColor: activeTheme.background_color,
                          borderColor: activeTheme.accent_color || activeTheme.primary_color,
                          color: activeTheme.text_color
                        } : undefined}
                      >
                        <div className="text-center">
                          <h4 className="text-2xl font-bold mb-4">
                            {currentSlideData?.title}
                          </h4>
                          <div
                            className={cn(
                              "space-y-2",
                              !activeTheme && "text-gray-700"
                            )}
                          >
                            {currentSlideData?.content.map((item, index) => (
                              <p key={index} className="text-left">• {item}</p>
                            ))}
                          </div>
                          {currentSlideChartUrl && (
                            <div className="mt-6 flex justify-center">
                              <img
                                src={currentSlideChartUrl}
                                alt="Slide chart"
                                className="max-h-56 w-full object-contain rounded-lg border border-orange-200 dark:border-orange-700/70 bg-white dark:bg-gray-900"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Slide Thumbnails */}
                      <div className="flex space-x-2 mt-4 overflow-x-auto">
                        {pitchDeckData.slides.map((slide, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={cn(
                              "flex-shrink-0 w-20 h-12 rounded border-2 flex items-center justify-center text-xs",
                              currentSlide === index
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500"
                            )}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme selection shown alongside preview once slides are generated */}
                {pitchDeckData && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700 xl:col-span-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                      <Palette className="w-6 h-6 text-orange-500 mr-2" />
                      Choose Design Theme
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Select a theme for your deck before exporting the final PPT. You can change this anytime.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {designThemes.map((theme, index) => (
                        <button
                          key={index}
                          onClick={() => handleThemeClick(theme)}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all text-left",
                            selectedTheme?.name === theme.name
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                          )}
                        >
                          <div className={`w-full h-16 rounded-lg bg-gradient-to-r ${theme.color} mb-3`}></div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Design Themes Module */}
            {currentModule === "themes" && (
              <motion.div
                key="themes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Palette className="w-6 h-6 text-orange-500 mr-2" />
                  Design Themes
                </h3>
                {pitchDeckData ? (
                  activeTheme && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Current theme: <span className="font-semibold text-gray-900 dark:text-white">{activeTheme.name}</span>
                    </p>
                  )
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Generate your slides first to let AI fine-tune the theme. You can still preview the available styles below.
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {designThemes.map((theme, index) => (
                    <button
                      key={index}
                      onClick={() => handleThemeClick(theme)}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all",
                        selectedTheme?.name === theme.name
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                      )}
                    >
                      <div className={`w-full h-20 rounded-lg bg-gradient-to-r ${theme.color} mb-3`}></div>
                      <p className="font-medium text-gray-900 dark:text-white">{theme.name}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Voiceover Module */}
            {currentModule === "voiceover" && pitchDeckData && (
              <motion.div
                key="voiceover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Mic className="w-6 h-6 text-orange-500 mr-2" />
                  AI Voiceover Narration
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Generate Voiceovers</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Add AI narration to all slides using ElevenLabs</p>
                    </div>
                    <button
                      onClick={generateVoiceovers}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Generate</span>
                    </button>
                  </div>

                  {pitchDeckData.voiceovers && pitchDeckData.voiceovers.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Generated Voiceovers</h4>
                      {pitchDeckData.voiceovers.map((voiceover, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 dark:text-white">Slide {voiceover.slide_number}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{voiceover.text.substring(0, 100)}...</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{voiceover.duration_seconds}s</span>
                          </div>
                          <button
                            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Charts Module */}
            {currentModule === "charts" && pitchDeckData && (
              <motion.div
                key="charts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <BarChart3 className="w-6 h-6 text-orange-500 mr-2" />
                  Chart Auto-Builder
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Market Size", type: "bar", description: "TAM, SAM, SOM visualization" },
                    { name: "Revenue Growth", type: "line", description: "5-year revenue projections" },
                    { name: "Market Share", type: "pie", description: "Competitive positioning" },
                    { name: "User Acquisition", type: "area", description: "Customer growth metrics" },
                    { name: "Unit Economics", type: "bar", description: "LTV, CAC, and margins" },
                    { name: "Funding Timeline", type: "line", description: "Fundraising milestones" }
                  ].map((chart, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{chart.name}</h4>
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{chart.description}</p>
                      <div className="h-24 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 rounded border border-orange-200 dark:border-orange-700/70 flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-300">Chart Preview</span>
                      </div>
                      <button className="w-full mt-3 px-3 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded hover:bg-orange-200 dark:hover:bg-orange-800/70 text-sm">
                        Add to Slide
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Demo Script Module */}
            {currentModule === "script" && pitchDeckData && (
              <motion.div
                key="script"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FileText className="w-6 h-6 text-orange-500 mr-2" />
                  Demo Day Script Writer
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Generate Presentation Script</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">AI-powered script for demo day presentation</p>
                    </div>
                    <button
                      onClick={generateDemoScript}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Generate Script</span>
                    </button>
                  </div>

                  {demoScript && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Generated Script</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="w-4 h-4" />
                          <span>{demoScript.total_duration_minutes} minutes</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{demoScript.full_script}</pre>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Pacing Cues</h5>
                          <ul className="space-y-1">
                            {demoScript.pacing_cues.map((cue, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                <Zap className="w-3 h-3 text-orange-500 mr-2" />
                                {cue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Emphasis Points</h5>
                          <ul className="space-y-1">
                            {demoScript.emphasis_points.map((point, index) => (
                              <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                <Target className="w-3 h-3 text-red-500 mr-2" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Investor Q&A Module */}
            {currentModule === "qa" && pitchDeckData && (
              <motion.div
                key="qa"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <MessageCircle className="w-6 h-6 text-orange-500 mr-2" />
                  Investor Q&A Simulator
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Generate Practice Questions</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">AI-generated investor questions with suggested answers</p>
                    </div>
                    <button
                      onClick={generateInvestorQA}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Generate Q&A</span>
                    </button>
                  </div>

                  {investorQA.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">Practice Questions ({investorQA.length})</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {['financial', 'market', 'team', 'product', 'competition'].map((category) => (
                          <div key={category} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="text-lg font-bold text-orange-600">
                              {investorQA.filter(q => q.category === category).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 capitalize">{category}</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {investorQA.map((qa, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium capitalize",
                                qa.difficulty === "easy" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                qa.difficulty === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              )}>
                                {qa.difficulty}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{qa.category}</span>
                            </div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{qa.question}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{qa.suggested_answer}</p>
                            <div className="flex flex-wrap gap-1">
                              {qa.key_points.map((point, pointIndex) => (
                                <span key={pointIndex} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-xs">
                                  {point}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Export Module */}
            {currentModule === "export" && pitchDeckData && (
              <motion.div
                key="export"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-elegant p-8 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Download className="w-6 h-6 text-orange-500 mr-2" />
                  Export
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* PPTX Export - Recommended */}
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <FileText className="w-8 h-8 text-orange-500" />
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PowerPoint (PPTX)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Professional presentation format with all slides and design</p>
                    <button
                      onClick={exportToPPTX}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Download PPTX
                    </button>
                  </div>

                  {/* Video Presentation - Not yet available */}
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <Video className="w-8 h-8 text-blue-500" />
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Not yet available</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Video Presentation</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Animated video with voiceover narration</p>
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Generate Video
                    </button>
                  </div>

                  {/* PDF Export - Premium only */}
                  <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <Image className="w-8 h-8 text-purple-500" />
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Premium only</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PDF Export</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Download your pitch deck as a shareable PDF (coming for premium users)</p>
                    <button
                      disabled
                      className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Sharing Options</h4>
                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Share Link
                    </button>
                    <button className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Email Investors
                    </button>
                    <button className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                      Generate QR Code
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
          </AnimatePresence>
        </div>
      </main>

      {isPresenting && pitchDeckData && currentSlideData && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 text-white">
            <div className="flex items-center space-x-3">
              <Presentation className="w-5 h-5" />
              <span className="font-semibold text-sm sm:text-base">
                {pitchDeckData.business_name || formData.businessName || "Pitch Deck"}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs sm:text-sm">
              <span>
                Slide {currentSlide + 1} of {pitchDeckData.slides.length}
              </span>
              <button
                onClick={() => setIsPresenting(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 pb-8">
            <div
              className={cn(
                "w-full max-w-5xl aspect-video rounded-2xl shadow-2xl border overflow-hidden flex flex-col justify-between",
                selectedGradientTheme
                  ? `bg-gradient-to-br ${selectedGradientTheme}`
                  : !activeTheme && "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
              )}
              style={activeTheme ? {
                backgroundColor: activeTheme.background_color,
                borderColor: activeTheme.accent_color || activeTheme.primary_color,
                color: activeTheme.text_color
              } : undefined}
            >
              <div className="p-8 sm:p-10 flex-1 flex flex-col">
                <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-center">
                  {currentSlideData.title}
                </h2>
                <div className={cn("flex-1 flex", currentSlideChartUrl ? "flex-row gap-8" : "flex-col")}
                >
                  <div className={cn("space-y-3 text-base sm:text-xl", currentSlideChartUrl && "flex-1")}
                  >
                    {currentSlideData.content.map((item, index) => (
                      <p key={index}>• {item}</p>
                    ))}
                  </div>
                  {currentSlideChartUrl && (
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src={currentSlideChartUrl}
                        alt="Slide chart"
                        className="max-h-full max-w-full object-contain rounded-lg bg-white/80 border border-white/40"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between text-white text-xs sm:text-sm bg-black/20">
                <div className="space-x-3 hidden sm:block">
                  <span>←/→ or PageUp/PageDown to navigate</span>
                  <span>•</span>
                  <span>Esc to exit</span>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === pitchDeckData.slides.length - 1}
                    className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDeck;
