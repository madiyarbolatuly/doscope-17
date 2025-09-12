declare global {
  interface File {
    webkitRelativePath?: string;
    relativePath?: string;
  }
}