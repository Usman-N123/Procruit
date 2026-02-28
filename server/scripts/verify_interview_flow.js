const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const API_URL = 'http://localhost:5001/api';

async function run() {
    try {
        console.log('Starting Verification...');

        // 1. Register Org Admin
        const orgAdminEmail = `test_org_${Date.now()}@example.com`;
        const password = 'password123';
        console.log('Registering Org Admin...');
        let res = await fetch(`${API_URL}/auth/register-org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Org Admin',
                email: orgAdminEmail,
                password: password,
                orgName: 'Test Corp'
            })
        });
        let data = await res.json();
        if (!res.ok) throw new Error(`Register Org Failed: ${data.message}`);
        const orgToken = data.token;
        console.log('Org Admin Registered');

        // 2. Add Recruiter
        const recruiterEmail = `test_recruiter_${Date.now()}@example.com`;
        console.log('Adding Recruiter...');
        res = await fetch(`${API_URL}/auth/register-recruiter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${orgToken}`
            },
            body: JSON.stringify({
                name: 'Test Recruiter',
                email: recruiterEmail,
                password: password
            })
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Add Recruiter Failed: ${data.message}`);
        console.log('Recruiter Added');

        // 3. Login as Recruiter
        console.log('Logging in as Recruiter...');
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: recruiterEmail,
                password: password
            })
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Login Recruiter Failed: ${data.message}`);
        const recruiterToken = data.token;
        const recruiterId = data._id; // Login returns _id, not user object wrapper
        console.log('Recruiter Logged In');

        // 4. Register Candidate
        const candidateEmail = `test_candidate_${Date.now()}@example.com`;
        console.log('Registering Candidate...');
        res = await fetch(`${API_URL}/auth/register-candidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Candidate',
                email: candidateEmail,
                password: password
            })
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Register Candidate Failed: ${data.message}`);
        const candidateToken = data.token;
        const candidateId = data._id; // Register candidate returns _id based on controller
        // Wait, controller returns { _id, ... } for candidate register
        console.log('Candidate Registered');

        // 5. Create Job
        console.log('Creating Job...');
        res = await fetch(`${API_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recruiterToken}`
            },
            body: JSON.stringify({
                title: 'Test Job',
                description: 'Test Description',
                requirements: 'None',
                location: 'Remote',
                type: 'Full-time',
                company: 'Test Corp'
            })
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Create Job Failed: ${data.message}`);
        const jobId = data._id;
        console.log('Job Created');

        // 6. Fetch Candidates (THE FIX CHECK)
        console.log('Fetching Candidates...');
        res = await fetch(`${API_URL}/users/candidates`, {
            headers: { 'Authorization': `Bearer ${recruiterToken}` }
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Fetch Candidates Failed: ${data.message}`);

        if (!Array.isArray(data)) throw new Error('Candidates endpoint did not return an array');
        const foundCandidate = data.find(c => c.email === candidateEmail);
        if (!foundCandidate) throw new Error('Newly created candidate not found in list');
        console.log('Candidates Fetched Successfully (Fix Verified)');

        // 7. Schedule Interview
        console.log('Scheduling Interview...');
        const scheduledTime = new Date(Date.now() + 86400000).toISOString();
        res = await fetch(`${API_URL}/interviews/schedule`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recruiterToken}`
            },
            body: JSON.stringify({
                candidateId: candidateId,
                jobId: jobId,
                scheduledTime: scheduledTime,
                notes: 'Test Interview'
            })
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Schedule Interview Failed: ${data.message}`);
        const interviewId = data._id;
        console.log('Interview Scheduled');

        // 8. Verify Candidate sees it
        console.log('Checking Candidate Interviews...');
        res = await fetch(`${API_URL}/interviews/my-interviews`, {
            headers: { 'Authorization': `Bearer ${candidateToken}` }
        });
        data = await res.json();
        if (!res.ok) throw new Error(`Fetch Candidate Interviews Failed: ${data.message}`);

        const foundInterview = data.find(i => i._id === interviewId);
        if (!foundInterview) throw new Error('Interview not found for candidate');
        console.log('Candidate Interview Verified');

        console.log('SUCCESS: All checks passed!');
        process.exit(0);

    } catch (error) {
        console.error('VERIFICATION FAILED:', error.message);
        process.exit(1);
    }
}

run();
