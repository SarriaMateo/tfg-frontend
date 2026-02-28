import React, { createContext, useState, useEffect, useCallback } from 'react';

// @refresh reset
const BranchSelectionContext = createContext();

const SELECTED_BRANCH_KEY = 'selectedBranchId';

export const BranchSelectionProvider = ({ children }) => {
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedBranchId = localStorage.getItem(SELECTED_BRANCH_KEY);
    if (storedBranchId) {
      setSelectedBranchId(parseInt(storedBranchId, 10));
    }
    setLoading(false);
  }, []);

  const selectBranch = useCallback((branchId) => {
    setSelectedBranchId(branchId);
    if (branchId) {
      localStorage.setItem(SELECTED_BRANCH_KEY, branchId.toString());
    } else {
      localStorage.removeItem(SELECTED_BRANCH_KEY);
    }
  }, []);

  const clearBranchSelection = useCallback(() => {
    setSelectedBranchId(null);
    localStorage.removeItem(SELECTED_BRANCH_KEY);
  }, []);

  const value = {
    selectedBranchId,
    selectBranch,
    clearBranchSelection,
    loading,
  };

  return (
    <BranchSelectionContext.Provider value={value}>
      {children}
    </BranchSelectionContext.Provider>
  );
};

export { BranchSelectionContext };
