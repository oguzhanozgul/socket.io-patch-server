import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:9001");

const subToWorkspace = (workspaceId: string) => {
  socket.emit("sub", { workspaceId }, success => {
    if (success) {
      console.log(`Subscribed to ${workspaceId}`);
    }
  });
};

const unsubFromWorkspace = (workspaceId: string) => {
  socket.emit("unsub", { workspaceId }, success => {
    if (success) {
      console.log(`Unsubscribed from ${workspaceId}`);
    }
  });
};

const submitPatch = (workspaceId: string, patchId: string, payload: any) => {
  socket.emit("patch", { workspaceId, patchId, payload }, success => {
    if (success) {
      console.log(`Patch ${patchId} sent to ${workspaceId}`);
    }
  });
};

socket.on("connect", () => {
  const workspaceId = "doc1";
  subToWorkspace(workspaceId);
  submitPatch(workspaceId, uuidv4(), { hello: "world" });
});

socket.on("patch", (data: { workspaceId: string, patchId: string, payload: any }) => {
  console.log(`Patch ${data.patchId} received for workspace ${data.workspaceId}`);
  console.log({ payload: data.payload });
});
