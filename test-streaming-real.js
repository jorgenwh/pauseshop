const https = require('https');
const http = require('http');

// Simple test image with a product (a red shirt)
const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

async function testStreamingEndpoint() {
    console.log('Testing streaming endpoint with real image...');
    
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            image: testImageData,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/analyze/stream',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                return;
            }

            console.log('✅ Connection established');
            console.log('📡 Listening for streaming events...');

            let buffer = '';
            let productCount = 0;

            res.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    
                    if (line.startsWith('event: ')) {
                        const eventType = line.substring(7).trim();
                        console.log(`📨 Event: ${eventType}`);
                    }
                    
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6).trim();
                        try {
                            const parsedData = JSON.parse(data);
                            
                            // Check if this is a product
                            if (parsedData.name && parsedData.category) {
                                productCount++;
                                console.log(`🛍️  Product ${productCount}:`, {
                                    name: parsedData.name,
                                    category: parsedData.category,
                                    brand: parsedData.brand,
                                    searchTerms: parsedData.searchTerms
                                });
                            } else {
                                console.log('📦 Data:', JSON.stringify(parsedData, null, 2));
                            }
                        } catch (e) {
                            console.log('📦 Raw data:', data);
                        }
                    }
                }
            });

            res.on('end', () => {
                console.log('🏁 Stream ended');
                console.log(`📊 Total products detected: ${productCount}`);
                resolve();
            });

            res.on('error', (error) => {
                console.error('❌ Stream error:', error.message);
                reject(error);
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Check if server is running first
async function checkServer() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/health',
            method: 'GET'
        }, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Server is running');
                resolve(true);
            } else {
                console.log('❌ Server is not running. Please start the server first:');
                console.log('   cd server && npm run dev');
                resolve(false);
            }
        });

        req.on('error', () => {
            console.log('❌ Server is not running. Please start the server first:');
            console.log('   cd server && npm run dev');
            resolve(false);
        });

        req.end();
    });
}

async function main() {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await testStreamingEndpoint();
    }
}

main().catch(console.error);