# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

`@studiokloek/kloek-ts-core` is a foundational TypeScript library for Studio Kloek's interactive web projects (games, animations, media-rich applications). It integrates PIXI.js, GSAP, Howler.js, and Capacitor into a cohesive toolkit.

## Commands

```bash
yarn build          # Clean + compile TypeScript to lib/
yarn build/clean    # Remove lib/ directory
yarn build/script   # Compile TypeScript only (tsc)
yarn types/check    # Type-check without emitting
yarn types/watch    # Type-check in watch mode
```

There is no test suite (package.json has `"tests": false`).

## Architecture

### Entry Point & Initialization

`src/index.ts` re-exports everything. Consumers call `initCoreLibrary()` to set up GSAP/PixiPlugin, device/network detection (via Capacitor), screen management, and the logger.

### Module Organization

Each module under `src/` has an `index.ts` barrel export. Modules are designed for independent import but compose naturally.

### Key Patterns

**View** (`src/patterns/`) — The main base class for UI/game screens. Extends PIXI `Container` via `ts-mixer` Mixins combining `TickerMixin`, `TweenMixin`, and `DelayedMixin`. Provides lifecycle: `init()` → `prepareAfterLoad()` → `activate()` → `deactivate()` → `cleanupBeforeUnload()`.

**Asset Loading** (`src/loaders/`) — `AssetLoader` handles sprites, fonts, sounds, and Spine animations with concurrent loading control and progress events (`progressed`, `loaded`).

**Audio** (`src/media/sounds/`) — `AudioFX` singleton wraps Howler.js. Supports spatial/3D audio, volume fading, looping, and AudioContext suspension for global pause/resume.

**Ticker** (`src/ticker/`) — Frame-based update loop with time scaling. `TickerMixin` auto-registers classes for per-frame updates. Supports named tickers alongside the global ticker.

**Tween** (`src/tween/`) — GSAP integration with PixiPlugin. `TweenMixin` provides animation utilities on any class.

**Screen** (`src/screen/`) — Responsive breakpoints for iOS/Android/Desktop, stage time scaling, display info tracking.

**Device** (`src/device/`) — Browser/GPU/network detection, pixel ratio, device orientation, and interaction capabilities via Capacitor plugins.

**Events** (`src/events/`) — PubSub messaging plus re-exports from `ts-events` (Async/Sync event types).

**Logger** (`src/logger/`) — Module-based loggers with configurable levels and colors.

**Utilities** (`src/util/`) — Math, random, dates, strings, colors, URLs, and type helpers.

### TypeScript

- Strict mode fully enabled (`noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks`)
- `experimentalDecorators: true`
- Target: `esnext`, output to `lib/`, declarations generated
- External re-exports: `ts-mixer` (Mixin utilities), `ts-events` (event types)