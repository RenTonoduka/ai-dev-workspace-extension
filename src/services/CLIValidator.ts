/**
 * CLI Tool Validator Service
 * Validates CLI tool availability and provides setup guidance
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ValidationResult {
  available: boolean;
  path?: string;
  error?: string;
  setupGuidance?: string;
}

export class CLIValidator {
  private static instance: CLIValidator;

  private constructor() {}

  static getInstance(): CLIValidator {
    if (!CLIValidator.instance) {
      CLIValidator.instance = new CLIValidator();
    }
    return CLIValidator.instance;
  }

  /**
   * Validate if a CLI command is available
   */
  async validateCommand(command: string): Promise<ValidationResult> {
    try {
      const { stdout } = await execAsync(`which ${command}`);
      const path = stdout.trim();

      if (path) {
        return {
          available: true,
          path
        };
      }

      return {
        available: false,
        error: `Command '${command}' not found`,
        setupGuidance: this.getSetupGuidance(command)
      };
    } catch (error) {
      return {
        available: false,
        error: `Command '${command}' not found`,
        setupGuidance: this.getSetupGuidance(command)
      };
    }
  }

  /**
   * Get setup guidance for a specific CLI tool
   */
  private getSetupGuidance(command: string): string {
    const guides: Record<string, string> = {
      'cursor': `Cursor CLIをインストールするには:
1. Cursorアプリを起動
2. Cmd+Shift+P でコマンドパレットを開く
3. "Shell Command: Install 'cursor' command in PATH" を実行
または: docs/CLI_SETUP.md を参照してください`,

      'aider': `Aiderをインストールするには:
pip install aider-chat
または: docs/CLI_SETUP.md を参照してください`,

      'gemini-cli': `Gemini CLIをインストールするには:
npm install -g @google/generative-ai-cli
または: docs/CLI_SETUP.md を参照してください`,

      'claude': `Claude Codeをインストールするには:
npm install -g @anthropic-ai/claude-code
または: https://claude.com/claude-code を参照してください`
    };

    return guides[command] || `'${command}' のインストール方法は docs/CLI_SETUP.md を参照してください`;
  }

  /**
   * Validate all enabled CLI tools
   */
  async validateAllTools(): Promise<Map<string, ValidationResult>> {
    const config = vscode.workspace.getConfiguration('aiDevWorkspace');
    const cliTools = config.get<Record<string, any>>('cliTools', {});

    const results = new Map<string, ValidationResult>();

    for (const [name, tool] of Object.entries(cliTools)) {
      if (tool.enabled) {
        const result = await this.validateCommand(tool.command);
        results.set(name, result);
      }
    }

    return results;
  }

  /**
   * Show validation results to user
   */
  async showValidationResults(results: Map<string, ValidationResult>): Promise<void> {
    const unavailable: string[] = [];
    const available: string[] = [];

    for (const [name, result] of results) {
      if (result.available) {
        available.push(`✅ ${name}: ${result.path}`);
      } else {
        unavailable.push(`❌ ${name}: ${result.error}`);
      }
    }

    if (unavailable.length === 0) {
      vscode.window.showInformationMessage(
        `すべてのAI CLIツールが利用可能です (${available.length}個)`
      );
      return;
    }

    // Show warning with setup guidance
    const message = `${unavailable.length}個のCLIツールが見つかりません`;
    const action = await vscode.window.showWarningMessage(
      message,
      'セットアップガイドを開く',
      '無視'
    );

    if (action === 'セットアップガイドを開く') {
      const docPath = vscode.Uri.file(
        require('path').join(
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
          'docs',
          'CLI_SETUP.md'
        )
      );

      try {
        await vscode.commands.executeCommand('markdown.showPreview', docPath);
      } catch {
        vscode.window.showErrorMessage('セットアップガイドを開けませんでした');
      }
    }
  }

  /**
   * Check and warn about unavailable tools before creating worktree
   */
  async checkBeforeCreate(selectedTools: string[]): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('aiDevWorkspace');
    const cliTools = config.get<Record<string, any>>('cliTools', {});

    const unavailable: string[] = [];

    for (const toolName of selectedTools) {
      const tool = cliTools[toolName];
      if (!tool) continue;

      const result = await this.validateCommand(tool.command);
      if (!result.available) {
        unavailable.push(toolName);
      }
    }

    if (unavailable.length === 0) {
      return true; // All tools available
    }

    // Show warning
    const message = `以下のツールが見つかりません: ${unavailable.join(', ')}\n続行しますか?`;
    const action = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      'セットアップガイド',
      '続行',
      'キャンセル'
    );

    if (action === 'セットアップガイド') {
      // Show first tool's setup guidance
      const firstTool = unavailable[0];
      const toolConfig = cliTools[firstTool];
      const result = await this.validateCommand(toolConfig.command);

      vscode.window.showInformationMessage(
        result.setupGuidance || 'セットアップガイドを確認してください',
        { modal: true }
      );
      return false;
    }

    return action === '続行';
  }
}
