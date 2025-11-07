import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, Github, FileArchive, ChevronDown } from 'lucide-react';
import { exportToZip } from '@/lib/utils/exportProject';
import GitHubTemplateModal from './GitHubTemplateModal';
import { triggerSuccessConfetti } from '@/lib/utils/confetti';
import { analytics } from '@/lib/analytics/plausible';
import { toast } from 'sonner';

interface ExportProjectButtonProps {
  projectName: string;
  projectDescription?: string;
  techStack: string[];
  files: Array<{ path: string; content: string; preview?: string }>;
  className?: string;
}

const ExportProjectButton: React.FC<ExportProjectButtonProps> = ({
  projectName,
  projectDescription = '',
  techStack,
  files,
  className,
}) => {
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const projectFiles = files.map(f => ({
        path: f.path,
        content: f.preview || f.content,
      }));

      await exportToZip({
        projectName,
        files: projectFiles,
        includeReadme: true,
        includePackageJson: true,
        techStack,
      });

      // Track export
      analytics.trackExportProject('zip');
      
      // Show success
      toast.success('Project exported successfully!');
      triggerSuccessConfetti();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export project');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGitHubTemplate = () => {
    setIsGitHubModalOpen(true);
    analytics.trackExportProject('github');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={className}
            disabled={isExporting || files.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Project
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleExportZip} disabled={isExporting}>
            <FileArchive className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>Download as ZIP</span>
              <span className="text-xs text-gray-500">
                All files + README
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleGitHubTemplate}>
            <Github className="w-4 h-4 mr-2" />
            <div className="flex flex-col">
              <span>GitHub Template</span>
              <span className="text-xs text-gray-500">
                Setup commands & README
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* GitHub Template Modal */}
      <GitHubTemplateModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        projectName={projectName}
        projectDescription={projectDescription}
        techStack={techStack}
        files={files.map(f => ({
          path: f.path,
          content: f.preview || f.content,
        }))}
      />
    </>
  );
};

export default ExportProjectButton;
