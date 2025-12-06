# @webprotocol/fetch

fetch client for `web://` protocol (NWEP)

## install

```bash
npm install @webprotocol/fetch
```

## usage

```typescript
import { read, write, modify, del } from '@webprotocol/fetch';

// read a resource
const res = await read('web://[::1]:4433/users/123');
console.log(res.json());

// write a resource
await write('web://[::1]:4433/users', {
  name: 'alice',
  email: 'alice@example.com'
});

// modify a resource
await modify('web://[::1]:4433/users/123', {
  name: 'alice cooper'
});

// delete a resource
await del('web://[::1]:4433/users/123');
```

## response helpers

```typescript
const res = await read('web://[::1]:4433/');

res.status       // 'ok' | 'error' | 'not-found' | etc
res.statusText   // 'OK' | 'Error' | 'Not Found' | etc
res.headers      // Map<string, string>
res.body         // Buffer
res.text()       // string
res.json()       // any
```

## methods

all NWEP methods are supported:

- `read(url, options?)` - READ method
- `write(url, body, options?)` - WRITE method
- `modify(url, body, options?)` - MODIFY method
- `del(url, options?)` - DELETE method
- `probe(url, options?)` - PROBE method
- `trace(url, options?)` - TRACE method

## low-level api

```typescript
import { fetch } from '@webprotocol/fetch';

const res = await fetch('web://[::1]:4433/', {
  method: 'READ',
  headers: { 'x-custom': 'value' },
  body: { foo: 'bar' }
});
```
