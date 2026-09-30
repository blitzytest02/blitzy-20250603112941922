// Entry point: reads PORT and HOST, starts the server built in app.js, logs where it listens,
// and reports startup errors and shutdown signals. `npm start`, `npm run dev` and `node .` run it.

import { createServer } from './app.js';

const DEFAULT_PORT = 3000;

// Loopback keeps a learner's server off the local network. HOST=0.0.0.0 opts in to exposure on
// every IPv4 interface, and HOST=::1 binds the IPv6 loopback instead.
const DEFAULT_HOST = '127.0.0.1';

// Renders a value for a one-line log message, which guards against log injection (CWE-117): a
// PORT, or a HOST that getaddrinfo repeats in err.message, could otherwise carry a newline that
// forges an extra log line, an escape code the terminal acts on, or a bidi override such as
// U+202E that makes the terminal display the message in a misleading order without adding a line.
// JSON.stringify escapes \n and the other C0 controls, the backslash and the double quote; the
// replace adds DEL, the C1 controls, the invisible format characters (Cf), which include every
// bidi control, and the U+2028 and U+2029 line breaks. Other text, such as é, is left unchanged.
function escapeForLog(text) {
  const escaped = JSON.stringify(String(text)).slice(1, -1);
  return escaped.replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, (char) => {
    // A format character beyond U+FFFF, such as a tag character from U+E0020 to U+E007F, is a
    // pair of UTF-16 code units, so each unit gets its own \u escape and neither half is lost.
    return char
      .split('')
      .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`)
      .join('');
  });
}

// Resolves once everything written to `stream` so far has reached the operating system, or once
// a write fails, in which case the output still pending is lost. Callers wait for it because
// process.exit() discards a write still pending when stdout or stderr is a pipe whose reader has
// fallen behind. Writes complete in order, so this empty write's callback follows the line before
// it. If the reader has gone, the write fails with EPIPE, which also arrives as an 'error' event
// that, unhandled, would replace the exit code with a stack trace. The listener is never removed:
// that event comes after the write callback, while shutdown() may still be waiting for close().
function flush(stream) {
  return new Promise((resolve) => {
    stream.on('error', resolve);
    stream.write('', resolve);
  });
}

// Environment variables are always strings, so unset and empty both fall back to the default.
// Number() is the documented conversion, so forms such as '0x10' and '1e3' count as 16 and 1000.
const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

// Checking here replaces the unhandled RangeError [ERR_SOCKET_BAD_PORT] stack trace that
// listen() throws for a value such as PORT=abc with one readable line. Port 0 is valid:
// it asks the operating system for any free port.
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(`Invalid PORT "${escapeForLog(rawPort)}": expected an integer from 0 to 65535`);
  // Top-level await pauses the module here, so the exit still comes before the server exists.
  await flush(process.stderr);
  process.exit(1);
}

// `||` treats an empty HOST like an unset one. Any other value reaches listen() unchanged.
const host = process.env.HOST || DEFAULT_HOST;

const server = createServer();

// Registered before listen(): a bind failure such as EADDRINUSE, EACCES or ENOTFOUND arrives as
// an 'error' event, and with no listener Node.js would throw it as an uncaught stack trace.
server.on('error', async (err) => {
  console.error(`Failed to start server: ${escapeForLog(err.message)}`);
  // The process is already on its way to exit code 1. Without the shutdown handlers, a signal
  // during the wait below ends it at once instead of running shutdown(), which would exit with 0.
  process.removeAllListeners('SIGINT').removeAllListeners('SIGTERM');
  await flush(process.stderr);
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
  // Started before close(), so the line is written, or its write error such as EPIPE caught,
  // while close() waits. After a write error the line is lost, but the exit code is still 0.
  const logFlushed = flush(process.stdout);
  // On Node.js 24 and later, close() stops accepting connections and also closes idle keep-alive
  // ones, so a finished curl or browser request does not keep the process alive. A client that
  // holds a request open keeps the callback, and so the exit, waiting until that connection
  // ends, or until a second Ctrl+C ends the process at once.
  server.close(async () => {
    await logFlushed;
    process.exit(0);
  });
}

// process.once removes each handler after its first signal, so a second Ctrl+C falls through to
// Node's default handling and ends the process at once. That is the escape hatch when a client
// holds a request open and close() would otherwise wait for it.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => shutdown(signal));
}
