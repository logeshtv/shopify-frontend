// import React, { createContext, useContext, useEffect, useState } from "react";

// const PlanContext = createContext({ 
//   priceId: null, 
//   loading: true, 
//   user: null,
//   refreshPlan: () => {} 
// });

// export const usePlan = () => useContext(PlanContext);

// export const PlanProvider = ({ children }) => {
//   const [priceId, setPriceId] = useState(null);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchPlan = async () => {
//     const token = localStorage.getItem('token');
//     const userData = localStorage.getItem('user');
    
//     if (!token) {
//       setLoading(false);
//       return;
//     }

//     if (userData) {
//       setUser(JSON.parse(userData));
//     }

//     try {
//       const res = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/user/get`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`
//         },
//       });

//       if (res.ok) {
//         const userResponse = await res.json();
//         setPriceId(userResponse?.priceId || null);
//       }
//     } catch (error) {
//       console.error('Failed to fetch plan:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const refreshPlan = () => {
//     setLoading(true);
//     fetchPlan();
//   };

//   useEffect(() => {
//     fetchPlan();
//   }, []);

//   useEffect(() => {
//     const handleStorageChange = () => {
//       fetchPlan();
//     };

//     window.addEventListener('storage', handleStorageChange);
//     return () => window.removeEventListener('storage', handleStorageChange);
//   }, []);

//   return (
//     <PlanContext.Provider value={{ priceId, user, loading, refreshPlan }}>
//       {children}
//     </PlanContext.Provider>
//   );
// };


import React, { createContext, useContext, useEffect, useState } from "react";

const PlanContext = createContext({ 
  priceId: null, 
  loading: true, 
  user: null,
  refreshPlan: () => {} 
});

export const usePlan = () => useContext(PlanContext);

export const PlanProvider = ({ children }) => {
  const [priceId, setPriceId] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      setUser(null);
      setPriceId(null);
      setLoading(false);
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_ENDPOINT}/user/get`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (res.ok) {
        const userResponse = await res.json();
        setPriceId(userResponse?.priceId || null);
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPlan = () => {
    setLoading(true);
    fetchPlan();
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  // Listen for custom events when login happens
  useEffect(() => {
    const handleLoginSuccess = () => {
      fetchPlan();
    };

    window.addEventListener('loginSuccess', handleLoginSuccess);
    return () => window.removeEventListener('loginSuccess', handleLoginSuccess);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      fetchPlan();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <PlanContext.Provider value={{ priceId, user, loading, refreshPlan }}>
      {children}
    </PlanContext.Provider>
  );
};
