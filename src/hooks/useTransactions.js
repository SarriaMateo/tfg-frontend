import { useState, useCallback } from 'react';
import { transactionService } from '../services/transactionService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from './useAuth';

const DEFAULT_TRANSACTIONS_QUERY = {
  page: 1,
  pageSize: 20,
  order_by: 'created_at',
  order_desc: true,
};

const TRANSACTIONS_QUERY_STORAGE_PREFIX = 'transactionsListState:';

const getTransactionsQueryStorageKey = (userId) => `${TRANSACTIONS_QUERY_STORAGE_PREFIX}${userId}`;

const readStoredTransactionsQuery = (userId) => {
  if (!userId) return null;

  try {
    const rawValue = sessionStorage.getItem(getTransactionsQueryStorageKey(userId));
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    return {
      ...DEFAULT_TRANSACTIONS_QUERY,
      ...parsed,
      page: Number(parsed?.page) || DEFAULT_TRANSACTIONS_QUERY.page,
      pageSize: Number(parsed?.pageSize) || DEFAULT_TRANSACTIONS_QUERY.pageSize,
      order_desc: typeof parsed?.order_desc === 'boolean' ? parsed.order_desc : DEFAULT_TRANSACTIONS_QUERY.order_desc,
    };
  } catch {
    return null;
  }
};

const saveTransactionsQuery = (userId, query) => {
  if (!userId) return;

  try {
    sessionStorage.setItem(getTransactionsQueryStorageKey(userId), JSON.stringify(query));
  } catch {
    // Ignore storage errors in private mode or blocked storage
  }
};

const areQueriesEqual = (queryA, queryB) => {
  const keysA = Object.keys(queryA || {});
  const keysB = Object.keys(queryB || {});

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => queryA[key] === queryB[key]);
};

export const useTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState(DEFAULT_TRANSACTIONS_QUERY);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch transactions with filters, sorting and pagination
  const fetchTransactions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const hasFilters = Object.keys(filters).length > 0;
      const storedQuery = !hasFilters ? readStoredTransactionsQuery(user?.id) : null;
      const nextQuery = hasFilters
        ? {
            ...DEFAULT_TRANSACTIONS_QUERY,
            ...filters,
          }
        : (storedQuery || DEFAULT_TRANSACTIONS_QUERY);

      const { page = 1, pageSize = 20, ...restFilters } = nextQuery;
      const params = {
        page,
        page_size: pageSize,
        ...restFilters,
      };

      const response = await transactionService.listTransactions(params);

      const normalizedQuery = {
        ...DEFAULT_TRANSACTIONS_QUERY,
        ...restFilters,
        page,
        pageSize,
      };

      setCurrentQuery((prev) => (areQueriesEqual(prev, normalizedQuery) ? prev : normalizedQuery));
      saveTransactionsQuery(user?.id, normalizedQuery);

      setTransactions(Array.isArray(response?.data) ? response.data : []);
      setPagination({
        page: response?.page || page,
        pageSize: response?.page_size || pageSize,
        total: response?.total || 0,
        totalPages: response?.total_pages || 0,
      });
    } catch (err) {
      setError(translateError(err));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    transactions,
    loading,
    error,
    pagination,
    currentQuery,
    fetchTransactions,
  };
};
