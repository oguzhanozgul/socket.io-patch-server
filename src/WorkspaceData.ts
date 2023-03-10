export type Entry = { id: string, key: string, value: string };
export type Documents = Map<string, Entry[]>;
export type Workspaces = Map<string, Documents>;

export class WorkspaceData {
  workspaces: Workspaces = new Map();

  // Workspace functionality
  createWorkspace(wsName: string) {
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

  getWorkspaceDocumentNames(wsName: string) {
    const documents = this.workspaces.get(wsName);
    if (documents) {
      return Array.from(documents.keys());
    }
    return [];
  }

  // Document functionality
  createDocument(wsName: string, documentName: string) {
    if (this.workspaces.has(wsName) && !this.workspaces.get(wsName)!.has(documentName)) {
      this.workspaces.get(wsName)!.set(documentName, []);
    }
  }

  deleteDocument(wsName: string, documentName: string) {
    this.workspaces.get(wsName)?.delete(documentName);
  }

  doesDocumentExist(wsName: string, documentName: string) {
    return this.workspaces.get(wsName)?.has(documentName);
  }

  getDocumentEntries(wsName: string, documentName: string) {
    const entries = this.workspaces.get(wsName)?.get(documentName);
    if (entries && entries.length > 0) {
      return entries;
    }
    return [];
  };

  // Entry functionality
  addEntry(
    wsName: string,
    documentName: string,
    entry: { id: string, key: string, value: string }
  ) {
    if (this.workspaces.has(wsName) && this.workspaces.get(wsName)!.has(documentName)) {
      this.workspaces
        .get(wsName)!
        .get(documentName)!
        .push({ id: entry.id, key: entry.key, value: entry.value });
    }
  }

  deleteEntry(wsName: string, documentName: string, entryId: string) {
    const entries = this.workspaces.get(wsName)?.get(documentName);
    if (entries && entries.length > 0) {
      const newEntries = entries.filter(entry => entry.id !== entryId);
      this.workspaces.get(wsName)?.set(documentName, newEntries);
    }
  }

  doesEntryExist(wsName: string, documentName: string, entryId: string) {
    return this.workspaces.get(wsName)?.get(documentName)?.find(entry => entry.id === entryId) !== undefined;
  }

} 