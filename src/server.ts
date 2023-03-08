import { LRUMap } from "mnemonist";
import { Server } from "socket.io";
import { createServer } from "http";
import { WorkspaceData } from "./WorkspaceData";

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

  // subscribe to workspace, create workspace if doesn't exist
  socket.on("subscribe",
    (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
      if (typeof data?.workspaceId === "string") {

        // if WS doesn't exist, create it and publish the list of workspaces
        if (!database.doesWorkspaceExist(data.workspaceId)) {
          database.createWorkspace(data.workspaceId);
          io.emit("workspaces", database.getWorkspaceNames());
        }

        console.log(database.workspaces);
        console.log(`Adding client ${socket.id} to ${data.workspaceId}`);
        socket.join(data.workspaceId);

        if (ack) {
          ack(true);
          io.emit("message", `Added client ${socket.id} to ${data.workspaceId}`);
        }
        return;
      }

      if (ack) {
        ack(false);
        io.emit("message", `Error: Cannot add client ${socket.id} to ${data.workspaceId}`);
      }
    });

  socket.on("unsubscribe", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      console.log(`Removing client ${socket.id} from ${data.workspaceId}`);
      socket.leave(data.workspaceId);
      if (ack) {
        ack(true);
        io.emit("message", `Removed client ${socket.id} from ${data.workspaceId}`);
      }
      return;
    }
    if (ack) {
      ack(false);
      io.emit("message", `Error: Cannot remove client ${socket.id} from ${data.workspaceId}`);
    }
  });

  // delete workspace
  socket.on("delete-workspace", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      if (database.doesWorkspaceExist(data.workspaceId)) {
        console.log(`Deleting workspace ${data.workspaceId}`);
        database.removeWorkspace(data.workspaceId);
        io.emit("workspaces", database.getWorkspaceNames());
        if (ack) {
          ack(true);
          io.emit("message", `Deleted workspace ${data.workspaceId}`);
        }
        return;
      }

      if (ack) {
        ack(false);
        io.emit("message", `Error: Workspace ${data.workspaceId} does not exist`);
      }
      return;

    }
    if (ack) {
      ack(false);
      io.emit("message", `Error: Cannot delete workspace ${data.workspaceId}`);
    }
  });

  socket.on("patch", (data: { workspaceId: string, documentId: string, patchId: string, patches: any }, ack?: (success: boolean) => void) => {
    if (typeof data?.patchId === "string" && typeof data?.workspaceId === "string") {
      if (!publishedPatchMap.has(data.patchId)) {
        publishedPatchMap.set(data.patchId, true);
        socket.to(data.workspaceId).emit("patch", data);
        console.log(`Emitting patch ${data.patchId} to workspace ${data.workspaceId}`);
        if (ack) {
          ack(true);
          io.emit("message", `Emitted patch ${data.patchId} to workspace ${data.workspaceId}`);
        }
        return;
      } else {
        console.log(`Skipping duplicate patch ${data.patchId}`);
        io.emit("message", `Skipped duplicate patch ${data.patchId}`);
      }
    }
    if (ack) {
      ack(false);
      io.emit("message", `Error: Cannot emit patch ${data.patchId} to workspace ${data.workspaceId}`);
    }
  });

});

io.on("disconnect", socket => {
  console.log(`Client ${socket.id} disconnected`);
  io.emit("message", `Client ${socket.id} disconnected`);
});

io.listen(port);