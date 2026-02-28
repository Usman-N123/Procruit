const fs = require('fs');

const API_URL = 'http://127.0.0.1:5001/api';
const EMAIL = `testupdate_${Date.now()}@test.com`;
const PASSWORD = 'password123';

async function run() {
    try {
        // 1. Register Candidate
        console.log('Registering user...');
        const regRes = await fetch(`${API_URL}/auth/register-candidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Uploader',
                email: EMAIL,
                password: PASSWORD
            })
        });
        const regData = await regRes.json();

        if (!regRes.ok) throw new Error(`Registration failed: ${regData.message}`);

        // 2. Login to get Token
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);

        const token = loginData.token;
        console.log('Got Token:', token ? 'Yes' : 'No');

        // 3. Create a dummy file
        const fileName = 'test-image.txt';
        fs.writeFileSync(fileName, 'This is a dummy image content');
        const fileContent = fs.readFileSync(fileName);
        const blob = new Blob([fileContent], { type: 'text/plain' });

        // 4. Upload
        console.log('Uploading file...');
        const formData = new FormData();
        formData.append('profilePicture', blob, 'test-image.jpg'); // Mimic jpg

        const uploadRes = await fetch(`${API_URL}/users/profile-picture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Do NOT set Content-Type header when using FormData
            },
            body: formData
        });

        const text = await uploadRes.text();
        console.log('Response Status:', uploadRes.status);
        console.log('Response Body:', text);

        if (uploadRes.ok) {
            console.log('✅ Upload Test PASSED');
        } else {
            console.error('❌ Upload Test FAILED');
        }

        // Cleanup
        fs.unlinkSync(fileName);

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

run();
