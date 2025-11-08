import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Download,
  Loader2,
  Sparkles,
  BarChart3,
  Shield,
  Brain,
  Zap
} from "lucide-react";
import { validateIdea, type IdeaValidationResponse, downloadValidationReport } from "@/lib/api";
import { apiPost } from "@/lib/api-client";
import { generateValidationBarChart, generateRadarChart } from "@/lib/chartUtils";
import { exportValidationPDF } from "@/lib/pdfExport";

const IdeaValidation = () => {
  const navigate = useNavigate();
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<IdeaValidationResponse | null>(null);
  const [error, setError] = useState("");
  const [barChartUrl, setBarChartUrl] = useState<string>("");
  const [radarChartUrl, setRadarChartUrl] = useState<string>("");

  const handleValidate = async () => {
    if (!idea.trim()) {
      setError("Please enter your startup idea");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await validateIdea({
        idea: idea.trim(),
        industry: industry.trim(),
        generate_pdf: true
      });

      setValidationResult(result);
      
      // Log scores for debugging
      console.log('Validation scores received:', {
        feasibility: result.ai_feasibility_score.feasibility,
        novelty: result.ai_feasibility_score.novelty,
        scalability: result.ai_feasibility_score.scalability,
        overall: result.ai_feasibility_score.overall
      });
      
      // Generate chart URLs with actual API scores (no defaults)
      const chartScores = {
        feasibility: result.ai_feasibility_score.feasibility,
        scalability: result.ai_feasibility_score.scalability,
        marketDemand: result.problem_solution_fit?.trend_score ?? result.ai_feasibility_score.overall,
        innovation: result.ai_feasibility_score.novelty
      };
      
      console.log('Chart scores being passed:', chartScores);
      
      const barChart = generateValidationBarChart(chartScores);
      const radarChart = generateRadarChart({
        marketPotential: result.target_audience?.fit_score ?? result.ai_feasibility_score.overall,
        feasibility: result.ai_feasibility_score.feasibility,
        innovation: result.ai_feasibility_score.novelty,
        scalability: result.ai_feasibility_score.scalability,
        marketDemand: result.problem_solution_fit?.trend_score ?? result.ai_feasibility_score.overall
      });
      
      console.log('Bar chart URL generated:', barChart);
      console.log('Radar chart URL generated:', radarChart);
      
      setBarChartUrl(barChart);
      setRadarChartUrl(radarChart);
    } catch (err: any) {
      setError(err.message || "Failed to validate idea. Please try again.");
      console.error("Validation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!validationResult) return;

    try {
      // Use the enhanced PDF export with charts
      const validationData = {
        score: {
          overall: validationResult.ai_feasibility_score.overall,
          feasibility: validationResult.ai_feasibility_score.feasibility,
          scalability: validationResult.ai_feasibility_score.scalability,
          marketDemand: validationResult.problem_solution_fit?.trend_score ?? validationResult.ai_feasibility_score.overall,
          innovation: validationResult.ai_feasibility_score.novelty,
          marketPotential: validationResult.target_audience?.fit_score ?? validationResult.ai_feasibility_score.overall
        },
        improvedIdea: validationResult.summary,
        strengths: validationResult.competitors.slice(0, 3).map(c => `Low competition from ${c.name}`) || [],
        weaknesses: validationResult.risks.map(r => r.risk) || [],
        recommendations: [validationResult.summary_recommendation],
        marketSize: validationResult.target_audience?.total_addressable_market || "Not specified",
        targetAudience: validationResult.target_audience?.segments.map(s => s.name).join(", ") || "Not specified",
        competitorInsights: validationResult.competitors.slice(0, 3).map(c => ({
          competitor: c.name,
          strengths: c.strengths.join(", "),
          weaknesses: c.weaknesses.join(", "),
          opportunity: `${100 - c.overlap_score}% differentiation opportunity`
        }))
      };
      
      await exportValidationPDF(validationData, { idea, problem: industry });
    } catch (err) {
      console.error("Error downloading report:", err);
      // Fallback to backend PDF if available
      if (validationResult.validation_id) {
        try {
          const blob = await downloadValidationReport(validationResult.validation_id);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `idea-validation-${validationResult.validation_id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } catch (fallbackErr) {
          console.error("Fallback download failed:", fallbackErr);
        }
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-blue-100 dark:bg-blue-900/30";
    if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
            <div className="inline-flex items-center justify-center px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
              <Lightbulb className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">AI-Powered Validation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Validate Your Startup Idea
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get instant AI-powered analysis of your idea's feasibility, market potential, and competitive landscape
            </p>
          </motion.div>

          {!validationResult ? (
            /* Input Form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-3xl mx-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                <div className="space-y-6">
                  {/* Idea Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Startup Idea *
                    </label>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Describe your startup idea in detail. What problem does it solve? Who is it for? What makes it unique?"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[150px] resize-none"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Industry Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Industry (Optional)
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g., FinTech, HealthTech, EdTech, E-commerce"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                      disabled={isLoading}
                    />
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

                  {/* Submit Button */}
                  <button
                    onClick={handleValidate}
                    disabled={isLoading || !idea.trim()}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2",
                      isLoading || !idea.trim()
                        ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Your Idea...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Validate My Idea</span>
                      </>
                    )}
                  </button>

                  {/* Features Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {[
                      { icon: Brain, label: "AI Scoring" },
                      { icon: Users, label: "Competitor Analysis" },
                      { icon: Target, label: "Audience Fit" },
                      { icon: TrendingUp, label: "Trend Analysis" }
                    ].map((feature, index) => (
                      <div key={index} className="text-center">
                        <feature.icon className="w-6 h-6 text-orange-500 dark:text-orange-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">{feature.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Validation Results */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              {/* Header with Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {validationResult.idea_title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{validationResult.summary}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:shadow-md transition-all text-gray-700 dark:text-gray-300"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download Report</span>
                  </button>
                  <button
                    onClick={() => {
                      setValidationResult(null);
                      setIdea("");
                      setIndustry("");
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                  >
                    Validate Another Idea
                  </button>
                </div>
              </div>

              {/* Feasibility Scores */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Overall Score", value: validationResult.ai_feasibility_score.overall, icon: Sparkles },
                  { label: "Feasibility", value: validationResult.ai_feasibility_score.feasibility, icon: Brain },
                  { label: "Novelty", value: validationResult.ai_feasibility_score.novelty, icon: Zap },
                  { label: "Scalability", value: validationResult.ai_feasibility_score.scalability, icon: TrendingUp }
                ].map((score, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-6 rounded-2xl border-2 shadow-lg",
                      getScoreBgColor(score.value),
                      "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <score.icon className={cn("w-8 h-8 mb-3", getScoreColor(score.value))} />
                    <div className={cn("text-4xl font-bold mb-2", getScoreColor(score.value))}>
                      {score.value}
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{score.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* AI Reasoning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Analysis</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {validationResult.ai_feasibility_score.reasoning}
                </p>
              </motion.div>

              {/* Score Visualizations */}
              {barChartUrl && radarChartUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Score Visualizations</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <img src={barChartUrl} alt="Score Analysis" className="w-full rounded-lg shadow-md" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Category Breakdown</p>
                    </div>
                    <div className="text-center">
                      <img src={radarChartUrl} alt="Comprehensive Analysis" className="w-full rounded-lg shadow-md" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Overall Performance</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Competitors */}
              {validationResult.competitors && validationResult.competitors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Users className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Competitor Analysis</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {validationResult.competitors.slice(0, 6).map((competitor, index) => (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{competitor.name}</h4>
                          <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                            {competitor.overlap_score}% overlap
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{competitor.description}</p>
                        {competitor.url && (
                          <a
                            href={competitor.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 dark:text-orange-400 hover:underline"
                          >
                            Visit website →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Target Audience */}
              {validationResult.target_audience && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Target className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Target Audience</h3>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Audience Fit Score</span>
                      <span className={cn("text-2xl font-bold", getScoreColor(validationResult.target_audience.fit_score))}>
                        {validationResult.target_audience.fit_score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      TAM: {validationResult.target_audience.total_addressable_market}
                    </div>
                  </div>
                  <div className="space-y-4">
                    {validationResult.target_audience.segments.map((segment, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{segment.name}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p><strong>Demographics:</strong> {segment.demographics}</p>
                          <p><strong>Psychographics:</strong> {segment.psychographics}</p>
                          <div>
                            <strong>Pain Points:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1">
                              {segment.pain_points.map((point, i) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          <p><strong>Adoption Likelihood:</strong> {segment.adoption_likelihood}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Problem-Solution Fit */}
              {validationResult.problem_solution_fit && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Market Trends</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trend Score</span>
                      <span className={cn("text-2xl font-bold", getScoreColor(validationResult.problem_solution_fit.trend_score))}>
                        {validationResult.problem_solution_fit.trend_score}%
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{validationResult.problem_solution_fit.trend_summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Volume</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">{validationResult.problem_solution_fit.search_volume_trend}</div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market Demand</div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">{validationResult.problem_solution_fit.market_demand}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Risks */}
              {validationResult.risks && validationResult.risks.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Risk Assessment</h3>
                  </div>
                  <div className="space-y-4">
                    {validationResult.risks.map((risk, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{risk.risk}</h4>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            risk.severity === "High" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                            risk.severity === "Medium" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" :
                            "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                          )}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          Confidence: {risk.confidence}%
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Final Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-white"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">Final Recommendation</h3>
                </div>
                <p className="text-white/90 text-lg leading-relaxed mb-6">
                  {validationResult.summary_recommendation}
                </p>
                <button
                  onClick={() => navigate("/business-plan", { state: { idea: idea } })}
                  className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Create Business Plan →
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default IdeaValidation;
