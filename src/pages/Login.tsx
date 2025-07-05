import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Debug information
  useEffect(() => {
    console.log("Login component mounted");
    console.log("Environment variables:", {
      SHOPIFY_API_KEY: import.meta.env.VITE_SHOPIFY_API_KEY,
      REDIRECT_URI:
        import.meta.env.VITE_REDIRECT_URI ||
        "http://localhost:8080/auth/callback",
      SCOPES: "read_products,write_products,read_orders,write_orders",
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Hash the password
    const hashPassword = async (password: string) => {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    try {
      const password_hash = await hashPassword(password);
      // Try admin login first
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email, password_hash")
        .eq("email", email)
        .single();
      if (user && user.password_hash === password_hash) {
        localStorage.setItem("user_email", user.email);
        localStorage.setItem("user_type", "admin");
        localStorage.setItem("user_role", "admin");
        setLoading(false);
        navigate("/dashboard");
        return;
      }
      // Try sub_user login
      const { data: subUser, error: subUserError } = await supabase
        .from("sub_users")
        .select("id, name, email, password_hash, role")
        .eq("email", email)
        .single();
      if (subUser && subUser.password_hash === password_hash) {
        localStorage.setItem("user_email", subUser.email);
        localStorage.setItem("user_type", "sub_user");
        localStorage.setItem("user_role", subUser.role);
        setLoading(false);
        navigate("/dashboard");
        return;
      }
      setError("Invalid email or password");
      setLoading(false);
    } catch (err: any) {
      setError("Login failed");
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
            <label className="block text-slate-700 mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 mb-1 font-medium">
              Password
            </label>
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
          <a
            href="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
