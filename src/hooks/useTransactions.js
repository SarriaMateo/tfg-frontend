import { useState, useCallback } from 'react';
import { transactionService } from '../services/transactionService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from './useAuth';

const DEFAULT_ORDER_BY = 'last_event_at';

const normalizeOrderBy = (orderByValue) => {
  if (orderByValue === 'total_items') return 'total_items';
  if (orderByValue === 'created_at') return 'created_at';
  if (orderByValue === 'status') return 'status';
  if (orderByValue === 'operation_type') return 'operation_type';
  if (orderByValue === DEFAULT_ORDER_BY) return DEFAULT_ORDER_BY;
  return DEFAULT_ORDER_BY;
};

const DEFAULT_TRANSACTIONS_QUERY = {
  page: 1,
  pageSize: 20,
  order_by: DEFAULT_ORDER_BY,
  order_desc: true,
};

const TRANSACTIONS_QUERY_STORAGE_PREFIX = 'transactionsListState:';

const buildDefaultTransactionsQuery = (defaultBranchId) => ({
  ...DEFAULT_TRANSACTIONS_QUERY,
  ...(defaultBranchId ? { branch_id: Number(defaultBranchId) } : {}),
});

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
      order_by: normalizeOrderBy(parsed?.order_by),
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
  const fetchTransactions = useCallback(async (filters = {}, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { defaultBranchId } = options;
      const hasFilters = Object.keys(filters).length > 0;
      const storedQuery = !hasFilters ? readStoredTransactionsQuery(user?.id) : null;
      const nextQuery = hasFilters
        ? {
            ...DEFAULT_TRANSACTIONS_QUERY,
            ...filters,
          }
        : (storedQuery || buildDefaultTransactionsQuery(defaultBranchId));

      const normalizedOrderBy = normalizeOrderBy(nextQuery.order_by);
      const nextQueryWithNormalizedOrder = {
        ...nextQuery,
        order_by: normalizedOrderBy,
      };

      const { page = 1, pageSize = 20, ...restFilters } = nextQueryWithNormalizedOrder;
      const params = {
        page,
        page_size: pageSize,
      };

      Object.entries(restFilters).forEach(([key, value]) => {
        if (value === '' || value === null || value === undefined) return;
        params[key] = value;
      });

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
