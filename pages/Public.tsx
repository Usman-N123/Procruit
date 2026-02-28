
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../components/UI';
import { CheckCircle, Zap, Shield, Users, ArrowRight, UserPlus, FileSearch, MessageSquare, HelpCircle, ChevronDown } from 'lucide-react';
import { UserRole } from '../types';
import { apiRequest } from '../utils/api';

// Logo Component
const BrandLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-sm" }) => (
  <div className={`${className} rounded-xl bg-gradient-to-br from-[#7B2CBF] to-[#480CA8] flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20`}>
    AI
  </div>
);

// --- Home Page ---
export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 lg:pt-32 px-4 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7B2CBF] opacity-20 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            AI-Powered <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7B2CBF] via-purple-400 to-pink-500">
              Recruitment Ecosystem
            </span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            PROCRUIT revolutionizes hiring by combining emotional intelligence AI with seamless scheduling and candidate tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button size="lg" variant="primary" onClick={() => navigate('/login')}>Login</Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>Register Now</Button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl shadow-purple-900/20 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-10" />
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" alt="Dashboard Preview" className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-100 group-hover:scale-105 transition-transform" />
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-white/5 py-12 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-8">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-bold text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div> Acme Corp</span>
            <span className="text-2xl font-bold text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div> Globex</span>
            <span className="text-2xl font-bold text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div> Soylent</span>
            <span className="text-2xl font-bold text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div> Initech</span>
            <span className="text-2xl font-bold text-white flex items-center gap-2"><div className="w-6 h-6 bg-white rounded-full"></div> Umbrela</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why Choose PROCRUIT?</h2>
          <p className="text-neutral-400">Streamline your hiring process with next-gen features.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Zap}
            title="AI Analysis"
            description="Automated candidate scoring and emotional intelligence analysis during video interviews."
          />
          <FeatureCard
            icon={Shield}
            title="Secure & Private"
            description="Enterprise-grade security ensures your data and candidate privacy are always protected."
          />
          <FeatureCard
            icon={Users}
            title="Collaborative Hiring"
            description="Share feedback, rate candidates, and make team decisions seamlessly in one dashboard."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-neutral-400">A simple, streamlined process for recruiters and candidates.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-[#7B2CBF] to-transparent -z-10" />

          <div className="text-center relative group">
            <div className="w-24 h-24 bg-[#10002B] border border-[#7B2CBF] rounded-full flex items-center justify-center mx-auto mb-6 z-10 group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="w-10 h-10 text-[#7B2CBF]" />
            </div>
            <h3 className="text-xl font-bold mb-2">1. Create Profile</h3>
            <p className="text-neutral-400">Sign up as a recruiter to post jobs or as a candidate to build your professional profile.</p>
          </div>

          <div className="text-center relative group">
            <div className="w-24 h-24 bg-[#10002B] border border-[#7B2CBF] rounded-full flex items-center justify-center mx-auto mb-6 z-10 group-hover:scale-110 transition-transform duration-300">
              <FileSearch className="w-10 h-10 text-[#7B2CBF]" />
            </div>
            <h3 className="text-xl font-bold mb-2">2. AI Matching</h3>
            <p className="text-neutral-400">Our algorithm automatically matches skills and experience to the perfect job opportunities.</p>
          </div>

          <div className="text-center relative group">
            <div className="w-24 h-24 bg-[#10002B] border border-[#7B2CBF] rounded-full flex items-center justify-center mx-auto mb-6 z-10 group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-10 h-10 text-[#7B2CBF]" />
            </div>
            <h3 className="text-xl font-bold mb-2">3. Interview & Hire</h3>
            <p className="text-neutral-400">Schedule interviews, conduct AI-assisted sessions, and make data-driven hiring decisions.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-neutral-900 border-y border-neutral-800 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">10k+</div>
            <div className="text-neutral-400">Candidates Hired</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">500+</div>
            <div className="text-neutral-400">Companies</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">98%</div>
            <div className="text-neutral-400">Match Accuracy</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">24/7</div>
            <div className="text-neutral-400">AI Support</div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 bg-neutral-900/30 rounded-3xl p-8 md:p-16 border border-neutral-800">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Revolutionizing Recruitment</h2>
            <p className="text-neutral-400 leading-relaxed">
              We believe that hiring shouldn't be a guessing game. By leveraging advanced machine learning, PROCRUIT provides objective data points to help recruiters make the best decisions, while giving candidates a fair platform to showcase their true potential.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-neutral-300">
                <CheckCircle className="text-[#7B2CBF] w-5 h-5" /> Reduced bias in hiring
              </li>
              <li className="flex items-center gap-3 text-neutral-300">
                <CheckCircle className="text-[#7B2CBF] w-5 h-5" /> 50% faster time-to-hire
              </li>
              <li className="flex items-center gap-3 text-neutral-300">
                <CheckCircle className="text-[#7B2CBF] w-5 h-5" /> Automated scheduling
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-[#7B2CBF] blur-[80px] opacity-20" />
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Team working" className="relative rounded-xl border border-neutral-700 shadow-2xl" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-12 text-center">What People Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8">
            <div className="flex gap-1 text-[#7B2CBF] mb-4">★★★★★</div>
            <p className="text-neutral-300 mb-6 italic">"PROCRUIT completely transformed how we hire engineers. The AI insights are scary accurate!"</p>
            <div className="flex items-center gap-4">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="rounded-full w-10 h-10" alt="Avatar" />
              <div>
                <div className="font-bold text-sm">Sarah Jenkins</div>
                <div className="text-xs text-neutral-500">HR Director, TechFlow</div>
              </div>
            </div>
          </Card>
          <Card className="p-8">
            <div className="flex gap-1 text-[#7B2CBF] mb-4">★★★★★</div>
            <p className="text-neutral-300 mb-6 italic">"I got hired within 3 days. The interview process was smooth and I loved the feedback loop."</p>
            <div className="flex items-center gap-4">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" className="rounded-full w-10 h-10" alt="Avatar" />
              <div>
                <div className="font-bold text-sm">David Chen</div>
                <div className="text-xs text-neutral-500">Senior Developer</div>
              </div>
            </div>
          </Card>
          <Card className="p-8">
            <div className="flex gap-1 text-[#7B2CBF] mb-4">★★★★★</div>
            <p className="text-neutral-300 mb-6 italic">"The dashboard is intuitive and powerful. It saves us hours of manual screening every week."</p>
            <div className="flex items-center gap-4">
              <img src="https://i.pravatar.cc/150?u=a04258114e29026302d" className="rounded-full w-10 h-10" alt="Avatar" />
              <div>
                <div className="font-bold text-sm">Amanda Ray</div>
                <div className="text-xs text-neutral-500">Recruitment Manager</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "Is PROCRUIT free to use?", a: "We offer a free tier for candidates and a 14-day trial for recruiters. After that, we have flexible pricing plans suited for teams of all sizes." },
            { q: "How does the AI matching work?", a: "Our proprietary AI analyzes job descriptions and candidate profiles, matching skills, experience levels, and even soft skills extracted from bio data to calculate a compatibility score." },
            { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption for all data at rest and in transit. We are GDPR and CCPA compliant." },
            { q: "Can I integrate with other HR tools?", a: "Yes, PROCRUIT integrates with major ATS platforms like Greenhouse, Lever, and Workday via our robust API." }
          ].map((item, i) => (
            <Card key={i} className="p-6 cursor-pointer hover:border-[#7B2CBF] transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-white mb-2 flex items-center gap-2"><HelpCircle size={18} className="text-[#7B2CBF]" /> {item.q}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="rounded-3xl bg-gradient-to-r from-[#7B2CBF] to-purple-800 p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to Transform Your Hiring?</h2>
          <p className="text-purple-100 max-w-2xl mx-auto mb-8 relative z-10">Join thousands of companies and candidates using PROCRUIT to build the future workforce.</p>
          <Button variant="secondary" size="lg" className="bg-white text-purple-900 hover:bg-neutral-100 border-none shadow-xl relative z-10" onClick={() => navigate('/signup')}>
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">Get In Touch</h2>
        <Card className="p-8 text-left bg-neutral-900/50">
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Name" />
              <Input placeholder="Email" type="email" />
            </div>
            <Input placeholder="Subject" />
            <textarea
              className="w-full bg-black/50 border border-neutral-800 rounded-lg px-4 py-2.5 text-white placeholder-neutral-600 focus:border-[#7B2CBF] focus:ring-1 focus:ring-[#7B2CBF] outline-none h-32"
              placeholder="Your message..."
            />
            <Button className="w-full">Send Message</Button>
          </form>
        </Card>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <Card className="text-center p-8 hover:-translate-y-1 transition-transform duration-300">
    <div className="w-12 h-12 bg-[#7B2CBF]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#7B2CBF]">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <p className="text-neutral-400 leading-relaxed">{description}</p>
  </Card>
);

// --- Auth Pages (Login / Signup) ---

interface AuthPageProps {
  type: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

      console.log('Auth Success:', data); // Debugging log

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      // Backend returns flat structure for register/login, so `data` IS the user object (mostly)
      localStorage.setItem('user', JSON.stringify(data));

      if (type === 'signup') {
        // Direct redirect to Profile Page to fill details
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
      // Show a more user-friendly error message if available
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#7B2CBF] opacity-10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900 opacity-10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 cursor-pointer" onClick={() => navigate('/')}>
            <BrandLogo className="w-12 h-12 text-xl" />
          </div>
          <h2 className="text-3xl font-bold">{type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-neutral-400 mt-2">
            {type === 'login' ? 'Enter your credentials to access your account.' : 'Join the future of recruitment today.'}
          </p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-neutral-900/80 border-neutral-800">
          <form onSubmit={handleSubmit} className="space-y-6">

            {type === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">I am a...</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-black/40 rounded-lg border border-neutral-800">
                  {/* Removed ADMIN from options */}
                  {(['CANDIDATE', 'RECRUITER', 'INTERVIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-xs sm:text-xs font-medium py-2 rounded-md transition-all ${role === r
                        ? 'bg-[#7B2CBF] text-white shadow-lg'
                        : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                      {r === 'INTERVIEWER' ? 'Freelancer' : r === 'RECRUITER' ? 'Organization' : r.charAt(0) + r.slice(1).toLowerCase()}
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
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : (type === 'login' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => navigate('/signup')} className="text-[#7B2CBF] hover:underline cursor-pointer">Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => navigate('/login')} className="text-[#7B2CBF] hover:underline cursor-pointer">Log in</span></>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
