// Import required modules
const { WebSocket, WebSocketServer } = require('ws');
const http = require('http');
const uuidv4 = require('uuid').v4;

// Create an HTTP server and a WebSocket server
const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 8000;

// Start the WebSocket server
server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});

// Maintain active connections and users
const clients = {};
const users = {};
let editorContent = null;
let userActivity = [];

// Define event types
const eventTypes = {
  USER_EVENT: 'userevent',
  CONTENT_CHANGE: 'contentchange',
};

// Broadcast a message to all connected clients
function sendMessageToAllClients(json) {
  const data = JSON.stringify(json);
  for (const userId in clients) {
    const client = clients[userId];
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Handle incoming messages from clients
function processReceivedMessage(message, userId) {
  const dataFromClient = JSON.parse(message.toString());
  const json = { type: dataFromClient.type };

  if (dataFromClient.type === eventTypes.USER_EVENT) {
    users[userId] = dataFromClient;
    userActivity.push(`${dataFromClient.username} joined to collaborate`);
    json.data = { users, userActivity };
  } else if (dataFromClient.type === eventTypes.CONTENT_CHANGE) {
    editorContent = dataFromClient.content;
    json.data = { editorContent, userActivity };
  }

  sendMessageToAllClients(json);
}

// Handle disconnection of a client
function handleClientDisconnection(userId) {
  console.log(`${userId} disconnected.`);
  const json = { type: eventTypes.USER_EVENT };
  const username = users[userId]?.username || userId;
  userActivity.push(`${username} left the editor`);
  json.data = { users, userActivity };
  delete clients[userId];
  delete users[userId];
  sendMessageToAllClients(json);
}

// Handle new client connections
wsServer.on('connection', function handleNewConnection(connection) {
  const userId = uuidv4();
  console.log('Received a new connection');

  clients[userId] = connection;
  console.log(`${userId} connected.`);

  connection.on('message', (message) => processReceivedMessage(message, userId));
  connection.on('close', () => handleClientDisconnection(userId));
});
