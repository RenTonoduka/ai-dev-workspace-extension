/**
 * AI Dev Workspace Extension Entry Point
 */

import * as vscode from 'vscode';
import { GitService } from './services/GitService';
import { WorktreeManager } from './services/WorktreeManager';
import { WorktreeProvider, WorktreeExplorer, WorktreeTreeItem } from './providers/WorktreeProvider';
import { WorktreeCreateOptions } from './types';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Dev Workspace extension is now active');

  // Verify workspace is open
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('AI Dev Workspace requires an open workspace');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  // Initialize services
  const gitService = new GitService(rootPath);
  const worktreeManager = new WorktreeManager(gitService, rootPath);

  // Initialize TreeView
  const worktreeProvider = new WorktreeProvider(gitService);
  new WorktreeExplorer(context, worktreeProvider);

  // Validate Git repository
  gitService.isGitRepository().then(isRepo => {
    if (!isRepo) {
      vscode.window.showWarningMessage('AI Dev Workspace requires a Git repository');
      return;
    }

    // Validate Git version
    const config = vscode.workspace.getConfiguration('aiDevWorkspace');
    const minVersion = config.get<string>('gitMinVersion', '2.30.0');

    gitService.validateGitVersion(minVersion).then(isValid => {
      if (!isValid) {
        vscode.window.showWarningMessage(
          `AI Dev Workspace requires Git version ${minVersion} or higher`
        );
      }
    });
  });

  // Register commands
  registerCommands(context, gitService, worktreeManager, worktreeProvider);
}

/**
 * Register all extension commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  worktreeManager: WorktreeManager,
  worktreeProvider: WorktreeProvider
): void {
  // Create worktree command
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.createWorktree', async () => {
      await createWorktree(gitService, worktreeManager, worktreeProvider);
    })
  );

  // List worktrees command
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.listWorktrees', async () => {
      await listWorktrees(gitService);
    })
  );

  // Remove worktree command (from command palette)
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.removeWorktree', async () => {
      await removeWorktreeFromPalette(gitService, worktreeManager, worktreeProvider);
    })
  );

  // Remove worktree from TreeView item
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.removeWorktreeItem', async (item: WorktreeTreeItem) => {
      const success = await worktreeManager.removeWorktree(item.worktree);
      if (success) {
        worktreeProvider.refresh();
      }
    })
  );

  // Open terminal in worktree
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.openWorktreeTerminal', async (pathOrItem: string | WorktreeTreeItem) => {
      const path = typeof pathOrItem === 'string' ? pathOrItem : pathOrItem.worktree.path;
      await worktreeManager.openTerminal(path);
    })
  );

  // Start AI CLI
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.startAICLI', async (pathOrItem: string | WorktreeTreeItem) => {
      const path = typeof pathOrItem === 'string' ? pathOrItem : pathOrItem.worktree.path;
      await worktreeManager.startAICLI(path);
    })
  );

  // Open worktree in new window
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevWorkspace.openWorktreeWindow', async (item: WorktreeTreeItem) => {
      await vscode.commands.executeCommand(
        'vscode.openFolder',
        vscode.Uri.file(item.worktree.path),
        true // Open in new window
      );
    })
  );
}

/**
 * Create a new worktree with interactive UI
 */
async function createWorktree(
  gitService: GitService,
  worktreeManager: WorktreeManager,
  worktreeProvider: WorktreeProvider
): Promise<void> {
  // Step 1: Get worktree name
  const name = await vscode.window.showInputBox({
    prompt: 'Enter worktree name',
    placeHolder: 'feature-auth',
    validateInput: (value) => {
      if (!value) {
        return 'Worktree name is required';
      }
      if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
        return 'Invalid name (use only letters, numbers, hyphens, underscores)';
      }
      return null;
    }
  });

  if (!name) {
    return;
  }

  // Step 2: Get branch name
  const branches = await gitService.getAllBranches();
  const branchItems = [
    { label: '$(add) Create new branch', description: 'Start fresh branch', value: '__new__' },
    { label: '$(git-branch) Use existing branch', description: 'Select from list', value: '__existing__', kind: vscode.QuickPickItemKind.Separator },
    ...branches.map(b => ({ label: b, value: b }))
  ];

  const selectedBranch = await vscode.window.showQuickPick(branchItems, {
    placeHolder: 'Select branch or create new',
    matchOnDescription: true
  });

  if (!selectedBranch) {
    return;
  }

  let branch: string;
  let createBranch = false;

  if (selectedBranch.value === '__new__') {
    const newBranch = await vscode.window.showInputBox({
      prompt: 'Enter new branch name',
      placeHolder: 'feature/user-authentication',
      validateInput: (value) => {
        if (!value) {
          return 'Branch name is required';
        }
        return null;
      }
    });

    if (!newBranch) {
      return;
    }

    branch = newBranch;
    createBranch = true;
  } else if (selectedBranch.value === '__existing__') {
    return; // Separator clicked, do nothing
  } else {
    branch = selectedBranch.value;
  }

  // Step 3: Select AI CLI tools (multi-select)
  const config = vscode.workspace.getConfiguration('aiDevWorkspace');
  const cliTools = config.get<Record<string, any>>('cliTools', {});

  const cliToolItems = Object.entries(cliTools)
    .filter(([_, cfg]) => cfg.enabled)
    .map(([name, cfg]) => ({
      label: name,
      description: cfg.command,
      picked: false
    }));

  const selectedTools = await vscode.window.showQuickPick(cliToolItems, {
    placeHolder: 'Select AI CLI tools to start (optional, multi-select)',
    canPickMany: true
  });

  const cliToolNames = selectedTools ? selectedTools.map(t => t.label) : [];

  // Step 4: Create worktree with options
  const defaultLocation = config.get<string>('defaultWorktreeLocation', '../');
  const autoOpenWindow = config.get<boolean>('autoOpenNewWindow', true);
  const autoStartTerminal = config.get<boolean>('autoStartTerminal', true);

  const options: WorktreeCreateOptions = {
    name: `project-${name}`,
    branch,
    basePath: defaultLocation,
    createBranch,
    cliTools: cliToolNames,
    openInNewWindow: autoOpenWindow,
    autoStartTerminal: autoStartTerminal && cliToolNames.length > 0
  };

  // Validate options
  const errors = await worktreeManager.validateCreateOptions(options);
  if (errors.length > 0) {
    vscode.window.showErrorMessage(`Cannot create worktree:\n${errors.join('\n')}`);
    return;
  }

  // Create worktree
  const success = await worktreeManager.createWorktree(options);
  if (success) {
    worktreeProvider.refresh();
  }
}

/**
 * List all worktrees (command palette)
 */
async function listWorktrees(gitService: GitService): Promise<void> {
  const worktrees = await gitService.listWorktrees();

  if (worktrees.length === 0) {
    vscode.window.showInformationMessage('No worktrees found');
    return;
  }

  const items = worktrees.map(wt => ({
    label: wt.path.split('/').pop() || wt.path,
    description: wt.branch,
    detail: `${wt.path} (${wt.commit.substring(0, 7)})`,
    worktree: wt
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select worktree'
  });

  if (selected) {
    vscode.window.showInformationMessage(
      `Worktree: ${selected.label}\nBranch: ${selected.description}\nPath: ${selected.worktree.path}`
    );
  }
}

/**
 * Remove worktree from command palette
 */
async function removeWorktreeFromPalette(
  gitService: GitService,
  worktreeManager: WorktreeManager,
  worktreeProvider: WorktreeProvider
): Promise<void> {
  const worktrees = await gitService.listWorktrees();
  const nonMainWorktrees = worktrees.filter(wt => !wt.isMain);

  if (nonMainWorktrees.length === 0) {
    vscode.window.showInformationMessage('No removable worktrees found');
    return;
  }

  const items = nonMainWorktrees.map(wt => ({
    label: wt.path.split('/').pop() || wt.path,
    description: wt.branch,
    detail: wt.path,
    worktree: wt
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select worktree to remove'
  });

  if (!selected) {
    return;
  }

  const success = await worktreeManager.removeWorktree(selected.worktree);
  if (success) {
    worktreeProvider.refresh();
  }
}

export function deactivate() {
  console.log('AI Dev Workspace extension is now deactivated');
}
