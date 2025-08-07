declare module '@supabase/supabase-js' {
  export type User = any;
  export type AuthChangeEvent = any;
  export type Session = any;
  export function createClient(url: string, key: string): any;
}
