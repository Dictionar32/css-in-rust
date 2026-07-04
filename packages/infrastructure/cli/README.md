# tailwind-styled CLI

CLI tooling for tailwind-styled v5 — setup, analyze, migrate, and more.

Part of the tailwind-styled-v5 ecosystem.

## Installation

```bash
# Global
npm install -g create-tailwind-styled

# OR use npx (recommended)
npx create-tailwind-styled my-project
```

## Quick Start

```bash
# Setup new project
tw setup

# Create project from template
tw create my-app

# Scan classes in workspace
tw scan

# Analyze class usage
tw analyze

# Migrate to v5
tw migrate --wizard
```

## Commands

### Project Setup
| Command | Description |
|---------|-------------|
| `tw setup` | Auto-setup project with framework choice |
| `tw create [name]` | Create project from template |
| `tw init [target]` | Initialize config files |

### Analysis
| Command | Description |
|---------|-------------|
| `tw scan [target]` | Scan all classes in workspace |
| `tw analyze [target]` | Analyze class usage patterns |
| `tw stats [target]` | Estimate CSS bundle stats |
| `tw extract [target]` | Suggest extraction candidates |

### Migration
| Command | Description |
|---------|-------------|
| `tw migrate [target]` | Migrate to v5 patterns |
| `tw preflight` | Environment preflight checks |

### Plugin
| Command | Description |
|---------|-------------|
| `tw plugin search [query]` | Search plugins |
| `tw plugin list` | List available plugins |
| `tw plugin install <name>` | Install plugin |

### Design Token Sync
| Command | Description |
|---------|-------------|
| `tw figma pull [--dry-run]` | Import design tokens dari Figma → `tokens.sync.json` |
| `tw figma push [--dry-run]` | Export tokens dari file → update Figma variables |
| `tw figma diff` | Compare local tokens vs Figma variables |

### Development
| Command | Description |
|---------|-------------|
| `tw dashboard` | Start dashboard server |
| `tw storybook` | Storybook helpers |
| `tw studio` | Open studio mode |

### Utility
| Command | Description |
|---------|-------------|
| `tw version` | Show CLI version |
| `tw upgrade` | Check/upgrade CLI version |
| `tw ai <prompt>` | AI script shortcut |

## Options

```bash
tw --json      # Output strict JSON
tw --debug     # Include stack traces
tw --verbose   # Verbose logs
```

## Examples

```bash
# Setup Next.js + React project
tw setup --next --react --yes

# Analyze with JSON output
tw analyze --json > analysis.json

# Migrate with dry-run
tw migrate --dry-run --wizard
```

## Figma Design Token Sync

Sync design tokens dari Figma ke codebase (build-time CLI command).

### Prerequisites
- Figma account dengan Enterprise plan (untuk Figma Variables API)
- Personal access token dari [figma.com/account/tokens](https://figma.com/account/tokens)

### Setup

Setkan environment variables:

```bash
export FIGMA_TOKEN=figd_...              # Figma personal access token
export FIGMA_FILE_KEY=abc123XYZ          # Figma file key dari URL: figma.com/file/<KEY>/...
```

### Usage

```bash
# Pull (Figma → tokens.sync.json)
tw figma pull

# Preview changes sebelum write
tw figma pull --dry-run

# Push (tokens.sync.json → Figma)
tw figma push

# Preview push changes
tw figma push --dry-run

# Compare local vs Figma
tw figma diff
```

### Troubleshooting

**Error: Missing FIGMA_TOKEN or FIGMA_FILE_KEY**
```bash
# Set missing env vars:
export FIGMA_TOKEN=your_personal_access_token
export FIGMA_FILE_KEY=your_figma_file_key
```

**Error: tokens.sync.json not found**
```bash
# Run pull first untuk create token file:
tw figma pull
```

**Figma API Error (requires Enterprise)**
- Figma Variables API hanya tersedia di Enterprise plan
- Fallback: manual manage `tokens.sync.json` file dan push ke Figma

## Troubleshooting

### "command not found: tw"
Make sure CLI is installed globally or use `npx tw`.

### Node version error
Make sure you're using Node.js >= 20.

## See Also

- [@tailwind-styled/core](https://www.npmjs.com/package/tailwind-styled-v4) - Core styling API
- [@tailwind-styled/next](https://www.npmjs.com/package/@tailwind-styled/next) - Next.js adapter
- [@tailwind-styled/vite](https://www.npmjs.com/package/@tailwind-styled/vite) - Vite plugin
