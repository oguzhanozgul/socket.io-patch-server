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

socket.on("connect", () => {
  const workspaceId = "my-workspace";
  const docId = "doc1";
  createWorkspace(workspaceId);
  subToWorkspace(workspaceId);
});

socket.on("message", (msg: string) => {
  console.log(msg);
});


