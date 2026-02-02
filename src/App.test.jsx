import { render, screen } from '@testing-library/react';
import App from './App';

test('la aplicación se renderiza correctamente', () => {
  render(<App />);
  expect(screen).toBeDefined();
});
