## Simple Backend for a Real-time Key-Value Editing Application

(forked from socket.io-patch-server at [https://github.com/veggiesaurus/socket.io-patch-server](https://github.com/veggiesaurus/socket.io-patch-server))

A simple socket.io server for receiving and broadcasting data model patches between clients in the same workspace.

The server uses a simple in-memory database to provide a pseudo-persistent experience.

## Server

Run `npm run start-server` to start up the server on port 9001. The server will allow clients to connect and subscribe to a workspace by sending the `"subscribe"` event with a workspace ID.

You can also run the server in a container via `npm start` command.

## Client

An example client is provided (run using `npm run start-client`). The client connects to the server and subscribes to the `"my-workspace"` workspace.

A prototype for a front end is can also be seen at [key-value-editor.netlify.com](https://key-value-editor.netlify.com)

## CI/CD

Pushes to the main branch triggers a GitHub Actions workflow which builds a Docker images, stores it in the ghcr.io, connects to a VPS, downloads image and runs the container. The above hosted front-end connects to that address, while the local copy connects to localhost.
