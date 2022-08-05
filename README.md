## socket.io-patch-server

A very simple socket.io server for recieving and broadcasting data model patches between clients in the same workspace.

### Server
Just run `yarn run start-server` to start up the server on port 9001. The server will allow clients to connect and subscribe to a workspace by sending the `"sub"` event with a workspace ID.

### Client
An example client is provided (run using `yarn run start-client`). The client connects to the server, subscribes to the `"my-workspace"` workspace and submits an exxample patch to document `"doc1"`.
