# Global Toast & Delete Confirmation System

This document describes the global notification system implemented across the project.

## Components Created

### 1. **ToastContext** (`src/context/ToastContext.jsx`)
- Global context for managing toast notifications
- `useToast()` hook to access toast functionality
- Methods:
  - `showToast(message, severity, duration)` - Show a toast message
  - `removeToast(id)` - Remove a specific toast

### 2. **Toast Component** (`src/components/Toast.jsx`)
- Renders all active toasts in the bottom-right corner
- Automatically dismisses toasts after specified duration (default: 3 seconds for success, 4 seconds for errors)
- Supports success, error, warning, and info severity levels

### 3. **DeleteConfirmContext** (`src/context/DeleteConfirmContext.jsx`)
- Global context for delete confirmation dialogs
- `useDeleteConfirm()` hook to access confirmation functionality
- `showConfirm(title, message)` - Returns a Promise that resolves to true/false based on user action

### 4. **API Client Interceptors** (`src/api/client.js`)
- **Request Interceptor**: Shows loader when API request starts
- **Response Interceptor**: 
  - Shows success toast for POST, PUT, PATCH, DELETE operations
  - Shows error toast for any failed request
  - Auto-hides loader when request completes

## Integration Points

### Setup
All providers are integrated in `src/main.jsx`:
- `LoaderProvider` - Global loader state
- `ToastProvider` - Global toast state
- `DeleteConfirmProvider` - Delete confirmation state

### Usage Example

#### Using Toast Notifications
```javascript
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const { showToast } = useToast();
  
  const handleAction = () => {
    showToast('Operation successful', 'success');
    showToast('Operation failed', 'error', 4000);
  };
}
```

#### Using Delete Confirmations
```javascript
import { useDeleteConfirm } from '../context/DeleteConfirmContext';

function MyComponent() {
  const { showConfirm } = useDeleteConfirm();
  
  const handleDelete = async (item) => {
    const confirmed = await showConfirm(
      'Delete Item?',
      'Are you sure you want to delete this item?'
    );
    
    if (confirmed) {
      await api.delete(`/api/item/${item.id}`);
      // Toast is shown automatically by API interceptor
    }
  };
}
```

## Features

✅ **Automatic API Toasts** - All API calls show success/error toasts automatically  
✅ **Delete Confirmations** - Confirmation dialog appears before any delete operation  
✅ **Global Loader** - Loader appears during API requests  
✅ **Stacked Toasts** - Multiple toasts can be displayed simultaneously  
✅ **Auto-dismiss** - Toasts automatically disappear after set duration  
✅ **Customizable** - Message, severity, and duration are all customizable  

## Pages Updated

### UsersPage
- Delete confirmation added before user deletion
- API interceptors handle success/error toasts automatically
