# Jest Testing Setup Guide

## 📦 Installation

Install Jest and required testing dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event identity-obj-proxy
```

## 🎯 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test quick-stats-bar

# Run tests matching a pattern
npm test -- --testPathPattern=components
```

## 📁 Test File Organization

```
client/src/
  ├── components/
  │   ├── __tests__/
  │   │   └── quick-stats-bar.test.tsx
  │   └── quick-stats-bar.tsx

server/
  ├── __tests__/
  │   └── storage.test.ts
  └── storage.ts
```

## ✅ What's Configured

### 1. **jest.config.ts**
- TypeScript support via ts-jest
- React Testing Library setup
- Path alias mapping (@/, @shared/, @server/)
- CSS/image mocking
- Coverage thresholds

### 2. **jest.setup.ts**
- @testing-library/jest-dom matchers
- Browser API mocks (matchMedia, IntersectionObserver, ResizeObserver)
- Environment variables

### 3. **Sample Tests**
- `client/src/components/__tests__/quick-stats-bar.test.tsx` - Component testing example
- `server/__tests__/storage.test.ts` - Backend logic testing example

## 📝 Writing Tests

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    const { user } = render(<button onClick={handleClick}>Click me</button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Backend Test Example

```ts
import { myFunction } from '../my-module';

describe('myFunction', () => {
  it('returns expected result', () => {
    const result = myFunction('input');

    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Testing API Endpoints

```ts
import request from 'supertest';
import app from '../server/index';

describe('POST /api/endpoint', () => {
  it('returns 200 on success', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
  });
});
```

## 🧪 Testing Best Practices

### 1. **Use descriptive test names**
```ts
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('displays error message when input is invalid', () => { ... });
```

### 2. **Follow AAA pattern**
```ts
it('increments counter on button click', async () => {
  // Arrange
  render(<Counter />);

  // Act
  await userEvent.click(screen.getByRole('button'));

  // Assert
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### 3. **Test behavior, not implementation**
```ts
// ❌ Bad - testing implementation
expect(component.state.count).toBe(1);

// ✅ Good - testing behavior
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

### 4. **Use data-testid sparingly**
```tsx
// Prefer semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// Only use data-testid when necessary
<div data-testid="complex-component">...</div>
screen.getByTestId('complex-component')
```

## 🎨 Jest VSCode Extension Features

### Running Tests from Editor
1. **Run single test**: Click the green play button next to `it()` or `describe()`
2. **Debug test**: Click the debug icon next to the test
3. **View coverage**: Shows inline coverage indicators

### Keyboard Shortcuts
- `Cmd/Ctrl + Shift + P` → "Jest: Run All Tests"
- `Cmd/Ctrl + Shift + P` → "Jest: Toggle Coverage"
- `Cmd/Ctrl + Shift + P` → "Jest: Watch Tests"

### Extension Settings
Add to `.vscode/settings.json`:
```json
{
  "jest.autoRun": "watch",
  "jest.showCoverageOnLoad": true,
  "jest.testExplorer.enabled": true
}
```

## 🔧 Common Issues & Solutions

### Issue: Path aliases not working
**Solution**: Ensure `moduleNameMapper` in jest.config.ts matches your tsconfig paths

### Issue: CSS imports causing errors
**Solution**: Already configured with `identity-obj-proxy` in jest.config.ts

### Issue: React hooks errors in tests
**Solution**: Wrap components with proper providers (QueryClientProvider, etc.)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
```

## 📊 Coverage Reports

After running `npm test -- --coverage`, view reports at:
- **Terminal**: Summary in console
- **HTML**: Open `coverage/lcov-report/index.html` in browser
- **VSCode**: Inline coverage indicators (if extension configured)

## 🚀 Continuous Integration

Add to your CI workflow (GitHub Actions example):

```yaml
- name: Run tests
  run: npm test -- --coverage --maxWorkers=2

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
