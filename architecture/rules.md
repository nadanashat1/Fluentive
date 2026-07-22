# DDD Architecture Enforcement Rules

## 🚨 CRITICAL: NON-BYPASSABLE DEPENDENCY BOUNDARIES

### Layer Dependency Direction (STRICT ENFORCEMENT)

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Use Cases     │    │   Controllers   │                │
│  └─────────────────┘    └─────────────────┘                │
│           ↓                      ↓                         │
├─────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                           │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Entities      │    │   Interfaces    │                │
│  │   Value Objects │    │   Domain Events │                │
│  │   Aggregates    │    │   Repositories  │                │
│  └─────────────────┘    └─────────────────┘                │
│           ↓                      ↓                         │
├─────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                       │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Repositories  │    │   External APIs  │                │
│  │   Database      │    │   File System   │                │
│  │   Messaging     │    │   Caching       │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 🛡️ ENFORCEMENT RULES (ZERO TOLERANCE)

#### 1. IMPORT RESTRICTIONS
```
✅ ALLOWED:
application → domain
infrastructure → domain
infrastructure → application (only for application services)

❌ FORBIDDEN:
domain → application
domain → infrastructure
application → infrastructure
infrastructure → application (except app services)
```

#### 2. LAYER OWNERSHIP
```
DOMAIN LAYER OWNS:
- All business interfaces (IRepository, IService, etc.)
- Domain entities and value objects
- Business rules and validation
- Domain events

INFRASTRUCTURE LAYER OWNS:
- Implementation of domain interfaces
- Database access (Prisma, etc.)
- External API clients
- File system operations
- Caching mechanisms

APPLICATION LAYER OWNS:
- Use cases and application services
- Controllers/API endpoints
- DTOs and request/response models
- Orchestration of domain operations
```

#### 3. DEPENDENCY INVERSION (MANDATORY)
```
❌ WRONG:
class LeadService {
  constructor(private prisma: PrismaClient) {} // Direct dependency
}

✅ CORRECT:
// Domain defines contract
interface ILeadRepository {
  create(data: CreateLeadData): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
}

// Infrastructure implements
class PrismaLeadRepository implements ILeadRepository {
  constructor(private prisma: PrismaClient) {}
  // Implementation
}

// Application uses interface
class LeadService {
  constructor(private leadRepo: ILeadRepository) {} // Interface dependency
}
```

#### 4. PATH ALIAS ENFORCEMENT
```json
// tsconfig.json paths
{
  "@domain/*": ["src/domain/*"],
  "@application/*": ["src/application/*"],
  "@infrastructure/*": ["src/infrastructure/*"]
}
```

#### 5. ESLINT BOUNDARY RULES
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@domain/**'],
            from: 'application',
            message: 'Application cannot import from Domain'
          },
          {
            group: ['@infrastructure/**'],
            from: 'domain',
            message: 'Domain cannot import from Infrastructure'
          },
          // More boundary rules...
        ]
      }
    ]
  }
}
```

### 🔄 ALLOWED COMMUNICATION PATTERNS

#### 1. CONTROLLER → USE CASE → DOMAIN
```
Controller (Application)
  ↓ calls
Use Case (Application)
  ↓ uses
Domain Service/Entity (Domain)
  ↓ uses (via interface)
Repository Implementation (Infrastructure)
```

#### 2. TRANSACTION BOUNDARIES
```
✅ Application layer owns transactions
✅ Use Case coordinates multiple domain operations
✅ Infrastructure handles individual persistence
❌ Domain layer manages transactions
❌ Infrastructure spans multiple aggregates
```

#### 3. EVENT FLOW
```
Domain Event (Domain)
  ↓ published by
Domain Service/Entity (Domain)
  ↓ handled by
Application Service (Application)
  ↓ delegates to
Infrastructure (External services, notifications)
```

### 🚨 COMPILATION-TIME ENFORCEMENT

#### 1. TYPESCRIPT MODULE DECLARATION
```typescript
// src/domain/index.ts - Export only domain types
export * from './entities';
export * from './interfaces';
export * from './events';
// NO infrastructure exports

// src/infrastructure/index.ts - Export only implementations
export * from './repositories';
export * from './external';
// NO domain exports
```

#### 2. BARREL EXPORTS CONTROL
```
domain/index.ts → Only domain contracts
application/index.ts → Only application services
infrastructure/index.ts → Only implementations
```

### 🔒 CONTAINER AS GUARD (NOT JUST REGISTRY)

```typescript
// Dependency Injection Container with boundary enforcement
class DIContainer {
  private domainBindings = new Map();
  private infrastructureBindings = new Map();
  private applicationBindings = new Map();

  bindDomain<T>(token: string, implementation: T) {
    this.domainBindings.set(token, implementation);
  }

  bindInfrastructure<T>(token: string, implementation: T) {
    if (!this.domainBindings.has(token)) {
      throw new Error(`Infrastructure must implement domain interface: ${token}`);
    }
    this.infrastructureBindings.set(token, implementation);
  }

  // Enforces dependency direction at runtime
  resolve<T>(token: string): T {
    // Implementation with boundary checks
  }
}
```

### 📋 VALIDATION CHECKLIST

Before any code commit:
- [ ] No cross-layer imports (ESLint pass)
- [ ] All dependencies are interfaces (TypeScript check)
- [ ] Domain has no infrastructure dependencies
- [ ] Infrastructure implements domain interfaces only
- [ ] Application orchestrates, doesn't implement business logic
- [ ] Container bindings follow dependency inversion

### 🎯 VIOLATION CONSEQUENCES

1. **Build Failure**: ESLint rules block compilation
2. **Type Error**: TypeScript prevents wrong dependencies
3. **Runtime Exception**: Container rejects invalid bindings
4. **Code Review**: Automated PR checks reject violations

---

## 🚀 IMPLEMENTATION SEQUENCE

1. **Define Rules** ← YOU ARE HERE
2. **Configure ESLint** 
3. **Setup TypeScript paths**
4. **Create domain interfaces**
5. **Implement infrastructure**
6. **Configure container guards**
7. **Validate with tests**

---

**⚠️ REMINDER**: Architecture without enforcement is just organization.  
Real DDD = Structure + Rules + Enforcement.
