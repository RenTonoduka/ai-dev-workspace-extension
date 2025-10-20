# AI Dev Workspace - クイックスタートガイド

このガイドでは、AI Dev Workspace拡張機能の使い方を順を追って説明します。

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
cd /Users/tonodukaren/Programming/AI/01_APP/ai-dev-workspace-extension
npm install
```

### 2. コンパイル

```bash
npm run compile
```

## 🧪 拡張機能のテスト起動

### 方法1: VSCodeから起動

1. **VSCodeで拡張機能プロジェクトを開く**
   ```bash
   code /Users/tonodukaren/Programming/AI/01_APP/ai-dev-workspace-extension
   ```

2. **F5キーを押す**
   - 自動的に「Extension Development Host」という新しいVSCodeウィンドウが開きます
   - このウィンドウで拡張機能がアクティブになります

3. **Gitリポジトリを開く**
   - Extension Development Hostで任意のGitリポジトリを開いてください
   - 例: `File > Open Folder...` で既存のプロジェクトを開く

### 方法2: コマンドラインから

```bash
code --extensionDevelopmentPath=/Users/tonodukaren/Programming/AI/01_APP/ai-dev-workspace-extension
```

## 📱 使い方

### UI確認

拡張機能が起動すると、以下が表示されます:

1. **アクティビティバーにアイコン追加**
   - 左サイドバーに「AI Dev Workspace」アイコンが表示されます
   - アイコン: `$(git-branch)`

2. **サイドバーパネル**
   ```
   AI DEV WORKSPACE
   ├── 🏠 main (master) • No changes
   └── [➕] [🔄]
   ```

### 基本操作

#### ✅ Worktreeを作成

**方法1: サイドバーから**
1. サイドバーの `➕` ボタンをクリック
2. ウィザードに従って入力:
   - Worktree名: `feature-test`
   - ブランチ: `Create new branch` を選択
   - 新規ブランチ名: `feature/test-worktree`
   - AI CLI: `Claude Code` を選択（オプション）
3. 自動実行:
   - Worktree作成
   - 新しいVSCodeウィンドウが開く
   - Claude Codeが起動

**方法2: コマンドパレットから**
1. `Cmd+Shift+P` (macOS) または `Ctrl+Shift+P` (Windows/Linux)
2. `AI Dev: Create Worktree` を入力
3. 同様のウィザードが表示される

#### 📋 Worktree一覧表示

サイドバーに自動的に表示されます:

```
AI DEV WORKSPACE
├── 🏠 main (master) • No changes
│   └── メインworktree
├── 🌿 project-feature-test (feature/test-worktree) • No changes
│   └── [📟] [🤖] 右クリックでメニュー
└── 🌿 project-api-work (feature/api) • 3 changes
    └── 変更あり（黄色アイコン）
```

#### 🎯 Worktreeで作業

**インラインボタン（サイドバー）**
- `📟` **Terminal** - ターミナルを開く
- `🤖` **AI CLI** - AI CLIツールを起動

**右クリックメニュー**
1. サイドバーのworktreeを右クリック
2. メニュー表示:
   - `Open in New Window` - 新規ウィンドウで開く
   - `Open Terminal` - ターミナル起動
   - `Start AI CLI` - AI CLI選択して起動
   - `Remove Worktree` - 削除（確認あり）

#### 🗑️ Worktree削除

**方法1: サイドバーから**
1. 削除したいworktreeを右クリック
2. `Remove Worktree` を選択
3. 確認ダイアログで `Remove` をクリック

**方法2: コマンドパレットから**
1. `Cmd+Shift+P`
2. `AI Dev: Remove Worktree`
3. 削除したいworktreeを選択

## 🎨 アイコンの意味

| アイコン | 色 | 意味 |
|---------|---|------|
| 🏠 | 青 | メインworktree（削除不可） |
| 🔒 | 赤 | ロックされたworktree |
| 🌿 | 黄 | 変更あり（uncommitted changes） |
| 🌿 | 緑 | クリーンな状態 |

## ⚙️ 設定カスタマイズ

### VSCode設定を開く

1. `Cmd+,` (macOS) または `Ctrl+,` (Windows/Linux)
2. `AI Dev Workspace` で検索

### 主な設定項目

```json
{
  // Worktreeの作成場所（プロジェクトルートからの相対パス）
  "aiDevWorkspace.defaultWorktreeLocation": "../",

  // 新規ウィンドウ自動オープン
  "aiDevWorkspace.autoOpenNewWindow": true,

  // ターミナル自動起動
  "aiDevWorkspace.autoStartTerminal": true,

  // AI CLIツール設定
  "aiDevWorkspace.cliTools": {
    "claude": {
      "command": "claude",
      "args": [],
      "enabled": true,
      "env": {}
    },
    "aider": {
      "command": "aider",
      "args": ["--model", "gpt-4"],
      "enabled": true,
      "env": {}
    }
  }
}
```

## 💡 実用例

### 例1: 機能開発用worktree作成

```
目的: 新機能開発を並行して行う

1. コマンドパレット > AI Dev: Create Worktree
2. 入力:
   - Name: feature-auth
   - Branch: Create new branch → feature/user-authentication
   - AI CLI: Claude Code
3. 結果:
   - ../project-feature-auth に worktree作成
   - 新しいVSCodeウィンドウで自動オープン
   - Claude Code起動済み
```

### 例2: バグ修正と機能開発を並行

```
Main Window (元のプロジェクト)
└── メインブランチで通常開発

Window 2 (project-bugfix-login)
└── ログインバグ修正
└── Aider使用

Window 3 (project-feature-dashboard)
└── ダッシュボード機能追加
└── Claude Code使用
```

### 例3: コードレビュー用worktree

```
1. Pull Request用のworktreeを作成
   - Name: review-pr-123
   - Branch: Use existing → pr/feature-xyz

2. レビュー後、そのまま削除
   - 右クリック > Remove Worktree
```

## 🔧 トラブルシューティング

### 拡張機能が表示されない

**原因**: Gitリポジトリ外で開いている

**解決策**:
```bash
# Gitリポジトリを開く
cd /path/to/your/git/project
code .
```

### Worktree作成に失敗

**エラー**: "fatal: invalid reference"

**解決策**:
- ブランチ名が有効か確認
- Git version確認: `git --version` (2.30.0以上必要)

### AI CLIが起動しない

**エラー**: "command not found"

**解決策**:
```bash
# Claude Code インストール
npm install -g @anthropic-ai/claude-code

# Aider インストール
pip install aider-chat

# パスを確認
which claude
which aider
```

## 📚 次のステップ

- [README.md](./README.md) - 詳細なドキュメント
- [CHANGELOG.md](./CHANGELOG.md) - 変更履歴
- [GitHub Issues](https://github.com/RenTonoduka/ai-dev-workspace-extension/issues) - バグ報告・機能要望

## 🎯 ショートカットまとめ

| 操作 | ショートカット |
|------|---------------|
| コマンドパレット | `Cmd+Shift+P` / `Ctrl+Shift+P` |
| Worktree作成 | パレット > `AI Dev: Create` |
| サイドバー表示 | アクティビティバーのアイコンクリック |
| 設定を開く | `Cmd+,` / `Ctrl+,` |
| 拡張機能デバッグ | `F5` |

---

**🎉 準備完了！さっそく使ってみましょう！**
