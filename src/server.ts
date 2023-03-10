import { LRUMap } from "mnemonist";
import { Server } from "socket.io";
import { createServer } from "http";
import { WorkspaceData } from "./WorkspaceData";
import { v4 as uuidv4 } from "uuid";


const port = 9001;
const publishedPatchMap: LRUMap<string, boolean> = new LRUMap<string, boolean>(10000);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

const database = new WorkspaceData();

io.on("connection", socket => {
  console.log(`Client ${socket.id} connected`);
  io.emit("message", `Client ${socket.id} connected`);
  socket.emit("workspaces", database.getWorkspaceNames());

  // subscribe to workspace
  socket.on("subscribe",
    (data: { workspaceId: string }, ack?: (success: boolean) => void) => {

      if (typeof data?.workspaceId === "string") {

        if (!database.doesWorkspaceExist(data.workspaceId)) {
          socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`);
          if (ack) ack(false);
          return;
        }

        console.log(`Adding client ${socket.id} to ${data.workspaceId}`);
        socket.join(data.workspaceId);
        socket.emit("documents",
          { workspace: data.workspaceId, documents: database.getWorkspaceDocumentNames(data.workspaceId) }
        );

        io.in(data.workspaceId).emit("message", `Added client ${socket.id} to ${data.workspaceId}`);
        if (ack) ack(true);
        return;
      }

      if (ack) {
        ack(false);
        socket.emit("message", `Error: Cannot add client ${socket.id} to ${data.workspaceId}`);
      }
    });

  socket.on("unsubscribe", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      console.log(`Removing client ${socket.id} from ${data.workspaceId}`);
      socket.leave(data.workspaceId);
      io.in(data.workspaceId).emit("message", `Removed client ${socket.id} from ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }
    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot remove client ${socket.id} from ${data.workspaceId}`);
    }
  });

  // Create workspace
  socket.on("create-workspace", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {

    if (typeof data?.workspaceId === "string") {
      if (database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} already exists`)
        if (ack) ack(false);
        return;
      }
      database.createWorkspace(data.workspaceId);
      io.emit("message", `Created new workspace ${data.workspaceId}`);
      io.emit("workspaces", database.getWorkspaceNames());
      console.log(`Created new workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot create workspace ${data.workspaceId}`);
    }
  })

  // delete workspace
  socket.on("delete-workspace", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      if (database.doesWorkspaceExist(data.workspaceId)) {
        console.log(`Deleting workspace ${data.workspaceId}`);
        io.socketsLeave(data.workspaceId);
        database.deleteWorkspace(data.workspaceId);
        io.emit("workspaces", database.getWorkspaceNames());
        io.emit("message", `Deleted workspace ${data.workspaceId}`);
        if (ack) ack(true);
        return;
      }

      if (ack) {
        ack(false);
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`);
      }
      return;

    }
    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot delete workspace ${data.workspaceId}`);
    }
  });


  socket.on("create-document", (data: { workspaceId: string, documentId: string }, ack?: (success: boolean) => void) => {

    if (typeof data?.workspaceId === "string" && typeof data?.documentId === "string") {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} already exists in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }
      database.createDocument(data.workspaceId, data.documentId);
      io.in(data.workspaceId).emit("message", `Created new document ${data.documentId} in workspace ${data.workspaceId}`);
      io.in(data.workspaceId).emit("documents",
        { workspace: data.workspaceId, documents: database.getWorkspaceDocumentNames(data.workspaceId) }
      );

      console.log(`Created new document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot create document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("delete-document", (data: { workspaceId: string, documentId: string }, ack?: (success: boolean) => void) => {

    if (typeof data?.workspaceId === "string" && typeof data?.documentId === "string") {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }
      database.deleteDocument(data.workspaceId, data.documentId);
      io.in(data.workspaceId).emit("message", `Deleted document ${data.documentId} in workspace ${data.workspaceId}`);
      io.in(data.workspaceId).emit("documents",
        { workspace: data.workspaceId, documents: database.getWorkspaceDocumentNames(data.workspaceId) }
      );

      console.log(`Deleted document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot delete document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("open-document", (data: { workspaceId: string, documentId: string }, ack?: (success: boolean) => void) => {

    if (typeof data?.workspaceId === "string" && typeof data?.documentId === "string") {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      socket.emit("entries",
        { workspace: data.workspaceId, document: data.documentId, entries: database.getDocumentEntries(data.workspaceId, data.documentId) }
      );

      console.log(`Sent entries in document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot open document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("create-entry", (data: { workspaceId: string, documentId: string, id: string, key: string, value: string }, ack?: (success: boolean) => void) => {

    if (
      typeof data?.workspaceId === "string"
      && typeof data?.documentId === "string"
      && typeof data?.key === "string"
      && typeof data?.value === "string"
    ) {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      database.addEntry(
        data.workspaceId,
        data.documentId,
        { id: data.id, key: data.key, value: data.value })

      io.in(data.workspaceId).emit("message", `Added entry {${data.key}: ${data.value}} in document ${data.documentId} in workspace ${data.workspaceId}`);
      io.in(data.workspaceId).emit("entries",
        { workspace: data.workspaceId, document: data.documentId, entries: database.getDocumentEntries(data.workspaceId, data.documentId) }
      );

      console.log(`Added new entry {${data.key}: ${data.value}} in document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot create entry {${data.key}: ${data.value}} in document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("delete-entry", (data: { workspaceId: string, documentId: string, entryId: string }, ack?: (success: boolean) => void) => {

    if (
      typeof data?.workspaceId === "string"
      && typeof data?.documentId === "string"
      && typeof data?.entryId === "string"
    ) {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesEntryExist(data.workspaceId, data.documentId, data.entryId)) {
        socket.emit("message", `Error: Entry ${data.entryId} does not exist in document ${data.documentId} in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      database.deleteEntry(
        data.workspaceId,
        data.documentId,
        data.entryId,
      )

      io.in(data.workspaceId).emit("message", `Deleted entry ${data.entryId} in document ${data.documentId} in workspace ${data.workspaceId}`);
      io.in(data.workspaceId).emit("entries",
        { workspace: data.workspaceId, document: data.documentId, entries: database.getDocumentEntries(data.workspaceId, data.documentId) }
      );

      console.log(`Deleted entry ${data.entryId} in document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot delete entry ${data.entryId} in document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("change-entry", (data: { workspaceId: string, documentId: string, id: string, key: string, value: string }, ack?: (success: boolean) => void) => {

    if (
      typeof data?.workspaceId === "string"
      && typeof data?.documentId === "string"
      && typeof data?.id === "string"
      && typeof data?.key === "string"
      && typeof data?.value === "string"
    ) {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }
      if (!database.doesEntryExist(data.workspaceId, data.documentId, data.id)) {
        socket.emit("message", `Error: Entry ${data.id} does not exist in document ${data.documentId} in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      database.changeEntry(
        data.workspaceId,
        data.documentId,
        {
          id: data.id,
          key: data.key,
          value: data.value
        },
      )

      io.in(data.workspaceId).emit("message", `Changed entry ${data.id} to {${data.key}: ${data.value}} in document ${data.documentId} in workspace ${data.workspaceId}`);
      io.in(data.workspaceId).emit("entries",
        { workspace: data.workspaceId, document: data.documentId, entries: database.getDocumentEntries(data.workspaceId, data.documentId) }
      );

      console.log(`Changed entry ${data.id} to {${data.key}: ${data.value}} in document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }

    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot delete entry ${data.id} in document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

  socket.on("move-entry", (data: { workspaceId: string, documentId: string, id: string, direction: "up" | "down" }, ack?: (success: boolean) => void) => {

    if (
      typeof data.workspaceId === "string"
      && typeof data.documentId === "string"
      && typeof data.id === "string"
      && (data.direction === "up" || data.direction === "down")
    ) {

      if (!database.doesWorkspaceExist(data.workspaceId)) {
        socket.emit("message", `Error: Workspace ${data.workspaceId} does not exist`)
        if (ack) ack(false);
        return;
      }

      if (!database.doesDocumentExist(data.workspaceId, data.documentId)) {
        socket.emit("message", `Error: Document ${data.documentId} does not exist in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      if (!database.doesEntryExist(data.workspaceId, data.documentId, data.id)) {
        socket.emit("message", `Error: Entry ${data.id} does not exist in document ${data.documentId} in workspace ${data.workspaceId}`)
        if (ack) ack(false);
        return;
      }

      database.moveEntry(
        data.workspaceId,
        data.documentId,
        data.id,
        data.direction,
      )

      io.in(data.workspaceId).emit("message", `Moved entry ${data.id} ${data.direction} in document ${data.documentId} in workspace ${data.workspaceId}`);

      io.in(data.workspaceId).emit("entries",
        { workspace: data.workspaceId, document: data.documentId, entries: database.getDocumentEntries(data.workspaceId, data.documentId) }
      );

      console.log(`Moved entry ${data.id} ${data.direction} in document ${data.documentId} in workspace ${data.workspaceId}`);
      if (ack) ack(true);
      return;
    }
    if (ack) {
      ack(false);
      socket.emit("message", `Error: Cannot move entry ${data.id} ${data.direction} in document ${data.documentId} in workspace ${data.workspaceId}`);
    }
  })

});

io.on("disconnect", socket => {
  console.log(`Client ${socket.id} disconnected`);
  io.emit("message", `Client ${socket.id} disconnected`);
});

io.listen(port);