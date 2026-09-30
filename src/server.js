// Entry point: reads PORT and HOST, starts the server built in app.js, logs where it listens,
// and reports startup errors and shutdown signals. `npm start`, `npm run dev` and `node .` run it.

import { createServer } from './app.js';

const DEFAULT_PORT = 3000;

// Loopback keeps a learner's server off the local network. HOST=0.0.0.0 opts in to exposure on
// every IPv4 interface, and HOST=::1 binds the IPv6 loopback instead.
const DEFAULT_HOST = '127.0.0.1';

// Environment variables are always strings, so unset and empty both fall back to the default.
// Number() is the documented conversion, so forms such as '0x10' and '1e3' count as 16 and 1000.
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

// Checking here replaces the unhandled RangeError [ERR_SOCKET_BAD_PORT] stack trace that
// listen() throws for a value such as PORT=abc with one readable line. Port 0 is valid:
// it asks the operating system for any free port.
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(`Invalid PORT "${rawPort}": expected an integer from 0 to 65535`);
  process.exit(1);
}

// `||` treats an empty HOST like an unset one. Any other value reaches listen() unchanged.
const host = process.env.HOST || DEFAULT_HOST;

const server = createServer();

// Registered before listen(): a bind failure such as EADDRINUSE, EACCES or ENOTFOUND arrives as
// an 'error' event, and with no listener Node.js would throw it as an uncaught stack trace.
server.on('error', (err) => {
  console.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});

server.listen(port, host, () => {
  // address() reports the port actually bound, so PORT=0 logs the one the OS assigned.
  const actualPort = server.address().port;
  // An IPv6 literal such as ::1 must be wrapped in brackets inside a URL: http://[::1]:3000.
  const urlHost = host.includes(':') ? `[${host}]` : host;
  console.log(`Server listening on http://${urlHost}:${actualPort}`);
});

// Stops the server in response to a signal and exits once every connection has closed.
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  // Since Node.js 19, close() stops accepting connections and also closes idle keep-alive ones,
  // so a finished curl or browser request does not keep the process alive.
  server.close(() => process.exit(0));
}

// process.once removes each handler after its first signal, so a second Ctrl+C falls through to
// Node's default handling and ends the process at once. That is the escape hatch when a client
// holds a request open and close() would otherwise wait for it.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => shutdown(signal));
}
