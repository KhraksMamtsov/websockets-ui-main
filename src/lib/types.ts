export type Compute<A> = { [K in keyof A]: A[K] } & unknown;

export type NoInfer<T> = [T][T extends any ? 0 : never];
