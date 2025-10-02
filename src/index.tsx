import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';

import { Root } from '@/components/Root.tsx';
import { Provider } from 'react-redux';
import { store } from '@/slices/index.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <Root/>
    </Provider>
  </StrictMode>,
);
