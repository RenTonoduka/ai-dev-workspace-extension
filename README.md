# AI Dev Workspace - VSCode Extension

Automate Git worktree creation and AI CLI integration for parallel development workflows.

## Features

### 🌳 Git Worktree Automation
- **One-command worktree creation** - Create and configure Git worktrees instantly
- **Smart defaults** - Auto-suggest worktree names and locations
- **Branch management** - Create new branches or use existing ones seamlessly

### 🤖 AI CLI Integration
- **Multi-AI support** - Claude Code, Aider, Gemini CLI, and custom commands
- **Auto-start terminals** - Launch AI CLIs automatically in dedicated terminals
- **Configurable commands** - Customize CLI arguments and environment variables

### 📊 Worktree Management UI
- **Visual tree view** - Browse all worktrees from the Activity Bar
- **Quick actions** - Right-click menu for common operations
- **Status indicators** - See branch names and change counts at a glance

## Installation

### From VSCode Marketplace
1. Open VSCode
2. Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for "AI Dev Workspace"
4. Click Install

### From VSIX
```bash
code --install-extension ai-dev-workspace-0.1.0.vsix
```

## Requirements

- **VSCode**: 1.85.0 or higher
- **Git**: 2.30.0 or higher
- **Node.js**: 18.x or higher (for AI CLI tools)

### Optional AI CLI Tools
- [Claude Code](https://docs.claude.com/claude-code) - `npm install -g @anthropic-ai/claude-code`
- [Aider](https://github.com/paul-gauthier/aider) - `pip install aider-chat`
- [Gemini CLI](https://github.com/your-repo/gemini-cli) - Custom installation

## Quick Start

### Creating a Worktree

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run `AI Dev: Create Worktree`
3. Follow the prompts:
   - Enter worktree name (e.g., `feature-auth`)
   - Select/create branch (e.g., `feature/user-authentication`)
   - Choose AI CLI tools to start

The extension will:
- Create the worktree at `../project-feature-auth`
- Open a new VSCode window
- Launch selected AI CLIs in terminals

### Using the Sidebar

1. Click the AI Dev Workspace icon in the Activity Bar
2. View all worktrees with their status
3. Right-click for actions:
   - Open Terminal
   - Start AI CLI
   - Remove Worktree

## Configuration

### Default Worktree Location

```json
{
  "aiDevWorkspace.defaultWorktreeLocation": "../"
}
```

### AI CLI Tools

```json
{
  "aiDevWorkspace.cliTools": {
    "claude": {
      "command": "claude",
      "args": [],
      "enabled": true,
      "env": {
        "ANTHROPIC_API_KEY": "${env:ANTHROPIC_API_KEY}"
      }
    },
    "aider": {
      "command": "aider",
      "args": ["--model", "gpt-4"],
      "enabled": true,
      "env": {}
    },
    "custom": {
      "command": "your-custom-cli",
      "args": ["--option", "value"],
      "enabled": false,
      "env": {
        "CUSTOM_VAR": "value"
      }
    }
  }
}
```

### Auto-open Settings

```json
{
  "aiDevWorkspace.autoOpenNewWindow": true,
  "aiDevWorkspace.autoStartTerminal": true
}
```

## Commands

| Command | Description | Keyboard Shortcut |
|---------|-------------|-------------------|
| `AI Dev: Create Worktree` | Create a new worktree with AI CLI setup | - |
| `AI Dev: List Worktrees` | Show all worktrees in QuickPick | - |
| `AI Dev: Remove Worktree` | Delete a worktree | - |
| `AI Dev: Open Terminal` | Open terminal in worktree directory | - |
| `AI Dev: Start AI CLI` | Launch AI CLI in current worktree | - |
| `AI Dev: Refresh` | Reload worktree list | - |

## Use Cases

### Parallel Feature Development

```bash
# Create worktrees for different features
AI Dev: Create Worktree
  Name: feature-auth
  Branch: feature/user-authentication
  CLI: Claude Code

AI Dev: Create Worktree
  Name: feature-api
  Branch: feature/api-refactor
  CLI: Aider
```

Work on multiple features simultaneously without context switching!

### Testing and Development

```bash
# Main development
Worktree: main-dev
Branch: feature/new-feature
CLI: Claude Code

# Testing environment
Worktree: test-env
Branch: feature/new-feature
CLI: Aider (for test generation)
```

### Code Review Workflow

```bash
# Review branch
Worktree: review-pr-123
Branch: pr/feature-xyz
CLI: None (manual review)

# Continue working
Worktree: main-dev
Branch: feature/current-work
CLI: Claude Code
```

## Troubleshooting

### Git Worktree Issues

**Error: "fatal: invalid reference"**
- Ensure the branch name is valid
- Check that Git version is 2.30.0+

**Error: "worktree already exists"**
- Remove existing worktree with `AI Dev: Remove Worktree`
- Or manually: `git worktree remove <path>`

### AI CLI Issues

**Error: "command not found"**
- Verify CLI is installed: `which claude` / `which aider`
- Add CLI installation path to `$PATH`

**Error: "API key not found"**
- Set environment variables in `.env` file
- Configure in `aiDevWorkspace.cliTools.<name>.env`

### VSCode Issues

**Extension not activating**
- Check VSCode version: `Code > About`
- Reload window: `Cmd+Shift+P` > "Reload Window"

## Development

### Building from Source

```bash
git clone https://github.com/tonodukaren/ai-dev-workspace-extension.git
cd ai-dev-workspace-extension
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Debugging

1. Open extension project in VSCode
2. Press `F5` to launch Extension Development Host
3. Test extension in the new window

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Roadmap

### v0.2.0
- [ ] Template system for common workflows
- [ ] Worktree status badges (changes, commits ahead/behind)
- [ ] Multi-worktree operations (batch create/remove)

### v0.3.0
- [ ] Integration with Task Master AI
- [ ] AI CLI output capture and display
- [ ] Worktree bookmarks and favorites

### v1.0.0
- [ ] Full test coverage
- [ ] Performance optimizations
- [ ] Documentation site

## License

MIT © 2025 Tonodukaren

## Credits

Inspired by:
- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Claude Code](https://docs.claude.com/claude-code)
- [Aider](https://github.com/paul-gauthier/aider)

---

**Note**: This extension is in active development. Features and APIs may change.
