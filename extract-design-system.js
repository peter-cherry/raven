#!/usr/bin/env node

/**
 * Design System Extractor
 * Scans a Next.js/React/Tailwind app and generates skill reference files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = process.argv[2] || process.cwd();
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'skills', 'landing-page-builder', 'references');

console.log('🔍 Scanning project at:', PROJECT_ROOT);
console.log('📁 Output directory:', OUTPUT_DIR);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ==================== EXTRACT TAILWIND TOKENS ====================
function extractTailwindTokens() {
  console.log('\n📦 Extracting Tailwind tokens...');
  
  const configPaths = [
    path.join(PROJECT_ROOT, 'tailwind.config.ts'),
    path.join(PROJECT_ROOT, 'tailwind.config.js')
  ];
  
  let configContent = '';
  let configPath = '';
  
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      configContent = fs.readFileSync(p, 'utf8');
      configPath = p;
      break;
    }
  }
  
  if (!configContent) {
    console.log('⚠️  No tailwind.config found');
    return { colors: {}, spacing: {}, typography: {} };
  }
  
  console.log('✓ Found config at:', configPath);
  
  // Extract colors
  const colors = {};
  const colorMatch = configContent.match(/colors:\s*{([^}]+)}/s);
  if (colorMatch) {
    const colorBlock = colorMatch[1];
    const colorLines = colorBlock.split('\n');
    colorLines.forEach(line => {
      const match = line.match(/['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (match) {
        colors[match[1]] = match[2];
      }
    });
  }
  
  // Extract spacing
  const spacing = {};
  const spacingMatch = configContent.match(/spacing:\s*{([^}]+)}/s);
  if (spacingMatch) {
    const spacingBlock = spacingMatch[1];
    const spacingLines = spacingBlock.split('\n');
    spacingLines.forEach(line => {
      const match = line.match(/['"]?(\w+)['"]?\s*:\s*['"]([^'"]+)['"]/);
      if (match) {
        spacing[match[1]] = match[2];
      }
    });
  }
  
  return { colors, spacing, typography: {} };
}

// ==================== SCAN COMPONENTS ====================
function scanComponents() {
  console.log('\n🧩 Scanning components...');
  
  const componentsDir = path.join(PROJECT_ROOT, 'components');
  
  if (!fs.existsSync(componentsDir)) {
    console.log('⚠️  No /components directory found');
    return [];
  }
  
  const components = [];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.match(/\.(tsx|jsx)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const relativePath = path.relative(componentsDir, fullPath);
        
        // Detect component type based on name and content
        const fileName = file.toLowerCase();
        let type = 'other';
        
        if (fileName.includes('hero')) type = 'hero';
        else if (fileName.includes('cta') || fileName.includes('button')) type = 'cta';
        else if (fileName.includes('feature') || fileName.includes('card')) type = 'feature';
        else if (fileName.includes('footer')) type = 'footer';
        else if (fileName.includes('testimonial')) type = 'testimonial';
        
        components.push({
          name: file.replace(/\.(tsx|jsx)$/, ''),
          path: relativePath,
          type,
          content: content.substring(0, 500) // First 500 chars as preview
        });
      }
    });
  }
  
  scanDir(componentsDir);
  console.log(`✓ Found ${components.length} components`);
  
  return components;
}

// ==================== ANALYZE LAYOUTS ====================
function analyzeLayouts() {
  console.log('\n📐 Analyzing layouts...');
  
  const patterns = {
    containers: new Set(),
    spacing: new Set(),
    padding: new Set()
  };
  
  // Scan app directory and components for layout patterns
  const dirsToScan = [
    path.join(PROJECT_ROOT, 'app'),
    path.join(PROJECT_ROOT, 'components')
  ];
  
  function scanForPatterns(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanForPatterns(fullPath);
      } else if (file.match(/\.(tsx|jsx)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Find max-w- patterns
        const maxWidthMatches = content.match(/max-w-\[?(\d+(?:px|rem)?)\]?/g);
        if (maxWidthMatches) {
          maxWidthMatches.forEach(m => patterns.containers.add(m));
        }
        
        // Find common spacing (gap, space-y, etc)
        const spacingMatches = content.match(/(?:gap|space-[xy])-\[?(\d+(?:px|rem)?)\]?/g);
        if (spacingMatches) {
          spacingMatches.forEach(m => patterns.spacing.add(m));
        }
        
        // Find padding patterns
        const paddingMatches = content.match(/p[xy]?-\[?(\d+(?:px|rem)?)\]?/g);
        if (paddingMatches) {
          paddingMatches.forEach(m => patterns.padding.add(m));
        }
      }
    });
  }
  
  dirsToScan.forEach(scanForPatterns);
  
  return {
    containers: Array.from(patterns.containers),
    spacing: Array.from(patterns.spacing),
    padding: Array.from(patterns.padding)
  };
}

// ==================== GENERATE MARKDOWN FILES ====================
function generateTokensMarkdown(tokens) {
  let md = '# Design Tokens\n\n';
  md += 'Reference these tokens when building pages.\n\n';
  
  if (Object.keys(tokens.colors).length > 0) {
    md += '## Colors\n\n';
    Object.entries(tokens.colors).forEach(([name, value]) => {
      md += `- **${name}**: \`${value}\`\n`;
    });
    md += '\n';
  }
  
  if (Object.keys(tokens.spacing).length > 0) {
    md += '## Spacing\n\n';
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      md += `- **${name}**: \`${value}\`\n`;
    });
    md += '\n';
  }
  
  md += '## Usage\n\n';
  md += '```tsx\n';
  md += '// Use semantic names from Tailwind config\n';
  md += 'className="bg-primary text-white p-4"\n';
  md += '```\n';
  
  return md;
}

function generateComponentsMarkdown(components) {
  let md = '# Component Patterns\n\n';
  md += 'Common component structures used in the app.\n\n';
  
  const componentsByType = {};
  components.forEach(comp => {
    if (!componentsByType[comp.type]) {
      componentsByType[comp.type] = [];
    }
    componentsByType[comp.type].push(comp);
  });
  
  Object.entries(componentsByType).forEach(([type, comps]) => {
    md += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Components\n\n`;
    
    comps.forEach(comp => {
      md += `### ${comp.name}\n\n`;
      md += `**Location**: \`components/${comp.path}\`\n\n`;
      md += '**Preview**:\n```tsx\n';
      md += comp.content.substring(0, 300) + '...\n';
      md += '```\n\n';
    });
  });
  
  return md;
}

function generateLayoutsMarkdown(layouts) {
  let md = '# Layout Patterns\n\n';
  md += 'Common layout dimensions and spacing patterns.\n\n';
  
  md += '## Container Widths\n\n';
  if (layouts.containers.length > 0) {
    layouts.containers.forEach(container => {
      md += `- \`${container}\`\n`;
    });
  } else {
    md += 'No container patterns detected. Common patterns:\n';
    md += '- `max-w-7xl` (1280px)\n';
    md += '- `max-w-6xl` (1152px)\n';
  }
  md += '\n';
  
  md += '## Section Spacing\n\n';
  if (layouts.spacing.length > 0) {
    layouts.spacing.forEach(spacing => {
      md += `- \`${spacing}\`\n`;
    });
  } else {
    md += 'Recommended:\n';
    md += '- Desktop: `space-y-20` (80px)\n';
    md += '- Mobile: `space-y-10` (40px)\n';
  }
  md += '\n';
  
  md += '## Padding Patterns\n\n';
  if (layouts.padding.length > 0) {
    layouts.padding.forEach(padding => {
      md += `- \`${padding}\`\n`;
    });
  }
  
  return md;
}

// ==================== MAIN ====================
async function main() {
  console.log('\n🚀 Starting design system extraction...\n');
  
  // Extract data
  const tokens = extractTailwindTokens();
  const components = scanComponents();
  const layouts = analyzeLayouts();
  
  // Generate markdown files
  console.log('\n📝 Generating reference files...');
  
  const tokensMarkdown = generateTokensMarkdown(tokens);
  const componentsMarkdown = generateComponentsMarkdown(components);
  const layoutsMarkdown = generateLayoutsMarkdown(layouts);
  
  // Write files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'tokens.md'), tokensMarkdown);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'components.md'), componentsMarkdown);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'layouts.md'), layoutsMarkdown);
  
  console.log('\n✅ Extraction complete!\n');
  console.log('Generated files:');
  console.log(`  - ${path.join(OUTPUT_DIR, 'tokens.md')}`);
  console.log(`  - ${path.join(OUTPUT_DIR, 'components.md')}`);
  console.log(`  - ${path.join(OUTPUT_DIR, 'layouts.md')}`);
  console.log('\nNext steps:');
  console.log('1. Review and edit the generated files');
  console.log('2. Create SKILL.md in the skill folder');
  console.log('3. Package the skill');
}

main().catch(console.error);
