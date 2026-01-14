import { useEffect, useState } from "react";

/**
 * useBooting
 * Keeps "booting" true until the first successful forecast load.
 */
export function useBooting(loading, rowsLength) {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (booting && !loading && rowsLength > 0) {
      setBooting(false);
    }
  }, [booting, loading, rowsLength]);

  return booting;
}
