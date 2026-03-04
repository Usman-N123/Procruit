import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, CheckCircle, LogOut, Sun, Moon, ChevronRight, Shield } from 'lucide-react';
import { useTheme } from './ThemeContext';

// ThemeToggle (same pill style)
const ThemeToggle: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] ${isDark ? 'bg-[#7B2CBF]' : 'bg-purple-200'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isDark ? 'translate-x-6 bg-white' : 'translate-x-0 bg-[#7B2CBF]'}`}>
                {isDark ? <Moon className="w-3 h-3 text-[#7B2CBF]" /> : <Sun className="w-3 h-3 text-white" />}
            </span>
        </button>
    );
};

export const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();

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

    const sidebarBg = isDark
        ? 'bg-[#0D0117] border-r border-purple-900/30'
        : 'bg-[#EDE4FF] border-r border-purple-200';
    const mainBg = isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]';
    const textPrimary = isDark ? 'text-white' : 'text-[#1a0033]';
    const textMuted = isDark ? 'text-neutral-400' : 'text-[#6b46a0]';
    const headerBg = isDark
        ? 'border-b border-purple-900/30 bg-[#07000F]/90 backdrop-blur-xl'
        : 'border-b border-purple-200 bg-[#F3EEFF]/90 backdrop-blur-xl';

    const currentItem = navItems.find(i => location.pathname === i.path || (location.pathname.startsWith(i.path) && i.path !== '/admin'));
    const pageTitle = currentItem?.label || 'Admin Panel';

    const adminRole = localStorage.getItem('role') || 'Admin';
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;
    const userInitial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

    return (
        <div className={`flex min-h-screen ${mainBg} ${textPrimary} font-sans selection:bg-[#7B2CBF] selection:text-white`}>
            {/* Sidebar */}
            <aside className={`w-64 fixed h-full flex flex-col ${sidebarBg}`}>
                {/* Brand Area */}
                <div className={`h-16 flex items-center px-5 gap-3 border-b ${isDark ? 'border-purple-900/30' : 'border-purple-200'}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
                        AI
                    </div>
                    <div>
                        <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#7B2CBF] to-[#c084fc] bg-clip-text text-transparent">
                            PROCRUIT
                        </h1>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-500/15 text-red-400 border border-red-500/25 uppercase tracking-wider mt-0.5">
                            <Shield size={8} className="mr-1" /> Admin
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'nav-active text-white font-semibold'
                                    : `${textMuted} hover:text-white hover:bg-purple-500/10 font-medium`}`
                            }
                        >
                            <item.icon size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className={`p-3 border-t space-y-2 ${isDark ? 'border-purple-900/30' : 'border-purple-200'}`}>
                    {/* User info */}
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-purple-100'}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                            {userInitial}
                        </div>
                        <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${textPrimary}`}>{user?.name || 'Admin'}</p>
                            <p className={`text-[10px] truncate ${textMuted}`}>{adminRole}</p>
                        </div>
                    </div>

                    {/* Theme toggle */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-purple-100'}`}>
                        <span className={`text-xs font-medium ${textMuted}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                        <ThemeToggle />
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        <span className="font-medium text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 ml-64 flex flex-col">
                {/* Top Header */}
                <header className={`h-14 flex items-center justify-between px-6 sticky top-0 z-30 ${headerBg}`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${textMuted}`}>Admin Panel</span>
                        <ChevronRight size={12} className={textMuted} />
                        <span className={`text-sm font-semibold ${textPrimary}`}>{pageTitle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Sun size={13} className={isDark ? textMuted : 'text-[#7B2CBF]'} />
                        <ThemeToggle />
                        <Moon size={13} className={isDark ? 'text-[#7B2CBF]' : textMuted} />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold shadow-md">
                            {userInitial}
                        </div>
                    </div>
                </header>

                <main className={`flex-1 p-6`}>
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
