import { useState, useCallback } from 'react';
import { itemService } from '../services/itemService';
import { translateError } from '../utils/errorTranslator';
import { useAuth } from './useAuth';
import { useBranchSelection } from './useBranchSelection';

const DEFAULT_ITEMS_QUERY = {
  page: 1,
  pageSize: 20,
  is_active: true,
  order_by: 'name',
  order_desc: false,
};

const ITEMS_QUERY_STORAGE_PREFIX = 'itemsListState:';
const SELECTED_BRANCH_KEY = 'selectedBranchId';

const resolveBranchId = (userBranchId, selectedBranchId) => {
  if (userBranchId) return Number(userBranchId);
  if (selectedBranchId) return Number(selectedBranchId);

  const storedBranchId = localStorage.getItem(SELECTED_BRANCH_KEY);
  if (!storedBranchId) return null;

  const parsedStoredBranchId = Number(storedBranchId);
  return Number.isInteger(parsedStoredBranchId) && parsedStoredBranchId > 0 ? parsedStoredBranchId : null;
};

const getItemsQueryStorageKey = (userId) => `${ITEMS_QUERY_STORAGE_PREFIX}${userId}`;

const readStoredItemsQuery = (userId) => {
  if (!userId) return null;

  try {
    const rawValue = sessionStorage.getItem(getItemsQueryStorageKey(userId));
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    const storedQuery = {
      ...parsed,
      page: Number(parsed?.page) || DEFAULT_ITEMS_QUERY.page,
      pageSize: Number(parsed?.pageSize) || DEFAULT_ITEMS_QUERY.pageSize,
      order_by: parsed?.order_by || DEFAULT_ITEMS_QUERY.order_by,
      order_desc: typeof parsed?.order_desc === 'boolean' ? parsed.order_desc : DEFAULT_ITEMS_QUERY.order_desc,
    };

    if (Object.prototype.hasOwnProperty.call(parsed, 'is_active')) {
      storedQuery.is_active = parsed.is_active;
    }

    return storedQuery;
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
  const { selectedBranchId } = useBranchSelection();
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
      const branchId = resolveBranchId(user?.branch_id, selectedBranchId);
      const hasFilters = Object.keys(filters).length > 0;
      const storedQuery = !hasFilters ? readStoredItemsQuery(user?.id) : null;
      const nextQuery = hasFilters
        ? {
            ...filters,
            page: filters.page ?? 1,
            pageSize: filters.pageSize ?? DEFAULT_ITEMS_QUERY.pageSize,
            order_by: filters.order_by ?? DEFAULT_ITEMS_QUERY.order_by,
            order_desc: filters.order_desc ?? DEFAULT_ITEMS_QUERY.order_desc,
          }
        : (storedQuery || DEFAULT_ITEMS_QUERY);

      const { page = 1, pageSize = 20, ...restFilters } = nextQuery;
      const params = {
        page,
        page_size: pageSize,
        ...restFilters,
      };

      if (branchId) {
        params.branch_id = branchId;
      }

      const response = await itemService.listItems(params);

      const normalizedQuery = {
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
  }, [selectedBranchId, user?.id, user?.branch_id]);

  return {
    items,
    loading,
    error,
    pagination,
    currentQuery,
    fetchItems,
  };
};
