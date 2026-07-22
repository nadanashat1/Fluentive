import { CacheProvider, RateLimitProvider, CircuitStateProvider, EventProvider } from './types';
import { 
  MemoryCacheProvider, 
  MemoryRateLimitProvider, 
  MemoryCircuitStateProvider, 
  MemoryEventProvider 
} from './memory-provider';

// Singleton instances for the memory providers
const memoryCache = new MemoryCacheProvider();
const memoryRateLimit = new MemoryRateLimitProvider();
const memoryCircuitState = new MemoryCircuitStateProvider();
const memoryEvent = new MemoryEventProvider();

// Active provider instances.
// Currently set to memory implementations. When switching to Redis, swap these.
export const cacheProvider: CacheProvider = memoryCache;
export const rateLimitProvider: RateLimitProvider = memoryRateLimit;
export const circuitStateProvider: CircuitStateProvider = memoryCircuitState;
export const eventProvider: EventProvider = memoryEvent;

export * from './types';
