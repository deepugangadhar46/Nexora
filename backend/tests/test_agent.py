"""
Quick test script for MVP_Agent
================================

Run this to verify the MVP Agent is working correctly.
"""

import asyncio
import json
import sys
from MVP_Agent import MVPNexoraAgent


async def test_agent():
    """Test the MVP Agent with a simple request"""
    
    print("=" * 80)
    print("MVP_Agent Test Script")
    print("=" * 80)
    print()
    
    try:
        # Initialize agent
        print("1. Initializing MVP Agent...")
        agent = MVPNexoraAgent()
        print("   ✓ Agent initialized successfully")
        print()
        
        # Test MiniMax connection
        print("2. Testing MiniMax API connection...")
        test_response = await agent.get_ai_response(
            prompt="Say 'Hello from MiniMax!'",
            model=AIModel.MINIMAX,
            system_prompt="You are a helpful assistant.",
            stream=False
        )
        print(f"   ✓ MiniMax response: {test_response[:100] if isinstance(test_response, str) else 'OK'}...")
        print()
        
        # Test simple MVP generation
        print("3. Testing MVP generation (simple example)...")
        print("   This may take 1-2 minutes...")
        
        user_request = """
        Build a simple Hello World web page with:
        - Clean, modern design
        - Centered heading
        - Gradient background
        - Responsive layout
        """
        
        response = await agent.build_mvp(
            user_request=user_request,
            scrape_urls=None,
            user_subscription="free"
        )
        
        print(f"   ✓ MVP generated successfully!")
        print(f"   - Project ID: {response.id}")
        print(f"   - Title: {response.title}")
        print(f"   - Stack: {response.stack.frontend} + {response.stack.backend}")
        print(f"   - Files generated: {len(response.files)}")
        print(f"   - Build status: {response.build.status}")
        print(f"   - Test status: {response.tests.status}")
        print(f"   - Patches applied: {len(response.patches)}")
        print()
        
        # Display files
        print("4. Generated files:")
        for file_info in response.files[:5]:  # Show first 5 files
            print(f"   - {file_info.path} ({file_info.size} bytes)")
        if len(response.files) > 5:
            print(f"   ... and {len(response.files) - 5} more files")
        print()
        
        # Display next steps
        print("5. Next steps:")
        print(response.next_steps)
        print()
        
        # Save response to file
        formatted = agent.format_response(response)
        with open('test_response.json', 'w', encoding='utf-8') as f:
            json.dump(formatted, f, indent=2)
        print("6. Full response saved to: test_response.json")
        print()
        
        print("=" * 80)
        print("✓ All tests passed successfully!")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print()
        print("=" * 80)
        print("✗ Test failed!")
        print("=" * 80)
        print(f"Error: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Check that all API keys are set in .env file:")
        print("   - HF_TOKEN")
        print("   - FIRECRAWL_API_KEY")
        print("   - E2B_API_KEY")
        print("2. Verify your internet connection")
        print("3. Check the backend logs for more details")
        print()
        return False


async def test_api_keys():
    """Test if API keys are configured"""
    
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    print("Checking API keys configuration...")
    print()
    
    keys = {
        "HF_TOKEN": os.getenv("HF_TOKEN"),
        "FIRECRAWL_API_KEY": os.getenv("FIRECRAWL_API_KEY"),
        "E2B_API_KEY": os.getenv("E2B_API_KEY")
    }
    
    all_set = True
    for key_name, key_value in keys.items():
        if key_value:
            print(f"✓ {key_name}: Set ({key_value[:10]}...)")
        else:
            print(f"✗ {key_name}: Not set")
            all_set = False
    
    print()
    return all_set


if __name__ == "__main__":
    print()
    
    # First check API keys
    if not asyncio.run(test_api_keys()):
        print("⚠️  Warning: Some API keys are not configured!")
        print("Please set them in the .env file before running tests.")
        print()
        sys.exit(1)
    
    # Run tests
    success = asyncio.run(test_agent())
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
