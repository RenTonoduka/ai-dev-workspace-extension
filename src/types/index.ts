/**
 * AI Dev Workspace Extension Type Definitions
 */

/**
 * Worktree information structure
 */
export interface WorktreeInfo {
  /** Absolute path to worktree directory */
  path: string;
  /** Branch name */
  branch: string;
  /** Commit hash (HEAD) */
  commit: string;
  /** Whether this is the main worktree */
  isMain: boolean;
  /** Whether the worktree is locked */
  isLocked: boolean;
  /** Number of uncommitted changes */
  changes?: number;
}

/**
 * AI CLI tool configuration
 */
export interface CLIToolConfig {
  /** Command to execute */
  command: string;
  /** Command line arguments */
  args: string[];
  /** Whether this tool is enabled */
  enabled: boolean;
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Worktree creation options
 */
export interface WorktreeCreateOptions {
  /** Name for the worktree directory */
  name: string;
  /** Branch name (new or existing) */
  branch: string;
  /** Base path for worktree (relative to project root) */
  basePath: string;
  /** Whether to create a new branch */
  createBranch: boolean;
  /** AI CLI tools to start */
  cliTools: string[];
  /** Whether to open in new window */
  openInNewWindow: boolean;
  /** Whether to auto-start terminal */
  autoStartTerminal: boolean;
}

/**
 * Terminal launch options
 */
export interface TerminalLaunchOptions {
  /** Terminal name */
  name: string;
  /** Working directory */
  cwd: string;
  /** CLI tool to execute */
  cliTool?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Extension configuration
 */
export interface ExtensionConfig {
  /** Default worktree location */
  defaultWorktreeLocation: string;
  /** Auto-open new window */
  autoOpenNewWindow: boolean;
  /** Auto-start terminal */
  autoStartTerminal: boolean;
  /** CLI tools configuration */
  cliTools: Record<string, CLIToolConfig>;
  /** Minimum Git version */
  gitMinVersion: string;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Operation output */
  output?: string;
}

/**
 * Worktree validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
}
