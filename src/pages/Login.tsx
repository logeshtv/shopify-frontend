import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch custom event to notify PlanContext
        window.dispatchEvent(new Event('loginSuccess'));
        
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-blue-700 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-6">Sign in to your ShopifyQ Admin</p>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 w-full text-center">
            {error}
          </div>
        )}
        <form className="w-full" onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 mb-1 font-medium">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 text-slate-500 text-sm">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
