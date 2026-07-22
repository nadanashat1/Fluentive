// Event infrastructure stubs - Temporary fix for missing modules
export const eventBus = {
  emit: (event: string, data: any) => {
    console.log(`Event emitted: ${event}`, data);
  },
  on: (event: string, listener: (data: any) => void) => {
    console.log(`Event listener registered: ${event}`);
  }
};

export const eventOutbox = {
  add: (event: any) => Promise.resolve(),
  process: () => Promise.resolve([])
};
