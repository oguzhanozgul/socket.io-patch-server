import { LRUMap } from "mnemonist";
import { Server } from "socket.io";

const port = 9001;
const publishedPatchMap: LRUMap<string, boolean> = new LRUMap<string, boolean>(10000);

const io = new Server();

io.on("connection", socket => {
  console.log(`Client ${socket.id} connected`);

  socket.on("sub", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      console.log(`Adding client ${socket.id} to ${data.workspaceId}`);
      socket.join(data.workspaceId);
      if (ack) {
        ack(true);
      }
      return;
    }
    if (ack) {
      ack(false);
    }
  });

  socket.on("unsub", (data: { workspaceId: string }, ack?: (success: boolean) => void) => {
    if (typeof data?.workspaceId === "string") {
      console.log(`Removing client ${socket.id} to ${data.workspaceId}`);
      socket.leave(data.workspaceId);
      if (ack) {
        ack(true);
      }
      return;
    }
    if (ack) {
      ack(false);
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
        }
        return;
      } else {
        console.log(`Skipping duplicate patch ${data.patchId}`);
      }
    }
    if (ack) {
      ack(false);
    }
  });
});

io.on("disconnect", socket => {
  console.log(`Client ${socket.id} disconnected`);
});

io.listen(port);