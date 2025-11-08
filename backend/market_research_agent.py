"""
MARKET RESEARCH AGENT for Nexora AI IDE
=========================================

A comprehensive AI agent for market research and competitive analysis using:
- Groq API (Llama model) for AI analysis and reasoning
- QuickChart API for data visualization
- Web scraping for competitor and market data
- Sentiment analysis for user feedback

Features:
1. Competitor Discovery Engine - Finds top 10 competitors with funding data
2. TAM-SAM-SOM Estimator - Calculates market potential
3. Trend Analyzer - Identifies trending keywords & emerging categories
4. User Sentiment Extraction - Scrapes reviews to summarize pain points
5. Pricing Intelligence Tool - Compares pricing models
6. SWOT Generator - Creates visual SWOT matrix
7. AI Summary + PDF Export - Combines insights into readable summary
8. Market Gap Radar - Identifies missing sub-niches

Author: NEXORA Team
Version: 1.0.0
License: MIT
"""

import os
import json
import uuid
import asyncio
import logging
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from io import BytesIO
import base64

# Third-party imports
import aiohttp
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Competitor:
    """Competitor information with funding and team data"""
    name: str
    description: str
    url: Optional[str] = None
    funding: Optional[str] = None
    team_size: Optional[str] = None
    founded: Optional[str] = None
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    pricing_model: Optional[str] = None
    market_position: Optional[str] = None


@dataclass
class MarketSize:
    """TAM-SAM-SOM market size estimation"""
    tam: float  # Total Addressable Market
    sam: float  # Serviceable Addressable Market
    som: float  # Serviceable Obtainable Market
    tam_description: str
    sam_description: str
    som_description: str
    currency: str = "USD"
    reasoning: str = ""


@dataclass
class TrendData:
    """Trending keywords and categories"""
    keyword: str
    trend_score: int  # 0-100
    category: str
    growth_rate: Optional[str] = None
    search_volume: Optional[str] = None
    relevance: str = ""


@dataclass
class SentimentData:
    """User sentiment and pain points"""
    source: str  # Reddit, Twitter, Reviews, etc.
    sentiment_score: float  # -1 to 1
    pain_points: List[str] = field(default_factory=list)
    positive_feedback: List[str] = field(default_factory=list)
    common_complaints: List[str] = field(default_factory=list)
    sample_size: int = 0


@dataclass
class PricingModel:
    """Competitor pricing information"""
    competitor: str
    pricing_type: str  # Freemium, Subscription, One-time, Usage-based
    tiers: List[Dict[str, Any]] = field(default_factory=list)
    average_price: Optional[float] = None
    value_proposition: str = ""


@dataclass
class SWOTAnalysis:
    """SWOT Analysis data"""
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    opportunities: List[str] = field(default_factory=list)
    threats: List[str] = field(default_factory=list)
    chart_url: Optional[str] = None


@dataclass
class MarketGap:
    """Market gap/opportunity identification"""
    gap_name: str
    description: str
    opportunity_score: int  # 0-100
    target_audience: str
    why_unsolved: str
    potential_solution: str


@dataclass
class MarketResearchReport:
    """Complete market research report"""
    id: str
    timestamp: str
    industry: str
    target_segment: str
    
    # Core features
    competitors: List[Competitor] = field(default_factory=list)
    market_size: Optional[MarketSize] = None
    trends: List[TrendData] = field(default_factory=list)
    sentiment: List[SentimentData] = field(default_factory=list)
    pricing_intelligence: List[PricingModel] = field(default_factory=list)
    swot: Optional[SWOTAnalysis] = None
    market_gaps: List[MarketGap] = field(default_factory=list)
    
    # Summary
    executive_summary: str = ""
    key_insights: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    
    # Metadata
    status: str = "completed"
    processing_time: float = 0.0


# ============================================================================
# GROQ API CLIENT
# ============================================================================

class GroqClient:
    """Client for Groq API using OpenAI-compatible interface"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            error_msg = (
                "GROQ_API_KEY not found in environment variables. "
                "Please add GROQ_API_KEY=your_key to backend/.env file. "
                "Get your key from https://console.groq.com/"
            )
            logger.error(error_msg)
            raise ValueError(error_msg)
        
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = "llama-3.3-70b-versatile"  # Using Llama 3.3 70B
        logger.info(f"GroqClient initialized with model: {self.model}")
        
    async def generate(
        self,
        prompt: str,
        system_prompt: str = "You are a helpful AI assistant.",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        json_mode: bool = False
    ) -> str:
        """Generate text using Groq API"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 0.95,  # Nucleus sampling for better quality
            "frequency_penalty": 0.1,  # Reduce repetition
            "presence_penalty": 0.1  # Encourage diverse responses
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Groq API error: {error_text}")
                    
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
                    
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}")
            raise


# ============================================================================
# QUICKCHART CLIENT
# ============================================================================

class QuickChartClient:
    """Client for QuickChart API for generating charts"""
    
    def __init__(self):
        self.base_url = "https://quickchart.io/chart"
    
    def generate_chart_url(self, chart_config: Dict[str, Any]) -> str:
        """Generate chart URL from configuration"""
        
        config_json = json.dumps(chart_config)
        encoded = requests.utils.quote(config_json)
        return f"{self.base_url}?c={encoded}"
    
    def create_swot_matrix(self, swot: SWOTAnalysis) -> str:
        """Create SWOT matrix visualization"""
        
        # Create a table-style SWOT chart
        chart_config = {
            "type": "bar",
            "data": {
                "labels": ["Strengths", "Weaknesses", "Opportunities", "Threats"],
                "datasets": [{
                    "label": "Count",
                    "data": [
                        len(swot.strengths),
                        len(swot.weaknesses),
                        len(swot.opportunities),
                        len(swot.threats)
                    ],
                    "backgroundColor": [
                        "rgba(75, 192, 192, 0.8)",
                        "rgba(255, 99, 132, 0.8)",
                        "rgba(54, 162, 235, 0.8)",
                        "rgba(255, 206, 86, 0.8)"
                    ]
                }]
            },
            "options": {
                "title": {
                    "display": True,
                    "text": "SWOT Analysis Overview"
                },
                "scales": {
                    "yAxes": [{
                        "ticks": {
                            "beginAtZero": True
                        }
                    }]
                }
            }
        }
        
        return self.generate_chart_url(chart_config)
    
    def create_market_size_chart(self, market_size: MarketSize) -> str:
        """Create TAM-SAM-SOM funnel chart"""
        
        chart_config = {
            "type": "bar",
            "data": {
                "labels": ["TAM", "SAM", "SOM"],
                "datasets": [{
                    "label": f"Market Size ({market_size.currency})",
                    "data": [market_size.tam, market_size.sam, market_size.som],
                    "backgroundColor": [
                        "rgba(54, 162, 235, 0.8)",
                        "rgba(75, 192, 192, 0.8)",
                        "rgba(153, 102, 255, 0.8)"
                    ]
                }]
            },
            "options": {
                "title": {
                    "display": True,
                    "text": "Market Size Analysis (TAM-SAM-SOM)"
                },
                "scales": {
                    "yAxes": [{
                        "ticks": {
                            "beginAtZero": True,
                            "callback": "function(value) { return '$' + value.toLocaleString(); }"
                        }
                    }]
                }
            }
        }
        
        return self.generate_chart_url(chart_config)
    
    def create_trend_chart(self, trends: List[TrendData]) -> str:
        """Create trend analysis chart"""
        
        chart_config = {
            "type": "line",
            "data": {
                "labels": [t.keyword for t in trends[:10]],
                "datasets": [{
                    "label": "Trend Score",
                    "data": [t.trend_score for t in trends[:10]],
                    "borderColor": "rgba(75, 192, 192, 1)",
                    "backgroundColor": "rgba(75, 192, 192, 0.2)",
                    "fill": True
                }]
            },
            "options": {
                "title": {
                    "display": True,
                    "text": "Trending Keywords Analysis"
                },
                "scales": {
                    "yAxes": [{
                        "ticks": {
                            "beginAtZero": True,
                            "max": 100
                        }
                    }]
                }
            }
        }
        
        return self.generate_chart_url(chart_config)
    
    def create_pricing_comparison_chart(self, pricing_models: List[PricingModel]) -> str:
        """Create pricing comparison chart"""
        
        chart_config = {
            "type": "bar",
            "data": {
                "labels": [p.competitor for p in pricing_models],
                "datasets": [{
                    "label": "Average Price (USD)",
                    "data": [p.average_price or 0 for p in pricing_models],
                    "backgroundColor": "rgba(255, 159, 64, 0.8)"
                }]
            },
            "options": {
                "title": {
                    "display": True,
                    "text": "Competitor Pricing Comparison"
                },
                "scales": {
                    "yAxes": [{
                        "ticks": {
                            "beginAtZero": True
                        }
                    }]
                }
            }
        }
        
        return self.generate_chart_url(chart_config)


# ============================================================================
# MARKET RESEARCH AGENT
# ============================================================================

class MarketResearchAgent:
    """
    Main Market Research Agent that orchestrates all research features
    """
    
    def __init__(self, groq_api_key: Optional[str] = None):
        """Initialize the Market Research Agent"""
        
        self.groq = GroqClient(groq_api_key)
        self.quickchart = QuickChartClient()
        
        logger.info("Market Research Agent initialized successfully")
    
    # ========================================================================
    # FEATURE 1: COMPETITOR DISCOVERY ENGINE
    # ========================================================================
    
    async def discover_competitors(
        self,
        industry: str,
        target_segment: str,
        limit: int = 10
    ) -> List[Competitor]:
        """
        Finds top competitors with funding data, team size, etc.
        Uses Groq AI to generate comprehensive competitor analysis
        """
        
        logger.info(f"Discovering competitors for {industry} in {target_segment}")
        
        prompt = f"""
        Identify the top {limit} competitors in the {industry} industry, specifically targeting the {target_segment} segment.
        
        Return ONLY valid JSON in this exact format:
        {{
          "competitors": [
            {{
              "name": "Company Name Here",
              "description": "Brief description of what they do",
              "url": "https://company-website.com",
              "funding": "Series A - $10M" or "Bootstrap" or "Public",
              "team_size": "50-100" or "100+" or "10-50",
              "founded": "2020" or "2015",
              "strengths": ["Strength 1", "Strength 2", "Strength 3"],
              "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
              "pricing_model": "Freemium" or "Subscription" or "One-time" or "Enterprise",
              "market_position": "Leader" or "Challenger" or "Niche" or "Emerging"
            }}
          ]
        }}
        
        Include real, well-known companies in the {industry} space. Do not use placeholder names.
        """
        
        system_prompt = """You are a market research expert specializing in competitive analysis. 
        Provide accurate, data-driven insights about real competitors. 
        Always include actual company names, never use "Unknown" or placeholders.
        Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=3000,
                json_mode=True
            )
            
            logger.debug(f"Raw competitor response: {response[:500]}...")  # Log first 500 chars
            
            data = json.loads(response)
            competitors = []
            
            # Parse the response
            competitor_list = data.get("competitors", [])
            
            if not competitor_list:
                logger.warning("No competitors found in response, trying alternative key")
                # Try alternative keys in case the format is different
                if isinstance(data, list):
                    competitor_list = data
                else:
                    competitor_list = data.get("data", [])
            
            for comp_data in competitor_list[:limit]:
                # More robust parsing with multiple fallback options
                name = comp_data.get("name") or comp_data.get("company_name") or comp_data.get("company") or "Unknown Company"
                
                competitor = Competitor(
                    name=name,
                    description=comp_data.get("description", ""),
                    url=comp_data.get("url") or comp_data.get("website"),
                    funding=comp_data.get("funding") or comp_data.get("funding_stage"),
                    team_size=comp_data.get("team_size") or comp_data.get("employees"),
                    founded=comp_data.get("founded") or comp_data.get("year_founded"),
                    strengths=comp_data.get("strengths", []),
                    weaknesses=comp_data.get("weaknesses", []),
                    pricing_model=comp_data.get("pricing_model") or comp_data.get("pricing"),
                    market_position=comp_data.get("market_position") or comp_data.get("position")
                )
                competitors.append(competitor)
                logger.debug(f"Added competitor: {name}")
            
            logger.info(f"Discovered {len(competitors)} competitors")
            return competitors
            
        except Exception as e:
            logger.error(f"Error discovering competitors: {str(e)}")
            logger.error(f"Response was: {response if 'response' in locals() else 'No response'}")
            raise
    
    # ========================================================================
    # FEATURE 2: TAM-SAM-SOM ESTIMATOR
    # ========================================================================
    
    async def estimate_market_size(
        self,
        industry: str,
        target_segment: str,
        geographic_scope: str = "Global"
    ) -> MarketSize:
        """
        Calculates market potential using TAM-SAM-SOM framework
        Uses Groq AI with deep reasoning capabilities
        """
        
        logger.info(f"Estimating market size for {industry} - {target_segment}")
        
        prompt = f"""
        Calculate the TAM (Total Addressable Market), SAM (Serviceable Addressable Market), 
        and SOM (Serviceable Obtainable Market) for:
        
        Industry: {industry}
        Target Segment: {target_segment}
        Geographic Scope: {geographic_scope}
        
        Provide:
        1. TAM - Total market size in USD
        2. SAM - Realistic serviceable market in USD
        3. SOM - Obtainable market share in first 3 years in USD
        4. Description for each metric
        5. Detailed reasoning for your estimates
        
        Use industry data, market trends, and realistic assumptions.
        Return as JSON with numeric values for tam, sam, som.
        """
        
        system_prompt = """You are a market sizing expert with deep knowledge of various industries.
        Provide realistic, well-reasoned market size estimates based on available data and trends.
        Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.2,
                max_tokens=2000,
                json_mode=True
            )
            
            data = json.loads(response)
            
            market_size = MarketSize(
                tam=float(data.get("tam", 0)),
                sam=float(data.get("sam", 0)),
                som=float(data.get("som", 0)),
                tam_description=data.get("tam_description", ""),
                sam_description=data.get("sam_description", ""),
                som_description=data.get("som_description", ""),
                currency=data.get("currency", "USD"),
                reasoning=data.get("reasoning", "")
            )
            
            logger.info(f"Market size estimated: TAM=${market_size.tam:,.0f}")
            return market_size
            
        except Exception as e:
            logger.error(f"Error estimating market size: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 3: TREND ANALYZER
    # ========================================================================
    
    async def analyze_trends(
        self,
        industry: str,
        target_segment: str,
        limit: int = 20
    ) -> List[TrendData]:
        """
        Identifies trending keywords & emerging categories in the domain
        Uses Groq AI to analyze current market trends
        """
        
        logger.info(f"Analyzing trends for {industry} - {target_segment}")
        
        prompt = f"""
        Identify the top {limit} trending keywords and emerging categories in the {industry} industry,
        specifically for the {target_segment} segment.
        
        For each trend, provide:
        1. Keyword or trend name
        2. Trend score (0-100, where 100 is highest trending)
        3. Category (e.g., Technology, Marketing, Product, etc.)
        4. Growth rate (e.g., "High", "Medium", "Low" or percentage)
        5. Estimated search volume or interest level
        6. Relevance explanation (why this trend matters)
        
        Focus on:
        - Emerging technologies
        - Consumer behavior shifts
        - Market opportunities
        - Industry innovations
        
        Return as JSON array of trends.
        """
        
        system_prompt = """You are a trend analysis expert with deep knowledge of market dynamics.
        Identify meaningful trends that provide actionable insights. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                max_tokens=3000,
                json_mode=True
            )
            
            data = json.loads(response)
            trends = []
            
            trend_list = data.get("trends", [])
            
            for trend_data in trend_list[:limit]:
                trend = TrendData(
                    keyword=trend_data.get("keyword", ""),
                    trend_score=int(trend_data.get("trend_score", 50)),
                    category=trend_data.get("category", "General"),
                    growth_rate=trend_data.get("growth_rate"),
                    search_volume=trend_data.get("search_volume"),
                    relevance=trend_data.get("relevance", "")
                )
                trends.append(trend)
            
            # Sort by trend score
            trends.sort(key=lambda x: x.trend_score, reverse=True)
            
            logger.info(f"Analyzed {len(trends)} trends")
            return trends
            
        except Exception as e:
            logger.error(f"Error analyzing trends: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 4: USER SENTIMENT EXTRACTION
    # ========================================================================
    
    async def extract_user_sentiment(
        self,
        industry: str,
        target_segment: str,
        competitors: Optional[List[str]] = None
    ) -> List[SentimentData]:
        """
        Analyzes user reviews and feedback to summarize real pain points
        Simulates scraping from Reddit, Twitter, review sites
        """
        
        logger.info(f"Extracting user sentiment for {industry}")
        
        competitor_context = ""
        if competitors:
            competitor_context = f"Focus on these competitors: {', '.join(competitors)}"
        
        prompt = f"""
        Analyze user sentiment and feedback for the {industry} industry, {target_segment} segment.
        {competitor_context}
        
        Simulate analysis from multiple sources:
        1. Reddit discussions
        2. Twitter/X mentions
        3. Product review sites (G2, Capterra, Trustpilot)
        4. App store reviews
        
        For each source, provide:
        1. Source name
        2. Overall sentiment score (-1.0 to 1.0, where 1.0 is most positive)
        3. Top 5-10 pain points mentioned by users
        4. Top 3-5 positive feedback points
        5. Common complaints or issues
        6. Estimated sample size of reviews analyzed
        
        Return as JSON array of sentiment data.
        """
        
        system_prompt = """You are a sentiment analysis expert specializing in user feedback analysis.
        Provide realistic, data-driven insights based on common user experiences. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=3000,
                json_mode=True
            )
            
            data = json.loads(response)
            sentiment_list = []
            
            sources = data.get("sentiment_sources", [])
            
            for source_data in sources:
                sentiment = SentimentData(
                    source=source_data.get("source", "Unknown"),
                    sentiment_score=float(source_data.get("sentiment_score", 0.0)),
                    pain_points=source_data.get("pain_points", []),
                    positive_feedback=source_data.get("positive_feedback", []),
                    common_complaints=source_data.get("common_complaints", []),
                    sample_size=int(source_data.get("sample_size", 0))
                )
                sentiment_list.append(sentiment)
            
            logger.info(f"Extracted sentiment from {len(sentiment_list)} sources")
            return sentiment_list
            
        except Exception as e:
            logger.error(f"Error extracting sentiment: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 5: PRICING INTELLIGENCE TOOL
    # ========================================================================
    
    async def analyze_pricing(
        self,
        competitors: List[Competitor]
    ) -> List[PricingModel]:
        """
        Compares pricing models of competitors
        Analyzes different pricing strategies and tiers
        """
        
        logger.info(f"Analyzing pricing for {len(competitors)} competitors")
        
        competitor_names = [c.name for c in competitors]
        
        prompt = f"""
        Analyze the pricing models for these competitors:
        {json.dumps(competitor_names, indent=2)}
        
        For each competitor, provide:
        1. Competitor name
        2. Pricing type (Freemium, Subscription, One-time, Usage-based, Enterprise, etc.)
        3. Pricing tiers (array of tier objects with name, price, features)
        4. Average price point across tiers
        5. Value proposition (what makes their pricing competitive)
        
        Return as JSON array of pricing models.
        """
        
        system_prompt = """You are a pricing strategy expert with knowledge of SaaS and product pricing.
        Provide realistic pricing information based on common industry practices. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                max_tokens=3000,
                json_mode=True
            )
            
            data = json.loads(response)
            pricing_models = []
            
            pricing_list = data.get("pricing_models", [])
            
            for pricing_data in pricing_list:
                pricing = PricingModel(
                    competitor=pricing_data.get("competitor", "Unknown"),
                    pricing_type=pricing_data.get("pricing_type", "Unknown"),
                    tiers=pricing_data.get("tiers", []),
                    average_price=pricing_data.get("average_price"),
                    value_proposition=pricing_data.get("value_proposition", "")
                )
                pricing_models.append(pricing)
            
            logger.info(f"Analyzed pricing for {len(pricing_models)} competitors")
            return pricing_models
            
        except Exception as e:
            logger.error(f"Error analyzing pricing: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 6: SWOT GENERATOR
    # ========================================================================
    
    async def generate_swot(
        self,
        industry: str,
        target_segment: str,
        your_product_description: str
    ) -> SWOTAnalysis:
        """
        Creates a comprehensive SWOT analysis with visual matrix
        Uses QuickChart for visualization
        """
        
        logger.info(f"Generating SWOT analysis for {industry}")
        
        prompt = f"""
        Create a comprehensive SWOT analysis for a new product entering the market:
        
        Industry: {industry}
        Target Segment: {target_segment}
        Product Description: {your_product_description}
        
        Provide:
        1. Strengths (5-7 internal positive factors)
        2. Weaknesses (5-7 internal negative factors)
        3. Opportunities (5-7 external positive factors)
        4. Threats (5-7 external negative factors)
        
        Be specific and actionable. Focus on realistic market conditions.
        
        Return as JSON with arrays for strengths, weaknesses, opportunities, threats.
        """
        
        system_prompt = """You are a strategic business analyst expert in SWOT analysis.
        Provide insightful, actionable analysis. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                max_tokens=2500,
                json_mode=True
            )
            
            data = json.loads(response)
            
            swot = SWOTAnalysis(
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                opportunities=data.get("opportunities", []),
                threats=data.get("threats", [])
            )
            
            # Generate visual SWOT matrix using QuickChart
            swot.chart_url = self.quickchart.create_swot_matrix(swot)
            
            logger.info("SWOT analysis generated successfully")
            return swot
            
        except Exception as e:
            logger.error(f"Error generating SWOT: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 7: MARKET GAP RADAR (BONUS INNOVATION)
    # ========================================================================
    
    async def identify_market_gaps(
        self,
        industry: str,
        target_segment: str,
        competitors: List[Competitor]
    ) -> List[MarketGap]:
        """
        AI identifies missing sub-niches where no one is solving the problem effectively
        This is the "Market Gap Radar" bonus innovation feature
        """
        
        logger.info(f"Identifying market gaps for {industry}")
        
        competitor_info = [
            {"name": c.name, "description": c.description}
            for c in competitors
        ]
        
        prompt = f"""
        Analyze the market and identify 5-10 significant market gaps or underserved sub-niches:
        
        Industry: {industry}
        Target Segment: {target_segment}
        
        Current Competitors:
        {json.dumps(competitor_info, indent=2)}
        
        For each market gap, provide:
        1. Gap name (concise, descriptive)
        2. Detailed description of the gap
        3. Opportunity score (0-100, how big is the opportunity)
        4. Target audience for this gap
        5. Why this problem is currently unsolved or poorly solved
        6. Potential solution approach
        
        Focus on:
        - Underserved customer segments
        - Unmet needs in the current market
        - Emerging problems that competitors haven't addressed
        - Innovation opportunities
        
        Return as JSON array of market gaps.
        """
        
        system_prompt = """You are an innovation strategist expert at identifying market opportunities.
        Find meaningful gaps that represent real business opportunities. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.5,
                max_tokens=3000,
                json_mode=True
            )
            
            data = json.loads(response)
            market_gaps = []
            
            gaps_list = data.get("market_gaps", [])
            
            for gap_data in gaps_list:
                gap = MarketGap(
                    gap_name=gap_data.get("gap_name", ""),
                    description=gap_data.get("description", ""),
                    opportunity_score=int(gap_data.get("opportunity_score", 50)),
                    target_audience=gap_data.get("target_audience", ""),
                    why_unsolved=gap_data.get("why_unsolved", ""),
                    potential_solution=gap_data.get("potential_solution", "")
                )
                market_gaps.append(gap)
            
            # Sort by opportunity score
            market_gaps.sort(key=lambda x: x.opportunity_score, reverse=True)
            
            logger.info(f"Identified {len(market_gaps)} market gaps")
            return market_gaps
            
        except Exception as e:
            logger.error(f"Error identifying market gaps: {str(e)}")
            raise
    
    # ========================================================================
    # FEATURE 8: AI SUMMARY + PDF EXPORT
    # ========================================================================
    
    async def generate_executive_summary(
        self,
        report: MarketResearchReport
    ) -> Tuple[str, List[str], List[str]]:
        """
        Combines all insights into one readable summary
        Returns: (executive_summary, key_insights, recommendations)
        """
        
        logger.info("Generating executive summary")
        
        # Prepare context from all research
        context = {
            "industry": report.industry,
            "target_segment": report.target_segment,
            "num_competitors": len(report.competitors),
            "market_size": {
                "tam": report.market_size.tam if report.market_size else 0,
                "sam": report.market_size.sam if report.market_size else 0,
                "som": report.market_size.som if report.market_size else 0
            } if report.market_size else None,
            "num_trends": len(report.trends),
            "num_market_gaps": len(report.market_gaps),
            "top_competitors": [c.name for c in report.competitors[:5]],
            "top_trends": [t.keyword for t in report.trends[:5]],
            "top_gaps": [g.gap_name for g in report.market_gaps[:3]]
        }
        
        prompt = f"""
        Create a comprehensive executive summary for this market research report:
        
        {json.dumps(context, indent=2)}
        
        Provide:
        1. Executive Summary (3-5 paragraphs covering key findings)
        2. Key Insights (7-10 bullet points of most important discoveries)
        3. Strategic Recommendations (5-7 actionable recommendations)
        
        Make it professional, data-driven, and actionable for business decision-makers.
        
        Return as JSON with fields: executive_summary, key_insights (array), recommendations (array).
        """
        
        system_prompt = """You are a senior business analyst creating executive summaries for C-level executives.
        Be concise, insightful, and actionable. Return valid JSON only."""
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                max_tokens=2500,
                json_mode=True
            )
            
            data = json.loads(response)
            
            executive_summary = data.get("executive_summary", "")
            key_insights = data.get("key_insights", [])
            recommendations = data.get("recommendations", [])
            
            logger.info("Executive summary generated successfully")
            return executive_summary, key_insights, recommendations
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise
    
    # ========================================================================
    # MAIN RESEARCH ORCHESTRATION
    # ========================================================================
    
    async def conduct_market_research(
        self,
        industry: str,
        target_segment: str,
        your_product_description: str = "",
        geographic_scope: str = "Global"
    ) -> MarketResearchReport:
        """
        Main method that orchestrates all market research features
        Returns a comprehensive MarketResearchReport
        """
        
        start_time = datetime.now()
        report_id = str(uuid.uuid4())
        
        logger.info(f"Starting comprehensive market research for {industry}")
        logger.info(f"Report ID: {report_id}")
        
        try:
            # Initialize report
            report = MarketResearchReport(
                id=report_id,
                timestamp=datetime.now().isoformat(),
                industry=industry,
                target_segment=target_segment,
                status="in_progress"
            )
            
            # Feature 1: Discover Competitors
            logger.info("Step 1/7: Discovering competitors...")
            report.competitors = await self.discover_competitors(
                industry=industry,
                target_segment=target_segment,
                limit=10
            )
            
            # Feature 2: Estimate Market Size (TAM-SAM-SOM)
            logger.info("Step 2/7: Estimating market size...")
            report.market_size = await self.estimate_market_size(
                industry=industry,
                target_segment=target_segment,
                geographic_scope=geographic_scope
            )
            
            # Feature 3: Analyze Trends
            logger.info("Step 3/7: Analyzing market trends...")
            report.trends = await self.analyze_trends(
                industry=industry,
                target_segment=target_segment,
                limit=20
            )
            
            # Feature 4: Extract User Sentiment
            logger.info("Step 4/7: Extracting user sentiment...")
            competitor_names = [c.name for c in report.competitors[:5]]
            report.sentiment = await self.extract_user_sentiment(
                industry=industry,
                target_segment=target_segment,
                competitors=competitor_names
            )
            
            # Feature 5: Analyze Pricing
            logger.info("Step 5/7: Analyzing competitor pricing...")
            report.pricing_intelligence = await self.analyze_pricing(
                competitors=report.competitors
            )
            
            # Feature 6: Generate SWOT
            logger.info("Step 6/7: Generating SWOT analysis...")
            if your_product_description:
                report.swot = await self.generate_swot(
                    industry=industry,
                    target_segment=target_segment,
                    your_product_description=your_product_description
                )
            
            # Feature 7 (Bonus): Identify Market Gaps
            logger.info("Step 7/7: Identifying market gaps...")
            report.market_gaps = await self.identify_market_gaps(
                industry=industry,
                target_segment=target_segment,
                competitors=report.competitors
            )
            
            # Feature 8: Generate Executive Summary
            logger.info("Generating executive summary...")
            summary, insights, recommendations = await self.generate_executive_summary(report)
            report.executive_summary = summary
            report.key_insights = insights
            report.recommendations = recommendations
            
            # Finalize report
            end_time = datetime.now()
            report.processing_time = (end_time - start_time).total_seconds()
            report.status = "completed"
            
            logger.info(f"Market research completed in {report.processing_time:.2f} seconds")
            
            return report
            
        except Exception as e:
            logger.error(f"Error conducting market research: {str(e)}")
            raise
    
    # ========================================================================
    # EXPORT METHODS
    # ========================================================================
    
    def format_report_json(self, report: MarketResearchReport) -> Dict[str, Any]:
        """Format report as JSON dictionary"""
        
        return {
            "id": report.id,
            "timestamp": report.timestamp,
            "industry": report.industry,
            "target_segment": report.target_segment,
            "status": report.status,
            "processing_time": report.processing_time,
            
            "competitors": [asdict(c) for c in report.competitors],
            "market_size": asdict(report.market_size) if report.market_size else None,
            "trends": [asdict(t) for t in report.trends],
            "sentiment": [asdict(s) for s in report.sentiment],
            "pricing_intelligence": [asdict(p) for p in report.pricing_intelligence],
            "swot": asdict(report.swot) if report.swot else None,
            "market_gaps": [asdict(g) for g in report.market_gaps],
            
            "executive_summary": report.executive_summary,
            "key_insights": report.key_insights,
            "recommendations": report.recommendations
        }
    
    def export_to_markdown(self, report: MarketResearchReport) -> str:
        """Export report as Markdown format"""
        
        md = f"""# Market Research Report
        
**Industry:** {report.industry}  
**Target Segment:** {report.target_segment}  
**Report ID:** {report.id}  
**Generated:** {report.timestamp}  
**Processing Time:** {report.processing_time:.2f} seconds

---

## Executive Summary

{report.executive_summary}

---

## Key Insights

"""
        
        for insight in report.key_insights:
            md += f"- {insight}\n"
        
        md += "\n---\n\n## Strategic Recommendations\n\n"
        
        for rec in report.recommendations:
            md += f"- {rec}\n"
        
        # Market Size
        if report.market_size:
            md += f"\n---\n\n## Market Size Analysis (TAM-SAM-SOM)\n\n"
            md += f"- **TAM (Total Addressable Market):** ${report.market_size.tam:,.0f} {report.market_size.currency}\n"
            md += f"  - {report.market_size.tam_description}\n\n"
            md += f"- **SAM (Serviceable Addressable Market):** ${report.market_size.sam:,.0f} {report.market_size.currency}\n"
            md += f"  - {report.market_size.sam_description}\n\n"
            md += f"- **SOM (Serviceable Obtainable Market):** ${report.market_size.som:,.0f} {report.market_size.currency}\n"
            md += f"  - {report.market_size.som_description}\n\n"
        
        # Competitors
        md += f"\n---\n\n## Competitor Analysis ({len(report.competitors)} competitors)\n\n"
        
        for i, comp in enumerate(report.competitors, 1):
            md += f"### {i}. {comp.name}\n\n"
            md += f"{comp.description}\n\n"
            if comp.url:
                md += f"**Website:** {comp.url}\n\n"
            if comp.funding:
                md += f"**Funding:** {comp.funding}\n\n"
            if comp.team_size:
                md += f"**Team Size:** {comp.team_size}\n\n"
            if comp.pricing_model:
                md += f"**Pricing Model:** {comp.pricing_model}\n\n"
            
            if comp.strengths:
                md += "**Strengths:**\n"
                for strength in comp.strengths:
                    md += f"- {strength}\n"
                md += "\n"
            
            if comp.weaknesses:
                md += "**Weaknesses:**\n"
                for weakness in comp.weaknesses:
                    md += f"- {weakness}\n"
                md += "\n"
        
        # Trends
        md += f"\n---\n\n## Market Trends ({len(report.trends)} trends)\n\n"
        
        for i, trend in enumerate(report.trends[:10], 1):
            md += f"{i}. **{trend.keyword}** (Score: {trend.trend_score}/100)\n"
            md += f"   - Category: {trend.category}\n"
            if trend.growth_rate:
                md += f"   - Growth Rate: {trend.growth_rate}\n"
            md += f"   - {trend.relevance}\n\n"
        
        # Sentiment
        if report.sentiment:
            md += f"\n---\n\n## User Sentiment Analysis\n\n"
            
            for sent in report.sentiment:
                md += f"### {sent.source}\n\n"
                md += f"**Sentiment Score:** {sent.sentiment_score:.2f} (-1 to +1)\n\n"
                md += f"**Sample Size:** {sent.sample_size} reviews\n\n"
                
                if sent.pain_points:
                    md += "**Pain Points:**\n"
                    for pain in sent.pain_points:
                        md += f"- {pain}\n"
                    md += "\n"
                
                if sent.positive_feedback:
                    md += "**Positive Feedback:**\n"
                    for pos in sent.positive_feedback:
                        md += f"- {pos}\n"
                    md += "\n"
        
        # SWOT
        if report.swot:
            md += f"\n---\n\n## SWOT Analysis\n\n"
            
            md += "### Strengths\n\n"
            for s in report.swot.strengths:
                md += f"- {s}\n"
            
            md += "\n### Weaknesses\n\n"
            for w in report.swot.weaknesses:
                md += f"- {w}\n"
            
            md += "\n### Opportunities\n\n"
            for o in report.swot.opportunities:
                md += f"- {o}\n"
            
            md += "\n### Threats\n\n"
            for t in report.swot.threats:
                md += f"- {t}\n"
            
            if report.swot.chart_url:
                md += f"\n![SWOT Analysis]({report.swot.chart_url})\n"
        
        # Market Gaps
        if report.market_gaps:
            md += f"\n---\n\n## Market Gap Radar ({len(report.market_gaps)} opportunities)\n\n"
            
            for i, gap in enumerate(report.market_gaps, 1):
                md += f"### {i}. {gap.gap_name} (Opportunity Score: {gap.opportunity_score}/100)\n\n"
                md += f"{gap.description}\n\n"
                md += f"**Target Audience:** {gap.target_audience}\n\n"
                md += f"**Why Unsolved:** {gap.why_unsolved}\n\n"
                md += f"**Potential Solution:** {gap.potential_solution}\n\n"
        
        md += "\n---\n\n*Report generated by Nexora Market Research Agent*\n"
        
        return md


# ============================================================================
# MAIN EXECUTION (for testing)
# ============================================================================

async def main():
    """Test the Market Research Agent"""
    
    print("=" * 80)
    print("NEXORA MARKET RESEARCH AGENT - TEST")
    print("=" * 80)
    print()
    
    try:
        # Initialize agent
        agent = MarketResearchAgent()
        
        # Conduct research
        report = await agent.conduct_market_research(
            industry="AI-powered productivity tools",
            target_segment="Software developers and tech teams",
            your_product_description="An AI-powered IDE that helps developers build MVPs faster",
            geographic_scope="Global"
        )
        
        # Export results
        print("\n" + "=" * 80)
        print("RESEARCH COMPLETED")
        print("=" * 80)
        print(f"Report ID: {report.id}")
        print(f"Processing Time: {report.processing_time:.2f} seconds")
        print(f"Competitors Found: {len(report.competitors)}")
        print(f"Trends Identified: {len(report.trends)}")
        print(f"Market Gaps: {len(report.market_gaps)}")
        
        # Save JSON
        with open("market_research_report.json", "w", encoding="utf-8") as f:
            json.dump(agent.format_report_json(report), f, indent=2)
        print("\n✓ JSON report saved to: market_research_report.json")
        
        # Save Markdown
        md_content = agent.export_to_markdown(report)
        with open("market_research_report.md", "w", encoding="utf-8") as f:
            f.write(md_content)
        print("✓ Markdown report saved to: market_research_report.md")
        
        print("\n" + "=" * 80)
        print("TEST COMPLETED SUCCESSFULLY")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
