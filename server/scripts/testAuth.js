const API_URL = 'http://127.0.0.1:5001/api/auth';
const BASE_URL = 'http://127.0.0.1:5001';

const checkRoot = async () => {
    try {
        const res = await fetch(BASE_URL);
        const text = await res.text();
        console.log('Root URL Check:', text);
    } catch (e) {
        console.error('Root URL Check Failed:', e.message);
    }
};

const post = async (url, body, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log(`POST ${url}`);
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || response.statusText);
        }
        return data;
    } else {
        const text = await response.text();
        console.error('❌ Received non-JSON response:', text.substring(0, 200)); // Print first 200 chars
        throw new Error(`Received non-JSON response: ${response.status} ${response.statusText}`);
    }
};

const runTests = async () => {
    try {
        await checkRoot();
        console.log('--- Starting User Management Verification ---');

        // 1. Register Organization & Admin
        console.log('\nTesting Organization Registration...');
        try {
            const orgRes = await post(`${API_URL}/register-org`, {
                orgName: 'Test Corp',
                name: 'Org Admin',
                email: `admin_${Date.now()}@test.com`,
                password: 'password123',
                website: 'https://testcorp.com',
                description: 'A test organization'
            });
            console.log('✅ Org Registered:', orgRes.organization.name);
            var adminToken = orgRes.token;
            var orgEmail = orgRes.email;
        } catch (e) {
            console.error('❌ Org Registration Failed:', e.message);
            return;
        }

        // 2. Add Recruiter (as Admin)
        console.log('\nTesting Add Recruiter (Admin)...');
        try {
            const recruiterRes = await post(`${API_URL}/register-recruiter`, {
                name: 'Recruiter John',
                email: `recruiter_${Date.now()}@test.com`,
                password: 'password123'
            }, adminToken);
            console.log('✅ Recruiter Added:', recruiterRes.user.name);
        } catch (e) {
            console.error('❌ Add Recruiter Failed:', e.message);
        }

        // 3. Register Freelancer
        console.log('\nTesting Freelancer Registration...');
        try {
            const freelancerRes = await post(`${API_URL}/register-freelancer`, {
                name: 'Freelancer Jane',
                email: `freelancer_${Date.now()}@test.com`,
                password: 'password123',
                hourlyRate: '50',
                yearsOfExperience: '5',
                availability: 'Weekdays',
                headline: 'Senior Dev',
                bio: 'Expert in Node.js',
                skills: ['Node.js', 'React']
            });
            console.log('✅ Freelancer Registered:', freelancerRes.name);
            console.log('   Approval Status:', freelancerRes.approvalStatus);
        } catch (e) {
            console.error('❌ Freelancer Registration Failed:', e.message);
        }

        // 4. Register Candidate
        console.log('\nTesting Candidate Registration...');
        try {
            const candidateRes = await post(`${API_URL}/register-candidate`, {
                name: 'Candidate Mike',
                email: `candidate_${Date.now()}@test.com`,
                password: 'password123'
            });
            console.log('✅ Candidate Registered:', candidateRes.name);
        } catch (e) {
            console.error('❌ Candidate Registration Failed:', e.message);
        }

        // 5. Login
        console.log('\nTesting Login...');
        try {
            const loginRes = await post(`${API_URL}/login`, {
                email: orgEmail,
                password: 'password123'
            });
            console.log('✅ Login Successful for:', loginRes.email);
        } catch (e) {
            console.error('❌ Login Failed:', e.message);
        }

        console.log('\n--- Verification Complete ---');

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
    }
};

runTests();
