import uWS, { WebSocket } from 'uWebSockets.js';
import { v4 as uuid } from 'uuid';

const app = uWS.App();

const messages: { timestamp: number; userId: string; text: string }[] = [];
const users: { [id: string]: { name: string } } = {};

app.ws('/chat', {
  idleTimeout: 12,
  open(ws: WebSocket) {
    // eslint-disable-next-line no-param-reassign
    ws.id = uuid();
    users[ws.id] = { name: ws.id };
    ws.subscribe('chat');
  },
  message(ws, message) {
    try {
      const { event, data } = JSON.parse(Buffer.from(message).toString());
      // console.log(event, data);
      if (event === 'name') {
        users[ws.id].name = data.name;
        app.publish('chat', `${data.name} joined the chat!`);
        return;
      }
      if (event === 'text') {
        messages.push({ timestamp: Date.now(), userId: ws.id, text: data.text });
        app.publish('chat', `${users[ws.id].name}: ${data.text}`);
        return;
      }
    } catch (error) {
      console.error(error);
    }
  },
  close(ws) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete users[ws.id];
    // console.log('closed', ws.id);
  },
  drain: (ws) => {
    console.log(`WebSocket backpressure: ${ws.getBufferedAmount()}`);
  },
});
let clients = 0;
const interval = setInterval(() => {
  console.log(clients);
}, 1000);
app.ws('/test', {
  idleTimeout: 12,
  open() {
    clients += 1;
  },
  close() {
    clients -= 1;
  },
  message(ws, message) {
    try {
      ws.send(message);
    } catch (error) {
      console.error(error);
    }
  },
  drain: (ws) => {
    console.log(`WebSocket backpressure: ${ws.getBufferedAmount()}`);
  },
});

app.listen(8000, (listenSocket) => {
  if (listenSocket) {
    console.log('Listening to port 8000');
  }
  process.on('SIGINT', () => {
    console.log('Received stop signal, closing...');
    uWS.us_listen_socket_close(listenSocket);
    clearInterval(interval);
  });
});
