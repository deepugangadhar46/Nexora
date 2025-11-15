"""
Branding Agent for Logo Creation
===============================

This agent creates logos using Stable Diffusion 3.5 Large model via Hugging Face API.
Features:
- Logo generation based on user idea and company name
- Customizable logo generation with user input
- Uses HF_TOKEN_5 from environment variables
"""

import os
import logging
import base64
import io
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime
import aiohttp
import asyncio
from PIL import Image
import json

logger = logging.getLogger(__name__)

@dataclass
class LogoRequest:
    """Logo generation request"""
    company_name: str
    idea: str
    style: str = "modern"
    colors: str = "professional"
    shape: str = "square"  # New field for shape
    custom_prompt: Optional[str] = None

@dataclass
class LogoResponse:
    """Logo generation response"""
    logo_id: str
    company_name: str
    prompt_used: str
    image_base64: str
    created_at: str
    style: str = "modern"
    colors: str = "professional"
    shape: str = "square"  # Add shape field
    image_url: Optional[str] = None

class BrandingAgent:
    """
    Branding Agent for logo creation using Stable Diffusion 3.5 Large
    """
    
    def __init__(self):
        """Initialize the Branding Agent"""
        # Use Stable Diffusion XL from Hugging Face (using new router endpoint)
        self.model_name = "stabilityai/stable-diffusion-xl-base-1.0"
        self.hf_token = self._get_hf_token()
        # Use the new router endpoint instead of the deprecated api-inference endpoint
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{self.model_name}"
        
        if not self.hf_token:
            raise ValueError("HF_TOKEN_5 not found in environment variables")
        
        logger.info(f"🎨 Branding Agent initialized with Stable Diffusion XL")
        logger.info(f"   Model: {self.model_name}")
        logger.info(f"   API URL: {self.api_url}")
        logger.info(f"   Using HF Token: {self.hf_token[:15]}...")
    
    def _get_hf_token(self) -> Optional[str]:
        """Get HF_TOKEN_5 from environment variables"""
        return os.getenv('HF_TOKEN_5')
    
    def _create_logo_prompt(self, company_name: str, idea: str, style: str = "modern", colors: str = "professional", shape: str = "square") -> str:
        """Create a detailed prompt for logo generation"""
        
        style_prompts = {
            "modern": "clean, minimalist, contemporary, geometric",
            "vintage": "retro, classic, timeless, elegant",
            "playful": "fun, colorful, creative, dynamic", 
            "corporate": "professional, formal, business, authoritative",
            "tech": "futuristic, digital, innovative, technological",
            "artistic": "creative, abstract, artistic, expressive"
        }
        
        color_prompts = {
            "professional": "blue and gray color scheme, corporate colors",
            "vibrant": "bright, bold, colorful palette, eye-catching",
            "monochrome": "black and white design, high contrast",
            "warm": "warm colors like red, orange, yellow, energetic",
            "cool": "cool colors like blue, green, purple, calming",
            "earth": "natural earth tones, brown, green, beige"
        }
        
        shape_prompts = {
            "square": "square or rectangular format",
            "rectangle": "rectangular horizontal format",
            "circle": "circular or round format",
            "horizontal": "wide horizontal format",
            "vertical": "tall vertical format",
            "abstract": "abstract geometric shapes"
        }
        
        style_desc = style_prompts.get(style, "modern, clean design")
        color_desc = color_prompts.get(colors, "professional color scheme")
        shape_desc = shape_prompts.get(shape, "square format")
        
        # Create a more detailed and professional prompt
        prompt = f"""A professional, high-quality logo design for {company_name}. 
Business focus: {idea}. 
Style: {style_desc}. 
Colors: {color_desc}. 
Format: {shape_desc}.
Design characteristics: vector art, flat design, clean lines, memorable, scalable, brandable, no text, no watermark, white background, professional quality, startup-ready, modern aesthetic"""
        
        return prompt.strip()
    
    async def generate_logo(self, request: LogoRequest) -> LogoResponse:
        """Generate a logo using Stable Diffusion XL from Hugging Face"""
        try:
            # Create prompt
            if request.custom_prompt:
                prompt = f"""Professional logo design for {request.company_name}. 
User requirements: {request.custom_prompt}. 
Design characteristics: vector art, flat design, clean lines, memorable, scalable, brandable, no text unless specified, no watermark, white background, professional quality, high-resolution, startup-ready"""
            else:
                prompt = self._create_logo_prompt(
                    request.company_name, 
                    request.idea, 
                    request.style, 
                    request.colors,
                    request.shape
                )
            
            logger.info(f"🎨 Generating logo for {request.company_name}")
            logger.info(f"📝 Prompt: {prompt[:80]}...")
            logger.info(f"🔗 API URL: {self.api_url}")
            
            # Call Hugging Face API with proper headers
            headers = {
                "Authorization": f"Bearer {self.hf_token}",
                "Content-Type": "application/json",
                "User-Agent": "Nexora-Branding-Agent/1.0"
            }
            
            # Payload for Stable Diffusion XL
            payload = {
                "inputs": prompt,
                "parameters": {
                    "negative_prompt": "blurry, low quality, distorted, text, watermark, signature, ugly, deformed, bad quality, worst quality, pixelated",
                    "num_inference_steps": 30,
                    "guidance_scale": 8.0,
                    "height": 1024,
                    "width": 1024
                },
                "options": {
                    "wait_for_model": True,
                    "use_cache": False
                }
            }
            
            logger.info(f"📤 Sending request to HF API...")
            logger.info(f"📤 Headers: {headers}")
            logger.info(f"📤 Payload keys: {payload.keys()}")
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=180)) as session:
                async with session.post(self.api_url, headers=headers, json=payload) as response:
                    logger.info(f"📥 HF API Response Status: {response.status}")
                    logger.info(f"📋 Response Headers: {dict(response.headers)}")
                    logger.info(f"📋 Response Content-Type: {response.headers.get('content-type', 'unknown')}")
                    
                    if response.status == 200:
                        # Try to read as image first
                        content_type = response.headers.get('content-type', '')
                        logger.info(f"📦 Content-Type: {content_type}")
                        
                        image_bytes = await response.read()
                        logger.info(f"📊 Response size: {len(image_bytes)} bytes")
                        
                        if len(image_bytes) < 100:
                            # Likely an error response
                            error_text = image_bytes.decode('utf-8', errors='ignore')
                            logger.error(f"❌ Response too small, likely an error: {error_text}")
                            raise Exception(f"API returned invalid response: {error_text}")
                        
                        # Convert to base64
                        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                        logger.info(f"✅ Successfully encoded image to base64")
                        
                        # Generate unique ID
                        logo_id = f"logo_{int(datetime.now().timestamp())}_{request.company_name.lower().replace(' ', '_')}"
                        
                        return LogoResponse(
                            logo_id=logo_id,
                            company_name=request.company_name,
                            prompt_used=prompt,
                            image_base64=image_base64,
                            created_at=datetime.now().isoformat(),
                            style=request.style,
                            colors=request.colors,
                            shape=request.shape
                        )
                    
                    elif response.status == 503:
                        # Model is loading
                        error_data = await response.json()
                        estimated_time = error_data.get('estimated_time', 60)
                        logger.warning(f"⏳ Model is loading. Estimated time: {estimated_time}s")
                        raise Exception(f"Model is loading. Please wait {estimated_time} seconds and try again.")
                    
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ HF API error: {response.status}")
                        logger.error(f"❌ Error details: {error_text[:500]}")
                        raise Exception(f"HF API failed (Status {response.status}): {error_text[:200]}")
        
        except asyncio.TimeoutError:
            logger.error(f"❌ Request timeout after 180 seconds")
            raise Exception("Request timeout - the model took too long to respond")
        
        except Exception as e:
            logger.error(f"❌ Error generating logo: {str(e)}", exc_info=True)
            raise
    
    async def generate_custom_logo(self, company_name: str, custom_prompt: str) -> LogoResponse:
        """Generate a logo with custom user prompt"""
        request = LogoRequest(
            company_name=company_name,
            idea="custom",
            custom_prompt=custom_prompt
        )
        return await self.generate_logo(request)
    
    async def _generate_demo_logo(self, request: LogoRequest) -> LogoResponse:
        """Generate a professional AI-quality logo using advanced PIL techniques"""
        try:
            from PIL import Image, ImageDraw, ImageFont, ImageFilter
            import io
            import random
            import math
            import hashlib
            
            # Set dimensions
            width, height = 1024, 1024
            
            # Professional color palettes
            color_schemes = {
                "professional": {"primary": (37, 99, 235), "secondary": (59, 130, 246), "accent": (30, 64, 175), "bg": (255, 255, 255), "text": (30, 30, 30)},
                "vibrant": {"primary": (239, 68, 68), "secondary": (248, 113, 113), "accent": (220, 38, 38), "bg": (255, 255, 255), "text": (30, 30, 30)},
                "monochrome": {"primary": (0, 0, 0), "secondary": (80, 80, 80), "accent": (200, 200, 200), "bg": (255, 255, 255), "text": (0, 0, 0)},
                "warm": {"primary": (245, 158, 11), "secondary": (251, 191, 36), "accent": (217, 119, 6), "bg": (255, 255, 255), "text": (30, 30, 30)},
                "cool": {"primary": (6, 182, 212), "secondary": (34, 211, 238), "accent": (8, 145, 178), "bg": (255, 255, 255), "text": (30, 30, 30)},
                "earth": {"primary": (132, 204, 22), "secondary": (187, 247, 208), "accent": (101, 163, 13), "bg": (255, 255, 255), "text": (30, 30, 30)}
            }
            
            colors = color_schemes.get(request.colors, color_schemes["professional"])
            
            # Create base image
            image = Image.new('RGB', (width, height), colors['bg'])
            draw = ImageDraw.Draw(image, 'RGBA')
            
            center_x, center_y = width // 2, height // 2
            
            # Use company name to generate consistent but varied designs
            seed = int(hashlib.md5(request.company_name.encode()).hexdigest(), 16) % 100
            random.seed(seed)
            
            # Draw sophisticated logo based on style
            if request.style == "modern":
                # Modern: Minimalist geometric design with gradients
                size = 200
                # Draw main shape with gradient effect
                for i in range(size, 0, -2):
                    alpha = int(255 * (1 - i/size))
                    color = tuple(list(colors['primary'][:3]) + [alpha])
                    draw.ellipse([center_x - i, center_y - i, center_x + i, center_y + i], fill=color)
                
                # Add accent elements
                accent_size = 80
                draw.rectangle([center_x - accent_size, center_y - accent_size, center_x + accent_size, center_y + accent_size],
                             fill=colors['secondary'], outline=colors['accent'], width=3)
                
            elif request.style == "vintage":
                # Vintage: Ornate design with decorative elements
                size = 220
                # Outer ornate circle
                draw.ellipse([center_x - size, center_y - size, center_x + size, center_y + size],
                           outline=colors['primary'], width=6)
                # Inner decorative circle
                draw.ellipse([center_x - size*0.7, center_y - size*0.7, center_x + size*0.7, center_y + size*0.7],
                           outline=colors['accent'], width=3)
                
                # Add decorative elements around the circle
                for angle in range(0, 360, 45):
                    rad = math.radians(angle)
                    x = center_x + size * 0.85 * math.cos(rad)
                    y = center_y + size * 0.85 * math.sin(rad)
                    draw.ellipse([x - 15, y - 15, x + 15, y + 15], fill=colors['primary'])
                
            elif request.style == "playful":
                # Playful: Fun, rounded design with multiple colors
                size = 200
                # Main rounded shape
                draw.rounded_rectangle([center_x - size, center_y - size, center_x + size, center_y + size],
                                      radius=80, fill=colors['primary'], outline=colors['accent'], width=4)
                
                # Add playful elements
                draw.ellipse([center_x - 60, center_y - 60, center_x + 60, center_y + 60],
                           fill=colors['secondary'])
                draw.ellipse([center_x - 40, center_y - 40, center_x + 40, center_y + 40],
                           fill=colors['bg'])
                
            elif request.style == "corporate":
                # Corporate: Professional, structured design
                size = 180
                # Main square with rounded corners
                draw.rounded_rectangle([center_x - size, center_y - size, center_x + size, center_y + size],
                                      radius=40, fill=colors['primary'], outline=colors['accent'], width=5)
                
                # Inner design
                inner_size = 120
                draw.rectangle([center_x - inner_size, center_y - inner_size, center_x + inner_size, center_y + inner_size],
                             fill=colors['bg'], outline=colors['secondary'], width=3)
                
                # Add professional lines
                line_width = 3
                draw.rectangle([center_x - inner_size + 20, center_y - inner_size + 20, 
                              center_x + inner_size - 20, center_y - inner_size + 40],
                             fill=colors['secondary'])
                
            elif request.style == "tech":
                # Tech: Futuristic, angular design
                size = 200
                # Draw hexagon-like shape
                points = []
                for i in range(6):
                    angle = i * 60
                    rad = math.radians(angle)
                    x = center_x + size * math.cos(rad)
                    y = center_y + size * math.sin(rad)
                    points.append((x, y))
                
                draw.polygon(points, fill=colors['primary'], outline=colors['accent'])
                
                # Add inner tech elements
                for i in range(3):
                    angle = i * 120
                    rad = math.radians(angle)
                    x = center_x + 80 * math.cos(rad)
                    y = center_y + 80 * math.sin(rad)
                    draw.ellipse([x - 30, y - 30, x + 30, y + 30], fill=colors['secondary'])
                
            elif request.style == "artistic":
                # Artistic: Abstract, creative design
                size = 200
                # Multiple overlapping shapes
                positions = [
                    (center_x - 80, center_y - 80),
                    (center_x + 80, center_y - 80),
                    (center_x, center_y + 100),
                    (center_x - 100, center_y),
                    (center_x + 100, center_y)
                ]
                
                for i, (x, y) in enumerate(positions):
                    color = colors['primary'] if i % 2 == 0 else colors['secondary']
                    draw.ellipse([x - 70, y - 70, x + 70, y + 70], fill=color, outline=colors['accent'], width=2)
            
            # Add company initial prominently
            if request.company_name:
                initial = request.company_name[0].upper()
                try:
                    font_size = 300
                    font = ImageFont.truetype("arialbd.ttf", font_size)
                except:
                    try:
                        font = ImageFont.truetype("arial.ttf", 300)
                    except:
                        font = ImageFont.load_default()
                
                # Get text size for centering
                bbox = draw.textbbox((0, 0), initial, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
                
                text_x = center_x - text_width // 2
                text_y = center_y - text_height // 2 - 50
                
                # Draw text with contrasting color
                draw.text((text_x, text_y), initial, fill=colors['bg'], font=font)
            
            # Add company name below
            if request.company_name:
                try:
                    name_font = ImageFont.truetype("arial.ttf", 60)
                except:
                    name_font = ImageFont.load_default()
                
                name_bbox = draw.textbbox((0, 0), request.company_name, font=name_font)
                name_width = name_bbox[2] - name_bbox[0]
                name_x = center_x - name_width // 2
                name_y = center_y + 250
                
                draw.text((name_x, name_y), request.company_name, fill=colors['text'], font=name_font)
            
            # Apply slight blur for professional look
            image = image.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='PNG', quality=95)
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # Generate unique ID
            logo_id = f"logo_{int(datetime.now().timestamp())}_{request.company_name.lower().replace(' ', '_')}"
            
            return LogoResponse(
                logo_id=logo_id,
                company_name=request.company_name,
                prompt_used=f"AI-generated professional logo for {request.company_name} - {request.style} style, {request.colors} colors",
                image_base64=image_base64,
                created_at=datetime.now().isoformat(),
                style=request.style,
                colors=request.colors,
                shape=request.shape
            )
            
        except Exception as e:
            logger.error(f"Error generating professional logo: {str(e)}", exc_info=True)
            # If even this fails, create a simple fallback
            try:
                from PIL import Image, ImageDraw, ImageFont
                import io
                
                width, height = 512, 512
                image = Image.new('RGB', (width, height), (255, 255, 255))
                draw = ImageDraw.Draw(image)
                
                # Draw a simple rectangle
                draw.rectangle([50, 50, width-50, height-50], outline=(0, 0, 0), width=3)
                
                # Add company name
                try:
                    font = ImageFont.truetype("arial.ttf", 48)
                except:
                    font = ImageFont.load_default()
                
                text = request.company_name[:15]
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                draw.text(((width - text_width) // 2, height // 2 - 24), text, fill=(0, 0, 0), font=font)
                
                buffer = io.BytesIO()
                image.save(buffer, format='PNG')
                image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                return LogoResponse(
                    logo_id=f"fallback_logo_{int(datetime.now().timestamp())}",
                    company_name=request.company_name,
                    prompt_used=f"Fallback logo for {request.company_name}",
                    image_base64=image_base64,
                    created_at=datetime.now().isoformat(),
                    style=request.style,
                    colors=request.colors,
                    shape=request.shape
                )
            except Exception as fallback_error:
                logger.error(f"Fallback logo generation failed: {str(fallback_error)}")
                raise
    
    def get_style_options(self) -> List[Dict[str, str]]:
        """Get available style options"""
        return [
            {"value": "modern", "label": "Modern", "description": "Clean, minimalist, contemporary"},
            {"value": "vintage", "label": "Vintage", "description": "Retro, classic, timeless"},
            {"value": "playful", "label": "Playful", "description": "Fun, colorful, creative"},
            {"value": "corporate", "label": "Corporate", "description": "Professional, formal, business"},
            {"value": "tech", "label": "Tech", "description": "Futuristic, digital, innovative"},
            {"value": "artistic", "label": "Artistic", "description": "Creative, abstract, artistic"}
        ]
    
    def get_color_options(self) -> List[Dict[str, str]]:
        """Get available color options"""
        return [
            {"value": "professional", "label": "Professional", "description": "Blue and gray tones"},
            {"value": "vibrant", "label": "Vibrant", "description": "Bright, colorful palette"},
            {"value": "monochrome", "label": "Monochrome", "description": "Black and white"},
            {"value": "warm", "label": "Warm", "description": "Red, orange, yellow tones"},
            {"value": "cool", "label": "Cool", "description": "Blue, green, purple tones"},
            {"value": "earth", "label": "Earth", "description": "Natural earth tones"}
        ]
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if the branding agent is healthy"""
        try:
            # Test API connectivity with a simple request
            headers = {
                "Authorization": f"Bearer {self.hf_token}",
                "User-Agent": "Nexora-Branding-Agent/1.0"
            }
            
            # Test with a simple prompt to check model availability
            test_payload = {
                "inputs": "simple logo design test",
                "parameters": {
                    "num_inference_steps": 1,
                    "width": 64,
                    "height": 64
                },
                "options": {
                    "wait_for_model": False,
                    "use_cache": True
                }
            }
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.post(self.api_url, headers=headers, json=test_payload) as response:
                    if response.status == 200:
                        return {
                            "status": "healthy",
                            "model": self.model_name,
                            "token_configured": bool(self.hf_token),
                            "api_accessible": True
                        }
                    elif response.status == 503:
                        # Model is loading
                        return {
                            "status": "loading",
                            "model": self.model_name,
                            "token_configured": bool(self.hf_token),
                            "api_accessible": True,
                            "message": "Model is loading, please wait"
                        }
                    else:
                        error_text = await response.text()
                        return {
                            "status": "unhealthy",
                            "model": self.model_name,
                            "token_configured": bool(self.hf_token),
                            "api_accessible": False,
                            "error": f"API returned {response.status}: {error_text}"
                        }
        except Exception as e:
            return {
                "status": "unhealthy",
                "model": self.model_name,
                "token_configured": bool(self.hf_token),
                "api_accessible": False,
                "error": str(e)
            }
