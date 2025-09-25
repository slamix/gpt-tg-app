import type { ComponentType, JSX } from 'react';

import { ChatPage } from '@/pages/ChatPage';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: ChatPage },
];
