import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const shop = searchParams.get("shop");
        const state = searchParams.get("state");
        const hmac = searchParams.get("hmac");

        if (!code || !shop || !state || !hmac) {
          throw new Error("Missing required OAuth parameters");
        }

        // Verify HMAC to ensure the request is from Shopify
        // This should be done on the backend for security
        const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

        // Exchange the authorization code for an access token
        const response = await fetch(`${backend}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            code,
            shop,
            state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              "Failed to exchange authorization code for access token"
          );
        }

        const data = await response.json();

        if (data.success && data.access_token && shop) {
          // Save access token to Supabase for this shop
          const { data: updateData, error: updateError } = await supabase
            .from("shops")
            .update({ shopify_access_token: data.access_token })
            .eq("shopify_domain", shop)
            .select("id");

          if (updateError) {
            throw new Error(
              updateError.message || "Failed to update shop with access token"
            );
          }

          // If no row was updated, insert the shop record (fallback for edge cases)
          if (
            !updateData ||
            (Array.isArray(updateData) && updateData.length === 0)
          ) {
            // Try to get user_id from localStorage (if available)
            let user_id = null;
            try {
              const email = localStorage.getItem("user_email");
              if (email) {
                const { data: user, error: userError } = await supabase
                  .from("users")
                  .select("id")
                  .eq("email", email)
                  .single();
                if (user && user.id) user_id = user.id;
              }
            } catch (e) {
              /* ignore */
            }
            const insertObj: any = {
              shopify_domain: shop,
              shopify_access_token: data.access_token,
            };
            if (user_id) insertObj.user_id = user_id;
            const { error: insertError } = await supabase
              .from("shops")
              .insert([insertObj]);
            if (insertError) {
              throw new Error(
                insertError.message || "Failed to insert shop with access token"
              );
            }
          }
        }

        if (data.success) {
          // Redirect to the dashboard
          navigate("/dashboard");
        } else {
          throw new Error("Failed to complete authentication");
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred during authentication"
        );
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ShopifyQ
            </span>
          </div>
          <CardTitle className="text-2xl">Connecting Your Store</CardTitle>
          <CardDescription>
            Please wait while we connect your Shopify store...
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-slate-600">Connecting...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully connected! Redirecting to dashboard...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
