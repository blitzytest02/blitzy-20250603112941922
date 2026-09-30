// Contract tests for the /hello endpoint, run by `npm test` (`node --test`).
// Every case talks to one real server that app.js builds, listening on an ephemeral port.

import { test, before, after } from 'node:test';
// The strict variant makes assert.equal compare with Object.is, so the string '11' from a header
// never passes for the number 11 and no loose coercion hides a wrong value.
import assert from 'node:assert/strict';
import http from 'node:http';
// Only app.js is imported. server.js reads PORT, binds a real port (3000 by default) and
// installs signal handlers, none of which a test should trigger.
import { createServer } from '../src/app.js';

// before fills in both properties once the server is listening; after and every test read them.
// Sharing them as properties of one const object means no binding is ever reassigned.
const fixture = { server: undefined, baseUrl: undefined };

before(async () => {
  const server = createServer();
  // Port 0 asks the operating system for any free port, so these tests pass while the reader's
  // own server holds 3000, and loopback means they need no network access. A bind failure
  // arrives as an 'error' event, not through the listen callback, so without this listener the
  // promise would never settle. It is removed once listening, so it cannot swallow later errors.
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
  fixture.server = server;
  // address() returns null until the server is listening, so the port is read only after the
  // listen callback has fired.
  fixture.baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// close() returns the server rather than a promise, so wrapping its callback is what makes the
// runner wait for the shutdown. On Node.js 24 and later it also closes the idle keep-alive
// connections fetch leaves open, so the test process exits as soon as the summary prints.
// fixture.baseUrl stays unset when listen() failed, which before has already reported, so there is
// nothing to close. A close() error, such as ERR_SERVER_NOT_RUNNING after an early close,
// rejects the hook so the failure is reported instead of hidden.
after(async () => {
  if (fixture.baseUrl === undefined) {
    return;
  }
  await new Promise((resolve, reject) => {
    fixture.server.close((err) => (err ? reject(err) : resolve()));
  });
});

test('GET /hello returns 200, text/plain and the exact body', async () => {
  const res = await fetch(`${fixture.baseUrl}/hello`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  // Content-Length counts bytes: 11 means no trailing newline and no surrounding quotes.
  assert.equal(res.headers.get('content-length'), '11');
  assert.equal(await res.text(), 'Hello world');
});

test('GET /hello ignores the query string', async () => {
  const res = await fetch(`${fixture.baseUrl}/hello?name=reader`);

  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'Hello world');
});

test('HEAD /hello returns the GET headers and no body', async () => {
  const res = await fetch(`${fixture.baseUrl}/hello`, { method: 'HEAD' });

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  // HEAD reports the length a GET body would have, even though no body is sent.
  assert.equal(res.headers.get('content-length'), '11');
  assert.equal(await res.text(), '');
});

test('POST /hello returns 405 with an Allow header', async () => {
  const res = await fetch(`${fixture.baseUrl}/hello`, { method: 'POST' });

  assert.equal(res.status, 405);
  // HTTP semantics require a 405 response to list the methods the resource does accept.
  assert.equal(res.headers.get('allow'), 'GET, HEAD');
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await res.text(), 'Method Not Allowed');
});

test('an unknown path returns 404', async () => {
  const res = await fetch(`${fixture.baseUrl}/goodbye`);

  assert.equal(res.status, 404);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await res.text(), 'Not Found');
});

test('POST to an unknown path returns 404, not 405', async () => {
  // A 405 here would mean the method was checked first. 404 proves the handler resolves the
  // path before it looks at the method, so an unknown path is "not found" whatever the method.
  const res = await fetch(`${fixture.baseUrl}/goodbye`, { method: 'POST' });

  assert.equal(res.status, 404);
  assert.equal(await res.text(), 'Not Found');
});

test('trailing-slash and case variants of /hello return 404', async () => {
  // Paths match exactly and case-sensitively, and no redirect is issued for a trailing slash.
  // The path is the assertion message, so a failure names the variant that broke.
  for (const path of ['/hello/', '/Hello', '/HELLO']) {
    const res = await fetch(`${fixture.baseUrl}${path}`);

    assert.equal(res.status, 404, path);
    assert.equal(await res.text(), 'Not Found', path);
  }
});

test('an unparseable request target returns 404 and the server keeps running', async () => {
  // fetch() normalises every URL before sending it, so it cannot produce this target.
  // http.get writes the path into the request line verbatim. On 'http://[' `new URL()` throws
  // ERR_INVALID_URL, which would escape the handler and crash the server; URL.parse returns
  // null instead, so the handler answers 404.
  const statusCode = await new Promise((resolve, reject) => {
    const req = http.get(
      { host: '127.0.0.1', port: fixture.server.address().port, path: 'http://[' },
      (res) => {
        // Draining the body lets the response end and frees the socket, so it cannot hold
        // the test process open.
        res.on('error', reject);
        res.on('end', () => resolve(res.statusCode));
        res.resume();
      },
    );
    // Run standalone, a handler that throws on this target crashes the server. Inside the test
    // runner the error is caught instead and this request would wait forever for a reply, so a
    // monitor, which observes an uncaught error without handling it, fails the test at once
    // with that error. Destroying the request frees the socket so the after hook can close.
    const onUncaught = (err) => {
      req.destroy();
      reject(err);
    };
    process.once('uncaughtExceptionMonitor', onUncaught);
    req.on('close', () => process.removeListener('uncaughtExceptionMonitor', onUncaught));
    req.on('error', reject);
  });

  assert.equal(statusCode, 404);

  // A normal request after the malformed one proves the process survived it.
  const res = await fetch(`${fixture.baseUrl}/hello`);

  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'Hello world');
});
