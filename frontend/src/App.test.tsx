import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Store from './State/features/store/Store';

test('renders shopper brand', () => {
  render(
    <Provider store={Store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </Provider>,
  );

  const brandElement = screen.getByRole('button', { name: /shopper/i });
  expect(brandElement).toBeInTheDocument();
});
