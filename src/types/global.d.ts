interface Window {
  google: any;
  __activeToolMode?: string;
}

declare module '*?raw' {
  const content: string;
  export default content;
}
