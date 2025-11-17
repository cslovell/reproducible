/**
 * Global setup for Playwright tests
 * Renders all Quarto test files before running tests
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  console.log('\n==========================================');
  console.log('Rendering Quarto Test Files');
  console.log('==========================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const testExamplesDir = path.join(rootDir, 'tests', 'bash', 'examples');
  const outputDir = path.join(rootDir, 'test-outputs');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get all QMD files
  const qmdFiles = fs
    .readdirSync(testExamplesDir)
    .filter((f) => f.endsWith('.qmd'))
    .sort();

  console.log(`Found ${qmdFiles.length} test files to render\n`);

  // Render each file
  let successCount = 0;
  let failCount = 0;

  for (const qmdFile of qmdFiles) {
    const inputPath = path.join(testExamplesDir, qmdFile);
    const outputName = qmdFile.replace('.qmd', '.html');
    const outputPath = path.join(outputDir, outputName);

    try {
      process.stdout.write(`  Rendering ${qmdFile}... `);

      execSync(`quarto render "${inputPath}" --quiet`, {
        cwd: rootDir,
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      // Move generated HTML from test-examples/ to test-outputs/
      const generatedHtml = path.join(testExamplesDir, outputName);
      if (fs.existsSync(generatedHtml)) {
        fs.renameSync(generatedHtml, outputPath);

        // Clean up _files directory if it exists
        const filesDir = path.join(testExamplesDir, outputName.replace('.html', '_files'));
        if (fs.existsSync(filesDir)) {
          fs.rmSync(filesDir, { recursive: true, force: true });
        }
      }

      console.log('✓');
      successCount++;
    } catch (error) {
      console.log('✗');
      console.error(`    Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n==========================================');
  console.log(`Rendered: ${successCount} succeeded, ${failCount} failed`);
  console.log('==========================================\n');

  if (failCount > 0) {
    throw new Error(`Failed to render ${failCount} test file(s)`);
  }
}
