/**
 * TreeView Provider for Worktree Explorer
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { GitService } from '../services/GitService';
import { WorktreeInfo } from '../types';
import { TerminalTracker } from '../services/TerminalTracker';

/**
 * Worktree tree item for VSCode TreeView
 */
export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly worktree: WorktreeInfo,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(
      path.basename(worktree.path),
      collapsibleState
    );

    this.tooltip = this.buildTooltip();
    this.description = this.buildDescription();
    this.iconPath = this.getIcon();
    this.contextValue = 'worktree';
    this.command = {
      command: 'aiDevWorkspace.openWorktreeTerminal',
      title: 'Open Terminal',
      arguments: [worktree.path]
    };
  }

  /**
   * Build tooltip with detailed information
   */
  private buildTooltip(): string {
    const lines = [
      `Path: ${this.worktree.path}`,
      `Branch: ${this.worktree.branch}`,
      `Commit: ${this.worktree.commit.substring(0, 7)}`
    ];

    if (this.worktree.changes !== undefined) {
      lines.push(`Changes: ${this.worktree.changes} file(s)`);
    }

    if (this.worktree.activeCLIs && this.worktree.activeCLIs.length > 0) {
      lines.push(`Running: ${this.worktree.activeCLIs.join(', ')}`);
    }

    if (this.worktree.isMain) {
      lines.push('(Main worktree)');
    }

    if (this.worktree.isLocked) {
      lines.push('⚠️ Locked');
    }

    return lines.join('\n');
  }

  /**
   * Build description (shown next to label)
   */
  private buildDescription(): string {
    const parts: string[] = [];

    // Branch name
    parts.push(this.worktree.branch);

    // Change count
    if (this.worktree.changes !== undefined && this.worktree.changes > 0) {
      parts.push(`${this.worktree.changes} change${this.worktree.changes > 1 ? 's' : ''}`);
    }

    // Active CLIs
    if (this.worktree.activeCLIs && this.worktree.activeCLIs.length > 0) {
      parts.push(`🤖 ${this.worktree.activeCLIs.join(', ')}`);
    }

    return parts.join(' • ');
  }

  /**
   * Get appropriate icon for worktree
   */
  private getIcon(): vscode.ThemeIcon {
    if (this.worktree.isMain) {
      return new vscode.ThemeIcon('home', new vscode.ThemeColor('charts.blue'));
    }

    if (this.worktree.isLocked) {
      return new vscode.ThemeIcon('lock', new vscode.ThemeColor('charts.red'));
    }

    // Show robot icon if CLIs are running
    if (this.worktree.activeCLIs && this.worktree.activeCLIs.length > 0) {
      return new vscode.ThemeIcon('robot', new vscode.ThemeColor('charts.purple'));
    }

    if (this.worktree.changes && this.worktree.changes > 0) {
      return new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.yellow'));
    }

    return new vscode.ThemeIcon('git-branch', new vscode.ThemeColor('charts.green'));
  }
}

/**
 * Worktree TreeDataProvider for VSCode
 */
export class WorktreeProvider implements vscode.TreeDataProvider<WorktreeTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<WorktreeTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private terminalTracker: TerminalTracker;

  constructor(private gitService: GitService) {
    this.terminalTracker = TerminalTracker.getInstance();

    // Refresh when terminals change
    this.terminalTracker.onDidChangeTerminals(() => {
      this.refresh();
    });
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item
   */
  getTreeItem(element: WorktreeTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children (worktrees)
   */
  async getChildren(element?: WorktreeTreeItem): Promise<WorktreeTreeItem[]> {
    if (element) {
      // No children for worktree items (flat list)
      return [];
    }

    try {
      // Get all worktrees
      const worktrees = await this.gitService.listWorktrees();

      // Enrich with change counts and active CLIs
      const enrichedWorktrees = await Promise.all(
        worktrees.map(async (wt) => {
          const changes = await this.gitService.getChangesCount(wt.path);
          const activeCLIs = this.terminalTracker.getActiveCLIs(wt.path);
          return { ...wt, changes, activeCLIs };
        })
      );

      // Sort: main first, then by name
      enrichedWorktrees.sort((a, b) => {
        if (a.isMain) return -1;
        if (b.isMain) return 1;
        return path.basename(a.path).localeCompare(path.basename(b.path));
      });

      // Create tree items
      return enrichedWorktrees.map(
        wt => new WorktreeTreeItem(wt, vscode.TreeItemCollapsibleState.None)
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to load worktrees: ${error}`);
      return [];
    }
  }
}

/**
 * Worktree Explorer commands
 */
export class WorktreeExplorer {
  private treeView: vscode.TreeView<WorktreeTreeItem>;

  constructor(
    context: vscode.ExtensionContext,
    private provider: WorktreeProvider
  ) {
    // Create tree view
    this.treeView = vscode.window.createTreeView('worktreeExplorer', {
      treeDataProvider: this.provider,
      showCollapseAll: false
    });

    // Register commands
    this.registerCommands(context);

    // Auto-refresh on file system changes
    const watcher = vscode.workspace.createFileSystemWatcher('**/.git/worktrees/**');
    watcher.onDidChange(() => this.provider.refresh());
    watcher.onDidCreate(() => this.provider.refresh());
    watcher.onDidDelete(() => this.provider.refresh());

    context.subscriptions.push(this.treeView, watcher);
  }

  /**
   * Register TreeView-specific commands
   */
  private registerCommands(context: vscode.ExtensionContext): void {
    // Refresh command
    context.subscriptions.push(
      vscode.commands.registerCommand('aiDevWorkspace.refreshWorktrees', () => {
        this.provider.refresh();
        vscode.window.showInformationMessage('Worktrees refreshed');
      })
    );

    // Reveal worktree in explorer
    context.subscriptions.push(
      vscode.commands.registerCommand(
        'aiDevWorkspace.revealWorktree',
        async (item: WorktreeTreeItem) => {
          await this.treeView.reveal(item, { select: true, focus: true });
        }
      )
    );
  }

  /**
   * Get the tree view
   */
  getTreeView(): vscode.TreeView<WorktreeTreeItem> {
    return this.treeView;
  }
}
