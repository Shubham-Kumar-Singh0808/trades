import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { createContext, useContext, useState } from 'react';

const DeleteConfirmContext = createContext();

export const DeleteConfirmProvider = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    resolveRef: null,
    loading: false,
  });

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        open: true,
        title,
        message,
        resolveRef: { current: resolve },
        loading: false,
      });
    });
  };

  const closeConfirm = (confirmed = false) => {
    if (confirmDialog.resolveRef?.current) {
      confirmDialog.resolveRef.current(confirmed);
    }
    setConfirmDialog({ 
      open: false,
      title: '',
      message: '',
      resolveRef: null,
      loading: false,
    });
  };

  const handleConfirm = async () => {
    closeConfirm(true);
  };

  return (
    <DeleteConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <Dialog open={confirmDialog.open} onClose={() => closeConfirm(false)}>
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => closeConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DeleteConfirmContext.Provider>
  );
};

export const useDeleteConfirm = () => {
  const context = useContext(DeleteConfirmContext);
  if (!context) {
    throw new Error('useDeleteConfirm must be used within DeleteConfirmProvider');
  }
  return context;
};
