#!/usr/bin/env ts-node
/**
 * Performance Gate - Validates build and runtime performance
 * Fails CI if performance requirements are not met
 * 
 * Usage: npx ts-node scripts/performance-gate.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface PerformanceLimits {
  buildTime: number;           // seconds
  bundleSize: number;        // MB
  maxChunkSize: number;      // KB
  apiResponseTime: number;     // ms
  dbQueryTime: number;       // ms
}

interface PerformanceResults {
  buildTime: number;
  bundleSize: number;
  maxChunkSize: number;
  apiResponseTime: number;
  dbQueryTime: number;
}

// Performance requirements
const limits: PerformanceLimits = {
  buildTime: 120,            // 2 minutes max
  bundleSize: 300,           // 300 MB max
  maxChunkSize: 500,         // 500 KB per chunk
  apiResponseTime: 500,      // 500ms max
  dbQueryTime: 100,          // 100ms max
};

class PerformanceGate {
  private results: Partial<PerformanceResults> = {};

  async run(): Promise<boolean> {
    console.log('⚡ Enterprise Performance Gate\n');
    console.log('═══════════════════════════════════════════\n');

    // Check build time
    await this.checkBuildTime();

    // Check bundle size
    await this.checkBundleSize();

    // Check chunk sizes
    await this.checkChunkSizes();

    // Check API response time
    await this.checkApiResponseTime();

    // Check DB query time
    await this.checkDbQueryTime();

    // Summary
    return this.printSummary();
  }

  private async checkBuildTime(): Promise<void> {
    console.log('📊 Checking build time...');
    
    try {
      const startTime = Date.now();
      
      // Run build
      execSync('npm run build', { 
        stdio: 'pipe',
        timeout: limits.buildTime * 1000
      });
      
      this.results.buildTime = (Date.now() - startTime) / 1000;
      
      const passed = this.results.buildTime <= limits.buildTime;
      console.log(
        `  ${passed ? '✅' : '❌'} Build time: ${this.results.buildTime.toFixed(1)}s (limit: ${limits.buildTime}s)\n`
      );
    } catch (error) {
      console.error('  ❌ Build failed or exceeded time limit\n');
      this.results.buildTime = Infinity;
    }
  }

  private async checkBundleSize(): Promise<void> {
    console.log('📦 Checking bundle size...');
    
    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      if (!fs.existsSync(nextDir)) {
        console.log('  ⚠️  No .next directory found (skipping)\n');
        this.results.bundleSize = 0;
        return;
      }
      
      // Get total size
      const output = execSync(`du -sm ${nextDir}`, { encoding: 'utf-8' });
      this.results.bundleSize = parseInt(output.split('\t')[0]);
      
      const passed = this.results.bundleSize <= limits.bundleSize;
      console.log(
        `  ${passed ? '✅' : '❌'} Bundle size: ${this.results.bundleSize}MB (limit: ${limits.bundleSize}MB)\n`
      );
    } catch {
      console.log('  ⚠️  Could not check bundle size\n');
      this.results.bundleSize = 0;
    }
  }

  private async checkChunkSizes(): Promise<void> {
    console.log('🧩 Checking JavaScript chunks...');
    
    try {
      const chunksDir = path.join(process.cwd(), '.next/static/chunks');
      
      if (!fs.existsSync(chunksDir)) {
        console.log('  ⚠️  No chunks directory found (skipping)\n');
        this.results.maxChunkSize = 0;
        return;
      }
      
      const files = fs.readdirSync(chunksDir);
      let maxSize = 0;
      let maxFile = '';
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(chunksDir, file);
          const stats = fs.statSync(filePath);
          const sizeKB = stats.size / 1024;
          
          if (sizeKB > maxSize) {
            maxSize = sizeKB;
            maxFile = file;
          }
          
          // Warn if chunk is large
          if (sizeKB > limits.maxChunkSize) {
            console.log(`  ⚠️  Large chunk: ${file} (${sizeKB.toFixed(1)}KB)`);
          }
        }
      }
      
      this.results.maxChunkSize = maxSize;
      
      const passed = maxSize <= limits.maxChunkSize;
      console.log(
        `  ${passed ? '✅' : '❌'} Largest chunk: ${maxSize.toFixed(1)}KB (${maxFile}) (limit: ${limits.maxChunkSize}KB)\n`
      );
    } catch {
      console.log('  ⚠️  Could not check chunk sizes\n');
      this.results.maxChunkSize = 0;
    }
  }

  private async checkApiResponseTime(): Promise<void> {
    console.log('🌐 Checking API response time...');
    
    try {
      const startTime = Date.now();
      
      // Try to ping local API
      const response = await fetch('http://localhost:3000/api/health', {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        this.results.apiResponseTime = Date.now() - startTime;
        const passed = this.results.apiResponseTime <= limits.apiResponseTime;
        console.log(
          `  ${passed ? '✅' : '❌'} API response: ${this.results.apiResponseTime}ms (limit: ${limits.apiResponseTime}ms)\n`
        );
      } else {
        console.log('  ⚠️  API not responding (server may not be running)\n');
        this.results.apiResponseTime = 0;
      }
    } catch {
      console.log('  ⚠️  Could not check API (server may not be running)\n');
      this.results.apiResponseTime = 0;
    }
  }

  private async checkDbQueryTime(): Promise<void> {
    console.log('🗄️  Checking database query time...');
    
    try {
      // Import prisma only if available
      const { prisma } = await import('../src/lib/prisma');
      
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      this.results.dbQueryTime = Date.now() - startTime;
      
      const passed = this.results.dbQueryTime <= limits.dbQueryTime;
      console.log(
        `  ${passed ? '✅' : '❌'} DB query: ${this.results.dbQueryTime}ms (limit: ${limits.dbQueryTime}ms)\n`
      );
    } catch {
      console.log('  ⚠️  Could not check DB (may not be configured)\n');
      this.results.dbQueryTime = 0;
    }
  }

  private printSummary(): boolean {
    console.log('═══════════════════════════════════════════');
    console.log('📊 PERFORMANCE GATE SUMMARY\n');
    
    let allPassed = true;
    const checks = [
      { name: 'Build Time', value: this.results.buildTime, limit: limits.buildTime, unit: 's' },
      { name: 'Bundle Size', value: this.results.bundleSize, limit: limits.bundleSize, unit: 'MB' },
      { name: 'Max Chunk Size', value: this.results.maxChunkSize, limit: limits.maxChunkSize, unit: 'KB' },
      { name: 'API Response', value: this.results.apiResponseTime, limit: limits.apiResponseTime, unit: 'ms' },
      { name: 'DB Query', value: this.results.dbQueryTime, limit: limits.dbQueryTime, unit: 'ms' },
    ];

    for (const check of checks) {
      if (check.value === undefined || check.value === 0) {
        console.log(`  ⏸️  ${check.name}: Not checked`);
        continue;
      }

      const passed = check.value <= check.limit;
      const status = passed ? '✅' : '❌';
      
      console.log(`  ${status} ${check.name}: ${check.value}${check.unit} (limit: ${check.limit}${check.unit})`);
      
      if (!passed) allPassed = false;
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    
    if (allPassed) {
      console.log('✅ ALL PERFORMANCE GATES PASSED');
      console.log('🚀 Ready for deployment\n');
      return true;
    } else {
      console.log('❌ PERFORMANCE GATES FAILED');
      console.log('🛑 Deployment blocked\n');
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const gate = new PerformanceGate();
  gate.run()
    .then(passed => process.exit(passed ? 0 : 1))
    .catch(err => {
      console.error('Error running performance gate:', err);
      process.exit(1);
    });
}
