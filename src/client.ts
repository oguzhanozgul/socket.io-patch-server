import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:9001");

const createWorkspace = (workspaceId: string) => {
  socket.emit("create-workspace", { workspaceId }, (success: boolean) => {
    if (success) {
      console.log(`Created workspace ${workspaceId}`);
    }
  });
};

const subToWorkspace = (workspaceId: string) => {
  socket.emit("subscribe", { workspaceId }, (success: boolean) => {
    if (success) {
      console.log(`Subscribed to ${workspaceId}`);
    }
  });
};

const unsubFromWorkspace = (workspaceId: string) => {
  socket.emit("unsubscribe", { workspaceId }, (success: boolean) => {
    if (success) {
      console.log(`Unsubscribed from ${workspaceId}`);
    }
  });
};

const submitPatch = (workspaceId: string, documentId: string, patches: any) => {
  const patchId = uuidv4();
  socket.emit("patch", { workspaceId, documentId, patchId, patches }, (success: boolean) => {
    if (success) {
      console.log(`Patch ${patchId} for document ${documentId} sent to ${workspaceId}`);
    }
  });
};

socket.on("connect", () => {
  const workspaceId = "my-workspace";
  const docId = "doc1";
  createWorkspace(workspaceId);
  subToWorkspace(workspaceId);
  submitPatch(workspaceId, docId, ["your-json-patches here"]);
});

socket.on("message", (msg: string) => {
  console.log(msg);
});

socket.on("workspaces", (msg) => {
  console.log(msg);
});

socket.on("patch", (data: { workspaceId: string, documentId: string, patchId: string, patches: any }) => {
  console.log(`Patch ${data.patchId} received for workspace ${data.workspaceId}`);
  const { documentId, patches } = data;
  console.log({ documentId, patches });
});
