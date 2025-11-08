import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { apiPost, APIError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { 
  Search, TrendingUp, Users, Target, Loader2, BarChart, Globe, DollarSign,
  FileDown, Megaphone, Sparkles, CheckCircle, Zap, Mail, Share2,
  Instagram, Linkedin, Youtube, ChevronDown, ChevronUp, PieChart, Activity
} from "lucide-react";
import { MarketResearchTab } from "@/components/marketing/MarketResearchTab";
import { MarketingStrategyTab } from "@/components/marketing/MarketingStrategyTab";

// Types
interface MarketData {
  TAM: { value: number; currency: string; description: string; growth_rate: number };
  SAM: { value: number; currency: string; description: string; percentage_of_TAM: number };
  SOM: { value: number; currency: string; description: string; percentage_of_SAM: number };
  market_trends: Array<{ trend: string; impact: string; description: string }>;
  growth_forecast: { next_year: number; three_years: number; five_years: number };
}

interface CompetitorData {
  name: string;
  market_share: number;
  strengths: string[];
  weaknesses: string[];
  key_products: string[];
  pricing_strategy: string;
}

interface MarketingChannel {
  channel: string;
  strategy: string;
  estimated_cost: number;
  expected_roi: number;
  timeline: string;
}

interface MarketingStrategyData {
  channels: MarketingChannel[];
  total_budget: number;
  customer_acquisition_strategy: string;
  retention_strategy: string;
  growth_tactics: string[];
}

export interface CombinedResults {
  market_research?: {
    market_data?: MarketData;
    competitors?: CompetitorData[];
    executive_summary?: string;
    key_insights?: string[];
    recommendations?: string[];
  };
  marketing_strategy?: MarketingStrategyData;
}

const MarketingStrategy = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    industry: "",
    targetMarket: "",
    idea: location.state?.idea || "",
    region: "Global",
    budget: 10000,
    competitors: [] as string[]
  });
  
  const [competitorInput, setCompetitorInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<CombinedResults | null>(null);
  const [userCredits, setUserCredits] = useState(20);
  const [activeTab, setActiveTab] = useState<"research" | "strategy">("research");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    const credits = localStorage.getItem("userCredits");
    if (credits) setUserCredits(parseInt(credits));

    if (location.state?.targetAudience) {
      setFormData(prev => ({ ...prev, targetMarket: location.state.targetAudience }));
    }
    if (location.state?.competitors) {
      setFormData(prev => ({ ...prev, competitors: location.state.competitors }));
    }
  }, [location.state]);

  const budgetOptions = [
    { value: 5000, label: "$5,000" },
    { value: 10000, label: "$10,000" },
    { value: 25000, label: "$25,000" },
    { value: 50000, label: "$50,000" },
    { value: 100000, label: "$100,000+" }
  ];

  const addCompetitor = () => {
    if (competitorInput.trim() && !formData.competitors.includes(competitorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitorInput.trim()]
      }));
      setCompetitorInput("");
    }
  };

  const removeCompetitor = (competitor: string) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.industry || !formData.targetMarket || !formData.idea) {
      alert("Please fill in all required fields");
      return;
    }

    if (userCredits < 5) {
      alert("Insufficient credits. You need at least 5 credits for comprehensive marketing strategy analysis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 90));
      }, 800);

      const result = await apiPost(
        "/api/marketing-strategy/comprehensive",
        {
          industry: formData.industry,
          targetMarket: formData.targetMarket,
          idea: formData.idea,
          region: formData.region,
          competitors: formData.competitors,
          budget: formData.budget,
          userId: localStorage.getItem("userId")
        },
        { maxRetries: 2, retryDelay: 2000 }
      );
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      setTimeout(() => {
        setResults(result.data);
        const newCredits = result.remainingCredits || (userCredits - 5);
        setUserCredits(newCredits);
        localStorage.setItem("userCredits", newCredits.toString());
      }, 500);
    } catch (error: any) {
      console.error("Marketing strategy error:", error);
      
      let errorMessage = "Failed to generate marketing strategy. Please try again.";
      
      if (error instanceof APIError) {
        if (error.status === 429) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.status === 401) {
          errorMessage = "Please log in to continue.";
          setTimeout(() => navigate("/login"), 2000);
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
      setAnalysisProgress(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <Breadcrumbs />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 rounded-full mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Marketing Strategy</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Comprehensive Marketing Strategy
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get deep market research, competitive intelligence, and AI-powered marketing strategies with channel recommendations and budget allocation
            </p>
          </motion.div>

          {!results ? (
            /* Input Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Business Idea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Idea *
                    </label>
                    <textarea
                      value={formData.idea}
                      onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                      placeholder="Describe your business and what you're offering..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 min-h-[120px] resize-none"
                      disabled={isAnalyzing}
                      required
                    />
                  </div>

                  {/* Industry & Target Market */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Industry *
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., SaaS, E-commerce, FinTech"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isAnalyzing}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Market *
                      </label>
                      <input
                        type="text"
                        value={formData.targetMarket}
                        onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                        placeholder="e.g., Small business owners, Millennials"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isAnalyzing}
                        required
                      />
                    </div>
                  </div>

                  {/* Region & Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Geographic Region
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={isAnalyzing}
                      >
                        <option value="Global">Global</option>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                        <option value="Latin America">Latin America</option>
                        <option value="Middle East">Middle East</option>
                        <option value="Africa">Africa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Marketing Budget
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={isAnalyzing}
                      >
                        {budgetOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Competitors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Known Competitors (Optional)
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={competitorInput}
                        onChange={(e) => setCompetitorInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                        placeholder="Enter competitor name"
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isAnalyzing}
                      />
                      <button
                        type="button"
                        onClick={addCompetitor}
                        className="px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        disabled={isAnalyzing}
                      >
                        Add
                      </button>
                    </div>
                    {formData.competitors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.competitors.map((competitor, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                          >
                            {competitor}
                            <button
                              type="button"
                              onClick={() => removeCompetitor(competitor)}
                              className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                              disabled={isAnalyzing}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Analyzing market and generating strategy...</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisProgress}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full bg-gradient-to-r from-green-500 to-teal-600"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isAnalyzing || !formData.idea.trim() || !formData.industry.trim() || !formData.targetMarket.trim()}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2",
                      isAnalyzing || !formData.idea.trim() || !formData.industry.trim() || !formData.targetMarket.trim()
                        ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Comprehensive Strategy...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Marketing Strategy (5 Credits)</span>
                      </>
                    )}
                  </button>

                  {/* Features Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {[
                      { icon: Search, label: "Market Research" },
                      { icon: Users, label: "Competitor Analysis" },
                      { icon: Target, label: "Channel Strategy" },
                      { icon: BarChart, label: "Budget Planning" }
                    ].map((feature, index) => (
                      <div key={index} className="text-center">
                        <feature.icon className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">{feature.label}</p>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
            </motion.div>
          ) : (
            /* Results Display */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Header with Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Marketing Strategy
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Budget: <span className="font-semibold text-green-600 dark:text-green-400">
                      ${formData.budget.toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab("research")}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "research"
                          ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      <Search className="w-4 h-4 inline mr-2" />
                      Market Research
                    </button>
                    <button
                      onClick={() => setActiveTab("strategy")}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "strategy"
                          ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      )}
                    >
                      <TrendingUp className="w-4 h-4 inline mr-2" />
                      Marketing Strategy
                    </button>
                  </div>
                  <button
                    onClick={() => setResults(null)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                  >
                    New Analysis
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "research" && results.market_research && (
                <MarketResearchTab data={results.market_research} />
              )}

              {activeTab === "strategy" && results.marketing_strategy && (
                <MarketingStrategyTab data={results.marketing_strategy} budget={formData.budget} navigate={navigate} idea={formData.idea} />
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MarketingStrategy;
