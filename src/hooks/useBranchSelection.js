import { useContext } from 'react';
import { BranchSelectionContext } from '../context/BranchSelectionContext';

export const useBranchSelection = () => {
  const context = useContext(BranchSelectionContext);
  
  if (!context) {
    throw new Error('useBranchSelection must be used within BranchSelectionProvider');
  }
  
  return context;
};
