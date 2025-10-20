/**
 * Terminal Tracker Service
 * Tracks which AI CLI terminals are active for each worktree
 */

import * as vscode from 'vscode';

export interface TrackedTerminal {
  terminal: vscode.Terminal;
  cliName: string;
  worktreePath: string;
  startTime: Date;
}

export class TerminalTracker {
  private static instance: TerminalTracker;
  private terminals: Map<string, TrackedTerminal[]> = new Map();
  private _onDidChangeTerminals = new vscode.EventEmitter<string>();
  readonly onDidChangeTerminals = this._onDidChangeTerminals.event;

  private constructor() {
    // Listen for terminal close events
    vscode.window.onDidCloseTerminal(closedTerminal => {
      this.removeTerminal(closedTerminal);
    });
  }

  static getInstance(): TerminalTracker {
    if (!TerminalTracker.instance) {
      TerminalTracker.instance = new TerminalTracker();
    }
    return TerminalTracker.instance;
  }

  /**
   * Track a new terminal
   */
  trackTerminal(terminal: vscode.Terminal, worktreePath: string, cliName: string): void {
    const tracked: TrackedTerminal = {
      terminal,
      cliName,
      worktreePath,
      startTime: new Date()
    };

    const existing = this.terminals.get(worktreePath) || [];
    existing.push(tracked);
    this.terminals.set(worktreePath, existing);

    this._onDidChangeTerminals.fire(worktreePath);
  }

  /**
   * Remove a terminal from tracking
   */
  private removeTerminal(terminal: vscode.Terminal): void {
    for (const [worktreePath, terminals] of this.terminals.entries()) {
      const index = terminals.findIndex(t => t.terminal === terminal);
      if (index !== -1) {
        terminals.splice(index, 1);
        if (terminals.length === 0) {
          this.terminals.delete(worktreePath);
        } else {
          this.terminals.set(worktreePath, terminals);
        }
        this._onDidChangeTerminals.fire(worktreePath);
        break;
      }
    }
  }

  /**
   * Get active terminals for a worktree
   */
  getTerminals(worktreePath: string): TrackedTerminal[] {
    return this.terminals.get(worktreePath) || [];
  }

  /**
   * Get active CLI names for a worktree
   */
  getActiveCLIs(worktreePath: string): string[] {
    const terminals = this.getTerminals(worktreePath);
    return terminals.map(t => t.cliName);
  }

  /**
   * Check if any CLIs are running for a worktree
   */
  hasActiveCLIs(worktreePath: string): boolean {
    return this.getTerminals(worktreePath).length > 0;
  }

  /**
   * Get all worktrees with active terminals
   */
  getAllActiveWorktrees(): string[] {
    return Array.from(this.terminals.keys());
  }
}
