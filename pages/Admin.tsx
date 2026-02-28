import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { Card, Badge, Button } from '../components/UI';
import { Users, Briefcase, Trash2, CheckCircle, LayoutDashboard } from 'lucide-react';

// --- Components ---

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({ users: { total: 0, candidates: 0, recruiters: 0 }, jobs: { active: 0 }, applications: { total: 0 }, pendingApprovals: 0 });

  useEffect(() => {
    apiRequest('/admin/stats').then((res: any) => {
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-blue-500">
          <h3 className="text-3xl font-bold mb-1">{stats.users.total}</h3>
          <p className="text-neutral-400">Total Users</p>
          <div className="text-xs text-neutral-500 mt-2">
            {stats.users.candidates} Candidates, {stats.users.recruiters} Recruiters
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-purple-500">
          <h3 className="text-3xl font-bold mb-1">{stats.jobs.active}</h3>
          <p className="text-neutral-400">Active Jobs</p>
        </Card>
        <Card className="p-6 border-l-4 border-green-500">
          <h3 className="text-3xl font-bold mb-1">{stats.applications.total}</h3>
          <p className="text-neutral-400">Total Applications</p>
        </Card>
        <Card className="p-6 border-l-4 border-orange-500">
          <h3 className="text-3xl font-bold mb-1">{stats.pendingApprovals}</h3>
          <p className="text-neutral-400">Pending Approvals</p>
        </Card>
      </div>
    </div>
  );
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiRequest(`/admin/users?role=${filter}`);
      console.log("Admin API Response (Users):", res);
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        console.error("Unexpected response format:", res);
        setUsers([]);
      }
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/admin/users/${id}`, 'DELETE');
      fetchUsers();
      alert('User deleted');
    } catch (e) { alert('Failed to delete user'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>
      <div className="flex gap-2 mb-6">
        {['', 'CANDIDATE', 'RECRUITER', 'ORG_ADMIN', 'INTERVIEWER'].map(role => (
          <Button
            key={role}
            size="sm"
            variant={filter === role ? 'secondary' : 'outline'}
            onClick={() => setFilter(role)}
          >
            {role || 'All'}
          </Button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Email</th>
                <th className="p-4">Org</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-white/5">
                  <td className="p-4 font-medium text-white">{user.name}</td>
                  <td className="p-4"><Badge variant="info">{user.role}</Badge></td>
                  <td className="p-4 text-neutral-400">{user.email}</td>
                  <td className="p-4 text-neutral-400">{user.organization?.name || '-'}</td>
                  <td className="p-4 text-neutral-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(user._id, user.name)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = async () => {
    try {
      const res = await apiRequest('/admin/jobs');
      console.log("Admin API Response (Jobs):", res);
      if (res.success && Array.isArray(res.jobs)) {
        setJobs(res.jobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    await apiRequest(`/admin/jobs/${id}`, 'DELETE');
    fetchJobs();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Job Management</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 text-neutral-400">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Company</th>
                <th className="p-4">Posted By</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {jobs.map(job => (
                <tr key={job._id} className="hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{job.title}</td>
                  <td className="p-4 text-neutral-300">{job.company}</td>
                  <td className="p-4 text-neutral-400">{job.postedBy?.name || 'Unknown'}</td>
                  <td className="p-4"><Badge variant={job.status === 'Active' ? 'success' : 'neutral'}>{job.status}</Badge></td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(job._id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const AdminApprovals: React.FC = () => {
  const [pending, setPending] = useState<any[]>([]);

  const fetchPending = async () => {
    try {
      const res = await apiRequest('/admin/freelancers/pending');
      console.log("Admin API Response (Approvals):", res);
      if (res.success && Array.isArray(res.users)) {
        setPending(res.users);
      } else {
        console.error("Unexpected response format (Approvals):", res);
        setPending([]);
      }
    } catch (err) {
      console.error("Admin Fetch Error (Approvals):", err);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiRequest(`/admin/freelancers/${id}/approve`, 'PATCH', { status });
      fetchPending();
      alert(`User ${status.toLowerCase()}`);
    } catch (e) { alert('Action failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Freelancer Approvals</h2>
      <Card className="min-h-[200px]">
        {pending.length === 0 && <p className="text-neutral-500 p-4">No pending approvals.</p>}
        <div className="grid gap-4">
          {pending.map(user => (
            <div key={user._id} className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-center gap-4">
                <img src={user.profilePicture || "/assets/default-avatar.png"} className="w-12 h-12 rounded-full" alt="profile" />
                <div>
                  <h4 className="font-bold text-white">{user.name}</h4>
                  <p className="text-sm text-neutral-400">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="info">{user.role}</Badge>
                    <Badge variant="warning">PENDING</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleAction(user._id, 'REJECTED')} className="text-red-400 border-red-500/30 hover:bg-red-500/10">Reject</Button>
                <Button size="sm" onClick={() => handleAction(user._id, 'APPROVED')} className="bg-green-600 hover:bg-green-500 border-none text-white">Approve</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
