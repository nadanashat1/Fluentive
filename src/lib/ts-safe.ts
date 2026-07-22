/** Deployment stabilizers — narrow with real types after schema + API contracts settle. */
export const asAny = <T>(value: T): any => value;

export const unsafeEnum = (value: any): any => value as any;
