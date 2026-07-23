// Test upload API
const fs = require('fs');
const path = require('path');

async function testUpload() {
  // Create a simple test image (1x1 red pixel PNG)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54,
    0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00,
    0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44,
    0xae, 0x42, 0x60, 0x82
  ]);
  
  const boundary = '----TestBoundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
    pngHeader,
    Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nuploads/collections\r\n--${boundary}--\r\n`)
  ]);

  try {
    const res = await fetch('http://localhost:3009/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: body
    });
    const data = await res.json();
    console.log('Upload result:', JSON.stringify(data, null, 2));
    console.log('Status:', res.status);
  } catch (err) {
    console.error('Upload failed:', err.message);
  }
}

testUpload();
