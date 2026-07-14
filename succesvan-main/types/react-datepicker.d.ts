// global.d.ts (or similar .d.ts file)
declare module '*.css' {
  const content: string;
  export default content;
}