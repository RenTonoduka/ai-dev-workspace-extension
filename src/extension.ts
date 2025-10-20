/**
 * AI Dev Workspace Extension Entry Point
 */

import * as vscode from 'vscode';
import { GitService } from './services/GitService';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Dev Workspace extension is now active');

  // Verify workspace is open
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showWarningMessage('AI Dev Workspace requires an open workspace');
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const gitService = new GitService(rootPath);

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
  const createWorktreeCommand = vscode.commands.registerCommand(
    'aiDevWorkspace.createWorktree',
    async () => {
      await createWorktree(gitService);
    }
  );

  const listWorktreesCommand = vscode.commands.registerCommand(
    'aiDevWorkspace.listWorktrees',
    async () => {
      await listWorktrees(gitService);
    }
  );

  const removeWorktreeCommand = vscode.commands.registerCommand(
    'aiDevWorkspace.removeWorktree',
    async () => {
      await removeWorktree(gitService);
    }
  );

  const openWorktreeTerminalCommand = vscode.commands.registerCommand(
    'aiDevWorkspace.openWorktreeTerminal',
    async (worktreePath?: string) => {
      await openWorktreeTerminal(worktreePath);
    }
  );

  const startAICLICommand = vscode.commands.registerCommand(
    'aiDevWorkspace.startAICLI',
    async (worktreePath?: string) => {
      await startAICLI(worktreePath);
    }
  );

  const refreshWorktreesCommand = vscode.commands.registerCommand(
    'aiDevWorkspace.refreshWorktrees',
    async () => {
      vscode.window.showInformationMessage('Refreshing worktrees...');
      // TreeView refresh will be implemented later
    }
  );

  context.subscriptions.push(
    createWorktreeCommand,
    listWorktreesCommand,
    removeWorktreeCommand,
    openWorktreeTerminalCommand,
    startAICLICommand,
    refreshWorktreesCommand
  );
}

/**
 * Create a new worktree
 */
async function createWorktree(gitService: GitService) {
  // Get worktree name
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

  // Get branch name
  const branches = await gitService.getAllBranches();
  const branchItems = [
    { label: '$(add) Create new branch', value: '__new__' },
    ...branches.map(b => ({ label: b, value: b }))
  ];

  const selectedBranch = await vscode.window.showQuickPick(branchItems, {
    placeHolder: 'Select branch or create new'
  });

  if (!selectedBranch) {
    return;
  }

  let branch: string;
  let createBranch = false;

  if (selectedBranch.value === '__new__') {
    const newBranch = await vscode.window.showInputBox({
      prompt: 'Enter new branch name',
      placeHolder: 'feature/user-authentication'
    });

    if (!newBranch) {
      return;
    }

    branch = newBranch;
    createBranch = true;
  } else {
    branch = selectedBranch.value;
  }

  // Get base path
  const config = vscode.workspace.getConfiguration('aiDevWorkspace');
  const defaultLocation = config.get<string>('defaultWorktreeLocation', '../');
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders) {
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const worktreePath = vscode.Uri.joinPath(
    vscode.Uri.file(rootPath),
    defaultLocation,
    `project-${name}`
  ).fsPath;

  // Create worktree
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Creating worktree...',
      cancellable: false
    },
    async () => {
      const result = await gitService.createWorktree(worktreePath, branch, createBranch);

      if (result.success) {
        vscode.window.showInformationMessage(`Worktree created: ${name}`);

        // Open in new window if configured
        const autoOpen = config.get<boolean>('autoOpenNewWindow', true);
        if (autoOpen) {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(worktreePath),
            true
          );
        }
      } else {
        vscode.window.showErrorMessage(`Failed to create worktree: ${result.error}`);
      }
    }
  );
}

/**
 * List all worktrees
 */
async function listWorktrees(gitService: GitService) {
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
 * Remove a worktree
 */
async function removeWorktree(gitService: GitService) {
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

  const confirm = await vscode.window.showWarningMessage(
    `Remove worktree "${selected.label}"? This cannot be undone.`,
    { modal: true },
    'Remove'
  );

  if (confirm !== 'Remove') {
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Removing worktree...',
      cancellable: false
    },
    async () => {
      const result = await gitService.removeWorktree(selected.worktree.path);

      if (result.success) {
        vscode.window.showInformationMessage(`Worktree removed: ${selected.label}`);
      } else {
        vscode.window.showErrorMessage(`Failed to remove worktree: ${result.error}`);
      }
    }
  );
}

/**
 * Open terminal in worktree
 */
async function openWorktreeTerminal(worktreePath?: string) {
  let targetPath = worktreePath;

  if (!targetPath) {
    const currentPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    targetPath = currentPath;
  }

  if (!targetPath) {
    vscode.window.showErrorMessage('No worktree path specified');
    return;
  }

  const terminal = vscode.window.createTerminal({
    name: `Worktree: ${targetPath.split('/').pop()}`,
    cwd: targetPath
  });

  terminal.show();
}

/**
 * Start AI CLI in worktree
 */
async function startAICLI(worktreePath?: string) {
  const config = vscode.workspace.getConfiguration('aiDevWorkspace');
  const cliTools = config.get<Record<string, any>>('cliTools', {});

  const enabledTools = Object.entries(cliTools)
    .filter(([_, cfg]) => cfg.enabled)
    .map(([name, cfg]) => ({
      label: name,
      description: cfg.command,
      config: cfg
    }));

  if (enabledTools.length === 0) {
    vscode.window.showWarningMessage('No AI CLI tools are enabled');
    return;
  }

  const selected = await vscode.window.showQuickPick(enabledTools, {
    placeHolder: 'Select AI CLI to start'
  });

  if (!selected) {
    return;
  }

  let targetPath = worktreePath;
  if (!targetPath) {
    targetPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  }

  if (!targetPath) {
    vscode.window.showErrorMessage('No worktree path specified');
    return;
  }

  const terminal = vscode.window.createTerminal({
    name: `${selected.label}: ${targetPath.split('/').pop()}`,
    cwd: targetPath,
    env: selected.config.env
  });

  terminal.show();
  terminal.sendText(`${selected.config.command} ${selected.config.args.join(' ')}`);
}

export function deactivate() {
  console.log('AI Dev Workspace extension is now deactivated');
}
