import React from 'react';
import {createRoot} from 'react-dom/client';
import AdminApp from './AdminApp';
import './admin.css';
// Separate PWA entry: no Chat socket, no embedded administrative secrets.
createRoot(document.getElementById('admin-root')!).render(<React.StrictMode><AdminApp/></React.StrictMode>);
