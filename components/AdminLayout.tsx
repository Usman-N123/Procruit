import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, CheckCircle, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Briefcase, label: 'Jobs', path: '/admin/jobs' },
        { icon: CheckCircle, label: 'Approvals', path: '/admin/approvals' },
    ];

    return (
        <div className="flex min-h-screen bg-black text-white font-sans selection:bg-[#7B2CBF] selection:text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 bg-neutral-900/30 fixed h-full">
                <div className="p-6 border-b border-neutral-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] bg-clip-text text-transparent">
                        Admin<span className="text-white">Panel</span>
                    </h1>
                    <div className="text-xs text-neutral-500 mt-2">
                        {/* DEBUG: Show current role */}
                        Role: {localStorage.getItem('role') || 'Unknown'}
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'} // Exact match for root
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-[#7B2CBF] text-white shadow-[0_0_15px_rgba(123,44,191,0.5)]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 mt-8"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
