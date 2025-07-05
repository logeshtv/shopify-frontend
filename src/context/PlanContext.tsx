import React, { createContext, useContext, useEffect, useState } from "react";

const PlanContext = createContext({ priceId: null, loading: true });

export const usePlan = () => useContext(PlanContext);

export const PlanProvider = ({ children }) => {
  const [priceId, setPriceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      const email = localStorage.getItem("user_email");
      if (!email) {
        setLoading(false);
        return;
      }
      const backend = import.meta.env.VITE_BACKEND_ENDPOINT;

      const res = await fetch(`${backend}/user/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const user = await res.json();
      setPriceId(user?.priceId || null);
      setLoading(false);
    };
    fetchPlan();
  }, []);
  return (
    <PlanContext.Provider value={{ priceId, loading }}>
      {children}
    </PlanContext.Provider>
  );
};
