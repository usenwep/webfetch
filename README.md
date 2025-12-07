@webprotocol/fetch
==================

A fetch-like client library for NWEP (New Web Exchange Protocol). Simple, modern, and built on QUIC.

## Installation

```bash
npm install @webprotocol/fetch
```

## Quick Start

```javascript
import { read, write, modify, del } from '@webprotocol/fetch';

// READ request - retrieve a resource
const response = await read('web://[::1]:4433/users/123');
console.log(response.json());

// WRITE request - create a resource
await write('web://[::1]:4433/users', {
  name: 'alice',
  email: 'alice@example.com'
});

// MODIFY request - update a resource
await modify('web://[::1]:4433/users/123', {
  name: 'Alice Cooper'
});

// DELETE request - remove a resource
await del('web://[::1]:4433/users/123');
```

## API Reference

### read(url, options?)

Retrieve a resource from the server.

```javascript
const response = await read('web://[::1]:4433/api/data');
console.log(response.status);     // 'ok'
console.log(response.text());     // raw text
console.log(response.json());     // parsed JSON
```

**Options:**
- `headers?: Record<string, string>` - Custom request headers

### write(url, body, options?)

Create or replace a resource.

```javascript
await write('web://[::1]:4433/users', {
  name: 'alice',
  email: 'alice@example.com'
});

// With custom headers
await write('web://[::1]:4433/data', payload, {
  headers: {
    'content-type': 'application/octet-stream'
  }
});
```

**Parameters:**
- `url: string` - Target URL with `web://` scheme
- `body: string | object` - Request payload (objects auto-serialized to JSON)
- `options?: object` - Optional configuration
  - `headers?: Record<string, string>` - Custom headers

### modify(url, body, options?)

Partially update a resource.

```javascript
await modify('web://[::1]:4433/users/123', {
  name: 'Alice Cooper'
});
```

**Parameters:**
- `url: string` - Target URL
- `body: string | object` - Update payload
- `options?: object` - Optional configuration

### del(url, options?)

Delete a resource.

```javascript
await del('web://[::1]:4433/users/123');
```

**Parameters:**
- `url: string` - Target URL
- `options?: object` - Optional configuration

### probe(url, options?)

Query resource capabilities without retrieving the full content.

```javascript
const info = await probe('web://[::1]:4433/api');
console.log(info.headers);
```

### trace(url, options?)

Diagnostic echo request for debugging.

```javascript
const result = await trace('web://[::1]:4433/debug');
```

### fetch(url, options)

Low-level fetch function with full control.

```javascript
import { fetch } from '@webprotocol/fetch';

const response = await fetch('web://[::1]:4433/api/users', {
  method: 'READ',
  headers: {
    'accept': 'application/json'
  }
});
```

**Options:**
- `method?: NwepMethod` - READ, WRITE, MODIFY, DELETE, PROBE, TRACE
- `headers?: Record<string, string>` - Custom headers
- `body?: string | object` - Request payload

## Response Object

All request methods return a `FetchResponse`:

```javascript
const response = await read('web://[::1]:4433/users/123');

response.status       // 'ok', 'not_found', 'internal_error', etc.
response.statusText   // Human-readable status
response.headers      // Map<string, string>
response.body         // Buffer (raw bytes)

response.text()       // string
response.json()       // any (parsed JSON)
```

## NWEP Protocol

NWEP (New Web Exchange Protocol) simplifies HTTP semantics:

**Methods:**
- `READ` - Retrieve a resource (like GET)
- `WRITE` - Create or replace (like POST)
- `MODIFY` - Update existing (like PUT/PATCH)
- `DELETE` - Remove a resource
- `PROBE` - Query capabilities (like HEAD)
- `CONNECT` - Establish tunnel
- `TRACE` - Diagnostic echo

**Status Tokens:**
- `ok` (200), `created` (201), `accepted` (202), `no_content` (204)
- `bad_request` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404)
- `internal_error` (500), `not_implemented` (501), `service_unavailable` (503)

**URI Scheme:**
- Uses `web://` instead of `https://`

## Examples

### Basic CRUD Operations

```javascript
import { read, write, modify, del } from '@webprotocol/fetch';

// Create
await write('web://api.example.com/users', {
  name: 'alice',
  email: 'alice@example.com'
});

// Read
const user = await read('web://api.example.com/users/123');
console.log(user.json());

// Update
await modify('web://api.example.com/users/123', {
  email: 'alice.cooper@example.com'
});

// Delete
await del('web://api.example.com/users/123');
```

### Error Handling

```javascript
import { read } from '@webprotocol/fetch';

try {
  const response = await read('web://[::1]:4433/users/999');

  if (response.status !== 'ok') {
    console.error(`Error: ${response.status}`);
    return;
  }

  console.log(response.json());
} catch (err) {
  console.error('Request failed:', err.message);
}
```

### Custom Headers

```javascript
import { write } from '@webprotocol/fetch';

await write('web://[::1]:4433/data', payload, {
  headers: {
    'content-type': 'application/octet-stream',
    'x-api-key': 'secret'
  }
});
```

### IPv4 and IPv6

```javascript
// IPv6 (use brackets)
await read('web://[::1]:4433/api');
await read('web://[2001:db8::1]:4433/api');

// IPv4
await read('web://127.0.0.1:4433/api');
await read('web://192.168.1.100:4433/api');

// Domain names (when DNS supports NWEP)
await read('web://api.example.com/users');
```

## TypeScript

Full TypeScript support included:

```typescript
import { read, write, FetchResponse, NwepMethod } from '@webprotocol/fetch';

interface User {
  id: number;
  name: string;
  email: string;
}

const response = await read('web://[::1]:4433/users/123');
const user = response.json<User>();

console.log(user.name); // Type-safe!
```

## Requirements

- Node.js 12.22+ / 14.17+ / 15.12+ / 16.0+
- `@webprotocol/nwep` (automatically installed)

## How It Works

Under the hood, `@webprotocol/fetch` uses [@webprotocol/nwep](https://github.com/usenwep/quiche-nwep/tree/main/node) for QUIC transport and NWEP protocol handling. It provides a high-level, Promise-based API that handles:

- Connection management
- QUIC packet handling
- NWEP header construction
- Timeout handling
- Error management
- Response parsing

For lower-level control, use `@webprotocol/nwep` directly.

## License

ISC

## Links

- [NWEP Specification](https://github.com/usenwep/spec)
- [@webprotocol/nwep](https://github.com/usenwep/quiche-nwep/tree/main/node) - Low-level QUIC/NWEP bindings
- [@webprotocol/server](https://github.com/usenwep/server) - NWEP server framework
- [quiche-nwep](https://github.com/usenwep/quiche-nwep) - Core implementation
