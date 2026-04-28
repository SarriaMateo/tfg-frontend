import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboardService";
import { translateError } from "../utils/errorTranslator";

/**
 * Hook to manage dashboard data fetching and state
 * @param {object} options - Configuration options
 * @param {string} options.period - 'day', 'week', 'month', 'total'
 * @param {number} options.branchId - Optional branch ID
 * @returns {object} Dashboard data and loading/error states
 */
export const useDashboard = (options = {}) => {
  const [activityData, setActivityData] = useState(null);
  const [stockRiskData, setStockRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [activity, stockRisk] = await Promise.all([
        dashboardService.getDashboardActivity({
          period: options.period || "day",
          branchId: options.branchId,
        }),
        dashboardService.getDashboardStockRisk({
          branchId: options.branchId,
        }),
      ]);

      setActivityData(activity);
      setStockRiskData(stockRisk);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(translateError(err));
    } finally {
      setLoading(false);
    }
  }, [options.period, options.branchId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    activityData,
    stockRiskData,
    loading,
    error,
    refetch: fetchDashboardData,
  };
};
