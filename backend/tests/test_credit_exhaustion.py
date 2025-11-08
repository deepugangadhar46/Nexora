"""
Test script to verify credit exhaustion handling and key rotation
"""
import asyncio
import logging
from mvp_builder_agent import MVPBuilderAgent, AIModel

# Configure logging to see detailed output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def test_credit_exhaustion_handling():
    """Test that the system properly handles credit exhaustion and rotates keys"""
    
    print("=" * 70)
    print("CREDIT EXHAUSTION & KEY ROTATION TEST")
    print("=" * 70)
    
    agent = MVPBuilderAgent()
    
    print(f"\n📋 Available MiniMax Keys: {len(agent.minimax_keys)}")
    for i, key in enumerate(agent.minimax_keys, 1):
        masked = key[:10] + "..." + key[-5:] if len(key) > 15 else key
        print(f"  Key {i}: {masked}")
    
    if len(agent.minimax_keys) < 2:
        print("\n⚠️  WARNING: Only 1 key found. Add more keys to test rotation:")
        print("   Set HF_TOKEN_1, HF_TOKEN_2, HF_TOKEN_3, etc. in .env file")
        print("\nTest will proceed but key rotation cannot be demonstrated.")
    
    # Test with a simple prompt
    test_prompt = "Write a simple hello world function in Python"
    
    print(f"\n🧪 Testing AI request with prompt: '{test_prompt}'")
    print(f"   Expected behavior:")
    print(f"   1. Try Key 1 -> If credit exhausted, rotate to Key 2")
    print(f"   2. Try Key 2 -> If credit exhausted, rotate to Key 3")
    print(f"   3. Continue until a key works or all keys exhausted")
    print(f"\n{'─' * 70}")
    
    try:
        response_chunks = []
        async for chunk in agent.get_ai_response(
            prompt=test_prompt,
            model=AIModel.MINIMAX,
            stream=True
        ):
            response_chunks.append(chunk)
            # Print first few chunks to show it's working
            if len(response_chunks) <= 3:
                print(f"✅ Received chunk {len(response_chunks)}: {chunk[:50]}...")
        
        full_response = "".join(response_chunks)
        print(f"\n✅ SUCCESS! Received complete response ({len(full_response)} chars)")
        print(f"\n📝 Response preview:")
        print(f"{full_response[:200]}...")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ ERROR: {error_msg}")
        
        if "All" in error_msg and "keys failed or exhausted" in error_msg:
            print(f"\n⚠️  All {len(agent.minimax_keys)} MiniMax keys are exhausted.")
            print(f"   This means:")
            print(f"   1. ✅ Key rotation IS working (tried all keys)")
            print(f"   2. ❌ All keys have exceeded their credit limits")
            print(f"\n💡 Solutions:")
            print(f"   • Wait for credits to reset (monthly)")
            print(f"   • Add more HF_TOKEN keys with available credits")
            print(f"   • Subscribe to Hugging Face PRO for more credits")
        else:
            print(f"\n⚠️  Unexpected error occurred")
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_credit_exhaustion_handling())
