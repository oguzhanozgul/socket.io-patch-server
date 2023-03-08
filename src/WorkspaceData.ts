
export type Entry = Map<string, string>;
export type Entries = Map<string, Entry>;
export type Files = Map<string, Entry[]>;
export type Workspaces = Map<string, File[]>;

export class WorkspaceData {
  workspaces: Workspaces = new Map();

  addWorkspace(wsName: string) {
    this.workspaces.set(wsName, []);
  }

  removeWorkspace(wsName: string) {
    this.workspaces.delete(wsName);
  }

  doesWorkspaceExist(wsName: string) {
    return this.workspaces.has(wsName);
  }

  maybeCreateWorkspace(wsName: string) {
    if (!this.doesWorkspaceExist(wsName)) {
      this.addWorkspace(wsName);
    }
  }

  createWorkspace(wsName: string) {
    this.addWorkspace(wsName);
  }

  getWorkspaceNames() {
    return Array.from(this.workspaces.keys());
  }

} 