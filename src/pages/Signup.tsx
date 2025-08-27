import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeUrl, setStoreUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate store URL format
    const storeUrlPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!storeUrlPattern.test(storeUrl)) {
      setError(
        "Please enter a valid Shopify store URL (e.g., your-store.myshopify.com)"
      );
      setLoading(false);
      return;
    }
    // Normalize the store URL for consistency
    const normalizedStoreUrl = storeUrl.trim().toLowerCase();

    // Hash the password (client-side for demo; in production, do this server-side)
    const hashPassword = async (password: string) => {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    try {
      const password_hash = await hashPassword(password);
      // Insert user into Supabase
      const { error: supabaseError } = await supabase
        .from("users")
        .insert([{ name, email, password_hash }]);
      if (supabaseError) {
        setError(supabaseError.message);
        setLoading(false);
        return;
      }
      // Fetch the new user's id
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      if (fetchError || !userData) {
        setError(fetchError?.message || "Could not fetch user id");
        setLoading(false);
        return;
      }
      const userId = userData.id;
      // Use upsert to avoid duplicate shops for the same user and domain
      // onConflict must be a comma-separated string of columns
      const { error: shopError } = await supabase
        .from("shops")
        .upsert([{ user_id: userId, shopify_domain: normalizedStoreUrl }], {
          onConflict: "user_id,shopify_domain",
        });
      if (shopError) {
        setError(shopError.message);
        setLoading(false);
        return;
      }
      // Store email in localStorage for session persistence
      const user = { id: userId, name, email, type: 'admin', role: 'admin' };
const token = 'temp_token_' + Math.random().toString(36); // Temporary token for OAuth flow
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));;
      // Redirect to Shopify OAuth
      const shopifyAuthUrl = `https://${normalizedStoreUrl}/admin/oauth/authorize?client_id=${
        import.meta.env.VITE_SHOPIFY_API_KEY
      }&scope=read_products,write_products,read_orders,write_orders&redirect_uri=${encodeURIComponent(
        import.meta.env.VITE_REDIRECT_URI ||
          "http://localhost:8080/auth/callback"
      )}&state=${Math.random().toString(36).substring(2, 15)}`;
      window.location.href = shopifyAuthUrl;
    } catch (err: any) {
      setError(err.message || "Signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold text-purple-700 mb-2">
          Create Your Account
        </h2>
        <p className="text-slate-500 mb-6">
          Sign up to manage your ShopifyQ Admin
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 w-full text-center">
            {error}
          </div>
        )}
        <form className="w-full" onSubmit={handleSignup}>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">
              Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-700 mb-1 font-medium">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 mb-1 font-medium">
              Shopify Store URL
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="your-store.myshopify.com"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 rounded-lg shadow hover:from-purple-700 hover:to-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 text-slate-500 text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-purple-600 hover:underline font-medium"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
