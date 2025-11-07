import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProjectFile {
  path: string;
  content: string;
}

interface ExportOptions {
  projectName: string;
  files: ProjectFile[];
  includeReadme?: boolean;
  includePackageJson?: boolean;
  techStack?: string[];
}

/**
 * Export project files as a ZIP archive
 */
export const exportToZip = async (options: ExportOptions): Promise<void> => {
  const {
    projectName,
    files,
    includeReadme = true,
    includePackageJson = true,
    techStack = [],
  } = options;

  const zip = new JSZip();
  const folderName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

  // Add all project files
  files.forEach(file => {
    zip.file(file.path, file.content);
  });

  // Add README.md
  if (includeReadme) {
    const readme = generateReadme(projectName, techStack);
    zip.file('README.md', readme);
  }

  // Add package.json for web projects
  if (includePackageJson && techStack.some(tech => 
    ['React', 'Vue', 'Next.js', 'Vite'].includes(tech)
  )) {
    const packageJson = generatePackageJson(projectName, techStack);
    zip.file('package.json', packageJson);
  }

  // Add .gitignore
  const gitignore = generateGitignore(techStack);
  zip.file('.gitignore', gitignore);

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}.zip`);
};

/**
 * Generate README.md content
 */
const generateReadme = (projectName: string, techStack: string[]): string => {
  return `# ${projectName}

Generated with ❤️ by NEXORA

## 🚀 Tech Stack

${techStack.map(tech => `- ${tech}`).join('\n')}

## 📦 Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

## 🛠️ Build

\`\`\`bash
# Build for production
npm run build
\`\`\`

## 📝 Features

- Modern and responsive design
- Production-ready code
- Best practices implemented
- Optimized performance

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

MIT License

---

Built with [NEXORA](https://nexora.app) - AI-Powered MVP Generator
`;
};

/**
 * Generate package.json content
 */
const generatePackageJson = (projectName: string, techStack: string[]): string => {
  const name = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  const dependencies: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  };

  const devDependencies: Record<string, string> = {
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    '@vitejs/plugin-react': '^4.3.0',
    typescript: '^5.5.0',
    vite: '^5.4.0',
  };

  if (techStack.includes('Tailwind CSS')) {
    dependencies['tailwindcss'] = '^3.4.0';
    devDependencies['autoprefixer'] = '^10.4.0';
    devDependencies['postcss'] = '^8.4.0';
  }

  const packageJson = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'eslint .',
    },
    dependencies,
    devDependencies,
  };

  return JSON.stringify(packageJson, null, 2);
};

/**
 * Generate .gitignore content
 */
const generateGitignore = (techStack: string[]): string => {
  const common = `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Cache
.cache/
.parcel-cache/
.next/
.nuxt/
`;

  return common;
};

/**
 * Download a single file
 */
export const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
};

/**
 * Copy content to clipboard
 */
export const copyToClipboard = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
