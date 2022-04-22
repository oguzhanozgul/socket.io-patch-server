import * as uWS from "uWebSockets.js";
import { LRUMap } from "mnemonist";
import { Buffer } from "buffer";

const port = 9001;
const publishedPatchMap: LRUMap<string, boolean> = new LRUMap<string, boolean>(10000);

interface Message {
  action: "sub" | "unsub";
  data: any;
}

const app = uWS.App();
app.ws("/*", {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 32,
  open: ws => {
    console.log("Client joined");
  },
  message: (ws, message, isBinary) => {
    // Ignore binary messages
    if (isBinary) {
      return;
    }

    try {
      const parsedMessage = JSON.parse(Buffer.from(message).toString()) as Message;
      const workspaceId = parsedMessage?.data?.workspaceId;
      if (!workspaceId) {
        return;
      }
      const topic = `/workspaces/${workspaceId}`;

      if (parsedMessage.action === "sub" && !ws.isSubscribed(topic)) {
        ws.subscribe(topic);
        console.log(`Subscribed client to workspace ${workspaceId}`);
      } else if (parsedMessage.action === "unsub" && ws.isSubscribed(topic)) {
        ws.unsubscribe(topic);
        console.log(`Unsubscribed client to workspace ${workspaceId}`);
      }
    } catch (err) {
      console.warn(err);
    }
  },
});
app.options("/*", res => {
  res
    .writeHeader("Access-Control-Allow-Origin", "*")
    .writeHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    .end();
});

app.post("/patch", (res, req) => {
  res.writeHeader("Access-Control-Allow-Origin", "*");
  readJson(
    res,
    data => {
      const workspaceId = data?.workspace;
      const patchId = data?.id;
      // TODO: sanitise data before pushing junk to subscribers
      if (!workspaceId) {
        return res.writeStatus("400").end("No workspace specified");
      }
      if (!patchId) {
        return res.writeStatus("400").end("Invalid patch ID");
      }

      if (publishedPatchMap.has(patchId)) {
        return res.writeStatus("400").end("Ignoring duplicate patch ID");
      }

      const topic = `/workspaces/${workspaceId}`;
      const numSubscribers = app.numSubscribers(topic);
      if (numSubscribers) {
        console.log(`Pushing patch ${patchId} to ${numSubscribers} subscriber(s)`);
        app.publish(topic, JSON.stringify(data));
      }
      publishedPatchMap.set(patchId, true);
      return res.writeStatus("200").end("true");
    },
    () => {
      console.warn("Error parsing json");
    }
  );
});

// Adapted from uWS example
function readJson(res, cb, err) {
  let buffer;
  /* Register data cb */
  res.onData((ab, isLast) => {
    let chunk = Buffer.from(ab);
    if (isLast) {
      let json;
      if (buffer) {
        try {
          json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
        } catch (e) {
          /* res.close calls onAborted */
          res.close();
          return;
        }
        cb(json);
      } else {
        try {
          json = JSON.parse(chunk.toString());
        } catch (e) {
          /* res.close calls onAborted */
          res.close();
          return;
        }
        cb(json);
      }
    } else {
      if (buffer) {
        buffer = Buffer.concat([buffer, chunk]);
      } else {
        buffer = Buffer.concat([chunk]);
      }
    }
  });
  /* Register error cb */
  res.onAborted(err);
}

app.listen(port, token => {
  if (token) {
    console.log("Listening to port " + port);
  } else {
    console.log("Failed to listen to port " + port);
  }
});
