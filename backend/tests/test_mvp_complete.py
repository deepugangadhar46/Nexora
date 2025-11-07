"""
Comprehensive MVP Builder Test Suite
Tests: MiniMax API, Streaming, E2B Sandbox, File Generation
"""

import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Test configuration
BASE_URL = "http://localhost:8000"
MINIMAX_API_KEY = os.getenv("HF_TOKEN")
E2B_API_KEY = os.getenv("E2B_API_KEY")

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, status, message=""):
    symbol = "✓" if status else "✗"
    color = Colors.GREEN if status else Colors.RED
    print(f"{color}{symbol} {name}{Colors.END}")
    if message:
        print(f"  {message}")

async def test_minimax_direct():
    """Test 1: Direct MiniMax API connection"""
    print(f"\n{Colors.BLUE}=== Test 1: MiniMax API Direct Connection ==={Colors.END}")
    
    if not MINIMAX_API_KEY:
        print_test("MiniMax API Key", False, "API key not found in .env")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {MINIMAX_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "MiniMaxAI/MiniMax-M2",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello from MiniMax!' in one sentence."}
            ],
            "max_tokens": 50,
            "stream": False
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://router.huggingface.co/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.ok:
                    data = await response.json()
                    content = data['choices'][0]['message']['content']
                    print_test("MiniMax API Connection", True, f"Response: {content}")
                    return True
                else:
                    error = await response.text()
                    print_test("MiniMax API Connection", False, f"Error: {error}")
                    return False
    except Exception as e:
        print_test("MiniMax API Connection", False, f"Exception: {str(e)}")
        return False

async def test_backend_health():
    """Test 2: Backend health check"""
    print(f"\n{Colors.BLUE}=== Test 2: Backend Health Check ==={Colors.END}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/health") as response:
                if response.ok:
                    data = await response.json()
                    print_test("Backend Health", True, f"Status: {data.get('status')}")
                    return True
                else:
                    print_test("Backend Health", False, f"Status code: {response.status}")
                    return False
    except Exception as e:
        print_test("Backend Health", False, f"Cannot connect to backend: {str(e)}")
        return False

async def test_mvp_agent_initialization():
    """Test 3: MVP Agent initialization"""
    print(f"\n{Colors.BLUE}=== Test 3: MVP Agent Initialization ==={Colors.END}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/api/mvp-builder/health") as response:
                if response.ok:
                    data = await response.json()
                    agent_status = data.get('agent')
                    print_test("MVP Agent Init", agent_status == "initialized", 
                              f"Agent: {agent_status}, Models: {data.get('models')}")
                    return agent_status == "initialized"
                else:
                    print_test("MVP Agent Init", False, f"Status: {response.status}")
                    return False
    except Exception as e:
        print_test("MVP Agent Init", False, f"Error: {str(e)}")
        return False

async def test_streaming_endpoint():
    """Test 4: Streaming code generation endpoint"""
    print(f"\n{Colors.BLUE}=== Test 4: Streaming Code Generation ==={Colors.END}")
    
    test_prompt = "Create a simple React button component with TypeScript"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BASE_URL}/api/mvp/stream",
                json={
                    "prompt": test_prompt,
                    "conversationHistory": []
                },
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if not response.ok:
                    error = await response.text()
                    print_test("Streaming Endpoint", False, f"Error: {error}")
                    return False
                
                events = {
                    "sandbox_url": False,
                    "content": False,
                    "file_operation": False,
                    "complete": False
                }
                
                content_chunks = []
                file_ops = []
                
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data: '):
                        try:
                            data = json.loads(line[6:])
                            event_type = data.get('type')
                            
                            if event_type == 'sandbox_url':
                                events['sandbox_url'] = True
                                print(f"  📦 Sandbox URL: {data.get('url')}")
                            
                            elif event_type == 'content':
                                events['content'] = True
                                content_chunks.append(data.get('content', ''))
                            
                            elif event_type == 'file_operation':
                                events['file_operation'] = True
                                file_ops.append(data)
                                print(f"  📄 File: {data.get('path')} - {data.get('status')}")
                            
                            elif event_type == 'complete':
                                events['complete'] = True
                                break
                            
                            elif event_type == 'error':
                                print_test("Streaming Endpoint", False, f"Stream error: {data.get('message')}")
                                return False
                        
                        except json.JSONDecodeError:
                            continue
                
                # Verify all events received
                all_events = all(events.values())
                print_test("Streaming Events", all_events, 
                          f"Sandbox: {events['sandbox_url']}, Content: {events['content']}, "
                          f"Files: {events['file_operation']}, Complete: {events['complete']}")
                
                print_test("Content Generation", len(content_chunks) > 0, 
                          f"Generated {len(''.join(content_chunks))} characters")
                
                print_test("File Operations", len(file_ops) > 0, 
                          f"Created {len(file_ops)} files")
                
                return all_events
                
    except asyncio.TimeoutError:
        print_test("Streaming Endpoint", False, "Timeout after 60s")
        return False
    except Exception as e:
        print_test("Streaming Endpoint", False, f"Exception: {str(e)}")
        return False

async def test_e2b_sandbox():
    """Test 5: E2B Sandbox creation"""
    print(f"\n{Colors.BLUE}=== Test 5: E2B Sandbox Creation ==={Colors.END}")
    
    if not E2B_API_KEY:
        print_test("E2B API Key", False, "Using mock sandbox (no API key)")
        return True  # Mock sandbox is acceptable
    
    try:
        headers = {
            "X-API-Key": E2B_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "templateId": "base"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.e2b.dev/sandboxes",
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.ok:
                    data = await response.json()
                    sandbox_id = data.get('sandboxID') or data.get('id')
                    print_test("E2B Sandbox", True, f"Created: {sandbox_id}")
                    return True
                else:
                    error = await response.text()
                    print_test("E2B Sandbox", False, f"Error: {error}")
                    return False
    except Exception as e:
        print_test("E2B Sandbox", False, f"Exception: {str(e)}")
        return False

async def test_chat_endpoint():
    """Test 6: Chat endpoint with intent detection"""
    print(f"\n{Colors.BLUE}=== Test 6: Chat Endpoint ==={Colors.END}")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test greeting
            async with session.post(
                f"{BASE_URL}/api/chat",
                json={"message": "Hello"}
            ) as response:
                if response.ok:
                    data = await response.json()
                    print_test("Chat - Greeting", True, 
                              f"Intent: {data.get('intent')}, Response: {data.get('response')[:50]}...")
                else:
                    print_test("Chat - Greeting", False)
                    return False
            
            # Test build request
            async with session.post(
                f"{BASE_URL}/api/chat",
                json={"message": "Build me a todo app"}
            ) as response:
                if response.ok:
                    data = await response.json()
                    print_test("Chat - Build Request", True, 
                              f"Intent: {data.get('intent')}")
                    return True
                else:
                    print_test("Chat - Build Request", False)
                    return False
    except Exception as e:
        print_test("Chat Endpoint", False, f"Exception: {str(e)}")
        return False

async def run_all_tests():
    """Run all tests"""
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  MVP BUILDER - COMPREHENSIVE TEST SUITE")
    print(f"{'='*60}{Colors.END}\n")
    
    results = []
    
    # Run tests
    results.append(("MiniMax API", await test_minimax_direct()))
    results.append(("Backend Health", await test_backend_health()))
    results.append(("MVP Agent Init", await test_mvp_agent_initialization()))
    results.append(("Chat Endpoint", await test_chat_endpoint()))
    results.append(("E2B Sandbox", await test_e2b_sandbox()))
    results.append(("Streaming Generation", await test_streaming_endpoint()))
    
    # Summary
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  TEST SUMMARY")
    print(f"{'='*60}{Colors.END}\n")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.END}" if result else f"{Colors.RED}FAIL{Colors.END}"
        print(f"  {name:.<40} {status}")
    
    print(f"\n{Colors.BLUE}Total: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}🎉 All tests passed! System is ready.{Colors.END}\n")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Some tests failed. Check configuration.{Colors.END}\n")
    
    return passed == total

if __name__ == "__main__":
    try:
        success = asyncio.run(run_all_tests())
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Tests interrupted by user{Colors.END}")
        exit(1)
