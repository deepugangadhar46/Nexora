"""
Final Verification Test - MVP Builder System
Tests all critical components with detailed output
"""

import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv

load_dotenv()

MINIMAX_KEY = os.getenv("HF_TOKEN")
E2B_KEY = os.getenv("E2B_API_KEY")

print("\n" + "="*70)
print("  NEXORA MVP BUILDER - FINAL VERIFICATION TEST")
print("="*70 + "\n")

async def test_1_minimax():
    """Test MiniMax API"""
    print("[ 1/5 ] Testing MiniMax API Connection...")
    
    if not MINIMAX_KEY:
        print("    ⚠️  No MiniMax API key - SKIPPED")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {MINIMAX_KEY}", "Content-Type": "application/json"}
        payload = {
            "model": "MiniMaxAI/MiniMax-M2",
            "messages": [{"role": "user", "content": "Say 'OK'"}],
            "max_tokens": 10
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.ok:
                    data = await response.json()
                    print(f"    ✅ MiniMax API working - Response: {data['choices'][0]['message']['content']}")
                    return True
                else:
                    print(f"    ❌ MiniMax API failed - Status: {response.status}")
                    return False
    except Exception as e:
        print(f"    ❌ Exception: {str(e)[:50]}")
        return False

async def test_2_backend():
    """Test Backend"""
    print("\n[ 2/5 ] Testing Backend Server...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:8000/health", timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.ok:
                    print("    ✅ Backend server is running")
                    return True
                else:
                    print(f"    ❌ Backend returned status: {response.status}")
                    return False
    except Exception as e:
        print(f"    ❌ Cannot connect to backend: {str(e)[:50]}")
        return False

async def test_3_mvp_agent():
    """Test MVP Agent"""
    print("\n[ 3/5 ] Testing MVP Agent Initialization...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("http://localhost:8000/api/mvp-builder/health") as response:
                if response.ok:
                    data = await response.json()
                    if data.get('agent') == 'initialized':
                        print(f"    ✅ MVP Agent initialized")
                        print(f"    📊 Available models: {data.get('models')}")
                        return True
                    else:
                        print(f"    ❌ Agent not initialized: {data.get('agent')}")
                        return False
                else:
                    print(f"    ❌ Health check failed: {response.status}")
                    return False
    except Exception as e:
        print(f"    ❌ Exception: {str(e)[:50]}")
        return False

async def test_4_streaming():
    """Test Streaming Code Generation"""
    print("\n[ 4/5 ] Testing Streaming Code Generation...")
    print("    🔄 Generating code (this may take 10-20 seconds)...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/api/mvp/stream",
                json={
                    "prompt": "Create a simple React button component",
                    "conversationHistory": []
                },
                timeout=aiohttp.ClientTimeout(total=45)
            ) as response:
                if not response.ok:
                    print(f"    ❌ Request failed: {response.status}")
                    return False
                
                events = {"sandbox": False, "content": False, "files": False, "complete": False}
                file_count = 0
                content_size = 0
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            event_type = data.get('type')
                            
                            if event_type == 'sandbox_url':
                                events['sandbox'] = True
                            elif event_type == 'content':
                                events['content'] = True
                                content_size += len(data.get('content', ''))
                            elif event_type == 'file_operation':
                                events['files'] = True
                                if data.get('status') == 'completed':
                                    file_count += 1
                            elif event_type == 'complete':
                                events['complete'] = True
                                break
                            elif event_type == 'error':
                                print(f"    ❌ Stream error: {data.get('message')}")
                                return False
                        except:
                            pass
                
                success = all(events.values())
                if success:
                    print(f"    ✅ Streaming working perfectly!")
                    print(f"    📦 Sandbox created: {events['sandbox']}")
                    print(f"    📝 Content generated: {content_size} characters")
                    print(f"    📄 Files created: {file_count}")
                    print(f"    ✓ Stream completed: {events['complete']}")
                    return True
                else:
                    print(f"    ⚠️  Partial success - Events: {events}")
                    return False
                    
    except asyncio.TimeoutError:
        print("    ❌ Timeout after 45 seconds")
        return False
    except Exception as e:
        print(f"    ❌ Exception: {str(e)[:50]}")
        return False

async def test_5_chat():
    """Test Chat Endpoint"""
    print("\n[ 5/5 ] Testing Chat Endpoint...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/api/chat",
                json={"message": "Hello"},
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.ok:
                    data = await response.json()
                    print(f"    ✅ Chat endpoint working")
                    print(f"    💬 Intent detection: {data.get('intent')}")
                    return True
                else:
                    print(f"    ❌ Chat failed: {response.status}")
                    return False
    except Exception as e:
        print(f"    ❌ Exception: {str(e)[:50]}")
        return False

async def main():
    results = []
    
    results.append(await test_1_minimax())
    results.append(await test_2_backend())
    results.append(await test_3_mvp_agent())
    results.append(await test_4_streaming())
    results.append(await test_5_chat())
    
    # Summary
    print("\n" + "="*70)
    print("  TEST RESULTS SUMMARY")
    print("="*70)
    
    passed = sum(results)
    total = len(results)
    
    tests = [
        "MiniMax API",
        "Backend Server",
        "MVP Agent",
        "Streaming Generation",
        "Chat Endpoint"
    ]
    
    for i, (test, result) in enumerate(zip(tests, results), 1):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  [{i}] {test:.<50} {status}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  🎉 ALL SYSTEMS GO! MVP Builder is fully operational.")
        print("  ✓ MiniMax AI integration working")
        print("  ✓ Streaming code generation working")
        print("  ✓ Live preview ready (E2B sandbox)")
        print("  ✓ Chat interface functional")
        print("\n  👉 Ready to test in browser at: http://localhost:3000/mvp-development")
    elif passed >= 3:
        print("\n  ⚠️  MOSTLY WORKING - Core features operational")
        print("  ✓ Main functionality is ready for testing")
    else:
        print("\n  ❌ CRITICAL ISSUES - Please check configuration")
        print("  • Verify API keys in .env file")
        print("  • Ensure backend is running")
    
    print("\n" + "="*70 + "\n")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user\n")
        exit(1)
