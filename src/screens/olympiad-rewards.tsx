import { Navigate } from "react-router";

/**
 * Rewards is now ONE unified inbox at /arena/rewards (leagues + championships).
 * This route only redirects there so old links and the Olympiad "Rewards" entry
 * land on the single merged page. All reward UI now lives in arena-rewards.tsx.
 */
export function Component() {
  return <Navigate to="/arena/rewards" replace />;
}
