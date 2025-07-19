## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_EXPERT

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

### Guidelines for DOCUMENTATION

#### TYPEDOC

- Use JSDoc-style comments with TypeScript-specific annotations for all public APIs.
- Use // for variable comments.
- Always use Traditional Chinese for comments.
- Configure custom themes to match {{project_branding}} for consistent documentation.
- Group related functionality using @module and @category tags for better organization.
- Document edge cases and error handling for {{critical_functions}}.
- Generate and publish documentation as part of the CI/CD pipeline to keep it current.
- Include usage examples for complex interfaces and abstract classes.

## FRONTEND

### Guidelines for ANGULAR

#### ANGULAR_CODING_STANDARDS

- Use standalone components, directives, and pipes instead of NgModules.
- Implement signals for state management instead of traditional RxJS-based approaches.
- Use the new inject function instead of constructor injection.
- Implement control flow with `@if`, `@for`, and @switch instead of `*ngIf`, `*ngFor`, etc.
- Leverage functional guards and resolvers instead of class-based ones.
- Use the new deferrable views for improved loading states.
- Implement OnPush change detection strategy for improved performance.
- Use TypeScript decorators with explicit visibility modifiers (public, private).
- Leverage Angular CLI for schematics and code generation.
- Implement proper lazy loading with loadComponent and loadChildren.

#### CODE_QUALITY_STANDARDS

**Import Organization:**

- Organize imports in the following order: Angular core, RxJS, PrimeNG and external libraries, project imports, relative imports.
- Use absolute imports for project modules and relative imports only for same-directory files.
- Group related imports together with clear separation between import groups.

**Class Structure and Member Ordering:**

- Follow strict member ordering: signatures → fields (private/protected/public) → constructors → accessors → getters → setters → methods.
- Within each category, order by visibility: private → protected → public.
- Place static members before instance members within each visibility group.
- Use consistent decorator positioning and explicit visibility modifiers.

**Naming Conventions:**

- Use camelCase for default identifiers, variables, parameters, methods, and properties.
- Use PascalCase for types, classes, interfaces, enums, and enum members.
- Use UPPER_CASE for constants and private readonly properties.
- Apply leading underscore (\_) for private members and double underscore (\_\_) for protected members.
- Use kebab-case for Angular component selectors with 'app-' prefix.
- Use camelCase for Angular directive selectors with 'app' prefix.

**Code Syntax and Style:**

- Always terminate statements with semicolons for consistency and clarity.
- Preserve empty lifecycle methods (e.g., ngOnInit) for future implementation.
- Maintain consistent code formatting using Prettier for HTML templates.
- Follow Angular template best practices including accessibility guidelines.

**Error Prevention:**

- Implement comprehensive error handling for all async operations and user interactions.
- Use TypeScript strict mode features and proper type annotations throughout.
- Validate inputs and handle edge cases explicitly rather than relying on default behaviors.
- Apply defensive programming principles for public APIs and data transformations.

## Project Overview

This is the xyflow monorepo containing React Flow, Svelte Flow, Angular Flow (new), and the shared system library. It's a pnpm workspace with Turbo build system for managing multiple packages that create highly customizable node-based UI libraries.

## Architecture

### Core Packages
- **`packages/system`** - Shared core library (`@xyflow/system`) containing framework-agnostic utilities, types, and logic
- **`packages/react`** - React Flow v12 (`@xyflow/react`) - React implementation 
- **`packages/svelte`** - Svelte Flow (`@xyflow/svelte`) - Svelte implementation
- **`packages/angular`** - Angular Flow (new, in development) - Angular implementation

### Examples & Testing
- **`examples/`** - Working examples for React, Svelte, Angular, and Astro integrations
- **`tests/playwright/`** - Cross-framework E2E tests using Playwright
- **`tooling/`** - Shared tooling configs (ESLint, Rollup, PostCSS, TypeScript)

### Key Dependencies
- **State Management**: Zustand (React), Svelte stores (Svelte)
- **Interactions**: D3 (drag, zoom, selection) in system package
- **Build**: Rollup for libraries, Vite for examples
- **Styling**: PostCSS with nested syntax and auto-prefixing

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start all examples in development mode
pnpm dev

# Start specific framework examples
pnpm dev:react    # React examples only
pnpm dev:svelte   # Svelte examples only

# Build all packages
pnpm build:all    # Everything including examples
pnpm build        # Just the packages

# Lint and typecheck packages
pnpm lint
pnpm typecheck
```

### Testing
```bash
# Run E2E tests
pnpm test:react      # React tests
pnpm test:react:ui   # React tests with UI
pnpm test:svelte     # Svelte tests  
pnpm test:svelte:ui  # Svelte tests with UI
```

### Package-specific Commands
```bash
# Work on React package
cd packages/react
pnpm dev        # Watch mode with CSS rebuild
pnpm build      # Production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check

# Work on Svelte package  
cd packages/svelte
pnpm dev        # Watch mode with CSS rebuild
pnpm build      # Production build
pnpm lint       # Prettier + ESLint
pnpm typecheck  # svelte-check

# Work on System package
cd packages/system
pnpm dev        # Watch mode
pnpm build      # Production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
```

## Development Workflow

### Making Changes
1. Use `pnpm dev` for parallel development across packages
2. Changes to `packages/system` automatically rebuild dependent packages
3. Examples auto-refresh when packages rebuild
4. CSS changes in packages trigger automatic rebuilds

### Adding Features
1. Core functionality goes in `packages/system`
2. Framework-specific implementations go in respective packages
3. Add examples to demonstrate new features
4. Follow the changeset workflow for releases

### Release Process
Uses [changesets](https://github.com/changesets/changesets):
1. Add changeset for each PR with user-facing changes: `npx changeset`
2. Merge PR to main
3. Changesets creates release PR with version bumps
4. Merge release PR to publish to npm

## Code Organization

### System Package Structure
- **`utils/`** - Core utilities (graph operations, edge calculations, etc.)
- **`types/`** - Shared TypeScript types
- **`xy*/`** - Modular systems (XYDrag, XYPanZoom, XYHandle, XYResizer)

### React Package Structure  
- **`components/`** - React-specific components (Handle, NodeWrapper, etc.)
- **`container/`** - Main container components (ReactFlow, FlowRenderer, etc.)
- **`hooks/`** - React hooks for flow functionality
- **`additional-components/`** - Optional components (Controls, MiniMap, Background, etc.)

### Svelte Package Structure
- **`lib/components/`** - Svelte components
- **`lib/container/`** - Main container components  
- **`lib/hooks/`** - Svelte stores and reactive utilities
- **`lib/plugins/`** - Optional plugins (Controls, MiniMap, Background, etc.)

## Important Notes

- **Framework coordination**: Changes affecting multiple frameworks require updates to React, Svelte, and potentially Angular packages
- **System-first approach**: Most core logic should be framework-agnostic in the system package
- **CSS coordination**: Styles are built separately for each package but share base styles
- **Examples matter**: Always test changes against relevant examples before submitting
- **Backward compatibility**: v12 React Flow is a breaking change from v11, but current development maintains API stability