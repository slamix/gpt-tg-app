import ReactDOM from 'react-dom/client';

import { Root } from '@/components/Root.tsx';
import { Provider } from 'react-redux';
import { store } from '@/slices/index.ts';

import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <Provider store={store}>
    <Root/>
  </Provider>,
);
