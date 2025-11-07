"""
Idea Validation API Endpoints
==============================

FastAPI endpoints for the Idea Validation Agent

Author: NEXORA Team
Version: 1.0.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import logging
from datetime import datetime

from idea_validation_agent import (
    IdeaValidationAgent,
    IdeaValidationResponse,
    FeasibilityScore,
    Competitor,
    TargetAudience,
    ProblemSolutionFit,
    Risk
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/idea-validation", tags=["Idea Validation"])

# Initialize agent (singleton)
agent = None

def get_agent():
    """Get or create agent instance"""
    global agent
    if agent is None:
        agent = IdeaValidationAgent()
    return agent


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class IdeaValidationRequest(BaseModel):
    """Request model for idea validation"""
    idea: str = Field(..., description="Startup idea description", min_length=10)
    industry: Optional[str] = Field(None, description="Industry/sector (optional)")
    generate_pdf: bool = Field(True, description="Generate PDF report")
    
    class Config:
        json_schema_extra = {
            "example": {
                "idea": "A B2B SaaS that helps restaurants automatically manage food waste using AI sensors",
                "industry": "Food Tech",
                "generate_pdf": True
            }
        }


class FeasibilityScoreResponse(BaseModel):
    """Feasibility score response"""
    feasibility: int
    novelty: int
    scalability: int
    overall: int
    reasoning: str


class CompetitorResponse(BaseModel):
    """Competitor response"""
    name: str
    description: str
    overlap_score: int
    url: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []


class AudienceSegmentResponse(BaseModel):
    """Audience segment response"""
    name: str
    demographics: str
    psychographics: str
    pain_points: List[str]
    adoption_likelihood: int


class TargetAudienceResponse(BaseModel):
    """Target audience response"""
    segments: List[AudienceSegmentResponse]
    fit_score: int
    total_addressable_market: str


class ProblemSolutionFitResponse(BaseModel):
    """Problem-solution fit response"""
    trend_score: int
    trend_summary: str
    search_volume_trend: str
    market_demand: str
    validation_sources: List[str] = []


class RiskResponse(BaseModel):
    """Risk response"""
    risk: str
    severity: str
    mitigation: str
    confidence: int


class IdeaValidationResponseModel(BaseModel):
    """Complete validation response"""
    idea_title: str
    summary: str
    ai_feasibility_score: FeasibilityScoreResponse
    competitors: List[CompetitorResponse]
    target_audience: TargetAudienceResponse
    problem_solution_fit: ProblemSolutionFitResponse
    risks: List[RiskResponse]
    pdf_report_url: Optional[str] = None
    community_poll_link: Optional[str] = None
    summary_recommendation: str
    validation_id: str
    created_at: str


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/validate", response_model=IdeaValidationResponseModel)
async def validate_idea(request: IdeaValidationRequest):
    """
    Validate a startup idea
    
    Performs comprehensive validation including:
    - AI feasibility scoring
    - Competitor analysis
    - Target audience fit
    - Problem-solution fit
    - Risk assessment
    - PDF report generation
    
    Returns complete validation results with actionable insights.
    """
    
    try:
        logger.info(f"Validating idea: {request.idea[:100]}...")
        
        # Get agent instance
        validation_agent = get_agent()
        
        # Run validation
        result = await validation_agent.validate_idea(
            idea=request.idea,
            industry=request.industry or "",
            generate_pdf=request.generate_pdf
        )
        
        # Convert to response model
        response = _convert_to_response(result)
        
        # Add model metadata
        response_dict = response.model_dump() if hasattr(response, 'model_dump') else response.dict()
        response_dict["metadata"] = {
            "model": "Groq-Llama",
            "provider": "Groq",
            "reason": "Optimized for analysis and reasoning",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Validation completed: {result.validation_id}")
        
        return response_dict
    
    except Exception as e:
        logger.error(f"Error validating idea: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/validate-quick", response_model=FeasibilityScoreResponse)
async def validate_idea_quick(request: IdeaValidationRequest):
    """
    Quick validation - only AI feasibility scoring
    
    Fast endpoint that returns only the AI feasibility score
    without competitor research or full analysis.
    """
    
    try:
        logger.info(f"Quick validation: {request.idea[:100]}...")
        
        # Get agent instance
        validation_agent = get_agent()
        
        # Run only feasibility analysis
        feasibility = await validation_agent.analyze_feasibility(request.idea)
        
        return FeasibilityScoreResponse(
            feasibility=feasibility.feasibility,
            novelty=feasibility.novelty,
            scalability=feasibility.scalability,
            overall=feasibility.overall,
            reasoning=feasibility.reasoning
        )
    
    except Exception as e:
        logger.error(f"Error in quick validation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Quick validation failed: {str(e)}")


@router.post("/competitors", response_model=List[CompetitorResponse])
async def find_competitors(request: IdeaValidationRequest):
    """
    Find competitors for an idea
    
    Searches the market for similar products/companies and
    analyzes their overlap with your idea.
    """
    
    try:
        logger.info(f"Finding competitors for: {request.idea[:100]}...")
        
        # Get agent instance
        validation_agent = get_agent()
        
        # Find competitors
        competitors = await validation_agent.find_competitors(
            idea=request.idea,
            industry=request.industry or ""
        )
        
        # Convert to response
        return [
            CompetitorResponse(
                name=comp.name,
                description=comp.description,
                overlap_score=comp.overlap_score,
                url=comp.url,
                strengths=comp.strengths or [],
                weaknesses=comp.weaknesses or []
            )
            for comp in competitors
        ]
    
    except Exception as e:
        logger.error(f"Error finding competitors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Competitor search failed: {str(e)}")


@router.post("/audience", response_model=TargetAudienceResponse)
async def analyze_audience(request: IdeaValidationRequest):
    """
    Analyze target audience
    
    Identifies customer segments, demographics, psychographics,
    and calculates audience fit score.
    """
    
    try:
        logger.info(f"Analyzing audience for: {request.idea[:100]}...")
        
        # Get agent instance
        validation_agent = get_agent()
        
        # Analyze audience
        audience = await validation_agent.analyze_target_audience(request.idea)
        
        # Convert to response
        segments = [
            AudienceSegmentResponse(
                name=seg.name,
                demographics=seg.demographics,
                psychographics=seg.psychographics,
                pain_points=seg.pain_points,
                adoption_likelihood=seg.adoption_likelihood
            )
            for seg in audience.segments
        ]
        
        return TargetAudienceResponse(
            segments=segments,
            fit_score=audience.fit_score,
            total_addressable_market=audience.total_addressable_market
        )
    
    except Exception as e:
        logger.error(f"Error analyzing audience: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audience analysis failed: {str(e)}")


@router.post("/risks", response_model=List[RiskResponse])
async def detect_risks(request: IdeaValidationRequest):
    """
    Detect risks and barriers
    
    Identifies top risks across legal, technical, market,
    financial, and operational categories with mitigation strategies.
    """
    
    try:
        logger.info(f"Detecting risks for: {request.idea[:100]}...")
        
        # Get agent instance
        validation_agent = get_agent()
        
        # Detect risks
        risks = await validation_agent.detect_risks(
            idea=request.idea,
            industry=request.industry or ""
        )
        
        # Convert to response
        return [
            RiskResponse(
                risk=risk.risk,
                severity=risk.severity,
                mitigation=risk.mitigation,
                confidence=risk.confidence
            )
            for risk in risks
        ]
    
    except Exception as e:
        logger.error(f"Error detecting risks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Risk detection failed: {str(e)}")


@router.get("/report/{validation_id}")
async def download_report(validation_id: str):
    """
    Download PDF report
    
    Downloads the generated PDF validation report for a given validation ID.
    """
    
    try:
        # Look for report file
        reports_dir = "reports"
        report_path = os.path.join(reports_dir, f"idea_validation_{validation_id}.pdf")
        
        if not os.path.exists(report_path):
            raise HTTPException(status_code=404, detail="Report not found")
        
        return FileResponse(
            path=report_path,
            media_type="application/pdf",
            filename=f"idea_validation_{validation_id}.pdf"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report download failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Verifies that the Idea Validation Agent is operational
    and all required API keys are configured.
    """
    
    try:
        # Check environment variables
        groq_key = os.getenv("GROQ_API_KEY")
        firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
        
        status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "groq_api": "configured" if groq_key else "missing",
                "firecrawl_api": "configured" if firecrawl_key else "missing",
                "pdf_generation": "available" if os.getenv("REPORTLAB_AVAILABLE", "true") == "true" else "unavailable"
            }
        }
        
        # Check if all required services are available
        if not groq_key or not firecrawl_key:
            status["status"] = "degraded"
            status["message"] = "Some API keys are missing"
        
        return status
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _convert_to_response(result: IdeaValidationResponse) -> IdeaValidationResponseModel:
    """Convert internal response to API response model"""
    
    # Convert feasibility score
    feasibility = FeasibilityScoreResponse(
        feasibility=result.ai_feasibility_score.feasibility,
        novelty=result.ai_feasibility_score.novelty,
        scalability=result.ai_feasibility_score.scalability,
        overall=result.ai_feasibility_score.overall,
        reasoning=result.ai_feasibility_score.reasoning
    )
    
    # Convert competitors
    competitors = [
        CompetitorResponse(
            name=comp.name,
            description=comp.description,
            overlap_score=comp.overlap_score,
            url=comp.url,
            strengths=comp.strengths or [],
            weaknesses=comp.weaknesses or []
        )
        for comp in result.competitors
    ]
    
    # Convert audience segments
    segments = [
        AudienceSegmentResponse(
            name=seg.name,
            demographics=seg.demographics,
            psychographics=seg.psychographics,
            pain_points=seg.pain_points,
            adoption_likelihood=seg.adoption_likelihood
        )
        for seg in result.target_audience.segments
    ]
    
    audience = TargetAudienceResponse(
        segments=segments,
        fit_score=result.target_audience.fit_score,
        total_addressable_market=result.target_audience.total_addressable_market
    )
    
    # Convert problem-solution fit
    problem_fit = ProblemSolutionFitResponse(
        trend_score=result.problem_solution_fit.trend_score,
        trend_summary=result.problem_solution_fit.trend_summary,
        search_volume_trend=result.problem_solution_fit.search_volume_trend,
        market_demand=result.problem_solution_fit.market_demand,
        validation_sources=result.problem_solution_fit.validation_sources or []
    )
    
    # Convert risks
    risks = [
        RiskResponse(
            risk=risk.risk,
            severity=risk.severity,
            mitigation=risk.mitigation,
            confidence=risk.confidence
        )
        for risk in result.risks
    ]
    
    return IdeaValidationResponseModel(
        idea_title=result.idea_title,
        summary=result.summary,
        ai_feasibility_score=feasibility,
        competitors=competitors,
        target_audience=audience,
        problem_solution_fit=problem_fit,
        risks=risks,
        pdf_report_url=result.pdf_report_url,
        community_poll_link=result.community_poll_link,
        summary_recommendation=result.summary_recommendation,
        validation_id=result.validation_id,
        created_at=result.created_at
    )
