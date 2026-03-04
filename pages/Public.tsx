
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { CheckCircle, Zap, Shield, Users, ArrowRight, UserPlus, FileSearch, MessageSquare, HelpCircle, Eye, EyeOff, Star, TrendingUp, Award, Globe } from 'lucide-react';
import { UserRole } from '../types';
import { apiRequest } from '../utils/api';
import { useTheme } from '../components/ThemeContext';

// Logo Component
const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-sm" }) => (
  <div className={`${className} rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20`}>
    AI
  </div>
);

// Animated counter hook
const useCounter = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  React.useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// --- Home Page ---
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const textPrimary = isDark ? 'text-white' : 'text-[#1a0033]';
  const textMuted = isDark ? 'text-neutral-400' : 'text-[#6b46a0]';
  const sectionBg = isDark ? 'bg-[#0D0117]' : 'bg-[#EDE4FF]';
  const borderColor = isDark ? 'border-purple-900/30' : 'border-purple-200';

  return (
    <div className="space-y-0 overflow-x-hidden">

      {/* ── HERO SECTION with textured dark bg ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Textured background image */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: 'url(/dark-texture.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Gradient overlay on texture */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-[#07000F]/80 to-[#07000F]" />

        {/* Animated purple orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-[#7B2CBF] opacity-20 blur-[100px] rounded-full animate-pulse -z-10" />
        <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-[#480CA8] opacity-15 blur-[120px] rounded-full -z-10" style={{ animationDelay: '1s', animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#7B2CBF] opacity-8 blur-[180px] rounded-full -z-10" />

        {/* Hex grid pattern overlay */}
        <div className="absolute inset-0 -z-10 hex-pattern opacity-40" />

        <div className="max-w-6xl mx-auto px-4 text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-purple-500/30 bg-purple-500/10 text-purple-300 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <Zap size={14} className="text-purple-400" />
            <span>AI-Powered Recruitment Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
            Hire Smarter,<br />
            <span className="gradient-text">Not Harder</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            PROCRUIT revolutionizes hiring by combining emotional intelligence AI with seamless scheduling and candidate tracking — all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Button size="lg" variant="primary" className="btn-glow min-w-[160px]" onClick={() => navigate('/signup')}>
              Get Started Free <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" className="min-w-[160px] border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>

          {/* Social proof row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 animate-in fade-in duration-700 delay-300">
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/32?img=${i * 7}`} className="w-7 h-7 rounded-full border-2 border-[#07000F]" alt="" />
                ))}
              </div>
              <span className="text-neutral-300">10,000+ professionals</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
              <span className="text-neutral-400 ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-neutral-500 to-transparent" />
        </div>
      </section>

      {/* ── STATS SECTION ── */}
      <section className={`py-16 border-y ${isDark ? 'bg-[#0D0117] border-purple-900/30' : 'bg-[#EDE4FF] border-purple-200'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Candidates Hired', icon: Users, color: 'text-purple-400' },
              { value: '500+', label: 'Companies', icon: Globe, color: 'text-blue-400' },
              { value: '98%', label: 'Match Accuracy', icon: TrendingUp, color: 'text-green-400' },
              { value: '24/7', label: 'AI Support', icon: Award, color: 'text-yellow-400' },
            ].map(stat => (
              <div key={stat.label} className="group">
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-purple-100'} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div className={`text-4xl font-extrabold mb-1 ${isDark ? 'text-white' : 'text-[#1a0033]'}`}>{stat.value}</div>
                <div className={`text-sm ${textMuted}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ── */}
      <section className={`py-12 ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className={`text-xs font-bold uppercase tracking-widest mb-8 ${textMuted}`}>Trusted by industry leaders</p>
          <div className={`flex flex-wrap justify-center gap-8 md:gap-16 ${isDark ? 'opacity-40 hover:opacity-70' : 'opacity-50 hover:opacity-80'} transition-opacity duration-500`}>
            {['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella'].map(co => (
              <span key={co} className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#1a0033]'}`}>{co}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className={`py-24 ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-purple-500/30 bg-purple-500/10 text-purple-400 mb-4">
              <Star size={12} /> Features
            </span>
            <h2 className={`text-4xl font-extrabold mb-4 ${textPrimary}`}>Why Choose PROCRUIT?</h2>
            <p className={`text-lg max-w-xl mx-auto ${textMuted}`}>Streamline your hiring process with next-gen AI features built for modern teams.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard icon={Zap} title="AI Analysis" description="Automated candidate scoring and emotional intelligence analysis during video interviews. Get objective data instantly." gradient="from-purple-500 to-blue-500" />
            <FeatureCard icon={Shield} title="Secure & Private" description="Enterprise-grade security ensures your data and candidate privacy are always protected. GDPR compliant." gradient="from-blue-500 to-cyan-500" />
            <FeatureCard icon={Users} title="Collaborative Hiring" description="Share feedback, rate candidates, and make team decisions seamlessly in one unified dashboard." gradient="from-violet-500 to-purple-600" />
            <FeatureCard icon={TrendingUp} title="Smart Ranking" description="Our AI ranks candidates by fit score, reducing time-to-hire by 50% with data-driven decisions." gradient="from-pink-500 to-purple-500" />
            <FeatureCard icon={MessageSquare} title="Interview Rooms" description="Conduct AI-assisted video interviews with real-time emotion analysis and automatic transcripts." gradient="from-purple-600 to-indigo-600" />
            <FeatureCard icon={Award} title="Freelance Marketplace" description="Hire verified freelance interviewers on-demand to scale your hiring capacity instantly." gradient="from-indigo-500 to-purple-500" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className={`py-24 ${sectionBg}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-extrabold mb-4 ${textPrimary}`}>How It Works</h2>
            <p className={`text-lg ${textMuted}`}>A simple, streamlined process for recruiters and candidates.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className={`hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#7B2CBF] to-transparent`} />

            {[
              { icon: UserPlus, step: '01', title: 'Create Profile', desc: 'Sign up as recruiter to post jobs or as a candidate to build your professional profile.' },
              { icon: FileSearch, step: '02', title: 'AI Matching', desc: 'Our algorithm automatically matches skills and experience to the best opportunities.' },
              { icon: MessageSquare, step: '03', title: 'Interview & Hire', desc: 'Schedule interviews, conduct AI-assisted sessions, and make data-driven hiring decisions.' },
            ].map(step => (
              <div key={step.step} className="text-center relative group">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#7B2CBF]/20 to-[#480CA8]/20 border border-[#7B2CBF]/40 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:border-[#7B2CBF] group-hover:shadow-purple-md transition-all duration-300 backdrop-blur-sm">
                    <step.icon className="w-10 h-10 text-[#9D4EDD]" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#7B2CBF] text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {step.step.slice(1)}
                  </span>
                </div>
                <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>{step.title}</h3>
                <p className={textMuted}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT / MISSION ── */}
      <section id="about" className={`py-24 ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`rounded-3xl p-8 md:p-16 border relative overflow-hidden ${isDark ? 'bg-[#0D0117]/80 border-purple-900/30' : 'bg-[#EDE4FF] border-purple-200'}`}>
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#7B2CBF] blur-[120px] opacity-10 -z-10 rounded-full" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-purple-500/30 bg-purple-500/10 text-purple-400">
                  Our Mission
                </span>
                <h2 className={`text-4xl font-extrabold ${textPrimary}`}>Revolutionizing Recruitment</h2>
                <p className={`leading-relaxed ${textMuted}`}>
                  We believe hiring shouldn't be a guessing game. By leveraging advanced machine learning, PROCRUIT provides objective data points to help recruiters make the best decisions, while giving candidates a fair platform to showcase their true potential.
                </p>
                <ul className="space-y-4">
                  {['Reduced bias in hiring with AI objectivity', '50% faster time-to-hire on average', 'Automated scheduling & reminders', 'Real-time emotional intelligence scoring'].map(item => (
                    <li key={item} className={`flex items-start gap-3 ${isDark ? 'text-neutral-300' : 'text-[#1a0033]'}`}>
                      <CheckCircle className="text-[#9D4EDD] w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-[#7B2CBF] blur-[80px] opacity-15 rounded-full" />
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
                  alt="Team collaborating"
                  className="relative rounded-2xl border border-purple-900/30 shadow-2xl shadow-purple-900/30 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className={`py-24 ${sectionBg}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-extrabold mb-4 ${textPrimary}`}>What People Say</h2>
            <p className={textMuted}>Join thousands of satisfied recruiters and candidates.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { text: '"PROCRUIT completely transformed how we hire engineers. The AI insights are scary accurate!"', name: 'Sarah Jenkins', role: 'HR Director, TechFlow', img: 'a042581f4e29026024d', stars: 5 },
              { text: '"I got hired within 3 days. The interview process was smooth and I loved the feedback loop."', name: 'David Chen', role: 'Senior Developer', img: 'a042581f4e29026704d', stars: 5 },
              { text: '"The dashboard is intuitive and powerful. It saves us hours of manual screening every week."', name: 'Amanda Ray', role: 'Recruitment Manager', img: 'a04258114e29026302d', stars: 5 },
            ].map((t, i) => (
              <Card key={i} className="p-6 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex gap-0.5 text-yellow-400 mb-4">
                  {'★'.repeat(t.stars).split('').map((s, j) => <span key={j} className="text-lg">{s}</span>)}
                </div>
                <p className={`italic leading-relaxed mb-6 text-sm ${textMuted}`}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/150?u=${t.img}`} className="rounded-full w-10 h-10 border-2 border-[#7B2CBF]/30" alt={t.name} />
                  <div>
                    <div className={`font-bold text-sm ${textPrimary}`}>{t.name}</div>
                    <div className={`text-xs ${textMuted}`}>{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={`py-24 ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-extrabold mb-4 ${textPrimary}`}>Frequently Asked Questions</h2>
            <p className={textMuted}>Everything you need to know about PROCRUIT.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Is PROCRUIT free to use?", a: "We offer a free tier for candidates and a 14-day trial for recruiters. After that, we have flexible pricing plans suited for teams of all sizes." },
              { q: "How does the AI matching work?", a: "Our proprietary AI analyzes job descriptions and candidate profiles, matching skills, experience levels, and even soft skills extracted from video interviews to calculate a compatibility score." },
              { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption for all data at rest and in transit. We are GDPR and CCPA compliant." },
              { q: "Can I integrate with other HR tools?", a: "Yes, PROCRUIT integrates with major ATS platforms like Greenhouse, Lever, and Workday via our robust API." },
            ].map((item, i) => (
              <Card key={i} className="p-6 cursor-pointer hover:border-[#7B2CBF]/50 transition-colors group">
                <div className="flex items-start gap-3">
                  <HelpCircle size={18} className="text-[#9D4EDD] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className={`font-bold mb-2 ${textPrimary}`}>{item.q}</h3>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{item.a}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={`py-6 px-4 ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-[#7B2CBF] via-[#9D4EDD] to-[#480CA8] p-12 text-center relative overflow-hidden shadow-2xl shadow-purple-900/40">
            {/* Texture overlay on CTA */}
            <div className="absolute inset-0 hex-pattern opacity-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-white/10 blur-[60px] rounded-full" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Ready to Transform<br />Your Hiring?</h2>
              <p className="text-purple-100 max-w-2xl mx-auto text-lg">Join thousands of companies and candidates using PROCRUIT to build the future workforce.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" className="bg-white !text-purple-900 hover:bg-neutral-100 !border-transparent shadow-xl font-bold" onClick={() => navigate('/signup')}>
                  Get Started for Free <ArrowRight size={18} />
                </Button>
                <Button variant="ghost" size="lg" className="!text-white hover:!bg-white/10 !border-white/30 border" onClick={() => navigate('/login')}>
                  Sign In Instead
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className={`py-24 ${sectionBg}`}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className={`text-4xl font-extrabold mb-4 ${textPrimary}`}>Get In Touch</h2>
          <p className={`mb-10 ${textMuted}`}>Have a question or want to learn more? We'd love to hear from you.</p>
          <Card className="p-8 text-left">
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Your Name" />
                <Input placeholder="Email Address" type="email" />
              </div>
              <Input placeholder="Subject" />
              <textarea
                className={`w-full rounded-lg px-4 py-3 outline-none h-32 resize-none border transition-all
                  ${isDark
                    ? 'bg-black/50 border-neutral-800 text-white placeholder-neutral-600 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF]'
                    : 'bg-white border-purple-200 text-[#1a0033] placeholder-purple-300 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF]'}`}
                placeholder="Your message..."
              />
              <Button className="w-full btn-glow">Send Message</Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon: Icon, title, description, gradient
}: {
  icon: any; title: string; description: string; gradient: string;
}) => {
  const { isDark } = useTheme();
  return (
    <Card className="p-6 hover:-translate-y-1 transition-all duration-300 group">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1a0033]'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-[#6b46a0]'}`}>{description}</p>
    </Card>
  );
};

// --- Auth Pages (Login / Signup) ---

interface AuthPageProps {
  type: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'signup' && formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '/auth/login';
      if (type === 'signup') {
        if (role === 'CANDIDATE') endpoint = '/auth/register-candidate';
        else if (role === 'RECRUITER') endpoint = '/auth/register-org';
        else if (role === 'INTERVIEWER') endpoint = '/auth/register-freelancer';
      }

      const payload = type === 'login'
        ? { email: formData.email, password: formData.password }
        : { ...formData, role };

      const data = await apiRequest(endpoint, 'POST', payload);

      console.log('Auth Success:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user', JSON.stringify(data));

      if (type === 'signup') {
        if (data.role === 'RECRUITER') navigate('/recruiter/profile');
        else if (data.role === 'CANDIDATE') navigate('/candidate/profile');
        else if (data.role === 'INTERVIEWER') navigate('/interviewer/profile');
        else navigate('/admin');
      } else {
        if (data.role === 'ADMIN') navigate('/admin');
        else if (data.role === 'RECRUITER') navigate('/recruiter');
        else if (data.role === 'INTERVIEWER') navigate('/interviewer');
        else navigate('/candidate');
      }

    } catch (err: any) {
      console.error('Auth Failed:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 relative overflow-hidden ${isDark ? 'bg-[#07000F]' : 'bg-[#F3EEFF]'}`}>
      {/* Textured background for auth */}
      {isDark && (
        <div
          className="absolute inset-0 -z-20"
          style={{
            backgroundImage: 'url(/dark-texture.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.25,
          }}
        />
      )}

      {/* Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#7B2CBF] opacity-10 blur-[100px] rounded-full z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900 opacity-8 blur-[100px] rounded-full z-0" />

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 cursor-pointer float-anim" onClick={() => navigate('/')}>
            <BrandLogo className="w-14 h-14 text-2xl" />
          </div>
          <h2 className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#1a0033]'}`}>
            {type === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-[#6b46a0]'}`}>
            {type === 'login' ? 'Enter your credentials to access your account.' : 'Join the future of recruitment today.'}
          </p>
        </div>

        <Card className="p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">

            {type === 'signup' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-neutral-400' : 'text-[#6b46a0]'}`}>I am a...</label>
                <div className={`grid grid-cols-3 gap-2 p-1 rounded-xl border ${isDark ? 'bg-black/40 border-neutral-800' : 'bg-purple-50 border-purple-200'}`}>
                  {(['CANDIDATE', 'RECRUITER', 'INTERVIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-xs font-semibold py-2.5 rounded-lg transition-all duration-200 ${role === r
                        ? 'bg-gradient-to-r from-[#7B2CBF] to-[#9D4EDD] text-white shadow-lg shadow-purple-900/30'
                        : `${isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-[#6b46a0] hover:text-[#1a0033]'}`
                        }`}
                    >
                      {r === 'INTERVIEWER' ? 'Freelancer' : r === 'RECRUITER' ? 'Organization' : 'Candidate'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === 'signup' && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              endIcon={showPassword ? EyeOff : Eye}
              onEndIconClick={() => setShowPassword(!showPassword)}
            />

            {type === 'signup' && (
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                endIcon={showConfirmPassword ? EyeOff : Eye}
                onEndIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full btn-glow" disabled={loading}>
              {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className={`mt-6 text-center text-sm ${isDark ? 'text-neutral-500' : 'text-[#6b46a0]'}`}>
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => navigate('/signup')} className="text-[#9D4EDD] hover:text-[#c084fc] font-semibold cursor-pointer transition-colors">Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => navigate('/login')} className="text-[#9D4EDD] hover:text-[#c084fc] font-semibold cursor-pointer transition-colors">Log in</span></>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
