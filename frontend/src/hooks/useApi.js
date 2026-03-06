// src/hooks/useApi.js
// A reusable hook for making API calls with loading and error state.
//
// Usage:
//   const { data, loading, error, execute } = useApi(getTeachers);
//   useEffect(() => { execute(token); }, [token]);

import { useState, useCallback } from 'react';

export function useApi(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  const reset = () => { setData(null); setError(null); };

  return { data, loading, error, execute, reset };
}
