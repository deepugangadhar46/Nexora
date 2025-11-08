"""
IDEA VALIDATION AGENT for Nexora AI IDE
=========================================

A professional AI agent that evaluates startup ideas using:
- Groq API (Llama model) for AI analysis
- Firecrawl API for web scraping and competitor research
- QuickChart API for visualization
- ReportLab for PDF report generation

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
from dataclasses import dataclass, asdict
from io import BytesIO
import base64

# Third-party imports
import aiohttp
import requests
from dotenv import load_dotenv

# PDF Generation
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logging.warning("ReportLab not available. PDF generation will be disabled.")

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
class FeasibilityScore:
    """AI Feasibility scoring breakdown"""
    feasibility: int  # 0-100
    novelty: int  # 0-100
    scalability: int  # 0-100
    overall: int  # 0-100
    reasoning: str = ""


@dataclass
class Competitor:
    """Competitor information"""
    name: str
    description: str
    overlap_score: int  # 0-100
    url: Optional[str] = None
    strengths: List[str] = None
    weaknesses: List[str] = None
    
    def __post_init__(self):
        if self.strengths is None:
            self.strengths = []
        if self.weaknesses is None:
            self.weaknesses = []


@dataclass
class AudienceSegment:
    """Target audience segment"""
    name: str
    demographics: str
    psychographics: str
    pain_points: List[str]
    adoption_likelihood: int  # 0-100
    
    def __post_init__(self):
        if not isinstance(self.pain_points, list):
            self.pain_points = []


@dataclass
class TargetAudience:
    """Target audience analysis"""
    segments: List[AudienceSegment]
    fit_score: int  # 0-100
    total_addressable_market: str = ""


@dataclass
class ProblemSolutionFit:
    """Problem-solution fit analysis"""
    trend_score: int  # 0-100
    trend_summary: str
    search_volume_trend: str = "stable"
    market_demand: str = "moderate"
    validation_sources: List[str] = None
    
    def __post_init__(self):
        if self.validation_sources is None:
            self.validation_sources = []


@dataclass
class Risk:
    """Risk information"""
    risk: str
    severity: str  # High/Medium/Low
    mitigation: str
    confidence: int = 75  # 0-100


@dataclass
class IdeaValidationResponse:
    """Complete idea validation response"""
    idea_title: str
    summary: str
    ai_feasibility_score: FeasibilityScore
    competitors: List[Competitor]
    target_audience: TargetAudience
    problem_solution_fit: ProblemSolutionFit
    risks: List[Risk]
    pdf_report_url: Optional[str] = None
    community_poll_link: Optional[str] = None
    summary_recommendation: str = ""
    validation_id: str = ""
    created_at: str = ""


# ============================================================================
# API CLIENTS
# ============================================================================

class GroqClient:
    """Groq API client for Llama model"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.3-70b-versatile"  # Using Llama 3.3 70B
        
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
    
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4000,
        json_mode: bool = False
    ) -> str:
        """Generate response using Groq Llama model"""
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Groq API error: {error_text}")
                        raise Exception(f"Groq API error: {response.status}")
                    
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
        
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise


class FirecrawlClient:
    """Firecrawl API client for web scraping"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("FIRECRAWL_API_KEY")
        self.base_url = "https://api.firecrawl.dev/v1"
        
        if not self.api_key:
            raise ValueError("FIRECRAWL_API_KEY not found in environment variables")
    
    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrape a single URL"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "url": url
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/scrape",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Firecrawl API error: {error_text}")
                        return {"success": False, "error": error_text}
                    
                    return await response.json()
        
        except Exception as e:
            logger.error(f"Error scraping URL {url}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search the web using Firecrawl"""
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "query": query,
            "limit": limit
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/search",
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=45)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Firecrawl search error: {error_text}")
                        return []
                    
                    data = await response.json()
                    return data.get("data", [])
        
        except Exception as e:
            logger.error(f"Error searching with Firecrawl: {str(e)}")
            return []


class QuickChartClient:
    """QuickChart API client for chart generation"""
    
    def __init__(self):
        self.base_url = os.getenv("QUICKCHART_API_URL", "https://quickchart.io/chart")
    
    def generate_chart_url(self, chart_config: Dict[str, Any]) -> str:
        """Generate chart URL from configuration"""
        
        config_json = json.dumps(chart_config)
        encoded_config = requests.utils.quote(config_json)
        return f"{self.base_url}?c={encoded_config}"
    
    async def get_chart_image(self, chart_config: Dict[str, Any]) -> Optional[bytes]:
        """Get chart image as bytes"""
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url,
                    json={"chart": chart_config},
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as response:
                    if response.status == 200:
                        return await response.read()
                    return None
        
        except Exception as e:
            logger.error(f"Error generating chart: {str(e)}")
            return None


# ============================================================================
# IDEA VALIDATION AGENT
# ============================================================================

class IdeaValidationAgent:
    """
    IDEA VALIDATION AGENT
    
    Evaluates startup ideas using AI analysis, competitor research,
    audience validation, trend analysis, and risk assessment.
    """
    
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        firecrawl_api_key: Optional[str] = None
    ):
        """Initialize the Idea Validation Agent"""
        
        self.groq = GroqClient(groq_api_key)
        self.firecrawl = FirecrawlClient(firecrawl_api_key)
        self.quickchart = QuickChartClient()
        
        logger.info("Idea Validation Agent initialized successfully")
    
    # ========================================================================
    # MODULE 1: AI FEASIBILITY SCORING
    # ========================================================================
    
    async def analyze_feasibility(self, idea: str) -> FeasibilityScore:
        """
        Analyze idea feasibility, novelty, and scalability
        Returns scores from 0-100 for each dimension
        """
        
        system_prompt = """You are an ELITE VC analyst and startup advisor with 15+ years of experience evaluating unicorn startups.
Evaluate startup ideas with EXCEPTIONAL precision using data-driven metrics and market intelligence.

Scoring criteria (0-100):
- Feasibility: Technical viability, resource requirements, time to market, execution complexity
- Novelty: Uniqueness, innovation level, IP potential, differentiation from existing solutions
- Scalability: Growth potential, TAM size, unit economics, network effects, viral coefficient

Be HONEST and RIGOROUS. A score of 80+ means exceptional potential. 60-79 is good. 40-59 is average. Below 40 needs major pivots.

Return ONLY valid JSON with this exact structure:
{
  "feasibility": <0-100>,
  "novelty": <0-100>,
  "scalability": <0-100>,
  "reasoning": "<detailed explanation with specific insights>"
}"""

        user_prompt = f"""Analyze this startup idea and provide feasibility scores:

IDEA: {idea}

Evaluate:
1. Feasibility: Can this be built with current technology? What resources are needed?
2. Novelty: How unique is this? What makes it different from existing solutions?
3. Scalability: Can this grow to serve millions of users? What's the TAM?

Return scores (0-100) and reasoning in JSON format."""

        try:
            response = await self.groq.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                json_mode=True
            )
            
            # Parse JSON response
            data = json.loads(response)
            logger.info(f"Groq feasibility response: {data}")
            
            # Extract scores with robust error handling
            # Try to get the value, convert to int, and ensure it's in valid range
            try:
                feasibility = int(data.get("feasibility", 50))
            except (ValueError, TypeError):
                logger.warning(f"Invalid feasibility value: {data.get('feasibility')}, using default")
                feasibility = 50
            
            try:
                novelty = int(data.get("novelty", 50))
            except (ValueError, TypeError):
                logger.warning(f"Invalid novelty value: {data.get('novelty')}, using default")
                novelty = 50
            
            try:
                scalability = int(data.get("scalability", 50))
            except (ValueError, TypeError):
                logger.warning(f"Invalid scalability value: {data.get('scalability')}, using default")
                scalability = 50
            
            # Clamp values to valid range
            feasibility = max(0, min(100, feasibility))
            novelty = max(0, min(100, novelty))
            scalability = max(0, min(100, scalability))
            
            logger.info(f"Parsed scores - Feasibility: {feasibility}, Novelty: {novelty}, Scalability: {scalability}")
            
            # Weighted average: feasibility 40%, scalability 35%, novelty 25%
            # This prioritizes execution ability and market size over pure innovation
            overall = int(feasibility * 0.4 + scalability * 0.35 + novelty * 0.25)
            
            return FeasibilityScore(
                feasibility=feasibility,
                novelty=novelty,
                scalability=scalability,
                overall=overall,
                reasoning=data.get("reasoning", "")
            )
        
        except Exception as e:
            logger.error(f"Error analyzing feasibility: {str(e)}")
            logger.error(f"Raw response: {response if 'response' in locals() else 'No response'}")
            # Return default scores on error
            return FeasibilityScore(
                feasibility=50,
                novelty=50,
                scalability=50,
                overall=50,
                reasoning="Error during analysis"
            )
    
    # ========================================================================
    # MODULE 2: COMPETITOR PRESENCE CHECK
    # ========================================================================
    
    async def find_competitors(self, idea: str, industry: str = "") -> List[Competitor]:
        """
        Search for competitors and analyze market overlap
        """
        
        # Extract keywords from idea
        keywords = await self._extract_keywords(idea)
        
        # Search for competitors using Firecrawl
        search_query = f"{keywords} startup company product"
        if industry:
            search_query += f" {industry}"
        
        search_results = await self.firecrawl.search(search_query, limit=10)
        
        # Analyze competitors using Groq
        competitors = []
        
        if search_results:
            system_prompt = """You are a competitive intelligence analyst.
Analyze companies and determine their overlap with the given idea.

Return ONLY valid JSON array:
[
  {
    "name": "Company Name",
    "description": "What they do",
    "overlap_score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"]
  }
]"""

            # Prepare competitor data
            competitor_data = []
            for result in search_results[:5]:
                competitor_data.append({
                    "url": result.get("url", ""),
                    "title": result.get("title", ""),
                    "content": result.get("markdown", "")[:500]
                })
            
            user_prompt = f"""Analyze these companies for overlap with our idea:

OUR IDEA: {idea}

COMPETITORS FOUND:
{json.dumps(competitor_data, indent=2)}

For each competitor, determine:
1. What they do
2. Overlap score (0-100) with our idea
3. Their key strengths
4. Their weaknesses/gaps we can exploit

Return as JSON array."""

            try:
                response = await self.groq.generate(
                    prompt=user_prompt,
                    system_prompt=system_prompt,
                    temperature=0.4,
                    json_mode=True
                )
                
                # Parse response
                data = json.loads(response)
                
                # Handle both array and object with competitors key
                if isinstance(data, dict) and "competitors" in data:
                    data = data["competitors"]
                
                for comp in data[:5]:
                    competitors.append(Competitor(
                        name=comp.get("name", "Unknown"),
                        description=comp.get("description", ""),
                        overlap_score=int(comp.get("overlap_score", 0)),
                        strengths=comp.get("strengths", []),
                        weaknesses=comp.get("weaknesses", [])
                    ))
            
            except Exception as e:
                logger.error(f"Error analyzing competitors: {str(e)}")
        
        # If no competitors found, return empty list
        if not competitors:
            logger.info("No direct competitors found - could be a blue ocean opportunity")
        
        return competitors
    
    # ========================================================================
    # MODULE 3: TARGET AUDIENCE FIT
    # ========================================================================
    
    async def analyze_target_audience(self, idea: str) -> TargetAudience:
        """
        Analyze target audience segments and fit score
        """
        
        system_prompt = """You are a market research expert specializing in customer segmentation.
Identify target audience segments with detailed demographics and psychographics.

Return ONLY valid JSON:
{
  "segments": [
    {
      "name": "Segment Name",
      "demographics": "Age, income, location, etc.",
      "psychographics": "Values, interests, behaviors",
      "pain_points": ["pain1", "pain2"],
      "adoption_likelihood": <0-100>
    }
  ],
  "fit_score": <0-100>,
  "total_addressable_market": "Market size estimate"
}"""

        user_prompt = f"""Analyze the target audience for this idea:

IDEA: {idea}

Identify:
1. Primary and secondary customer segments
2. Demographics (age, income, location, occupation)
3. Psychographics (values, motivations, behaviors)
4. Key pain points this solves for them
5. Adoption likelihood for each segment
6. Overall audience fit score
7. Total addressable market (TAM) estimate

Return as JSON."""

        try:
            response = await self.groq.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                json_mode=True
            )
            
            data = json.loads(response)
            
            segments = []
            for seg in data.get("segments", []):
                segments.append(AudienceSegment(
                    name=seg.get("name", "Unknown Segment"),
                    demographics=seg.get("demographics", ""),
                    psychographics=seg.get("psychographics", ""),
                    pain_points=seg.get("pain_points", []),
                    adoption_likelihood=int(seg.get("adoption_likelihood", 50))
                ))
            
            return TargetAudience(
                segments=segments,
                fit_score=int(data.get("fit_score", 50)),
                total_addressable_market=data.get("total_addressable_market", "Unknown")
            )
        
        except Exception as e:
            logger.error(f"Error analyzing target audience: {str(e)}")
            return TargetAudience(
                segments=[],
                fit_score=50,
                total_addressable_market="Unknown"
            )
    
    # ========================================================================
    # MODULE 4: PROBLEM-SOLUTION FIT ANALYZER
    # ========================================================================
    
    async def analyze_problem_solution_fit(self, idea: str) -> ProblemSolutionFit:
        """
        Analyze if the problem is validated by market trends
        """
        
        # Extract problem statement
        problem = await self._extract_problem(idea)
        
        # Search for trend data
        search_query = f"{problem} market trend statistics"
        search_results = await self.firecrawl.search(search_query, limit=5)
        
        # Analyze trends using Groq
        system_prompt = """You are a market trend analyst.
Analyze market trends and validate problem-solution fit.

Return ONLY valid JSON:
{
  "trend_score": <0-100>,
  "trend_summary": "Description of trend",
  "search_volume_trend": "rising|stable|declining",
  "market_demand": "high|moderate|low",
  "validation_sources": ["source1", "source2"]
}"""

        trend_data = []
        for result in search_results:
            trend_data.append({
                "title": result.get("title", ""),
                "content": result.get("markdown", "")[:400]
            })
        
        user_prompt = f"""Analyze problem-solution fit for this idea:

IDEA: {idea}
PROBLEM: {problem}

MARKET DATA:
{json.dumps(trend_data, indent=2)}

Determine:
1. Trend score (0-100): Is interest in this problem growing?
2. Search volume trend: rising, stable, or declining?
3. Market demand level: high, moderate, or low?
4. Validation sources found

Return as JSON."""

        try:
            response = await self.groq.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.3,
                json_mode=True
            )
            
            data = json.loads(response)
            
            return ProblemSolutionFit(
                trend_score=int(data.get("trend_score", 50)),
                trend_summary=data.get("trend_summary", ""),
                search_volume_trend=data.get("search_volume_trend", "stable"),
                market_demand=data.get("market_demand", "moderate"),
                validation_sources=data.get("validation_sources", [])
            )
        
        except Exception as e:
            logger.error(f"Error analyzing problem-solution fit: {str(e)}")
            return ProblemSolutionFit(
                trend_score=50,
                trend_summary="Unable to analyze trends",
                search_volume_trend="stable",
                market_demand="moderate"
            )
    
    # ========================================================================
    # MODULE 5: RISK & BARRIERS DETECTOR
    # ========================================================================
    
    async def detect_risks(self, idea: str, industry: str = "") -> List[Risk]:
        """
        Identify top risks and mitigation strategies
        """
        
        system_prompt = """You are a risk management consultant and startup advisor.
Identify potential risks across legal, technical, market, financial, and adoption categories.

Return ONLY valid JSON array:
[
  {
    "risk": "Risk description",
    "severity": "High|Medium|Low",
    "mitigation": "Mitigation strategy",
    "confidence": <0-100>
  }
]"""

        user_prompt = f"""Identify the top 5 risks for this startup idea:

IDEA: {idea}
INDUSTRY: {industry or "General"}

Analyze risks in these categories:
1. Legal/Regulatory: Compliance, licensing, data privacy
2. Technical: Implementation challenges, scalability issues
3. Market: Competition, market timing, customer adoption
4. Financial: Funding requirements, burn rate, unit economics
5. Operational: Team, execution, partnerships

For each risk:
- Describe the risk clearly
- Rate severity (High/Medium/Low)
- Provide specific mitigation strategy
- Confidence level in risk assessment

Return top 5 risks as JSON array."""

        try:
            response = await self.groq.generate(
                prompt=user_prompt,
                system_prompt=system_prompt,
                temperature=0.4,
                json_mode=True
            )
            
            data = json.loads(response)
            
            # Handle both array and object with risks key
            if isinstance(data, dict) and "risks" in data:
                data = data["risks"]
            
            risks = []
            for risk_data in data[:5]:
                risks.append(Risk(
                    risk=risk_data.get("risk", "Unknown risk"),
                    severity=risk_data.get("severity", "Medium"),
                    mitigation=risk_data.get("mitigation", ""),
                    confidence=int(risk_data.get("confidence", 75))
                ))
            
            return risks
        
        except Exception as e:
            logger.error(f"Error detecting risks: {str(e)}")
            return []
    
    # ========================================================================
    # MODULE 6: PDF REPORT GENERATION
    # ========================================================================
    
    async def generate_pdf_report(
        self,
        validation_response: IdeaValidationResponse,
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate professional PDF report
        Returns file path or URL
        """
        
        if not REPORTLAB_AVAILABLE:
            logger.warning("ReportLab not available, skipping PDF generation")
            return ""
        
        try:
            # Create output path
            if not output_path:
                reports_dir = "reports"
                os.makedirs(reports_dir, exist_ok=True)
                output_path = os.path.join(
                    reports_dir,
                    f"idea_validation_{validation_response.validation_id}.pdf"
                )
            
            # Create PDF
            doc = SimpleDocTemplate(output_path, pagesize=letter)
            story = []
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a1a1a'),
                spaceAfter=30,
                alignment=TA_CENTER
            )
            
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontSize=16,
                textColor=colors.HexColor('#2563eb'),
                spaceAfter=12,
                spaceBefore=12
            )
            
            # Title
            story.append(Paragraph("IDEA VALIDATION REPORT", title_style))
            story.append(Paragraph(validation_response.idea_title, styles['Heading2']))
            story.append(Spacer(1, 0.3*inch))
            
            # Summary
            story.append(Paragraph("Executive Summary", heading_style))
            story.append(Paragraph(validation_response.summary, styles['BodyText']))
            story.append(Spacer(1, 0.2*inch))
            
            # AI Feasibility Score
            story.append(Paragraph("AI Feasibility Score", heading_style))
            score_data = [
                ['Metric', 'Score'],
                ['Feasibility', f"{validation_response.ai_feasibility_score.feasibility}/100"],
                ['Novelty', f"{validation_response.ai_feasibility_score.novelty}/100"],
                ['Scalability', f"{validation_response.ai_feasibility_score.scalability}/100"],
                ['Overall', f"{validation_response.ai_feasibility_score.overall}/100"]
            ]
            score_table = Table(score_data, colWidths=[3*inch, 2*inch])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(score_table)
            story.append(Spacer(1, 0.2*inch))
            
            # Competitors
            if validation_response.competitors:
                story.append(Paragraph("Competitor Analysis", heading_style))
                for comp in validation_response.competitors[:3]:
                    story.append(Paragraph(
                        f"<b>{comp.name}</b> (Overlap: {comp.overlap_score}%)",
                        styles['BodyText']
                    ))
                    story.append(Paragraph(comp.description, styles['BodyText']))
                    story.append(Spacer(1, 0.1*inch))
            
            # Target Audience
            story.append(Paragraph("Target Audience", heading_style))
            story.append(Paragraph(
                f"Audience Fit Score: {validation_response.target_audience.fit_score}/100",
                styles['BodyText']
            ))
            story.append(Paragraph(
                f"TAM: {validation_response.target_audience.total_addressable_market}",
                styles['BodyText']
            ))
            story.append(Spacer(1, 0.2*inch))
            
            # Problem-Solution Fit
            story.append(Paragraph("Problem-Solution Fit", heading_style))
            story.append(Paragraph(
                f"Trend Score: {validation_response.problem_solution_fit.trend_score}/100",
                styles['BodyText']
            ))
            story.append(Paragraph(
                validation_response.problem_solution_fit.trend_summary,
                styles['BodyText']
            ))
            story.append(Spacer(1, 0.2*inch))
            
            # Risks
            if validation_response.risks:
                story.append(Paragraph("Risk Analysis", heading_style))
                risk_data = [['Risk', 'Severity', 'Mitigation']]
                for risk in validation_response.risks:
                    risk_data.append([
                        risk.risk[:50] + "..." if len(risk.risk) > 50 else risk.risk,
                        risk.severity,
                        risk.mitigation[:60] + "..." if len(risk.mitigation) > 60 else risk.mitigation
                    ])
                
                risk_table = Table(risk_data, colWidths=[2*inch, 1*inch, 3*inch])
                risk_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                story.append(risk_table)
            
            # Recommendation
            story.append(Spacer(1, 0.3*inch))
            story.append(Paragraph("Final Recommendation", heading_style))
            story.append(Paragraph(
                validation_response.summary_recommendation,
                styles['BodyText']
            ))
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"PDF report generated: {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            return ""
    
    # ========================================================================
    # MAIN VALIDATION PIPELINE
    # ========================================================================
    
    async def validate_idea(
        self,
        idea: str,
        industry: str = "",
        generate_pdf: bool = True
    ) -> IdeaValidationResponse:
        """
        Complete idea validation pipeline
        
        Args:
            idea: Startup idea description
            industry: Industry/sector (optional)
            generate_pdf: Whether to generate PDF report
        
        Returns:
            Complete validation response
        """
        
        validation_id = str(uuid.uuid4())[:8]
        logger.info(f"Starting idea validation {validation_id}")
        
        # Extract idea title
        idea_title = await self._extract_title(idea)
        
        # Run all analysis modules in parallel for speed
        logger.info("Running parallel analysis...")
        
        feasibility_task = self.analyze_feasibility(idea)
        competitors_task = self.find_competitors(idea, industry)
        audience_task = self.analyze_target_audience(idea)
        problem_fit_task = self.analyze_problem_solution_fit(idea)
        risks_task = self.detect_risks(idea, industry)
        
        # Wait for all tasks
        feasibility, competitors, audience, problem_fit, risks = await asyncio.gather(
            feasibility_task,
            competitors_task,
            audience_task,
            problem_fit_task,
            risks_task
        )
        
        # Generate summary recommendation
        summary_recommendation = await self._generate_recommendation(
            feasibility, competitors, audience, problem_fit, risks
        )
        
        # Generate executive summary
        summary = await self._generate_summary(idea, feasibility, competitors, audience)
        
        # Create response object
        response = IdeaValidationResponse(
            idea_title=idea_title,
            summary=summary,
            ai_feasibility_score=feasibility,
            competitors=competitors,
            target_audience=audience,
            problem_solution_fit=problem_fit,
            risks=risks,
            summary_recommendation=summary_recommendation,
            validation_id=validation_id,
            created_at=datetime.now().isoformat()
        )
        
        # Generate PDF if requested
        if generate_pdf:
            pdf_path = await self.generate_pdf_report(response)
            response.pdf_report_url = pdf_path
        
        logger.info(f"Validation {validation_id} completed successfully")
        
        return response
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    async def _extract_keywords(self, idea: str) -> str:
        """Extract key search terms from idea"""
        
        prompt = f"Extract 3-5 key search terms from this idea (comma-separated): {idea}"
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=100
            )
            return response.strip()
        except:
            # Fallback: use first 5 words
            words = idea.split()[:5]
            return " ".join(words)
    
    async def _extract_problem(self, idea: str) -> str:
        """Extract problem statement from idea"""
        
        prompt = f"Extract the core problem being solved (one sentence): {idea}"
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=100
            )
            return response.strip()
        except:
            return idea[:200]
    
    async def _extract_title(self, idea: str) -> str:
        """Extract concise title from idea"""
        
        prompt = f"Create a concise 5-7 word title for this idea: {idea}"
        
        try:
            response = await self.groq.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=50
            )
            return response.strip()
        except:
            return idea[:50]
    
    async def _generate_summary(
        self,
        idea: str,
        feasibility: FeasibilityScore,
        competitors: List[Competitor],
        audience: TargetAudience
    ) -> str:
        """Generate executive summary"""
        
        prompt = f"""Create a 2-3 sentence executive summary for this startup idea validation:

Idea: {idea}
Overall Score: {feasibility.overall}/100
Competitors Found: {len(competitors)}
Audience Fit: {audience.fit_score}/100

Write a professional summary."""

        try:
            response = await self.groq.generate(
                prompt=prompt,
                temperature=0.5,
                max_tokens=200
            )
            return response.strip()
        except:
            return f"Idea validation completed with overall score of {feasibility.overall}/100."
    
    async def _generate_recommendation(
        self,
        feasibility: FeasibilityScore,
        competitors: List[Competitor],
        audience: TargetAudience,
        problem_fit: ProblemSolutionFit,
        risks: List[Risk]
    ) -> str:
        """Generate final recommendation"""
        
        # Calculate recommendation based on scores
        overall_score = feasibility.overall
        high_risks = sum(1 for r in risks if r.severity == "High")
        
        if overall_score >= 75 and high_risks <= 1:
            recommendation = "STRONG GO"
            reason = "High validation scores with manageable risks. Proceed with MVP development."
        elif overall_score >= 60 and high_risks <= 2:
            recommendation = "PROCEED WITH CAUTION"
            reason = "Moderate validation scores. Address key risks before full commitment."
        elif overall_score >= 45:
            recommendation = "PIVOT RECOMMENDED"
            reason = "Mixed signals. Consider pivoting to address identified weaknesses."
        else:
            recommendation = "HIGH RISK"
            reason = "Low validation scores and significant barriers. Reconsider or pivot significantly."
        
        return f"{recommendation}: {reason}"
    
    def to_json(self, response: IdeaValidationResponse) -> str:
        """Convert response to JSON string"""
        
        def convert_to_dict(obj):
            if hasattr(obj, '__dict__'):
                return {k: convert_to_dict(v) for k, v in obj.__dict__.items()}
            elif isinstance(obj, list):
                return [convert_to_dict(item) for item in obj]
            else:
                return obj
        
        response_dict = {
            "idea_validation_response": convert_to_dict(response)
        }
        
        return json.dumps(response_dict, indent=2)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Example usage"""
    
    # Initialize agent
    agent = IdeaValidationAgent()
    
    # Example idea
    idea = """
    A B2B SaaS platform that helps restaurants automatically manage food waste 
    using AI-powered sensors and computer vision. The system tracks inventory, 
    predicts demand, and provides actionable insights to reduce waste by up to 40%.
    """
    
    # Validate idea
    result = await agent.validate_idea(
        idea=idea,
        industry="Food Tech / Restaurant Tech",
        generate_pdf=True
    )
    
    # Print JSON response
    print(agent.to_json(result))
    
    # Print summary
    print("\n" + "="*80)
    print(f"VALIDATION SUMMARY")
    print("="*80)
    print(f"Idea: {result.idea_title}")
    print(f"Overall Score: {result.ai_feasibility_score.overall}/100")
    print(f"Competitors Found: {len(result.competitors)}")
    print(f"Audience Fit: {result.target_audience.fit_score}/100")
    print(f"Trend Score: {result.problem_solution_fit.trend_score}/100")
    print(f"Recommendation: {result.summary_recommendation}")
    if result.pdf_report_url:
        print(f"PDF Report: {result.pdf_report_url}")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
