declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(_path: string);
    exec(_sql: string): void;
    prepare(_sql: string): {
      run(..._params: unknown[]): unknown;
      get(..._params: unknown[]): unknown;
      all(..._params: unknown[]): unknown[];
    };
    close(): void;
  }
}

declare module 'node:fs' {
  export function mkdtempSync(_prefix: string): string;
}

declare module 'node:os' {
  export function tmpdir(): string;
}

declare module 'node:path' {
  export function join(..._paths: string[]): string;
}
