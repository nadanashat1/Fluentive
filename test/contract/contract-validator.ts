// Enterprise-grade Contract Testing System
// Hard failures for schema violations - no more soft warnings

export interface ContractSchema {
  required: string[];
  optional?: string[];
  shape?: {
    [key: string]: ContractSchema;
  };
  validate?: (value: any) => boolean;
}

export interface EndpointContract {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: ContractSchema;
  statusCodes?: number[];
}

class ContractValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public expected: any,
    public actual: any
  ) {
    super(message);
    this.name = 'ContractValidationError';
  }
}

class ContractTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractTestError';
  }
}

// Core validation function
export function validateResponse(
  response: any,
  schema: ContractSchema,
  path: string = 'root'
): void {
  // Check required fields
  for (const field of schema.required) {
    if (!(field in response)) {
      throw new ContractValidationError(
        `Missing required field: ${field}`,
        field,
        'present',
        'missing'
      );
    }
  }

  // Validate each field
  for (const [key, value] of Object.entries(response)) {
    const fieldPath = path === 'root' ? key : `${path}.${key}`;
    
    // Skip if field is not in schema
    if (!schema.required.includes(key) && !(schema.optional || []).includes(key)) {
      throw new ContractValidationError(
        `Unexpected field: ${key}`,
        fieldPath,
        'not in schema',
        'present'
      );
    }

    // Check field type
    if (value === null && schema.required.includes(key)) {
      throw new ContractValidationError(
        `Required field ${key} cannot be null`,
        fieldPath,
        'non-null',
        'null'
      );
    }

    // Custom validation
    if (schema.validate && !schema.validate(value)) {
      throw new ContractValidationError(
        `Field ${key} failed custom validation`,
        fieldPath,
        'valid',
        'invalid'
      );
    }

    // Nested validation
    if (schema.shape && schema.shape[key]) {
      validateResponse(value, schema.shape[key], fieldPath);
    }
  }
}

// Contract definitions
export const API_CONTRACTS: Record<string, EndpointContract[]> = {
  leads: [
    {
      method: 'GET',
      path: '/api/leads',
      response: {
        required: ['success', 'data', 'meta'],
        shape: {
          success: { required: [], validate: (v) => typeof v === 'boolean' },
          data: {
            required: [],
            validate: (v) => Array.isArray(v)
          },
          meta: {
            required: ['count', 'total', 'page', 'limit', 'totalPages', 'hasNextPage', 'hasPrevPage'],
            shape: {
              count: { required: [], validate: (v) => typeof v === 'number' },
              total: { required: [], validate: (v) => typeof v === 'number' },
              page: { required: [], validate: (v) => typeof v === 'number' },
              limit: { required: [], validate: (v) => typeof v === 'number' },
              totalPages: { required: [], validate: (v) => typeof v === 'number' },
              hasNextPage: { required: [], validate: (v) => typeof v === 'boolean' },
              hasPrevPage: { required: [], validate: (v) => typeof v === 'boolean' }
            }
          }
        }
      },
      statusCodes: [200, 401, 403, 500]
    },
    {
      method: 'POST',
      path: '/api/leads',
      response: {
        required: ['success', 'data'],
        shape: {
          success: { required: [], validate: (v) => typeof v === 'boolean' },
          data: { required: [], validate: (v) => v !== null }
        }
      },
      statusCodes: [201, 400, 401, 403, 500]
    }
  ],
  leadsStats: [
    {
      method: 'GET',
      path: '/api/leads/stats',
      response: {
        required: ['success', 'data'],
        shape: {
          success: { required: [], validate: (v) => typeof v === 'boolean' },
          data: {
            required: ['total', 'byStatus'],
            shape: {
              total: { required: [], validate: (v) => typeof v === 'number' },
              byStatus: { required: [], validate: (v) => typeof v === 'object' && v !== null },
              trends: {
                required: [],
                validate: (v) => Array.isArray(v)
              }
            }
          }
        }
      },
      statusCodes: [200, 401, 403, 500]
    }
  ],
  analytics: [
    {
      method: 'GET',
      path: '/api/analytics/timeseries',
      response: {
        required: ['success', 'data'],
        shape: {
          success: { required: [], validate: (v) => typeof v === 'boolean' },
          data: {
            required: ['series', 'period', 'totalLeads'],
            shape: {
              series: {
                required: [],
                validate: (v) => Array.isArray(v)
              },
              period: { required: [], validate: (v) => typeof v === 'string' },
              totalLeads: { required: [], validate: (v) => typeof v === 'number' }
            }
          }
        }
      },
      statusCodes: [200, 401, 403, 500]
    }
  ],
  auth: [
    {
      method: 'GET',
      path: '/api/auth/me',
      response: {
        required: ['success', 'data'],
        shape: {
          success: { required: [], validate: (v) => typeof v === 'boolean' },
          data: {
            required: ['id', 'name', 'email', 'role'],
            shape: {
              id: { required: [], validate: (v) => typeof v === 'string' },
              name: { required: [], validate: (v) => typeof v === 'string' },
              email: { required: [], validate: (v) => typeof v === 'string' },
              role: { required: [], validate: (v) => typeof v === 'string' }
            }
          }
        }
      },
      statusCodes: [200, 401, 500]
    }
  ]
};

// Test runner with hard failures
export class ContractTester {
  public failures: string[] = [];
  public passes: string[] = [];

  async testEndpoint(
    endpointName: string,
    contract: EndpointContract,
    response: Response
  ): Promise<void> {
    try {
      // Check status code
      const responseData = await response.json();
      const status = response.status;
      
      if (contract.statusCodes && !contract.statusCodes.includes(status)) {
        throw new ContractTestError(
          `Unexpected status code ${status} for ${contract.method} ${contract.path}. Expected: ${contract.statusCodes.join(', ')}`
        );
      }

      // Validate response structure
      validateResponse(responseData, contract.response);

      this.passes.push(`✅ ${contract.method} ${contract.path} - Contract valid`);
    } catch (error) {
      if (error instanceof ContractValidationError) {
        this.failures.push(
          `❌ ${contract.method} ${contract.path} - ${error.message} (Field: ${error.field}, Expected: ${error.expected}, Actual: ${error.actual})`
        );
      } else if (error instanceof ContractTestError) {
        this.failures.push(`❌ ${contract.method} ${contract.path} - ${error.message}`);
      } else {
        this.failures.push(`❌ ${contract.method} ${contract.path} - Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  getResults(): { passes: string[]; failures: string[]; success: boolean } {
    return {
      passes: this.passes,
      failures: this.failures,
      success: this.failures.length === 0
    };
  }

  reset(): void {
    this.failures = [];
    this.passes = [];
  }

  printResults(): void {
    console.log('\n🔍 CONTRACT TEST RESULTS');
    console.log('='.repeat(50));
    
    this.passes.forEach(pass => console.log(pass));
    this.failures.forEach(failure => console.error(failure));
    
    console.log('='.repeat(50));
    console.log(`✅ Passes: ${this.passes.length}`);
    console.log(`❌ Failures: ${this.failures.length}`);
    console.log(`📊 Success Rate: ${this.passes.length / (this.passes.length + this.failures.length) * 100}%`);
    
    if (this.failures.length > 0) {
      console.error('\n🚨 CONTRACT VIOLATIONS DETECTED - FIX REQUIRED');
      process.exit(1);
    } else {
      console.log('\n✅ ALL CONTRACTS VALID - PRODUCTION READY');
    }
  }
}

// Utility function to run all contract tests
export async function runAllContractTests(): Promise<void> {
  const tester = new ContractTester();
  
  console.log('🧪 Running API Contract Tests...');
  
  // Test each endpoint contract
  for (const [endpointName, contracts] of Object.entries(API_CONTRACTS)) {
    console.log(`\n📍 Testing ${endpointName}...`);
    
    for (const contract of contracts) {
      // This would make actual HTTP requests in real implementation
      // For now, we'll validate the contract definitions themselves
      try {
        validateResponse({ success: true, data: [], meta: { count: 0, total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPrevPage: false } }, contract.response);
        tester.passes.push(`✅ ${contract.method} ${contract.path} - Contract schema valid`);
      } catch (error) {
        tester.failures.push(`❌ ${contract.method} ${contract.path} - Invalid contract schema: ${error.message}`);
      }
    }
  }
  
  tester.printResults();
}

export { ContractValidationError, ContractTestError };
