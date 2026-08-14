import React from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';
import Root from './app.jsx';

createRoot(document.getElementById('root')).render(React.createElement(Root, null));
