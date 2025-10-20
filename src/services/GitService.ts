/**
 * Git service for worktree operations using simple-git
 */

import simpleGit, { SimpleGit } from 'simple-git';
import { WorktreeInfo, GitOperationResult } from '../types';

export class GitService {
  private git: SimpleGit;

  constructor(workspacePath: string) {
    this.git = simpleGit(workspacePath);
  }

  /**
   * List all worktrees in the repository
   */
  async listWorktrees(): Promise<WorktreeInfo[]> {
    try {
      const result = await this.git.raw(['worktree', 'list', '--porcelain']);
      return this.parseWorktreeList(result);
    } catch (error) {
      this.handleGitError(error, 'Failed to list worktrees');
      return [];
    }
  }

  /**
   * Create a new worktree
   */
  async createWorktree(
    worktreePath: string,
    branch: string,
    createBranch: boolean = false
  ): Promise<GitOperationResult> {
    try {
      const args = ['worktree', 'add'];

      if (createBranch) {
        args.push('-b', branch);
      }

      args.push(worktreePath);

      if (!createBranch) {
        args.push(branch);
      }

      await this.git.raw(args);

      return {
        success: true,
        output: `Worktree created at ${worktreePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Remove a worktree
   */
  async removeWorktree(worktreePath: string, force: boolean = false): Promise<GitOperationResult> {
    try {
      const args = ['worktree', 'remove'];

      if (force) {
        args.push('--force');
      }

      args.push(worktreePath);

      await this.git.raw(args);

      return {
        success: true,
        output: `Worktree removed: ${worktreePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error)
      };
    }
  }

  /**
   * Check if a branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      const branches = await this.git.branchLocal();
      return branches.all.includes(branchName);
    } catch (error) {
      this.handleGitError(error, 'Failed to check branch existence');
      return false;
    }
  }

  /**
   * Get all branches (local and remote)
   */
  async getAllBranches(): Promise<string[]> {
    try {
      const localBranches = await this.git.branchLocal();
      const remoteBranches = await this.git.branch(['-r']);

      const allBranches = [
        ...localBranches.all,
        ...remoteBranches.all.map(b => b.trim())
      ];

      return [...new Set(allBranches)];
    } catch (error) {
      this.handleGitError(error, 'Failed to fetch branches');
      return [];
    }
  }

  /**
   * Get number of uncommitted changes in a worktree
   */
  async getChangesCount(worktreePath: string): Promise<number> {
    try {
      const worktreeGit = simpleGit(worktreePath);
      const status = await worktreeGit.status();

      return status.files.length;
    } catch (error) {
      this.handleGitError(error, 'Failed to get changes count');
      return 0;
    }
  }

  /**
   * Validate Git version
   */
  async validateGitVersion(minVersion: string): Promise<boolean> {
    try {
      const versionResult = await this.git.raw(['--version']);
      const versionMatch = versionResult.match(/git version (\d+\.\d+\.\d+)/);

      if (!versionMatch) {
        return false;
      }

      const currentVersion = versionMatch[1];
      return this.compareVersions(currentVersion, minVersion) >= 0;
    } catch (error) {
      this.handleGitError(error, 'Failed to validate Git version');
      return false;
    }
  }

  /**
   * Check if path is a valid Git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse worktree list output
   */
  private parseWorktreeList(output: string): WorktreeInfo[] {
    const worktrees: WorktreeInfo[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    let currentWorktree: Partial<WorktreeInfo> = {};

    for (const line of lines) {
      if (line.startsWith('worktree ')) {
        if (currentWorktree.path) {
          worktrees.push(currentWorktree as WorktreeInfo);
        }
        currentWorktree = {
          path: line.substring(9),
          isMain: false,
          isLocked: false
        };
      } else if (line.startsWith('HEAD ')) {
        currentWorktree.commit = line.substring(5);
      } else if (line.startsWith('branch ')) {
        currentWorktree.branch = line.substring(7);
      } else if (line === 'bare') {
        currentWorktree.isMain = true;
      } else if (line.startsWith('locked')) {
        currentWorktree.isLocked = true;
      }
    }

    if (currentWorktree.path) {
      worktrees.push(currentWorktree as WorktreeInfo);
    }

    return worktrees;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }

    return 0;
  }

  /**
   * Get error message from Git error
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Handle Git errors with logging
   */
  private handleGitError(error: unknown, context: string): void {
    const message = this.getErrorMessage(error);
    console.error(`${context}: ${message}`);
  }
}
