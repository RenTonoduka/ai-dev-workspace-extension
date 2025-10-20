/**
 * High-level Worktree Management Service
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from './GitService';
import { WorktreeCreateOptions, WorktreeInfo, CLIToolConfig } from '../types';
import { TerminalTracker } from './TerminalTracker';

export class WorktreeManager {
  private terminalTracker: TerminalTracker;

  constructor(
    private gitService: GitService,
    private rootPath: string
  ) {
    this.terminalTracker = TerminalTracker.getInstance();
  }

  /**
   * Create a new worktree with full setup
   */
  async createWorktree(options: WorktreeCreateOptions): Promise<boolean> {
    try {
      // Build full path
      const fullPath = path.join(this.rootPath, options.basePath, options.name);

      // Create worktree
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Creating worktree "${options.name}"...`,
          cancellable: false
        },
        async (progress) => {
          progress.report({ message: 'Creating Git worktree...' });

          const result = await this.gitService.createWorktree(
            fullPath,
            options.branch,
            options.createBranch
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to create worktree');
          }

          // Open in new window if requested
          if (options.openInNewWindow) {
            progress.report({ message: 'Opening VSCode window...' });
            await vscode.commands.executeCommand(
              'vscode.openFolder',
              vscode.Uri.file(fullPath),
              true // Open in new window
            );
          }

          // Start terminals if requested
          if (options.autoStartTerminal && options.cliTools.length > 0) {
            progress.report({ message: 'Starting AI CLI tools...' });
            await this.startCLITools(fullPath, options.cliTools);
          }
        }
      );

      vscode.window.showInformationMessage(
        `✓ Worktree "${options.name}" created successfully`
      );

      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create worktree: ${error instanceof Error ? error.message : error}`
      );
      return false;
    }
  }

  /**
   * Remove a worktree with confirmation
   */
  async removeWorktree(worktree: WorktreeInfo): Promise<boolean> {
    try {
      const name = path.basename(worktree.path);

      // Confirm deletion
      const hasChanges = worktree.changes && worktree.changes > 0;
      const warningMessage = hasChanges
        ? `Worktree "${name}" has ${worktree.changes} uncommitted change(s). Remove anyway?`
        : `Remove worktree "${name}"?`;

      const confirmation = await vscode.window.showWarningMessage(
        warningMessage,
        { modal: true },
        'Remove',
        'Cancel'
      );

      if (confirmation !== 'Remove') {
        return false;
      }

      // Remove worktree
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Removing worktree "${name}"...`,
          cancellable: false
        },
        async () => {
          const result = await this.gitService.removeWorktree(
            worktree.path,
            hasChanges ? true : false // Force if has changes
          );

          if (!result.success) {
            throw new Error(result.error || 'Failed to remove worktree');
          }
        }
      );

      vscode.window.showInformationMessage(`✓ Worktree "${name}" removed`);
      return true;
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to remove worktree: ${error instanceof Error ? error.message : error}`
      );
      return false;
    }
  }

  /**
   * Open terminal in worktree
   */
  async openTerminal(worktreePath: string): Promise<void> {
    const name = path.basename(worktreePath);

    const terminal = vscode.window.createTerminal({
      name: `Worktree: ${name}`,
      cwd: worktreePath
    });

    terminal.show();
  }

  /**
   * Start AI CLI tool in worktree
   */
  async startAICLI(worktreePath: string, cliToolName?: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('aiDevWorkspace');
    const cliTools = config.get<Record<string, CLIToolConfig>>('cliTools', {});

    let selectedTool: { name: string; config: CLIToolConfig } | undefined;

    if (cliToolName) {
      // Use specified tool
      if (cliTools[cliToolName] && cliTools[cliToolName].enabled) {
        selectedTool = { name: cliToolName, config: cliTools[cliToolName] };
      } else {
        vscode.window.showErrorMessage(`CLI tool "${cliToolName}" is not enabled`);
        return;
      }
    } else {
      // Let user choose
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

      selectedTool = { name: selected.label, config: selected.config };
    }

    // Create and show terminal
    const name = path.basename(worktreePath);
    const terminal = vscode.window.createTerminal({
      name: `${selectedTool.name}: ${name}`,
      cwd: worktreePath,
      env: selectedTool.config.env
    });

    terminal.show();

    // Send command
    const command = [
      selectedTool.config.command,
      ...selectedTool.config.args
    ].join(' ');

    terminal.sendText(command);

    // Track the terminal
    this.terminalTracker.trackTerminal(terminal, worktreePath, selectedTool.name);
  }

  /**
   * Start multiple CLI tools in worktree in parallel
   */
  private async startCLITools(worktreePath: string, cliToolNames: string[]): Promise<void> {
    // Launch all CLIs in parallel using Promise.all
    await Promise.all(
      cliToolNames.map(toolName => this.startAICLI(worktreePath, toolName))
    );
  }

  /**
   * Get all worktrees with enriched information
   */
  async getWorktrees(): Promise<WorktreeInfo[]> {
    const worktrees = await this.gitService.listWorktrees();

    // Enrich with change counts
    const enriched = await Promise.all(
      worktrees.map(async (wt) => {
        const changes = await this.gitService.getChangesCount(wt.path);
        return { ...wt, changes };
      })
    );

    return enriched;
  }

  /**
   * Validate worktree creation options
   */
  async validateCreateOptions(options: WorktreeCreateOptions): Promise<string[]> {
    const errors: string[] = [];

    // Validate name
    if (!/^[a-zA-Z0-9-_]+$/.test(options.name)) {
      errors.push('Worktree name must contain only letters, numbers, hyphens, and underscores');
    }

    // Validate branch
    if (!options.createBranch) {
      const exists = await this.gitService.branchExists(options.branch);
      if (!exists) {
        errors.push(`Branch "${options.branch}" does not exist`);
      }
    }

    // Validate path doesn't exist
    const fullPath = path.join(this.rootPath, options.basePath, options.name);
    try {
      const uri = vscode.Uri.file(fullPath);
      await vscode.workspace.fs.stat(uri);
      errors.push(`Path already exists: ${fullPath}`);
    } catch {
      // Path doesn't exist - this is good
    }

    return errors;
  }
}
