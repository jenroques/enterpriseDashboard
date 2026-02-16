declare module 'virtual:__federation__' {
  export function __federation_method_setRemote(
    name: string,
    config: {
      url: string;
      format: 'esm' | 'systemjs' | 'var';
      from: 'vite' | 'webpack';
    }
  ): void;

  export function __federation_method_getRemote(name: string, component: string): Promise<unknown>;

  export function __federation_method_unwrapDefault(module: unknown): Promise<unknown>;
}
