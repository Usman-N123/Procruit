
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Menu, X, Briefcase, User, LayoutDashboard, Settings,
  Users, Calendar, FileText, LogOut, MessageSquare, Video,
  Sun, Moon, ChevronRight, Bell
} from 'lucide-react';
import { Button } from './UI';
import { useTheme } from './ThemeContext';

// Reusable Logo Component
const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-sm" }) => (
  <div className={`${className} rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30`}>
    AI
  </div>
);

// Theme Toggle Button
const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7B2CBF] focus:ring-offset-2 focus:ring-offset-transparent ${isDark ? 'bg-[#7B2CBF]' : 'bg-purple-200'} ${className}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${isDark ? 'translate-x-6 bg-white' : 'translate-x-0 bg-[#7B2CBF]'}`}>
        {isDark
          ? <Moon className="w-3 h-3 text-[#7B2CBF]" />
          : <Sun className="w-3 h-3 text-white" />
        }
      </span>
    </button>
  );
};

// --- Public Layout (Navbar + Footer) ---
export const PublicLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#07000F] text-white' : 'bg-[#F3EEFF] text-[#1a0033]'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl ${isDark ? 'border-purple-900/30 bg-[#07000F]/70' : 'border-purple-200/60 bg-[#F3EEFF]/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <BrandLogo />
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-[#7B2CBF] to-[#c084fc] bg-clip-text text-transparent">PROCRUIT</span>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {['Features', 'How it Works', 'About', 'Contact'].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                    className={`text-sm font-medium hover:text-[#9D4EDD] transition-colors duration-200 ${isDark ? 'text-neutral-400' : 'text-[#6b46a0]'}`}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="primary" size="sm" className="btn-glow" onClick={() => navigate('/signup')}>Get Started</Button>
            </div>

            <div className="md:hidden flex items-center gap-3">
              <ThemeToggle />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={isDark ? 'text-white' : 'text-[#1a0033]'}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden border-b ${isDark ? 'bg-[#0D0117] border-purple-900/30' : 'bg-[#EDE4FF] border-purple-200'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {['Features', 'How it Works', 'About', 'Contact'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${isDark ? 'text-neutral-400 hover:bg-purple-900/20 hover:text-white' : 'text-[#6b46a0] hover:bg-purple-100 hover:text-[#1a0033]'}`}>
                  {item}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2 px-3 pb-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                <Button variant="primary" onClick={() => navigate('/signup')}>Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={`border-t py-12 ${isDark ? 'border-purple-900/30 bg-[#0D0117]' : 'border-purple-200 bg-[#EDE4FF]'}`}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo className="w-7 h-7 text-xs" />
              <span className="text-lg font-extrabold bg-gradient-to-r from-[#7B2CBF] to-[#c084fc] bg-clip-text text-transparent">PROCRUIT</span>
            </div>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-500' : 'text-[#6b46a0]'}`}>Empowering the future of recruitment with advanced AI analysis and seamless workflows.</p>
          </div>
          {[
            { title: 'Platform', links: ['For Recruiters', 'For Candidates', 'Pricing'] },
            { title: 'Company', links: ['About Us', 'Careers', 'Blog'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
          ].map(section => (
            <div key={section.title}>
              <h4 className="font-semibold mb-4 text-[#9D4EDD]">{section.title}</h4>
              <ul className={`space-y-2 text-sm ${isDark ? 'text-neutral-500' : 'text-[#6b46a0]'}`}>
                {section.links.map(link => (
                  <li key={link}><a href="#" className="hover:text-[#9D4EDD] transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={`max-w-7xl mx-auto px-4 mt-10 pt-6 border-t text-center text-xs ${isDark ? 'border-purple-900/20 text-neutral-600' : 'border-purple-200 text-[#9D4EDD]'}`}>
          © 2025 PROCRUIT. All rights reserved. Built with ❤️ for the future of hiring.
        </div>
      </footer>
    </div>
  );
};

// --- Dashboard Layout ---
interface SidebarItem {
  name: string;
  path: string;
  icon: any;
}

interface DashboardLayoutProps {
  role: 'ADMIN' | 'organization' | 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER';
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Verify Role Logic
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== role) {
      const dashboardPath = user.role === 'ADMIN' ? '/admin/dashboard'
        : user.role === 'organization' ? '/organization/dashboard'
          : user.role === 'RECRUITER' ? '/recruiter/dashboard'
            : user.role === 'INTERVIEWER' ? '/interviewer/dashboard'
              : '/candidate/dashboard';
      navigate(dashboardPath);
    }
  }, [role, user, navigate]);

  if (!user || user.role !== role) return null;

  const adminLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Users', path: '/admin/users', icon: Users },
    { name: 'System Logs', path: '/admin/logs', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const recruiterLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/recruiter', icon: LayoutDashboard },
    { name: 'Jobs', path: '/recruiter/jobs', icon: Briefcase },
    { name: 'Applicants', path: '/recruiter/applicants', icon: Users },
    { name: 'Hire Interviewer', path: '/recruiter/hire-interviewer', icon: Video },
    { name: 'Schedule', path: '/recruiter/schedule', icon: Calendar },
    { name: 'Profile', path: '/recruiter/profile', icon: User },
  ];

  const candidateLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/candidate', icon: LayoutDashboard },
    { name: 'Browse Jobs', path: '/candidate/jobs', icon: Briefcase },
    { name: 'My Applications', path: '/candidate/applications', icon: FileText },
    { name: 'Interviews', path: '/candidate/interviews', icon: MessageSquare },
    { name: 'My Profile', path: '/candidate/profile', icon: User },
  ];

  const interviewerLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/interviewer', icon: LayoutDashboard },
    { name: 'My Schedule', path: '/interviewer/schedule', icon: Calendar },
    { name: 'Requests', path: '/interviewer/requests', icon: MessageSquare },
    { name: 'My Profile', path: '/interviewer/profile', icon: User },
  ];

  const orgAdminLinks: SidebarItem[] = [
    { name: 'Dashboard', path: '/organization/dashboard', icon: LayoutDashboard },
    { name: 'Manage Team', path: '/organization/dashboard', icon: Users },
    { name: 'Settings', path: '/organization/settings', icon: Settings },
  ];

  let links = candidateLinks;
  if (role === 'ADMIN') links = adminLinks;
  else if (role === 'organization') links = orgAdminLinks;
  else if (role === 'RECRUITER') links = recruiterLinks;
  else if (role === 'INTERVIEWER') links = interviewerLinks;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get page title from current route
  const currentLink = links.find(l => location.pathname === l.path || (location.pathname.startsWith(l.path) && l.path !== `/${role.toLowerCase().replace('_', '-')}`));
  const pageTitle = currentLink?.name || 'Dashboard';

  // Role label & badge
  const roleLabel = role === 'organization' ? 'Org Admin' : role.charAt(0) + role.slice(1).toLowerCase();
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  const sidebarBg = isDark
    ? 'bg-[#0D0117] border-r border-purple-900/30'
    : 'bg-[#EDE4FF] border-r border-purple-200';

  const headerBg = isDark
    ? 'border-b border-purple-900/30 bg-[#07000F]/90'
    : 'border-b border-purple-200 bg-[#F3EEFF]/90';

  const mainBg = isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]';
  const textMuted = isDark ? 'text-neutral-400' : 'text-[#6b46a0]';
  const textPrimary = isDark ? 'text-white' : 'text-[#1a0033]';

  return (
    <div className={`min-h-screen flex ${mainBg} ${textPrimary}`}>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarBg}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}>
        {/* Brand */}
        <div className={`h-16 flex items-center px-5 gap-3 border-b ${isDark ? 'border-purple-900/30' : 'border-purple-200'}`}>
          <BrandLogo className="w-8 h-8 text-sm" />
          <div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#7B2CBF] to-[#c084fc] bg-clip-text text-transparent">PROCRUIT</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-[#7B2CBF]/20 text-[#c084fc] border border-[#7B2CBF]/30 uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const rolePath = `/${role.toLowerCase().replace('_', '-')}`;
            const isActive = location.pathname === link.path ||
              (link.path !== rolePath && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === rolePath}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative
                  ${isActive
                    ? 'nav-active text-white font-semibold'
                    : `${textMuted} hover:text-white hover:bg-purple-500/10 font-medium`}
                `}
              >
                <link.icon size={18} className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110`} />
                <span className="text-sm">{link.name}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-3 border-t space-y-2 ${isDark ? 'border-purple-900/30' : 'border-purple-200'}`}>
          {/* User info */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${isDark ? 'bg-white/5' : 'bg-purple-100'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${textPrimary}`}>{user?.name || 'User'}</p>
              <p className={`text-[10px] truncate ${textMuted}`}>{user?.email}</p>
            </div>
          </div>

          {/* Theme toggle row */}
          <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-purple-100'}`}>
            <span className={`text-xs font-medium ${textMuted}`}>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            <ThemeToggle />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all rounded-xl group"
          >
            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header (always visible) */}
        <header className={`h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 backdrop-blur-xl ${headerBg}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden ${textMuted} hover:text-[#9D4EDD] transition-colors`}>
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2">
              <span className={`text-xs ${textMuted}`}>Dashboard</span>
              <ChevronRight size={12} className={textMuted} />
              <span className={`text-sm font-semibold ${textPrimary}`}>{pageTitle}</span>
            </div>
            <span className={`md:hidden font-bold text-sm ${textPrimary}`}>PROCRUIT</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop theme toggle in header */}
            <div className="hidden md:flex items-center gap-2">
              <Sun size={13} className={isDark ? textMuted : 'text-[#7B2CBF]'} />
              <ThemeToggle />
              <Moon size={13} className={isDark ? 'text-[#7B2CBF]' : textMuted} />
            </div>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#9D4EDD] flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
