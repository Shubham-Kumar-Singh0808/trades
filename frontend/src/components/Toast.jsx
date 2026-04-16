import { Alert, Box } from '@mui/material';
import { useToast } from '../context/ToastContext';

export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, maxWidth: 400 }}>
      {toasts.map((toast, index) => (
        <Alert
          key={toast.id}
          onClose={() => removeToast(toast.id)}
          severity={toast.severity}
          sx={{ 
            width: '100%', 
            minWidth: 300,
            mb: 1,
          }}
        >
          {toast.message}
        </Alert>
      ))}
    </Box>
  );
}
