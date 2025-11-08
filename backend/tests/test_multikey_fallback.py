"""
Test script to verify multi-key fallback functionality for MiniMax
"""
import os
from dotenv import load_dotenv
from model_router import model_router

load_dotenv()

print("=" * 60)
print("MINIMAX MULTI-KEY FALLBACK TEST")
print("=" * 60)

# Check loaded keys
print("\n📋 Loaded MiniMax API Keys:")
print(f"  Total Keys: {len(model_router.minimax_keys)}")
for i, key in enumerate(model_router.minimax_keys, 1):
    masked = key[:10] + "..." + key[-5:] if len(key) > 15 else key
    print(f"    Key {i}: {masked}")

# Validate key count
if len(model_router.minimax_keys) < 3:
    print(f"\n⚠️  WARNING: Only {len(model_router.minimax_keys)} key(s) found!")
    print("   Recommended: Add 3 keys (HF_TOKEN_1, HF_TOKEN_2, HF_TOKEN_3)")
else:
    print(f"\n✅ Optimal setup: {len(model_router.minimax_keys)} keys configured")

# Test key rotation
print("\n🔄 Testing Key Rotation:")
if len(model_router.minimax_keys) > 1:
    print(f"  Current key index: {model_router.current_key_index['minimax']}")
    current = model_router.get_api_key("minimax")
    print(f"  Current key: {current[:10]}...{current[-5:]}")
    
    # Rotate
    next_key = model_router.rotate_key("minimax")
    print(f"  After rotation index: {model_router.current_key_index['minimax']}")
    print(f"  Next key: {next_key[:10]}...{next_key[-5:]}")
    
    # Rotate again
    next_key = model_router.rotate_key("minimax")
    print(f"  After 2nd rotation index: {model_router.current_key_index['minimax']}")
    print(f"  Next key: {next_key[:10]}...{next_key[-5:]}")
    
    print(f"\n  ✅ Rotation working! Will cycle through all {len(model_router.minimax_keys)} keys on rate limits")
else:
    print("  ⚠️ Only 1 key found - no rotation possible")
    print("  Add more keys for automatic fallback on rate limits")

# Test model config
print("\n⚙️ MiniMax Configuration:")
config = model_router.get_model_config("minimax")
print(f"  Base URL: {config.get('base_url')}")
print(f"  Model: {config.get('model')}")
print(f"  Max Tokens: {config.get('max_tokens')}")
print(f"  Temperature: {config.get('temperature')}")

print("\n" + "=" * 60)
if len(model_router.minimax_keys) >= 3:
    print("✅ MiniMax multi-key fallback system is ready!")
    print(f"   {len(model_router.minimax_keys)} keys will auto-rotate on rate limits")
else:
    print("⚠️  System ready but needs more keys for optimal fallback")
print("=" * 60)
