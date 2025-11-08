import React from "react";
import { motion } from "framer-motion";
import { FileDown, Sparkles, CheckCircle, Users, Globe, TrendingUp, AlertCircle } from "lucide-react";

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

interface MarketResearchData {
  market_data?: MarketData;
  competitors?: CompetitorData[];
  executive_summary?: string;
  key_insights?: string[];
  recommendations?: string[];
}

interface MarketResearchTabProps {
  data: MarketResearchData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const MarketResearchTab: React.FC<MarketResearchTabProps> = ({ data }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Executive Summary */}
      {data.executive_summary && (
        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <FileDown className="w-6 h-6 mr-2" />
            Executive Summary
          </h3>
          <p className="text-white/90 leading-relaxed text-lg">
            {data.executive_summary}
          </p>
        </div>
      )}

      {/* Key Insights */}
      {data.key_insights && data.key_insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Sparkles className="w-6 h-6 text-green-500 mr-2" />
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.key_insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{insight}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {data.competitors && data.competitors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="w-6 h-6 text-green-500 mr-2" />
            Competitive Landscape
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.competitors.map((competitor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-3">{competitor.name}</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block mb-1">Market Share</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-teal-600 rounded-full"
                        style={{ width: `${competitor.market_share}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{competitor.market_share}%</span>
                  </div>
                  {competitor.pricing_strategy && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">Pricing Strategy</span>
                      <p className="text-gray-700 dark:text-gray-300">{competitor.pricing_strategy}</p>
                    </div>
                  )}
                  {competitor.strengths && competitor.strengths.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">Key Strengths</span>
                      <ul className="space-y-1">
                        {competitor.strengths.slice(0, 3).map((strength, idx) => (
                          <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Market Data */}
      {data.market_data && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Globe className="w-6 h-6 text-green-500 mr-2" />
            Market Size Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['TAM', 'SAM', 'SOM'].map((key) => {
              const marketData = data.market_data![key as keyof MarketData] as any;
              return (
                <div key={key} className="text-center p-6 bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{key}</h4>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {formatCurrency(marketData.value)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{marketData.description}</p>
                </div>
              );
            })}
          </div>

          {/* Market Trends */}
          {data.market_data.market_trends && data.market_data.market_trends.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                Market Trends
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.market_data.market_trends.map((trend, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        trend.impact === 'High' ? 'bg-green-100 dark:bg-green-900/30' :
                        trend.impact === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${
                          trend.impact === 'High' ? 'text-green-600 dark:text-green-400' :
                          trend.impact === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-1">{trend.trend}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{trend.description}</p>
                        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          trend.impact === 'High' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          trend.impact === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {trend.impact} Impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 text-green-500 mr-2" />
            Strategic Recommendations
          </h3>
          <div className="space-y-4">
            {data.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl border-l-4 border-green-500"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
