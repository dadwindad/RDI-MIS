import fetch from 'node-fetch'; // No, I will use built-in fetch if node >= 18.
const base64Str = "data:text/plain;base64," + "A".repeat(3000000); // ~3MB
const payload = { document_base64: base64Str, document_name: "test.txt" };

fetch('http://localhost:3002/api/pms/projects/1/attach', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer header.eyJpZCI6MSwibmFtZSI6IkFkbWluIE9mZmljZXIiLCJyb2xlIjoiYWRtaW4ifQ==.signature'
  },
  body: JSON.stringify(payload)
})
.then(async res => {
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
})
.catch(e => console.error(e));
