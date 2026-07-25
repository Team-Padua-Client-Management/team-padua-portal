const net = require('net');
const client = new net.Socket();
client.setTimeout(3000);
client.connect(5432, 'db.zdnjpiewgbcjaqruayfp.supabase.co', () => {
  console.log('Connected to port 5432');
  client.destroy();
});
client.on('error', (err) => {
  console.log('Port 5432 error:', err.message);
});
client.on('timeout', () => {
  console.log('Port 5432 timeout');
  client.destroy();
});
