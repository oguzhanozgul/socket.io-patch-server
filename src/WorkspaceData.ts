
export type Entry = Map<string, string>;
export type Entries = Map<string, Entry>;
export type Documents = Map<string, Entries>;
export type Workspaces = Map<string, Documents>;

export class WorkspaceData {
  workspaces: Workspaces = new Map();

  // Workspace functionality
  addWorkspace(wsName: string) {
    if (!this.workspaces.has(wsName)) {
      this.workspaces.set(wsName, new Map());
    }
  }

  deleteWorkspace(wsName: string) {
    this.workspaces.delete(wsName);
  }

  doesWorkspaceExist(wsName: string) {
    return this.workspaces.has(wsName);
  }

  getWorkspaceNames() {
    if (this.workspaces.keys()) {
      return Array.from(this.workspaces.keys());
    }
    return [];
  }

  // Document functionality
  addDocument(wsName: string, documentName: string) {
    if (this.workspaces.has(wsName) && !this.workspaces.get(wsName)?.has(documentName)) {
      this.workspaces.get(wsName)?.set(documentName, new Map());
    }
  }

  deleteDocument(wsName: string, documentName: string) {
    this.workspaces.get(wsName)?.delete(documentName);
  }

  doesDocumentExist(wsName: string, documentName: string) {
    return this.workspaces.get(wsName)?.has(documentName);
  }

  getDocumentNames(wsName: string) {
    const documents = this.workspaces.get(wsName);
    if (documents) {
      return Array.from(documents.keys());
    }
    return [];
  }

} 