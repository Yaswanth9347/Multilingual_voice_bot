import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

test('displays the correct text', () => {
  render(<MyComponent />);
  const element = screen.getByText(/react/i);
  
  // Using jest-dom matcher to check if the element is in the document
  expect(element).toBeInTheDocument();
  
  // Using jest-dom matcher to check if the element has specific text content
  expect(element).toHaveTextContent(/Welcome to React/i);
});

test('should have a button with specific class', () => {
  render(<MyComponent />);
  const button = screen.getByRole('button');
  
  // Using jest-dom matcher to check if button has a specific class
  expect(button).toHaveClass('btn-primary');
});
