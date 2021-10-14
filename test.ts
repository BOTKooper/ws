const WS = require('ws');

const randomString = (length = 1000) => {
  let string = '';
  while (string.length < length) {
    string += Math.random()
      .toString(36)
      .substr(2, 10);
  }
  return string.substr(0, length);
};

let clients = [];

function addClient() {
  return new Promise(resolve => {
    const client = new WS('ws://localhost:8000/test');
    client.on('open', () => {
      clients.push(client);
      resolve(1);
    });
  })
}

async function addClients(n) {
  let promises = [];
  for (let i = 0; i < n; i += 1) {
    promises.push(addClient());
  }
  await Promise.all(promises);
}

const data = randomString();

function test() {
  return Promise.all(clients.map((client) => {
    return new Promise((resolve, reject) => {
      const start = process.hrtime();
      client.send(data);
      client.once('message', (message) => {
        // const gotData = message.toString();
        const [s, ns] = process.hrtime(start);
        const ms = Math.round(s * 1000 + ns / 1000000);
        resolve(ms)
        // if (message.toString() === gotData) {
        // } else {
        //   reject(`expected ${data}, got ${gotData}`);
        // }
      });

    })
  }))
}

async function measureMs(fn) {
  const start = process.hrtime();
  const result = await fn();
  const end = process.hrtime(start);
  const [s, ns] = end;
  const ms = Math.round(s * 1000 + ns / 1000000);
  return [result, ms];
}

async function main() {
  await addClients(200);
  while (true) {
    const [mss, totalMs] = await measureMs(test);
    const total = mss.length;
    const avg = Math.round(mss.reduce((sum, current) => sum + current, 0) / total);
    console.log(`clients ${clients.length}, requests ${total}, avg ${avg}, total ${totalMs}`);
    addClients(100);
  }
}

main();
