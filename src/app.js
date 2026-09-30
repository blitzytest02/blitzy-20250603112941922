// Application module: builds the HTTP server and decides every response.
// Importing it has no side effects (no port, no environment, no output), so tests import it.

import http from 'node:http';

// The one route this server answers, matched exactly and case-sensitively.
const HELLO_PATH = '/hello';

// HEAD is defined as GET without the body, so accepting it costs one entry and keeps
// `curl -I` and link checkers working.
const ALLOWED_METHODS = ['GET', 'HEAD'];

/**
 * Writes a complete plain-text response. Every response goes through this helper,
 * so the same header rules hold on every path.
 *
 * @param {http.ServerResponse} res - The response to write.
 * @param {number} statusCode - The HTTP status code, such as 200, 404 or 405.
 * @param {string} body - The fixed response text.
 * @param {Record<string, string>} [extraHeaders] - Headers added after the defaults.
 * @returns {void}
 */
function send(res, statusCode, body, extraHeaders = {}) {
  res.writeHead(statusCode, {
    // Declaring the charset fixes how clients decode the bytes instead of leaving them to guess.
    'Content-Type': 'text/plain; charset=utf-8',
    // An explicit length, in bytes rather than characters, sends the body unchunked
    // and gives HEAD responses the same length a GET would carry.
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

/**
 * Request listener: routes the request and writes exactly one response.
 *
 * @param {http.IncomingMessage} req - The incoming request; only its method and URL are read.
 * @param {http.ServerResponse} res - The response to write the status, headers and body to.
 * @returns {void}
 */
export function handleRequest(req, res) {
  // URL.parse returns null for an unparseable target such as `http://[`, where `new URL()`
  // would throw ERR_INVALID_URL and the uncaught error would crash the server. A null result
  // leaves pathname undefined, which falls through to 404. The base only resolves relative
  // targets like `/hello?name=reader` and never reaches a response.
  const pathname = URL.parse(req.url, 'http://localhost')?.pathname;

  // The path is checked before the method: an unknown path is 404 whatever the method.
  if (pathname !== HELLO_PATH) {
    send(res, 404, 'Not Found');
    return;
  }

  // HTTP semantics require a 405 to list the methods the resource accepts in `Allow`.
  if (!ALLOWED_METHODS.includes(req.method)) {
    send(res, 405, 'Method Not Allowed', { Allow: ALLOWED_METHODS.join(', ') });
    return;
  }

  // For HEAD, Node.js drops the body itself and keeps the same headers,
  // including Content-Length: 11.
  send(res, 200, 'Hello world');
}

/**
 * Creates the tutorial's HTTP server with handleRequest as its request listener.
 *
 * @returns {http.Server} A server that is not yet listening; the caller chooses port and host.
 */
export function createServer() {
  return http.createServer(handleRequest);
}
