export type Entry = { [key: string]: string };
export type Entries = Map<string, Entry>;
export type Documents = Map<string, Entries>;
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
      this.workspaces.get(wsName)!.set(documentName, new Map());
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
    if (entries) {
      const retVal: { id: string, key: string, value: string }[] = [];
      const asd = Array.from(entries);
      asd.forEach(element => retVal.push({ id: element[0], key: Object.keys(element[1])[0], value: Object.values(element[1])[0] }))
      console.warn("Entries:");
      console.log(asd);
      return retVal;
    }

    return [];
  };

  // Entry functionality
  addEntry(
    wsName: string,
    documentName: string,
    entry: { id: string, content: Entry }
  ) {
    if (this.workspaces.has(wsName) && this.workspaces.get(wsName)!.has(documentName)) {
      this.workspaces
        .get(wsName)!
        .get(documentName)!
        .set(entry.id, entry.content);
    }
  }

  deleteEntry(wsName: string, documentName: string) {
    this.workspaces.get(wsName)?.delete(documentName);
  }

  doesEntryExist(wsName: string, documentName: string) {
    return this.workspaces.get(wsName)?.has(documentName);
  }

} 