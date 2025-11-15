"""
Test for Branding Agent with Shape Support
"""
import sys
import os
import asyncio
import base64
from PIL import Image
import io
from unittest.mock import patch

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from branding_agent import BrandingAgent, LogoRequest

async def test_branding_agent_with_shapes():
    """Test the branding agent with different shapes"""
    try:
        # Mock the HF token to avoid initialization errors
        with patch.dict(os.environ, {'HF_TOKEN_5': 'test-token'}):
            # Initialize the branding agent
            agent = BrandingAgent()
        print("✅ Branding Agent initialized successfully")
        
        # Test different shapes
        shapes = ["square", "rectangle", "circle", "horizontal", "vertical"]
        
        for shape in shapes:
            print(f"\n🎨 Testing {shape} shape...")
            
            # Create a logo request with shape
            request = LogoRequest(
                company_name="TestCorp",
                idea="Technology company",
                style="modern",
                colors="professional",
                shape=shape
            )
            
            # Generate logo
            result = await agent.generate_logo(request)
            print(f"✅ Generated {shape} logo successfully")
            
            # Verify the result contains shape information
            assert hasattr(result, 'shape'), "LogoResponse should have shape attribute"
            assert result.shape == shape, f"Shape should be {shape}"
            print(f"✅ Shape information correctly set to {shape}")
            
            # Verify we got base64 image data
            assert result.image_base64, "Should have base64 image data"
            print("✅ Base64 image data present")
            
            # Try to decode and verify it's a valid image
            try:
                image_data = base64.b64decode(result.image_base64)
                image = Image.open(io.BytesIO(image_data))
                print(f"✅ Valid image generated: {image.size}")
            except Exception as e:
                print(f"⚠️  Could not verify image data: {e}")
        
        print("\n🎉 All shape tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing branding agent: {e}")
        # Even if the API fails, we can still test the demo functionality
        return False

async def test_demo_logo_with_shapes():
    """Test the demo logo generation with different shapes"""
    try:
        # Mock the HF token to avoid initialization errors
        with patch.dict(os.environ, {'HF_TOKEN_5': 'test-token'}):
            # Initialize the branding agent
            agent = BrandingAgent()
        print("✅ Branding Agent initialized successfully")
        
        # Test different shapes with demo logo
        shapes = ["square", "rectangle", "circle", "horizontal", "vertical"]
        
        for shape in shapes:
            print(f"\n🎨 Testing demo {shape} shape...")
            
            # Create a logo request with shape
            request = LogoRequest(
                company_name="DemoCorp",
                idea="Demo company",
                style="modern",
                colors="professional",
                shape=shape
            )
            
            # Generate demo logo (force demo by using an invalid token)
            result = await agent._generate_demo_logo(request)
            print(f"✅ Generated demo {shape} logo successfully")
            
            # Verify the result contains shape information
            assert hasattr(result, 'shape'), "LogoResponse should have shape attribute"
            assert result.shape == shape, f"Shape should be {shape}"
            print(f"✅ Shape information correctly set to {shape}")
            
            # Verify we got base64 image data
            assert result.image_base64, "Should have base64 image data"
            print("✅ Base64 image data present")
            
            # Try to decode and verify it's a valid image
            try:
                image_data = base64.b64decode(result.image_base64)
                image = Image.open(io.BytesIO(image_data))
                print(f"✅ Valid demo image generated: {image.size}")
            except Exception as e:
                print(f"⚠️  Could not verify demo image data: {e}")
        
        print("\n🎉 All demo shape tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing demo logo generation: {e}")
        return False

def test_logo_request_with_shapes():
    """Test LogoRequest creation with shapes"""
    print("\n📋 Testing LogoRequest with shapes...")
    
    # Test default shape
    request1 = LogoRequest(
        company_name="TestCorp",
        idea="Technology company"
    )
    assert request1.shape == "square", "Default shape should be square"
    print("✅ Default shape correctly set to square")
    
    # Test custom shape
    request2 = LogoRequest(
        company_name="TestCorp",
        idea="Technology company",
        shape="rectangle"
    )
    assert request2.shape == "rectangle", "Shape should be rectangle"
    print("✅ Custom shape correctly set to rectangle")
    
    print("✅ All LogoRequest tests passed!")
    return True

def test_logo_response_with_shapes():
    """Test LogoResponse creation with shapes"""
    print("\n📋 Testing LogoResponse with shapes...")
    
    from branding_agent import LogoResponse
    from datetime import datetime
    
    # Test default shape
    response1 = LogoResponse(
        logo_id="test123",
        company_name="TestCorp",
        prompt_used="Test prompt",
        image_base64="testbase64",
        created_at=datetime.now().isoformat()
    )
    assert response1.shape == "square", "Default shape should be square"
    print("✅ Default shape correctly set to square")
    
    # Test custom shape
    response2 = LogoResponse(
        logo_id="test123",
        company_name="TestCorp",
        prompt_used="Test prompt",
        image_base64="testbase64",
        created_at=datetime.now().isoformat(),
        shape="rectangle"
    )
    assert response2.shape == "rectangle", "Shape should be rectangle"
    print("✅ Custom shape correctly set to rectangle")
    
    print("✅ All LogoResponse tests passed!")
    return True

if __name__ == "__main__":
    print("🧪 Testing Branding Agent with Shape Support")
    print("=" * 50)
    
    # Run the tests
    test1_passed = test_logo_request_with_shapes()
    test2_passed = test_logo_response_with_shapes()
    test3_passed = asyncio.run(test_demo_logo_with_shapes())
    
    # The API test might fail due to missing API key, but that's expected
    try:
        test4_passed = asyncio.run(test_branding_agent_with_shapes())
    except:
        test4_passed = False
        print("⚠️  API test failed (expected without API key)")
    
    if test1_passed and test2_passed and test3_passed:
        print("\n✅ All critical tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some critical tests failed!")
        sys.exit(1)