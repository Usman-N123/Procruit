
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Menu, X, Briefcase, User, LayoutDashboard, Settings,
  Users, Calendar, FileText, LogOut, MessageSquare, Video
} from 'lucide-react';
import { Button } from './UI';

// Reusable Logo Component
const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-sm" }) => (
  <div className={`${className} rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20`}>
    AI
  </div>
);

// --- Public Layout (Navbar + Footer) ---
export const PublicLayout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <BrandLogo />
              <span className="font-bold text-xl tracking-tight">PROCRUIT</span>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="hover:text-[#7B2CBF] transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-[#7B2CBF] transition-colors">How it Works</a>
                <a href="#about" className="hover:text-[#7B2CBF] transition-colors">About</a>
                <a href="#contact" className="hover:text-[#7B2CBF] transition-colors">Contact</a>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-neutral-900 border-b border-neutral-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#features" className="block px-3 py-2 rounded-md hover:bg-neutral-800">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 rounded-md hover:bg-neutral-800">How it Works</a>
              <a href="#about" className="block px-3 py-2 rounded-md hover:bg-neutral-800">About</a>
              <a href="#contact" className="block px-3 py-2 rounded-md hover:bg-neutral-800">Contact</a>
              <div className="mt-4 flex flex-col gap-2">
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
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BrandLogo className="w-6 h-6 text-xs" />
              <span className="text-xl font-bold text-white">PROCRUIT</span>
            </div>
            <p className="text-neutral-400 text-sm">Empowering the future of recruitment with advanced AI analysis and seamless workflows.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#7B2CBF]">Platform</h4>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li><a href="#" className="hover:text-white">For Recruiters</a></li>
              <li><a href="#" className="hover:text-white">For Candidates</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#7B2CBF]">Company</h4>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-[#7B2CBF]">Legal</h4>
            <ul className="space-y-2 text-neutral-400 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
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
  role: 'ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER';
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Verify Role Logic
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  React.useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== role) {
      // Redirect to correct dashboard
      const dashboardPath = user.role === 'ADMIN' ? '/admin'
        : user.role === 'ORG_ADMIN' ? '/org-admin'
          : user.role === 'RECRUITER' ? '/recruiter'
            : user.role === 'INTERVIEWER' ? '/interviewer'
              : '/candidate';
      navigate(dashboardPath);
    }
  }, [role, user, navigate]);

  if (!user || user.role !== role) return null; // Prevent flash of content

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
    { name: 'Dashboard', path: '/org-admin', icon: LayoutDashboard },
    { name: 'Manage Team', path: '/org-admin', icon: Users },
    { name: 'Settings', path: '/org-admin/settings', icon: Settings },
  ];

  let links = candidateLinks;
  if (role === 'ADMIN') links = adminLinks;
  else if (role === 'ORG_ADMIN') links = orgAdminLinks;
  else if (role === 'RECRUITER') links = recruiterLinks;
  else if (role === 'INTERVIEWER') links = interviewerLinks;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
      `}>
        <div className="h-16 flex items-center px-6 border-b border-neutral-800">
          <BrandLogo className="w-8 h-8 mr-3 text-sm" />
          <span className="font-bold text-xl">PROCRUIT</span>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const rolePath = `/${role.toLowerCase().replace('_', '-')}`;
            const isActive = location.pathname === link.path || (link.path !== rolePath && location.pathname.startsWith(link.path));
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === rolePath}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-[#7B2CBF]/10 text-[#7B2CBF] border-r-2 border-[#7B2CBF]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <link.icon size={20} />
                <span className="font-medium">{link.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-neutral-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-red-400 w-full transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Mobile */}
        <header className="md:hidden h-16 flex items-center justify-between px-4 border-b border-neutral-800 bg-black sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu />
          </button>
          <span className="font-bold">PROCRUIT</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
