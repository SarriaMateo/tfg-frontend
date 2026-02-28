import { useState, useCallback } from 'react';
import { itemService } from '../services/itemService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from './useAuth';

const DEFAULT_ITEMS_QUERY = {
  page: 1,
  pageSize: 20,
  order_by: 'created_at',
  order_desc: true,
};

const ITEMS_QUERY_STORAGE_PREFIX = 'itemsListState:';

const getItemsQueryStorageKey = (userId) => `${ITEMS_QUERY_STORAGE_PREFIX}${userId}`;

const readStoredItemsQuery = (userId) => {
  if (!userId) return null;

  try {
    const rawValue = sessionStorage.getItem(getItemsQueryStorageKey(userId));
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    return {
      ...DEFAULT_ITEMS_QUERY,
      ...parsed,
      page: Number(parsed?.page) || DEFAULT_ITEMS_QUERY.page,
      pageSize: Number(parsed?.pageSize) || DEFAULT_ITEMS_QUERY.pageSize,
      order_desc: typeof parsed?.order_desc === 'boolean' ? parsed.order_desc : DEFAULT_ITEMS_QUERY.order_desc,
    };
  } catch {
    return null;
  }
};

const saveItemsQuery = (userId, query) => {
  if (!userId) return;

  try {
    sessionStorage.setItem(getItemsQueryStorageKey(userId), JSON.stringify(query));
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

export const useItems = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuery, setCurrentQuery] = useState(DEFAULT_ITEMS_QUERY);
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
      const hasFilters = Object.keys(filters).length > 0;
      const storedQuery = !hasFilters ? readStoredItemsQuery(user?.id) : null;
      const nextQuery = hasFilters
        ? {
            ...DEFAULT_ITEMS_QUERY,
            ...filters,
          }
        : (storedQuery || DEFAULT_ITEMS_QUERY);

      const { page = 1, pageSize = 20, ...restFilters } = nextQuery;
      const params = {
        page,
        page_size: pageSize,
        ...restFilters,
      };

      const response = await itemService.listItems(params);

      const normalizedQuery = {
        ...DEFAULT_ITEMS_QUERY,
        ...restFilters,
        page,
        pageSize,
      };

      setCurrentQuery((prev) => (areQueriesEqual(prev, normalizedQuery) ? prev : normalizedQuery));
      saveItemsQuery(user?.id, normalizedQuery);

      setItems(response.data);
      setPagination({
        page: response.page,
        pageSize: response.page_size,
        total: response.total,
        totalPages: response.total_pages,
      });
    } catch (err) {
      setError(translateError(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    items,
    loading,
    error,
    pagination,
    currentQuery,
    fetchItems,
  };
};
