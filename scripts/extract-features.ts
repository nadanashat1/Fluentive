#!/usr/bin/env ts-node
/**
 * Feature Inventory Extractor
 * Scans old backend and extracts all routes, services, and features
 * 
 * Usage: npx ts-node scripts/extract-features.ts [backend-path]
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  middleware: string[];
}

interface ServiceInfo {
  name: string;
  methods: string[];
  file: string;
}

interface FeatureInventory {
  routes: RouteInfo[];
  services: ServiceInfo[];
  middleware: string[];
  models: string[];
  endpoints: Record<string, string[]>;
}

class FeatureExtractor {
  private backendPath: string;
  private inventory: FeatureInventory = {
    routes: [],
    services: [],
    middleware: [],
    models: [],
    endpoints: {}
  };

  constructor(backendPath: string) {
    this.backendPath = backendPath;
  }

  async extract(): Promise<FeatureInventory> {
    console.log('🔍 Extracting features from old backend...\n');
    console.log(`Path: ${this.backendPath}\n`);

    // 1. Extract routes
    await this.extractRoutes();

    // 2. Extract services
    await this.extractServices();

    // 3. Extract middleware
    await this.extractGlobalMiddleware();

    // 4. Extract models
    await this.extractModels();

    // 5. Group endpoints by module
    this.groupEndpoints();

    return this.inventory;
  }

  private async extractRoutes(): Promise<void> {
    console.log('📍 Extracting routes...');
    
    const routesDir = path.join(this.backendPath, 'src/routes');
    if (!fs.existsSync(routesDir)) {
      console.log('  ⚠️  No routes directory found');
      return;
    }

    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
    
    for (const file of routeFiles) {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract route definitions
      const routeMatches = content.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g);
      
      if (routeMatches) {
        const moduleName = file.replace('.ts', '');
        
        for (const match of routeMatches) {
          const parts = match.match(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/);
          if (parts) {
            this.inventory.routes.push({
              method: parts[1].toUpperCase(),
              path: `/api/${moduleName}${parts[2]}`,
              handler: this.extractHandler(content, parts[2]),
              middleware: this.extractRouteMiddleware(content, parts[2])
            });
          }
        }
        
        console.log(`  ✅ ${file}: ${routeMatches.length} routes`);
      }
    }
    
    console.log(`  Total: ${this.inventory.routes.length} routes\n`);
  }

  private async extractServices(): Promise<void> {
    console.log('🔧 Extracting services...');
    
    const servicesDir = path.join(this.backendPath, 'src/services');
    if (!fs.existsSync(servicesDir)) {
      console.log('  ⚠️  No services directory found');
      return;
    }

    const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts'));
    
    for (const file of serviceFiles) {
      const filePath = path.join(servicesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract exported functions
      const functionMatches = content.match(/export\s+(?:async\s+)?function\s+(\w+)/g);
      const methods = functionMatches?.map(m => 
        m.replace(/export\s+(?:async\s+)?function\s+/, '')
      ) || [];
      
      this.inventory.services.push({
        name: file.replace('.service.ts', '').replace('.ts', ''),
        methods,
        file
      });
      
      console.log(`  ✅ ${file}: ${methods.length} methods`);
    }
    
    console.log(`  Total: ${this.inventory.services.length} services\n`);
  }

  private async extractGlobalMiddleware(): Promise<void> {
    console.log('🛡️  Extracting middleware...');
    
    const middlewareDir = path.join(this.backendPath, 'src/middleware');
    if (!fs.existsSync(middlewareDir)) {
      console.log('  ⚠️  No middleware directory found');
      return;
    }

    const middlewareFiles = fs.readdirSync(middlewareDir).filter(f => f.endsWith('.ts'));
    
    this.inventory.middleware = middlewareFiles.map(f => f.replace('.ts', ''));
    
    for (const file of middlewareFiles) {
      console.log(`  ✅ ${file}`);
    }
    
    console.log(`  Total: ${this.inventory.middleware.length} middleware\n`);
  }

  private async extractModels(): Promise<void> {
    console.log('🗄️  Extracting models...');
    
    const prismaSchema = path.join(this.backendPath, 'prisma/schema.prisma');
    if (!fs.existsSync(prismaSchema)) {
      console.log('  ⚠️  No Prisma schema found');
      return;
    }

    const content = fs.readFileSync(prismaSchema, 'utf-8');
    const modelMatches = content.match(/^model\s+(\w+)/gm);
    
    if (modelMatches) {
      this.inventory.models = modelMatches.map(m => 
        m.replace('model ', '')
      );
      
      for (const model of this.inventory.models) {
        console.log(`  ✅ ${model}`);
      }
    }
    
    console.log(`  Total: ${this.inventory.models.length} models\n`);
  }

  private groupEndpoints(): void {
    console.log('📦 Grouping endpoints by module...\n');
    
    for (const route of this.inventory.routes) {
      const parts = route.path.split('/');
      const moduleName = parts[2] || 'root';
      
      if (!this.inventory.endpoints[moduleName]) {
        this.inventory.endpoints[moduleName] = [];
      }
      
      this.inventory.endpoints[moduleName].push(`${route.method} ${route.path}`);
    }
    
    // Print summary
    for (const [module, endpoints] of Object.entries(this.inventory.endpoints)) {
      console.log(`${module}:`);
      endpoints.forEach(e => console.log(`  - ${e}`));
      console.log('');
    }
  }

  private extractHandler(content: string, routePath: string): string {
    // Try to find the handler function name
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(routePath) && lines[i].includes('router.')) {
        // Look for handler in same line or next lines
        const match = lines[i].match(/,\s*(\w+)\)/);
        if (match) return match[1];
      }
    }
    return 'unknown';
  }

  private extractRouteMiddleware(content: string, routePath: string): string[] {
    const middleware: string[] = [];
    const lines = content.split('\n');
    
    // Look for router.use() before the route
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('router.use(') && lines[i].includes('protect')) {
        middleware.push('auth');
      }
      if (lines[i].includes('router.use(') && lines[i].includes('rateLimit')) {
        middleware.push('rateLimit');
      }
    }
    
    return middleware;
  }

  generateReport(): void {
    console.log('═══════════════════════════════════════════');
    console.log('📊 FEATURE INVENTORY REPORT');
    console.log('═══════════════════════════════════════════\n');

    console.log(`Routes: ${this.inventory.routes.length}`);
    console.log(`Services: ${this.inventory.services.length}`);
    console.log(`Middleware: ${this.inventory.middleware.length}`);
    console.log(`Models: ${this.inventory.models.length}`);
    console.log(`Modules: ${Object.keys(this.inventory.endpoints).length}\n`);

    console.log('═══════════════════════════════════════════');
    console.log('🎯 ENDPOINTS BY MODULE');
    console.log('═══════════════════════════════════════════\n');

    for (const [module, endpoints] of Object.entries(this.inventory.endpoints)) {
      console.log(`${module.toUpperCase()} (${endpoints.length} endpoints):`);
      endpoints.forEach(e => console.log(`  ${e}`));
      console.log('');
    }
  }

  saveInventory(outputPath: string): void {
    const output = {
      summary: {
        totalRoutes: this.inventory.routes.length,
        totalServices: this.inventory.services.length,
        totalMiddleware: this.inventory.middleware.length,
        totalModels: this.inventory.models.length,
        modules: Object.keys(this.inventory.endpoints)
      },
      modules: this.inventory.endpoints,
      routes: this.inventory.routes,
      services: this.inventory.services.map(s => ({
        name: s.name,
        methods: s.methods
      })),
      middleware: this.inventory.middleware,
      models: this.inventory.models
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Inventory saved to: ${outputPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const backendPath = process.argv[2] || './backend';
  
  if (!fs.existsSync(backendPath)) {
    console.error(`❌ Backend path not found: ${backendPath}`);
    console.log('Usage: npx ts-node scripts/extract-features.ts [path-to-backend]');
    process.exit(1);
  }

  const extractor = new FeatureExtractor(backendPath);
  extractor.extract()
    .then(() => {
      extractor.generateReport();
      extractor.saveInventory('./feature-inventory.json');
    })
    .catch(err => {
      console.error('❌ Extraction failed:', err);
      process.exit(1);
    });
}

export { FeatureExtractor };
