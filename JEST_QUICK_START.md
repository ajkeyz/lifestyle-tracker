# Jest Testing - Quick Start Guide

## ✅ What's Configured

Jest is now fully set up and working in your project!

### Test Results
```
✅ Component Tests: 6/6 passing
✅ Backend Tests: 8/9 passing
📊 Total: 14/15 tests passing (93%)
```

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test quick-stats-bar

# Run tests matching a pattern
npm test -- --testPathPattern=components
```

### VSCode Jest Extension Usage

Now that you have the Jest extension installed, you can:

1. **Run Tests from Editor**
   - Click the green ▶️ button next to any `it()` or `describe()` block
   - Right-click in a test file → "Jest: Run Test"

2. **Debug Tests**
   - Click the 🐛 debug icon next to a test
   - Set breakpoints by clicking in the gutter
   - Inspect variables during test execution

3. **View Test Status**
   - ✅ Green checkmarks appear next to passing tests
   - ❌ Red X marks appear next to failing tests
   - Inline error messages show why tests failed

4. **Test Explorer**
   - Open the Testing panel (beaker icon in sidebar)
   - See all tests in a tree view
   - Run/debug individual or grouped tests

## 📁 Example Test Files

### React Component Test
**Location:** `client/src/components/__tests__/quick-stats-bar.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { QuickStatsBar } from '../quick-stats-bar';

describe('QuickStatsBar', () => {
  it('renders all stats correctly', () => {
    render(<QuickStatsBar user={mockUser} />);

    expect(screen.getByTestId('stat-streak')).toHaveTextContent('5');
  });
});
```

### Backend Logic Test
**Location:** `server/__tests__/storage.test.ts`

```ts
import { MemStorage } from '../storage';

describe('MemStorage', () => {
  it('creates a new user with default values', async () => {
    const storage = new MemStorage();
    const user = await storage.getOrCreateUser('test-session-1');

    expect(user.membershipTier).toBe('free');
    expect(user.moneyHealth).toBe(50);
  });
});
```

## 🎯 Writing Your First Test

### 1. Create a test file
```bash
# For components
mkdir -p client/src/components/__tests__
touch client/src/components/__tests__/my-component.test.tsx

# For backend code
mkdir -p server/__tests__
touch server/__tests__/my-module.test.ts
```

### 2. Write the test
```tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('displays the title', () => {
    render(<MyComponent title="Hello World" />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### 3. Run the test
```bash
npm test my-component
```

## 📝 Common Testing Patterns

### Testing User Interactions
```tsx
import userEvent from '@testing-library/user-event';

it('handles button clicks', async () => {
  const user = userEvent.setup();
  render(<Button onClick={mockFn}>Click me</Button>);

  await user.click(screen.getByRole('button'));

  expect(mockFn).toHaveBeenCalled();
});
```

### Testing Async Code
```tsx
it('loads data asynchronously', async () => {
  render(<DataComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  const data = await screen.findByText('Data loaded');
  expect(data).toBeInTheDocument();
});
```

### Mocking Functions
```ts
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValue({
  json: async () => ({ data: 'test' })
});
```

## 🔧 Configuration Files

- **jest.config.ts** - Main Jest configuration
- **jest.setup.ts** - Setup run before each test
- **__mocks__/fileMock.ts** - Mock for static assets
- **.vscode/settings.json** - VSCode Jest extension settings

## 📊 Coverage Reports

After running `npm run test:coverage`:

1. **Terminal Output** - Summary in console
2. **HTML Report** - Open `coverage/lcov-report/index.html` in browser
3. **VSCode** - Inline coverage indicators (green/red/yellow highlights)

## 🎨 VSCode Extension Features You Can Use

### Auto-Run Tests
Tests automatically run when you save a file (configured in `.vscode/settings.json`)

### Inline Diagnostics
- See test results directly in your editor
- Red underlines show exact failures
- Hover for error details

### Test Explorer Panel
- Click the beaker icon in Activity Bar
- Tree view of all tests
- Run/debug any test with one click

### Coverage Highlighting
- Toggle with `Cmd/Ctrl + Shift + P` → "Jest: Toggle Coverage"
- Green = covered lines
- Red = uncovered lines
- Yellow = partially covered

## 🐛 Troubleshooting

### Tests not appearing in VSCode?
1. Check the Output panel → "Jest" channel
2. Reload VSCode: `Cmd/Ctrl + Shift + P` → "Reload Window"
3. Verify `jest.jestCommandLine` in settings.json

### Import errors?
- Check path aliases in `jest.config.ts` moduleNameMapper
- Ensure they match your `tsconfig.json` paths

### Component tests failing?
- Make sure you're using `@jest-environment jsdom` (default)
- Mock any browser APIs used by your components

### Backend tests failing?
- Use `@jest-environment node` comment at top of file
- Mock database connections and external services

## 📚 Next Steps

1. **Write More Tests**
   - Aim for 70%+ code coverage
   - Test critical user flows
   - Test error scenarios

2. **Add CI Integration**
   - Run tests on every PR
   - Block merges if tests fail
   - Track coverage over time

3. **Learn Advanced Patterns**
   - Snapshot testing
   - Custom matchers
   - Test utilities and helpers

## 🔗 Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)
- [Jest VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)

---

**Happy Testing! 🎉**

Your Jest setup is ready to use. Start writing tests and watch your code quality improve!
