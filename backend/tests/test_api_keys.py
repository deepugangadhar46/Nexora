#!/usr/bin/env python3
"""
API Key Validation Test Script
=============================

This script tests all configured AI API keys to ensure they're working properly.
Run this before starting the MVP development server to validate your configuration.

Usage: python test_api_keys.py
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
from mvp_builder_agent import MVPBuilderAgent, AIModel

# Load environment variables
load_dotenv()

async def test_api_key(agent: MVPBuilderAgent, model: AIModel, model_name: str):
    """Test a specific AI model API key"""
    print(f"\n🧪 Testing {model_name} API key...")
    
    try:
        # Simple test prompt
        test_prompt = "Hello! Please respond with just 'API key is working' if you can see this message."
        
        # Get response (non-streaming)
        response_chunks = []
        async for chunk in agent.get_ai_response(test_prompt, model, stream=False):
            response_chunks.append(chunk)
        
        response = ''.join(response_chunks).strip()
        
        if response:
            print(f"✅ {model_name} API key is working!")
            print(f"   Response: {response[:100]}{'...' if len(response) > 100 else ''}")
            return True
        else:
            print(f"❌ {model_name} API key failed - no response received")
            return False
            
    except Exception as e:
        print(f"❌ {model_name} API key failed: {str(e)}")
        return False

async def main():
    """Main test function"""
    print("🚀 NEXORA MVP Builder - API Key Validation Test")
    print("=" * 50)
    
    # Initialize the agent
    print("\n📋 Initializing MVP Builder Agent...")
    agent = MVPBuilderAgent()
    
    # Check environment variables
    print("\n🔍 Checking environment variables...")
    api_keys = {
        "HF_TOKEN": os.getenv("HF_TOKEN"),
        "GROQ_API_KEY": os.getenv("GROQ_API_KEY"),
        "KIMI_API_KEY": os.getenv("KIMI_API_KEY"),
        "E2B_API_KEY": os.getenv("E2B_API_KEY"),
        "FIRECRAWL_API_KEY": os.getenv("FIRECRAWL_API_KEY")
    }
    
    configured_keys = []
    missing_keys = []
    
    for key_name, key_value in api_keys.items():
        if key_value:
            configured_keys.append(key_name)
            # Show partial key for security
            masked_key = f"{key_value[:8]}...{key_value[-4:]}" if len(key_value) > 12 else "***"
            print(f"   ✅ {key_name}: {masked_key}")
        else:
            missing_keys.append(key_name)
            print(f"   ❌ {key_name}: Not configured")
    
    if not configured_keys:
        print("\n❌ No API keys configured! Please check your .env file.")
        return
    
    # Test AI models
    print("\n🤖 Testing AI Models...")
    test_results = {}
    
    # Test MiniMax
    if api_keys["HF_TOKEN"]:
        test_results["MiniMax"] = await test_api_key(agent, AIModel.MINIMAX, "MiniMax")
    
    # Test Groq
    if api_keys["GROQ_API_KEY"]:
        test_results["Groq"] = await test_api_key(agent, AIModel.GROQ, "Groq")
    
    # Test Kimi
    if api_keys["KIMI_API_KEY"]:
        test_results["Kimi"] = await test_api_key(agent, AIModel.KIMI, "Kimi")
    
    # Summary
    print("\n📊 Test Results Summary")
    print("=" * 30)
    
    working_models = [model for model, result in test_results.items() if result]
    failed_models = [model for model, result in test_results.items() if not result]
    
    if working_models:
        print(f"✅ Working AI models: {', '.join(working_models)}")
    
    if failed_models:
        print(f"❌ Failed AI models: {', '.join(failed_models)}")
    
    if missing_keys:
        print(f"⚠️  Missing API keys: {', '.join(missing_keys)}")
    
    # Recommendations
    print("\n💡 Recommendations:")
    if not working_models:
        print("   - Configure at least one AI API key (MiniMax, Groq, or Kimi)")
        print("   - Check your .env file and ensure API keys are valid")
    elif len(working_models) == 1:
        print("   - Consider configuring additional AI models for better fallback support")
    
    if not api_keys["E2B_API_KEY"]:
        print("   - Configure E2B_API_KEY for sandbox functionality")
    
    if not api_keys["FIRECRAWL_API_KEY"]:
        print("   - Configure FIRECRAWL_API_KEY for website scraping")
    
    print("\n🎯 Ready to start MVP development!" if working_models else "\n❌ Please fix API key issues before starting MVP development!")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        sys.exit(1)
