import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Github, Copy, Check, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils/exportProject';
import { motion } from 'framer-motion';

interface GitHubTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectDescription: string;
  techStack: string[];
  files: Array<{ path: string; content: string }>;
}

const GitHubTemplateModal: React.FC<GitHubTemplateModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectDescription,
  techStack,
  files,
}) => {
  const [repoName, setRepoName] = useState(
    projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  );
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (content: string, label: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  // Generate GitHub CLI commands
  const githubCommands = `# Create new repository
gh repo create ${repoName} --public --description "${projectDescription}"

# Initialize git and push
git init
git add .
git commit -m "Initial commit: ${projectName}"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/${repoName}.git
git push -u origin main`;

  // Generate manual setup instructions
  const manualInstructions = `1. Go to https://github.com/new
2. Repository name: ${repoName}
3. Description: ${projectDescription}
4. Choose Public or Private
5. Click "Create repository"

Then run these commands in your project folder:
git init
git add .
git commit -m "Initial commit: ${projectName}"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/${repoName}.git
git push -u origin main`;

  // Generate README template
  const readmeTemplate = `# ${projectName}

${projectDescription}

## 🚀 Tech Stack

${techStack.map(tech => `- ${tech}`).join('\n')}

## 📦 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/${repoName}.git
cd ${repoName}

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## 🛠️ Build

\`\`\`bash
npm run build
\`\`\`

## 📁 Project Structure

\`\`\`
${files.map(f => f.path).join('\n')}
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

---

Generated with [NEXORA](https://nexora.app) - AI-Powered MVP Generator 🚀
`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Github className="w-5 h-5" />
            <span>Create GitHub Repository</span>
          </DialogTitle>
          <DialogDescription>
            Set up your project on GitHub with these templates and commands
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Repository Name */}
          <div className="space-y-2">
            <Label htmlFor="repo-name">Repository Name</Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-awesome-project"
            />
          </div>

          {/* GitHub CLI Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>GitHub CLI Commands (Recommended)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(githubCommands, 'cli')}
              >
                {copied === 'cli' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={githubCommands}
              readOnly
              className="font-mono text-sm h-40"
            />
            <p className="text-xs text-gray-500">
              Install GitHub CLI:{' '}
              <a
                href="https://cli.github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline inline-flex items-center"
              >
                cli.github.com
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
          </div>

          {/* Manual Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Manual Setup Instructions</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(manualInstructions, 'manual')}
              >
                {copied === 'manual' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={manualInstructions}
              readOnly
              className="font-mono text-sm h-48"
            />
          </div>

          {/* README Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>README.md Template</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(readmeTemplate, 'readme')}
              >
                {copied === 'readme' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={readmeTemplate}
              readOnly
              className="font-mono text-sm h-64"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-gray-500">
              💡 Tip: Copy the commands and run them in your terminal
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  window.open('https://github.com/new', '_blank');
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Github className="w-4 h-4 mr-2" />
                Create on GitHub
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubTemplateModal;
