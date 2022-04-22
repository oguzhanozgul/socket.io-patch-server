import * as uWS from "uWebSockets.js";
import {LRUMap} from "mnemonist";

const port = 9001;
const publishedPatchMap: LRUMap<string, boolean> = new LRUMap<string, boolean>(10000);

interface Message {
  action: "sub" | "unsub";
  data: any;
}

const app = uWS.App();
app.ws('/*', {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 32,
  open: (ws) => {
    console.log("Client joined");
  },
  message: (ws, message, isBinary) => {
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
    ws.publish('home/sensors/temperature', message);
    ws.publish('home/sensors/light', message);
  },
  drain: (ws) => {

  },
  close: (ws, code, message) => {
    /* The library guarantees proper unsubscription at close */
  }
});

app.post('/patch', async (res, req) => {
  readJson(res, data => {
    const workspaceId = data?.workspace;
    const patchId = data?.patchId;
    // TODO: sanitise data before pushing junk to subscribers
    if (workspaceId && patchId && !publishedPatchMap.has(patchId)) {
      const topic = `/workspaces/${workspaceId}`;
      const numSubscribers = app.numSubscribers(topic);
      if (numSubscribers) {
        console.log(`Pushing patch ${patchId} to ${numSubscribers} subscriber(s)`);
        app.publish(topic, JSON.stringify(data));
        publishedPatchMap.set(patchId, true);
      }
      res.writeStatus("200").end();
    } else {
      res.writeStatus("400").end("No workspace specified");
    }
  }, () => {
    console.warn("Error parsing json");
  });
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

app.listen(port, (token) => {
  if (token) {
    console.log('Listening to port ' + port);
  } else {
    console.log('Failed to listen to port ' + port);
  }
});