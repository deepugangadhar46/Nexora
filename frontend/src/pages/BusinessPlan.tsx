import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Target,
  Shield,
  Download,
  Loader2,
  Sparkles,
  CheckCircle,
  BarChart3,
  Briefcase,
  Calendar,
  PieChart
} from "lucide-react";
import { 
  createBusinessPlan, 
  type BusinessPlanResponse, 
  type LeanCanvasBlock 
} from "@/lib/api";
import { apiPost, APIError } from "@/lib/api-client";

const BusinessPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    idea: location.state?.idea || "",
    industry: "",
    target_market: "",
    business_model: "SaaS",
    region: "United States",
    budget: 10000
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [businessPlan, setBusinessPlan] = useState<BusinessPlanResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"canvas" | "financials" | "team" | "marketing">("canvas");

  const businessModels = ["SaaS", "Marketplace", "E-commerce", "Subscription", "Freemium", "Enterprise"];

  const handleGenerate = async () => {
    if (!formData.idea.trim()) {
      setError("Please enter your business idea");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const userId = localStorage.getItem("userId");
      
      // Use enhanced API client with retry logic for better reliability
      const result = await apiPost<BusinessPlanResponse>(
        "/api/business-plan/create",
        {
          idea: formData.idea,
          industry: formData.industry,
          target_market: formData.target_market,
          business_model: formData.business_model,
          region: formData.region,
          budget: formData.budget,
          export_formats: ["pdf", "docx"],
          userId: userId || undefined
        },
        { maxRetries: 2, retryDelay: 2000 }
      );

      setBusinessPlan(result);
    } catch (err: any) {
      let errorMessage = "Failed to generate business plan. Please try again.";
      
      if (err instanceof APIError) {
        if (err.status === 429) {
          errorMessage = "Too many requests. Please wait a moment and try again.";
        } else if (err.status === 401) {
          errorMessage = "Please log in to continue.";
          setTimeout(() => navigate("/login"), 2000);
        } else if (err.isRetryable) {
          errorMessage = "Server is temporarily unavailable. Retrying...";
        } else {
          errorMessage = err.message;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error("Business plan error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format: "pdf" | "docx") => {
    if (!businessPlan) return;
    const url = format === "pdf" ? businessPlan.pdf_url : businessPlan.docx_url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
            <div className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Business Planning</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Generate Your Business Plan
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create a comprehensive business plan with Lean Canvas, financial projections, and investor-ready documentation
            </p>
          </motion.div>

          {!businessPlan ? (
            /* Input Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="space-y-6">
                  {/* Business Idea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business Idea *
                    </label>
                    <textarea
                      value={formData.idea}
                      onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                      placeholder="Describe your business idea, what problem it solves, and who your customers are..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[120px] resize-none"
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Industry */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        placeholder="e.g., FinTech, HealthTech"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Target Market */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Market
                      </label>
                      <input
                        type="text"
                        value={formData.target_market}
                        onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                        placeholder="e.g., Small businesses, Millennials"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Business Model */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Business Model
                      </label>
                      <select
                        value={formData.business_model}
                        onChange={(e) => setFormData({ ...formData, business_model: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={isGenerating}
                      >
                        {businessModels.map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>

                    {/* Marketing Budget */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Marketing Budget
                      </label>
                      <input
                        type="number"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                        placeholder="10000"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl"
                    >
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !formData.idea.trim()}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2",
                      isGenerating || !formData.idea.trim()
                        ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Business Plan...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Generate Business Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Business Plan Results */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {businessPlan.business_name}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">{businessPlan.tagline}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:shadow-md transition-all"
                  >
                    <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload("docx")}
                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:shadow-md transition-all"
                  >
                    <Download className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">DOCX</span>
                  </button>
                  <button
                    onClick={() => navigate("/mvp-development", { state: { idea: formData.idea } })}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                  >
                    Build MVP →
                  </button>
                </div>
              </div>

              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white"
              >
                <h3 className="text-2xl font-bold mb-4">Executive Summary</h3>
                <p className="text-white/90 leading-relaxed">{businessPlan.executive_summary}</p>
              </motion.div>

              {/* Tabs */}
              <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: "canvas", label: "Lean Canvas", icon: Target },
                  { id: "financials", label: "Financials", icon: DollarSign },
                  { id: "team", label: "Team", icon: Users },
                  { id: "marketing", label: "Marketing", icon: TrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center space-x-2 px-6 py-3 font-medium transition-all border-b-2",
                      activeTab === tab.id
                        ? "border-purple-500 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === "canvas" && businessPlan.lean_canvas && (
                  <motion.div
                    key="canvas"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    {Object.entries(businessPlan.lean_canvas || {}).map(([key, block]: [string, LeanCanvasBlock], index) => {
                      // Ensure block is valid before rendering
                      if (!block || typeof block !== 'object' || !block.title) {
                        return null;
                      }
                      
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3">{block.title}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{block.description || ''}</p>
                          <ul className="space-y-2">
                            {(block.content || []).map((item, i) => (
                              <li key={i} className="flex items-start space-x-2">
                                <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === "financials" && businessPlan.financial_estimate && (
                  <motion.div
                    key="financials"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {[
                        { label: "CAC", value: formatCurrency(businessPlan.financial_estimate?.cac || 0), icon: DollarSign },
                        { label: "LTV", value: formatCurrency(businessPlan.financial_estimate?.ltv || 0), icon: TrendingUp },
                        { label: "LTV:CAC Ratio", value: `${(businessPlan.financial_estimate?.ltv_cac_ratio || 0).toFixed(1)}x`, icon: BarChart3 },
                        { label: "Break Even", value: `Month ${businessPlan.financial_estimate?.break_even_month || 0}`, icon: Calendar }
                      ].map((metric, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                          <metric.icon className="w-6 h-6 text-purple-500 mb-2" />
                          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Projections Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">5-Year Financial Projections</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Year</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costs</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Profit</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Runway</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {(businessPlan.financial_estimate?.projections || []).map((proj, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">Year {proj.year}</td>
                                <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(proj.revenue)}</td>
                                <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(proj.costs)}</td>
                                <td className={cn(
                                  "px-6 py-4 text-sm text-right font-medium",
                                  proj.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                )}>
                                  {formatCurrency(proj.profit)}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-700 dark:text-gray-300">{proj.runway_months}mo</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Assumptions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">Key Assumptions</h4>
                      <ul className="space-y-2">
                        {(businessPlan.financial_estimate?.assumptions || []).map((assumption, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === "team" && businessPlan.team_composition && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Team Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <Users className="w-8 h-8 text-purple-500 mb-3" />
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {businessPlan.team_composition?.total_team_size || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Team Members</div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <DollarSign className="w-8 h-8 text-purple-500 mb-3" />
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {formatCurrency(businessPlan.team_composition?.estimated_payroll_monthly || 0)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Payroll</div>
                      </div>
                    </div>

                    {/* Team Roles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(businessPlan.team_composition?.roles || []).map((role, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900 dark:text-white">{role.role}</h4>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              role.priority === "Critical" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                              role.priority === "High" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                              "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            )}>
                              {role.priority}
                            </span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Responsibilities</div>
                              <ul className="space-y-1">
                                {role.responsibilities.map((resp, i) => (
                                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2">
                                    <span className="text-purple-500">•</span>
                                    <span>{resp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Skills Required</div>
                              <div className="flex flex-wrap gap-2">
                                {role.skills_required.map((skill, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <strong>Timeline:</strong> {role.hiring_timeline}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "marketing" && businessPlan.marketing_strategy && (
                  <motion.div
                    key="marketing"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Marketing Overview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Marketing Strategy</h3>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatCurrency(businessPlan.marketing_strategy?.total_budget || 0)}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Customer Acquisition</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{businessPlan.marketing_strategy?.customer_acquisition_strategy || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Retention Strategy</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{businessPlan.marketing_strategy?.retention_strategy || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Marketing Channels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(businessPlan.marketing_strategy?.channels || []).map((channel, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3">{channel.channel}</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{channel.strategy}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cost</div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(channel.estimated_cost)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected ROI</div>
                              <div className="text-sm font-semibold text-green-600 dark:text-green-400">{channel.expected_roi}x</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            <strong>Timeline:</strong> {channel.timeline}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Growth Tactics */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">Growth Tactics</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(businessPlan.marketing_strategy?.growth_tactics || []).map((tactic, i) => (
                          <div key={i} className="flex items-start space-x-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{tactic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Investor Summary */}
              {businessPlan.investor_summary && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Briefcase className="w-6 h-6 text-purple-500" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Investor Summary</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Elevator Pitch</h4>
                      <p className="text-gray-700 dark:text-gray-300">{businessPlan.investor_summary?.elevator_pitch || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Problem</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{businessPlan.investor_summary?.problem_statement || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Solution</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{businessPlan.investor_summary?.solution_overview || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Use of Funds</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {(businessPlan.investor_summary?.use_of_funds || []).map((fund, i) => (
                          <div key={i} className="flex items-center space-x-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{fund}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Next Steps CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="text-center"
              >
                <button
                  onClick={() => setBusinessPlan(null)}
                  className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-purple-500 text-purple-600 dark:text-purple-400 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Create Another Plan
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BusinessPlan;
