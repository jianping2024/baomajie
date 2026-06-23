const net = require("node:net");

const services = [
  { name: "PostgreSQL", host: "127.0.0.1", port: 5433 },
  { name: "Redis", host: "127.0.0.1", port: 6379 },
  { name: "Meilisearch", host: "127.0.0.1", port: 7700 },
];

function waitForPort(host, port, timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 1000);
      });
    };

    attempt();
  });
}

async function main() {
  for (const service of services) {
    process.stdout.write(`Waiting for ${service.name} on ${service.host}:${service.port}... `);
    await waitForPort(service.host, service.port);
    process.stdout.write("ready\n");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
