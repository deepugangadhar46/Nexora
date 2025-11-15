import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Palette, Sparkles, Download, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';

interface LogoResponse {
  logo_id: string;
  company_name: string;
  prompt_used: string;
  image_base64: string;
  created_at: string;
  style: string;
  colors: string;
  shape?: string;  // Add shape property
}

interface StyleOption {
  value: string;
  label: string;
  description: string;
}

interface ColorOption {
  value: string;
  label: string;
  description: string;
}

const Branding: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [businessIdea, setBusinessIdea] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('modern');
  const [selectedColors, setSelectedColors] = useState('professional');
  const [selectedShape, setSelectedShape] = useState('square');  // Add shape state
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<LogoResponse | null>(null);
  const [styleOptions, setStyleOptions] = useState<StyleOption[]>([]);
  const [colorOptions, setColorOption] = useState<ColorOption[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const [styleRes, colorRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/branding/style-options`),
        fetch(`${API_BASE_URL}/api/branding/color-options`)
      ]);

      if (styleRes.ok && colorRes.ok) {
        const styleData = await styleRes.json();
        const colorData = await colorRes.json();
        setStyleOptions(styleData.data);
        setColorOption(colorData.data);
      } else {
        console.error('Failed to load options:', styleRes.status, colorRes.status);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const generateLogo = async () => {
    if (!companyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    if (activeTab === 'basic' && !businessIdea.trim()) {
      toast.error('Please enter your business idea');
      return;
    }

    if (activeTab === 'custom' && !customPrompt.trim()) {
      toast.error('Please enter a custom prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');
      const endpoint = activeTab === 'basic' ? `${API_BASE_URL}/api/branding/generate-logo` : `${API_BASE_URL}/api/branding/generate-custom-logo`;
      
      const requestBody = activeTab === 'basic' 
        ? {
            company_name: companyName,
            idea: businessIdea,
            style: selectedStyle,
            colors: selectedColors,
            shape: selectedShape  // Include shape in request
          }
        : {
            company_name: companyName,
            custom_prompt: customPrompt
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate logo');
      }

      const data = await response.json();
      setGeneratedLogo(data.data);
      toast.success('Logo generated successfully!');
    } catch (error) {
      console.error('Error generating logo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate logo');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = () => {
    if (!generatedLogo) return;

    const link = document.createElement('a');
    link.href = `data:image/png;base64,${generatedLogo.image_base64}`;
    link.download = `${generatedLogo.company_name.replace(/\s+/g, '_')}_logo.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo downloaded!');
  };

  const resetForm = () => {
    setCompanyName('');
    setBusinessIdea('');
    setCustomPrompt('');
    setSelectedStyle('modern');
    setSelectedColors('professional');
    setGeneratedLogo(null);
    setActiveTab('basic');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4"
            >
              <Palette className="w-4 h-4" />
              AI-Powered Logo Generation
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Create Your Perfect Logo
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Generate professional logos using AI. Simply describe your company and let our advanced
              Stable Diffusion model create unique, customizable logos for your brand.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Logo Generation Form */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Logo Generator
                </CardTitle>
                <CardDescription>
                  Create your logo with AI-powered design
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="border-gray-200 focus:border-purple-500"
                  />
                </div>

                {/* Generation Mode Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Mode</TabsTrigger>
                    <TabsTrigger value="custom">Custom Mode</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    {/* Business Idea */}
                    <div className="space-y-2">
                      <Label htmlFor="businessIdea">Business Idea *</Label>
                      <Textarea
                        id="businessIdea"
                        placeholder="Describe your business idea or what your company does..."
                        value={businessIdea}
                        onChange={(e) => setBusinessIdea(e.target.value)}
                        className="border-gray-200 focus:border-purple-500 min-h-[100px]"
                      />
                    </div>

                    {/* Style Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="style">Logo Style</Label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger className="border-gray-200 focus:border-purple-500">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent>
                          {styleOptions.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              <div>
                                <div className="font-medium">{style.label}</div>
                                <div className="text-sm text-gray-500">{style.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="colors">Color Scheme</Label>
                      <Select value={selectedColors} onValueChange={setSelectedColors}>
                        <SelectTrigger className="border-gray-200 focus:border-purple-500">
                          <SelectValue placeholder="Select colors" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div>
                                <div className="font-medium">{color.label}</div>
                                <div className="text-sm text-gray-500">{color.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Shape Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="shape">Logo Shape</Label>
                      <Select value={selectedShape} onValueChange={setSelectedShape}>
                        <SelectTrigger className="border-gray-200 focus:border-purple-500">
                          <SelectValue placeholder="Select shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="rectangle">Rectangle</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                          <SelectItem value="vertical">Vertical</SelectItem>
                          <SelectItem value="abstract">Abstract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="custom" className="space-y-4">
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription>
                        Custom mode allows you to provide specific instructions for your logo design.
                        Be as detailed as possible for better results.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customPrompt">Custom Design Prompt *</Label>
                      <Textarea
                        id="customPrompt"
                        placeholder="Describe exactly how you want your logo to look. Include style, colors, elements, typography, etc..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="border-gray-200 focus:border-purple-500 min-h-[120px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={generateLogo}
                    disabled={isGenerating}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Logo
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated Logo Display */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  Generated Logo
                </CardTitle>
                <CardDescription>
                  Your AI-generated logo will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedLogo ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    {/* Logo Image */}
                    <div className="bg-gray-50 rounded-lg p-8 flex items-center justify-center">
                      <img
                        src={`data:image/png;base64,${generatedLogo.image_base64}`}
                        alt={`Logo for ${generatedLogo.company_name}`}
                        className="max-w-full max-h-64 object-contain"
                      />
                    </div>

                    {/* Logo Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{generatedLogo.company_name}</h3>
                        <p className="text-sm text-gray-500">Generated on {new Date(generatedLogo.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="secondary">{generatedLogo.style}</Badge>
                        <Badge variant="secondary">{generatedLogo.colors}</Badge>
                        {generatedLogo.shape && <Badge variant="secondary">{generatedLogo.shape}</Badge>}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          <strong>Prompt used:</strong> {generatedLogo.prompt_used.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    {/* Download Button */}
                    <Button
                      onClick={downloadLogo}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Logo
                    </Button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Palette className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No logo generated yet</p>
                    <p className="text-sm">Fill in the form and click "Generate Logo" to create your brand identity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI-Powered Design</h3>
              <p className="text-gray-600 text-sm">
                Uses advanced Stable Diffusion 3.5 Large model for professional logo generation
              </p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Customizable</h3>
              <p className="text-gray-600 text-sm">
                Choose from multiple styles and color schemes, or provide custom instructions
              </p>
            </Card>

            <Card className="text-center p-6 border-0 bg-white/60 backdrop-blur-sm">
              <Download className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Instant Download</h3>
              <p className="text-gray-600 text-sm">
                Download your generated logo immediately in high-quality PNG format
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Branding;
