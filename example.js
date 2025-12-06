import { read, write, modify, del, probe } from './index.js';

// simple read
const res = await read('web://[::1]:4433/');
console.log(res.json());

// write with auto json
await write('web://[::1]:4433/users', {
  name: 'alice',
  email: 'alice@example.com'
});

// modify
await modify('web://[::1]:4433/users/123', {
  name: 'alice cooper'
});

// probe capabilities
const caps = await probe('web://[::1]:4433/api');
console.log(caps.json());

// delete
await del('web://[::1]:4433/users/123');
