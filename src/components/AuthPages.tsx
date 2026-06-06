import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, CheckSquare, Users, BarChart3, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TaskFlow</span>
          </div>
          <p className="text-white/70 text-sm">Team Task Manager</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your team's<br />work, together.
          </h1>
          <div className="space-y-4">
            {[
              { icon: Users, text: 'Team collaboration with role-based access' },
              { icon: BarChart3, text: 'Real-time progress tracking & analytics' },
              { icon: Shield, text: 'Admin & Member role management' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-xs">
          © 2025 TaskFlow. Built for modern teams.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don't have an account?{' '}
            <button onClick={onSwitch} className="text-indigo-600 font-medium hover:text-indigo-700 cursor-pointer">
              Create one <ArrowRight className="w-3 h-3 inline" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TaskFlow</span>
          </div>
          <p className="text-white/70 text-sm">Team Task Manager</p>
        </div>

        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Start managing<br />tasks in minutes.
          </h1>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-white/90">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
              <span className="text-sm">Create your free account</span>
            </div>
            <div className="flex items-start gap-3 text-white/90">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
              <span className="text-sm">Set up your first project</span>
            </div>
            <div className="flex items-start gap-3 text-white/90">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
              <span className="text-sm">Invite team members & assign tasks</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-white/50 text-xs">
          © 2025 TaskFlow. Built for modern teams.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TaskFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
              <p className="text-gray-500 mt-1">Get started with your free account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm bg-gray-50 focus:bg-white"
                  placeholder="Re-enter password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{' '}
            <button onClick={onSwitch} className="text-emerald-600 font-medium hover:text-emerald-700 cursor-pointer">
              Sign in <ArrowRight className="w-3 h-3 inline" />
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
