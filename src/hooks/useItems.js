import { useState, useCallback } from 'react';
import { itemService } from '../services/itemService';

export const useItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch items with filters, search, sort and pagination
  const fetchItems = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, pageSize = 20, ...restFilters } = filters;
      const params = {
        page,
        page_size: pageSize,
        ...restFilters,
      };

      const response = await itemService.listItems(params);

      setItems(response.data);
      setPagination({
        page: response.page,
        pageSize: response.page_size,
        total: response.total,
        totalPages: response.total_pages,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    items,
    loading,
    error,
    pagination,
    fetchItems,
  };
};
