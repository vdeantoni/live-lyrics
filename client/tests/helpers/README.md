# Test Utilities

This directory contains reusable testing utilities for the Live Lyrics client application.

## Files

### `testRegistry.ts`

Factory function that creates consistent test data for the provider registry. This ensures all tests use the same mock data structure.

```typescript
import { createTestRegistry } from "./testRegistry";

const testRegistry = createTestRegistry();
// Contains mock data for lyrics providers (LrcLib, Local Server, Simulated)
// Contains mock data for artwork providers (iTunes)
// Contains mock data for player sources (Local, Remote)
```

### `TestProvider.tsx`

React component that automatically handles bootstrap initialization and loading states for tests.

```typescript
import { TestProvider } from "./TestProvider";

// Wrap your test components with TestProvider
<TestProvider testRegistry={optionalCustomRegistry}>
  <YourComponent />
</TestProvider>
```

### `testUtils.tsx`

Custom render functions that automatically wrap components with `TestProvider`.

#### `renderWithProviders(ui, options)`

Main render function that waits for bootstrap to complete automatically.

```typescript
import { renderWithProviders } from "../helpers/testUtils";

it("should render component", async () => {
  await renderWithProviders(<MyComponent />);
  // Bootstrap is automatically completed
  expect(screen.getByText("Some text")).toBeInTheDocument();
});
```

**Options:**

- `testRegistry?: Map<string, ProviderRegistryEntry>` - Custom test registry
- `waitForBootstrap?: boolean` - Whether to wait for bootstrap (default: true)

#### `renderWithProvidersOnly(ui, options)`

Render function that wraps with `TestProvider` but doesn't wait for bootstrap. Useful when you need more control over the bootstrap process.

```typescript
import { renderWithProvidersOnly } from "../helpers/testUtils";

it("should handle loading state", () => {
  const { getByTestId } = renderWithProvidersOnly(<MyComponent />, {
    waitForBootstrap: false
  });
  // You can now test loading states manually
});
```

## Usage Examples

### Simple Component Test

```typescript
import { renderWithProviders } from "../helpers/testUtils";

describe("MyComponent", () => {
  it("renders correctly", async () => {
    await renderWithProviders(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Custom Test Registry

```typescript
import { renderWithProviders } from "../helpers/testUtils";
import { createTestRegistry } from "../helpers/testRegistry";

describe("MyComponent", () => {
  it("works with custom providers", async () => {
    const customRegistry = createTestRegistry();
    // Modify the registry as needed

    await renderWithProviders(<MyComponent />, {
      testRegistry: customRegistry
    });

    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});
```

### Testing Bootstrap Directly

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import { createTestRegistry } from "../helpers/testRegistry";

describe("Bootstrap", () => {
  it("should initialize correctly", async () => {
    const testRegistry = createTestRegistry();

    const Component = () => {
      useBootstrap(testRegistry);
      const appState = useAtomValue(appStateAtom);

      return (
        <div>
          {appState.isLoading && <div data-testid="loading">Loading</div>}
          {appState.isReady && <div data-testid="ready">Ready</div>}
        </div>
      );
    };

    render(
      <JotaiProvider>
        <Component />
      </JotaiProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toBeInTheDocument();
    });
  });
});
```

## Benefits

1. **Consistency**: All tests use the same mock provider data
2. **Simplicity**: One-line component rendering with automatic bootstrap
3. **Flexibility**: Custom registries and bootstrap control when needed
4. **Type Safety**: Full TypeScript support with proper type inference
5. **Performance**: Automatic waiting eliminates manual `waitFor` calls in most cases
