#!/usr/bin/env python3
"""
Direct test of HF API for logo generation
"""
import asyncio
import os
import sys
import logging

# Set HF token from environment or use the one we know
if not os.getenv('HF_TOKEN_5'):
    os.environ['HF_TOKEN_5'] = 'hf_PpyXqlqHpLwO'  # The token from the logs

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.dirname(__file__))

from branding_agent import BrandingAgent, LogoRequest

async def test_hf_api():
    """Test HF API directly"""
    try:
        logger.info("=" * 80)
        logger.info("Testing Hugging Face API for Logo Generation")
        logger.info("=" * 80)
        
        # Initialize agent
        agent = BrandingAgent()
        logger.info(f"✅ Agent initialized")
        logger.info(f"   Model: {agent.model_name}")
        logger.info(f"   API URL: {agent.api_url}")
        logger.info(f"   Token: {agent.hf_token[:20]}...")
        
        # Create request
        request = LogoRequest(
            company_name="TestCompany",
            idea="technology",
            style="modern",
            colors="professional",
            shape="square"
        )
        logger.info(f"\n📝 Request:")
        logger.info(f"   Company: {request.company_name}")
        logger.info(f"   Idea: {request.idea}")
        logger.info(f"   Style: {request.style}")
        
        # Generate logo
        logger.info(f"\n🚀 Generating logo...")
        result = await agent.generate_logo(request)
        
        logger.info(f"\n✅ SUCCESS!")
        logger.info(f"   Logo ID: {result.logo_id}")
        logger.info(f"   Image size: {len(result.image_base64)} bytes")
        logger.info(f"   Prompt: {result.prompt_used[:100]}...")
        
        return True
        
    except Exception as e:
        logger.error(f"\n❌ ERROR: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    success = asyncio.run(test_hf_api())
    sys.exit(0 if success else 1)
