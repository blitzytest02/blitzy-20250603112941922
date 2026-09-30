# Node.js Hello World Tutorial

## What you will build

You will build and run a small Node.js HTTP server with exactly one endpoint, `/hello`, which
answers with the plain-text response `Hello world`: 11 characters, with no trailing newline. The
project uses only what ships with Node.js, so there are no dependencies to install and no build
step, and the files you read are exactly the files that run.

## Prerequisites

- **Node.js 24 LTS or later.** Check with `node --version`: it must print `v24.` followed by the
  rest of the version number, or a higher major version. Installers are at
  <https://nodejs.org>.
- **npm**, which is bundled with Node.js. Node.js 24 ships with npm 11.x, so there is nothing
  extra to install.
- **curl or a web browser**, to call the endpoint.

> **Windows PowerShell users:** type `curl.exe` wherever this tutorial says `curl`. In Windows
> PowerShell, `curl` is an alias for `Invoke-WebRequest`, which does not accept curl's options.

## Install

Open a terminal in the project directory, the folder that contains `package.json`, and run:

```bash
npm install
```

The project has no dependencies, so there is nothing to download. The command only confirms that
`package.json` and the committed lockfile, `package-lock.json`, agree. The "1 package" it audits
is the project itself. The output looks like this, and the duration varies:

```text
up to date, audited 1 package in 157ms

found 0 vulnerabilities
```

## Run

Start the server:

```bash
npm start
```

npm first prints the script it is running, then the server prints the address it listens on:

```text
> node-hello-tutorial@1.0.0 start
> node src/server.js

Server listening on http://127.0.0.1:3000
```

The command keeps running, because the server is waiting for requests. Leave it running and open
a second terminal for [Calling the endpoint](#calling-the-endpoint).

### Choosing a different port

The server reads its port from the `PORT` environment variable, and uses `3000` when `PORT` is
unset or empty. How you set an environment variable depends on your shell.

bash or zsh (macOS, Linux):

```bash
PORT=4000 npm start
```

PowerShell:

```powershell
$env:PORT = "4000"
npm start
```

cmd.exe:

```bat
set PORT=4000
npm start
```

The log line then reads `Server listening on http://127.0.0.1:4000`, so use port 4000 in the
URLs that follow. The bash and zsh form sets `PORT` for that one command only. In PowerShell and
cmd.exe the variable stays set for the rest of the terminal session, and `Remove-Item Env:PORT`
(PowerShell) or `set PORT=` (cmd.exe) clears it again.

`PORT` must be an integer from 0 to 65535. Any other value stops the process before the server is
created: it prints one line on stderr and exits with code 1.

```bash
PORT=abc npm start
```

```text
> node-hello-tutorial@1.0.0 start
> node src/server.js

Invalid PORT "abc": expected an integer from 0 to 65535
```

`PORT=0` is valid. It asks the operating system for any free port, and the log line shows the port
it picked, for example `Server listening on http://127.0.0.1:39761` (the number varies).

### Choosing who can connect

The `HOST` environment variable sets the network address the server listens on. It defaults to
`127.0.0.1`, the loopback address, which only programs on your own machine can reach. That is the
safe default for a tutorial: nobody else on your Wi-Fi or office network can call your server by
accident.

| `HOST` | Who can connect | Log line |
|---|---|---|
| unset or empty | Only your machine, over IPv4 | `Server listening on http://127.0.0.1:3000` |
| `0.0.0.0` | Any machine that can reach yours, over IPv4 | `Server listening on http://0.0.0.0:3000` |
| `::1` | Only your machine, over IPv6 | `Server listening on http://[::1]:3000` |

For example, `HOST=0.0.0.0 npm start` lets other machines call the server through your machine's
IP address, so only do it on a network you trust. A URL writes an IPv6 address in square brackets,
which is why `::1` is logged as `[::1]`.

### Restarting automatically while you edit

```bash
npm run dev
```

This runs the server with `node --watch`, which restarts it whenever you save `src/server.js` or
`src/app.js`. On each save, Node.js prints `Change detected in` followed by the changed file's path,
then `Restarting 'src/server.js'`. The old server logs `Received SIGTERM, shutting down`, because
watch mode stops it with the SIGTERM signal, and the new one logs its `Server listening on` line.
Stop it with Ctrl+C.

### Stopping the server

Press Ctrl+C in the terminal where the server is running. Ctrl+C sends the process the SIGINT
signal, and the server prints:

```text
Received SIGINT, shutting down
```

It then stops accepting connections, closes idle ones and exits with code 0. npm receives the same
Ctrl+C and reports it as exit status 130, the conventional code for a command interrupted by
Ctrl+C. Run `node src/server.js` directly to see the server's own exit code, 0.

If a client keeps a request open, the shutdown waits for it. A second Ctrl+C ends the process
immediately. On Windows, Ctrl+C delivers SIGINT the same way, but SIGTERM, the other signal the
server handles, is not delivered there as it is on macOS and Linux.

### When the server cannot start

If the server cannot start listening, it prints one line on stderr and exits with code 1, which
npm passes on as the result of the `start` script. The failure beginners meet first is a port
that another program already uses, often a server you started earlier and forgot about:

```text
Failed to start server: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

To see this for yourself, leave the first server from `npm start` running in its terminal, open a
second terminal in the project directory, and start the server again:

```bash
npm start
```

The second start cannot listen on port 3000, because the first server already does:

```text
> node-hello-tutorial@1.0.0 start
> node src/server.js

Failed to start server: listen EADDRINUSE: address already in use 127.0.0.1:3000
```

The `Failed to start server` line goes to stderr, and the process exits with code 1, which npm
reports as a failed `start` script by exiting with status 1 itself. In bash or zsh, run this right
after the failed start to see that status:

```bash
echo $?
```

```text
1
```

The first server is unaffected and keeps running. Call it from the second terminal to confirm
(the curl options are explained in [Calling the endpoint](#calling-the-endpoint)):

```bash
curl -s -w "\n" http://127.0.0.1:3000/hello
```

```text
Hello world
```

Stop the other program, or choose another port, for example `PORT=4000 npm start`. The same line
reports other failures too: `EACCES` for a port your user is not allowed to open,
`getaddrinfo ENOTFOUND <host>` for a `HOST` name that does not resolve, and
`listen EADDRNOTAVAIL: address not available ::1:3000` for `HOST=::1` on a machine with IPv6
turned off.

## Calling the endpoint

With the server running, run this in a second terminal:

```bash
curl -s -w "\n" http://127.0.0.1:3000/hello
```

It prints exactly one line:

```text
Hello world
```

`-s` (silent) hides curl's progress meter. `-w "\n"` makes curl print a newline after the
response, only so that your prompt starts on a fresh line. The response body itself is exactly
`Hello world`, with no newline.

### Seeing the status line and headers

Every HTTP response has three parts:

- a **status line**, whose numeric **status code** says how the request went (`200` means OK);
- **headers**, name and value pairs that describe the response;
- the **body**, the content itself.

`-i` makes curl print all three. `-sS` hides the progress meter but still shows errors.

```bash
curl -sS -i http://127.0.0.1:3000/hello
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 11
Date: Wed, 30 Sep 2026 06:01:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Hello world
```

The `Date` value varies. The body has no trailing newline, so your prompt appears right after
`Hello world` on the same line.

The code in `src/app.js` sets only `Content-Type` and `Content-Length`. Node.js adds `Date`,
`Connection` and `Keep-Alive` itself: `Connection: keep-alive` lets the client reuse the same
connection for its next request, and `Keep-Alive: timeout=5` says the server closes a connection
that stays idle for 5 seconds.

### In a browser

Open <http://127.0.0.1:3000/hello> in a web browser. It shows `Hello world` as plain text, because
the server declares the response as `text/plain`. Browsers also request `/favicon.ico`, the tab
icon, on their own. The server answers that request with `404 Not Found`, so a 404 for
`/favicon.ico` in the browser's developer tools is expected.

### The other responses

The server gives a deliberate answer to every request, including the ones it does not serve.
Every request carries an HTTP **method**, the verb that says what the client wants: `GET` fetches
a resource, `HEAD` fetches only its headers, and `POST` sends data to it. curl sends `GET` unless
you tell it otherwise.

| Command | Status | What curl prints |
|---|---|---|
| `curl -s -w "\n" http://127.0.0.1:3000/goodbye` | `404 Not Found`: no such path | `Not Found` |
| `curl -s -w "\n" -X POST http://127.0.0.1:3000/hello` | `405 Method Not Allowed`: the path exists, but not for this method | `Method Not Allowed` |
| `curl -sS -I http://127.0.0.1:3000/hello` | `200 OK` for a `HEAD` request | The same headers as `GET`, including `Content-Length: 11`, and no body |

A `405` response also tells the client which methods the path does accept, in the `Allow` header:

```bash
curl -sS -i -X POST http://127.0.0.1:3000/hello
```

```text
HTTP/1.1 405 Method Not Allowed
Content-Type: text/plain; charset=utf-8
Content-Length: 18
Allow: GET, HEAD
Date: Wed, 30 Sep 2026 06:01:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Method Not Allowed
```

Node.js itself answers a method name its HTTP parser does not recognise, such as `FOO /hello` or a
lowercase `get`, with `400 Bad Request`, and closes any `CONNECT` request, before either can reach
the code in `src/app.js`.

## Running the tests

From the project directory, run:

```bash
npm test
```

`npm test` runs `node --test`, the test runner built into Node.js. Given no file names, it finds
test files by their names, which in this project means `test/app.test.js`. The tests start their
own server on a free port that the operating system picks and talk to it over loopback, so they
need no network access and pass even while `npm start` is running on port 3000. They check eight
cases:

| # | Test | What it checks |
|---|---|---|
| 1 | `GET /hello returns 200, text/plain and the exact body` | Status `200`, `Content-Type: text/plain; charset=utf-8`, `Content-Length: 11`, and a body of exactly `Hello world` |
| 2 | `GET /hello ignores the query string` | `/hello?name=reader` still returns `200` and `Hello world` |
| 3 | `HEAD /hello returns the GET headers and no body` | Status `200`, the same `Content-Type` and `Content-Length: 11`, and an empty body |
| 4 | `POST /hello returns 405 with an Allow header` | Status `405`, `Allow: GET, HEAD`, `Content-Type: text/plain; charset=utf-8`, and the body `Method Not Allowed` |
| 5 | `an unknown path returns 404` | `GET /goodbye` returns `404`, `Content-Type: text/plain; charset=utf-8`, and the body `Not Found` |
| 6 | `POST to an unknown path returns 404, not 405` | `POST /goodbye` returns `404` and `Not Found`, which proves the path is checked before the method |
| 7 | `trailing-slash and case variants of /hello return 404` | `/hello/`, `/Hello` and `/HELLO` each return `404` and `Not Found` |
| 8 | `an unparseable request target returns 404 and the server keeps running` | The request target `http://[` returns `404`, and a `GET /hello` sent afterwards still returns `200` |

A passing run prints one `✔` line per test, in file order, then a summary. The durations vary:

```text
> node-hello-tutorial@1.0.0 test
> node --test

✔ GET /hello returns 200, text/plain and the exact body (23.727764ms)
✔ GET /hello ignores the query string (2.947896ms)
✔ HEAD /hello returns the GET headers and no body (4.344158ms)
✔ POST /hello returns 405 with an Allow header (2.100924ms)
✔ an unknown path returns 404 (1.998453ms)
✔ POST to an unknown path returns 404, not 405 (1.581345ms)
✔ trailing-slash and case variants of /hello return 404 (4.275657ms)
✔ an unparseable request target returns 404 and the server keeps running (4.818317ms)
ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 146.257129
```

The lines that matter are `ℹ tests 8`, `ℹ pass 8` and `ℹ fail 0`, and `npm test` exits with code
0. A failing test prints `✖` instead of `✔`, together with the assertion that failed, and the
command exits with code 1.


## How the code works

The whole project is seven files:

```text
.
├── src/
│   ├── app.js           # createServer() and handleRequest(): routing and responses
│   └── server.js        # Entry point: reads PORT and HOST, listens, logs, handles signals
├── test/
│   └── app.test.js      # The eight tests, against a server on a free port
├── .gitignore           # Keeps node_modules/ and npm debug logs out of git
├── package.json         # Project manifest: scripts, supported Node.js versions, no dependencies
├── package-lock.json    # npm lockfile, generated by npm install
└── README.md            # This tutorial
```

Read them in the order below: the manifest, the code that answers requests, the code that runs
the server, and the tests.

### package.json

```json
{
  "name": "node-hello-tutorial",
  "version": "1.0.0",
  "description": "A Node.js tutorial project with one endpoint, /hello, that returns Hello world.",
  "private": true,
  "type": "module",
  "main": "src/server.js",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "node --test"
  }
}
```

| Field | What it does |
|---|---|
| `name`, `version` | The package's identity. npm prints both in its script banner, as in `> node-hello-tutorial@1.0.0 start`. |
| `description` | A one-line summary of the project. |
| `private` | `true` makes `npm publish` refuse to publish the project by accident. Because the package is never published, it carries no `license` field. |
| `type` | `"module"` makes Node.js treat every `.js` file as an ES module, so the code uses `import` and `export`. |
| `main` | Names the entry point, so `node .` also starts the server. |
| `engines` | Declares the Node.js versions the project supports: 24 or later. |

| Script | Command | Run it with |
|---|---|---|
| `start` | `node src/server.js` | `npm start` |
| `dev` | `node --watch src/server.js` | `npm run dev` |
| `test` | `node --test` | `npm test` |

`start` and `test` are standard script names with their own npm commands. Any other script, such
as `dev`, runs with `npm run <name>`.

There is no `dependencies` or `devDependencies` field, because everything the project needs is
built into Node.js: `node:http` serves requests, `node:test` runs the tests, and the global
`fetch` calls the server from them. `package-lock.json` is still committed, so that `npm install`
and `npm ci` stay reproducible, and `.gitignore` keeps `node_modules/` out of git if you add a
dependency later.

### src/app.js: answering requests

This module decides every response. Node.js calls its `handleRequest` function once for each
request, with two objects:

- `req`, the request (an `http.IncomingMessage`). The code reads only `req.method`, such as
  `'GET'`, and `req.url`, the request target, such as `'/hello?name=reader'`.
- `res`, the response (an `http.ServerResponse`), through which the code sends the status code,
  headers and body back.

Two constants name the route and the methods it accepts:

```js
// The one route this server answers, matched exactly and case-sensitively.
const HELLO_PATH = '/hello';

// HEAD is defined as GET without the body, so accepting it costs one entry and keeps
// `curl -I` and link checkers working.
const ALLOWED_METHODS = ['GET', 'HEAD'];
```

Every response is written by one helper, `send()`, so the same header rules hold on every path:

```js
function send(res, statusCode, body, extraHeaders = {}) {
  // Header names are case-insensitive, so an extra named Content-Type or Content-Length in any
  // letter case is dropped: it would otherwise replace a value below or be sent a second time.
  const extras = Object.entries(extraHeaders).filter(
    ([name]) => !['content-type', 'content-length'].includes(name.toLowerCase()),
  );
  res.writeHead(statusCode, {
    // Declaring the charset fixes how clients decode the bytes instead of leaving them to guess.
    'Content-Type': 'text/plain; charset=utf-8',
    // An explicit length, in bytes rather than characters, sends the body unchunked
    // and gives HEAD responses the same length a GET would carry.
    'Content-Length': Buffer.byteLength(body),
    ...Object.fromEntries(extras),
  });
  res.end(body);
}
```

- `res.writeHead()` sends the status line and the headers, and `res.end(body)` sends the body and
  finishes the response.
- `Content-Type: text/plain; charset=utf-8` tells the client that the body is plain text encoded
  as UTF-8, so terminals and browsers show it as-is instead of guessing.
- `Content-Length` is the size of the body in bytes. `Buffer.byteLength()` counts bytes, which
  differ from characters for non-ASCII text: `é` is one character but two bytes. With the length
  known up front, Node.js sends the body in one piece instead of in chunks, and a `HEAD` response
  can report the length a `GET` would carry.
- `extraHeaders` adds headers for a single response. Only the `405` response uses it, for
  `Allow`. Because HTTP header names are case-insensitive, `send()` first drops any extra named
  `Content-Type` or `Content-Length` in any letter case, so those two headers always carry the
  values `send()` computes and are never sent twice.

The request listener routes each request in three steps:

```js
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
```

**1. Find the path.** `req.url` holds the path and any query string, so the code parses it with
`URL.parse(req.url, 'http://localhost')` and keeps only `.pathname`. The base `http://localhost`
is needed only because `req.url` is usually relative, and it never appears in a response. The
comparison with `HELLO_PATH` is exact and case-sensitive:

| Request target | `pathname` | Response |
|---|---|---|
| `/hello` | `/hello` | `200` |
| `/hello?name=reader` | `/hello` | `200`: the query string is ignored |
| `/hello/` | `/hello/` | `404`: a trailing slash makes a different path, and no redirect is sent |
| `/Hello` | `/Hello` | `404`: paths are case-sensitive |
| `/goodbye` | `/goodbye` | `404` |
| `http://[` | `undefined` | `404`, and the server keeps running |

Why `URL.parse()` and not `new URL()`? Anyone can send any request target, including one that is
not a valid URL. `new URL()` throws a `TypeError` for a target such as `http://[`, and an
exception thrown inside the request listener that nothing catches ends the whole process, so a
single bad request would crash the server. `URL.parse()`, available since Node.js 22.1, returns
`null` instead. The optional chaining operator `?.` turns that `null` into `undefined`, which is
not `/hello`, so the answer is a `404` and the server keeps serving.

**2. Check the path before the method.** An unknown path returns `404 Not Found` whatever its
method, which is why `POST /goodbye` gets `404` and not `405`. Test 6 checks exactly this.

**3. Check the method.** A method outside `ALLOWED_METHODS` gets `405 Method Not Allowed`. HTTP
requires a `405` to list the accepted methods, so the code joins `ALLOWED_METHODS` into
`Allow: GET, HEAD`. Everything else is a `GET` or `HEAD` for `/hello` and gets `200 OK` with
`Hello world`. For `HEAD`, Node.js sends the same status and headers but drops the body by
itself, so the code needs no separate `HEAD` branch.

The module's only other export builds the server:

```js
export function createServer() {
  return http.createServer(handleRequest);
}
```

`http.createServer(handleRequest)` returns a server that is not yet listening. The caller chooses
the port and host, which is what lets `src/server.js` and the tests share the same server.
`src/app.js` reads no environment variables, opens no port and prints nothing, so importing it has
no side effects.

### src/server.js: running the server

This is the entry point that `npm start`, `npm run dev` and `node .` run. It first reads and
checks the port:

```js
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
```

Environment variables are always strings, and an empty string is falsy, so an unset or empty
`PORT` falls back to `DEFAULT_PORT` (3000). `Number()` converts everything else. It turns `'abc'`
into `NaN`, which fails `Number.isInteger()`, and it also accepts forms such as `0x10` (16) and
`1e3` (1000). A rejected value prints the one-line message and exits with code 1 before any
server exists.

The rejected value is printed through `escapeForLog()`, a helper defined near the top of the file:

```js
// Renders a value for a one-line log message, which guards against log injection (CWE-117): a
// PORT, or a HOST that getaddrinfo repeats in err.message, could otherwise carry a newline that
// forges an extra log line, or an escape code the terminal acts on. JSON.stringify escapes \n and
// the other C0 controls, the backslash and the double quote; the replace adds DEL, the C1
// controls and the U+2028 and U+2029 line breaks. Other text, such as é, is left unchanged.
function escapeForLog(text) {
  const escaped = JSON.stringify(String(text)).slice(1, -1);
  return escaped.replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
  });
}
```

An environment variable can hold any text, including a line break. Printed as it is, a `PORT`
made of `abc`, a line break and `Failed to start server: forged` would add a second, fake line to
the output that looks exactly like a real message. Planting lines in a log this way is called log
injection. `escapeForLog()` prints such characters as escape sequences instead, so the message
stays on one line and shows `Invalid PORT "abc\nFailed to start server: forged"`, followed by the
usual `: expected an integer from 0 to 65535`. `JSON.stringify()` writes the same escapes a
JavaScript string literal uses, and `.slice(1, -1)` removes the double quotes it adds around them.
The `replace()` call covers the few invisible characters that `JSON.stringify()` leaves as they
are, among them the Unicode line separators U+2028 and U+2029. An ordinary value such as `abc`
comes back unchanged, so the messages in the Run section are exactly what the server prints.

Before `process.exit(1)`, the code waits for `flush()`, the other helper at the top of the file:

```js
// Resolves once everything written to `stream` so far has reached the operating system, because
// process.exit() discards a write still pending when stdout or stderr is a pipe whose reader has
// fallen behind. Writes complete in order, so this empty write's callback follows the line before
// it. If the reader has gone, the EPIPE also arrives as an 'error' event that, unhandled, would
// replace the exit code with a stack trace. The listener stays: an exit follows every flush.
function flush(stream) {
  return new Promise((resolve) => {
    stream.on('error', resolve);
    stream.write('', resolve);
  });
}
```

Usually `console.error()` hands its line to the operating system at once. When stderr is piped
into another program that has fallen behind, though, the pipe is full and Node.js keeps the line
queued until there is room. `process.exit()` ends the process immediately and throws that queue
away, so the one line explaining the failure would be lost. `flush()` writes an empty string with
a callback. A stream completes its writes in order, so the callback runs only once the line
before it has gone out, and `await` waits for that callback. This is a top-level `await`, which
ES modules allow outside any function: it pauses the rest of the file, so a rejected `PORT` still
exits before the server is created. If the reading program has already exited, the write fails
with `EPIPE`, which Node.js also reports as an `'error'` event on the stream. The `'error'`
listener resolves the promise as well, so the process ends with its own exit code instead of a
stack trace.

The host is read the same way as the port, with `DEFAULT_HOST` set to `'127.0.0.1'`:

```js
const host = process.env.HOST || DEFAULT_HOST;
```

Next the server is created, and an `'error'` listener is attached before `listen()` is called:

```js
server.on('error', async (err) => {
  console.error(`Failed to start server: ${escapeForLog(err.message)}`);
  // The process is already on its way to exit code 1. Without the shutdown handlers, a signal
  // during the wait below ends it at once instead of running shutdown(), which would exit with 0.
  process.removeAllListeners('SIGINT').removeAllListeners('SIGTERM');
  await flush(process.stderr);
  process.exit(1);
});
```

`listen()` does not throw when the port is busy (`EADDRINUSE`), not permitted (`EACCES`) or the
host does not resolve (`ENOTFOUND`). The server reports those failures later, as an `'error'`
event. Without a listener, Node.js would treat the event as an uncaught error and print a stack
trace, so the code registers one first and prints a single readable line instead.

The message goes through `escapeForLog()` too, because for `ENOTFOUND` it repeats the `HOST`
value: `getaddrinfo ENOTFOUND <host>`. A `HOST` containing a line break could otherwise forge a
line such as `Server listening on ...`. Only the printed text is escaped. `listen()` still
receives `HOST` exactly as you set it.

The listener is `async` so that it can wait for `flush()` before `process.exit(1)`, as the `PORT`
check does. Before waiting, it removes the SIGINT and SIGTERM handlers shown at the end of this
section. The process is already failing, so a signal that arrives while the line is still on its
way out should stop it at once, not run the shutdown code, which exits with the success code 0.

Then the server starts listening:

```js
server.listen(port, host, () => {
  // address() reports the port actually bound, so PORT=0 logs the one the OS assigned.
  const actualPort = server.address().port;
  // An IPv6 literal such as ::1 must be wrapped in brackets inside a URL: http://[::1]:3000.
  const urlHost = host.includes(':') ? `[${host}]` : host;
  console.log(`Server listening on http://${urlHost}:${actualPort}`);
});
```

The callback runs only once the server is accepting connections, so the log line never announces
an address that cannot be reached yet. A host that contains `:` is an IPv6 address.

Finally, the process handles the two shutdown signals:

```js
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  // Started at once, so the line goes out and a write error is caught while close() waits.
  const logFlushed = flush(process.stdout);
  // Since Node.js 19, close() stops accepting connections and also closes idle keep-alive ones,
  // so a finished curl or browser request does not keep the process alive.
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
```

SIGINT is what Ctrl+C sends. SIGTERM is the standard "please stop" signal, sent by `kill`, by
process managers and by `npm run dev` on each restart. `shutdown()` calls `flush()` right after
logging, so the line is already on its way out while the server closes, and a write error is
caught from that moment on. The callback given to `server.close()` runs once every connection has
closed. It waits for that flush, and `process.exit(0)` then ends the process with the success
code.

### test/app.test.js: testing the server

The test file imports the runner, the assertions, the `http` module and the server factory:

```js
import { test, before, after } from 'node:test';
// The strict variant makes assert.equal compare with Object.is, so the string '11' from a header
// never passes for the number 11 and no loose coercion hides a wrong value.
import assert from 'node:assert/strict';
import http from 'node:http';
// Only app.js is imported. server.js reads PORT, binds a real port (3000 by default) and
// installs signal handlers, none of which a test should trigger.
import { createServer } from '../src/app.js';
```

Two hooks start one real server before the tests and stop it after them:

```js
before(async () => {
  server = createServer();
  // Port 0 asks the operating system for any free port, so these tests pass while the reader's
  // own server holds 3000, and loopback means they need no network access.
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  // address() returns null until the server is listening, so the port is read only after the
  // listen callback has fired.
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// close() returns the server rather than a promise, so wrapping its callback is what makes the
// runner wait for the shutdown. Since Node.js 19 it also closes the idle keep-alive connections
// fetch leaves open, so the test process exits as soon as the summary prints.
after(() => new Promise((resolve) => server.close(resolve)));
```

`before` runs once before the first test and `after` once after the last. `listen()` and
`close()` report completion through callbacks, not promises, so each hook passes a promise's
`resolve` function as the callback. The runner waits for that promise, so no test starts before
the server is listening, and the process does not exit before the server has closed.

Each test sends a request with the global `fetch` and asserts on the response:

```js
test('GET /hello returns 200, text/plain and the exact body', async () => {
  const res = await fetch(`${baseUrl}/hello`);

  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  // Content-Length counts bytes: 11 means no trailing newline and no surrounding quotes.
  assert.equal(res.headers.get('content-length'), '11');
  assert.equal(await res.text(), 'Hello world');
});
```

`res.headers.get()` looks headers up case-insensitively and returns their values as strings, which
is why the expected length is `'11'`, not `11`. With `node:assert/strict`, `assert.equal` uses
strict comparison, so the number `11` would fail.

The last test needs a request that `fetch` cannot send. `fetch` normalises every URL, so it can
never put `http://[` on the wire. The test uses `http.get` instead, with the options
`{ host: '127.0.0.1', port: server.address().port, path: 'http://[' }`, because `http.get` writes
`path` into the request line exactly as given. It expects `404`, then sends a normal
`GET /hello` and expects `200`, which proves the server survived. If a change ever made the
handler throw on that target, the test would fail at once with the thrown error rather than wait
for a response that never comes.

### Where a new route would go

To add a route of your own, extend `handleRequest` in `src/app.js`: give the new path its own
constant, and handle it before the `if (pathname !== HELLO_PATH)` check, because that check
answers `404` for every path other than `/hello`. Send its responses through `send()` so they get
the same headers, and add a test for it to `test/app.test.js`. This project deliberately ships with
`/hello` as its only endpoint.
