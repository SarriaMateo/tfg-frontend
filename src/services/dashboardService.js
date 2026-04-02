import api from "../api/api";

export const dashboardService = {
  /**
   * Get activity dashboard data
   * @param {object} params - Query parameters
   * @param {string} params.period - 'day', 'week', 'month', 'total'
   * @param {number} params.branchId - Optional branch ID
   * @returns {Promise} Activity data with operations and transaction lines
   */
  getDashboardActivity: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.period) {
      queryParams.append("period", params.period);
    }
    
    if (params.branchId) {
      queryParams.append("branch_id", params.branchId);
    }

    const response = await api.get(`/dashboard/activity?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get stock risk dashboard data
   * @param {object} params - Query parameters
   * @param {number} params.branchId - Optional branch ID
   * @returns {Promise} Stock risk data with alerts and metrics
   */
  getDashboardStockRisk: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.branchId) {
      queryParams.append("branch_id", params.branchId);
    }

    const response = await api.get(`/dashboard/stock-risk?${queryParams.toString()}`);
    return response.data;
  },
};
