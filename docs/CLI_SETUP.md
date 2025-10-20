# AI CLI ツール セットアップガイド

このガイドでは、AI Dev Workspaceで使用できる各AI CLIツールのインストール方法を説明します。

## 🤖 サポートされているCLIツール

### 1. Claude Code (推奨 ✅)

**インストール済み:** `/Users/tonodukaren/.nvm/versions/node/v22.20.0/bin/claude`

```bash
# すでにインストール済みです
which claude
# /Users/tonodukaren/.nvm/versions/node/v22.20.0/bin/claude
```

✅ **デフォルトで有効** - すぐに使えます!

---

### 2. Cursor (推奨 ✅)

**アプリケーション:** `/Applications/Cursor.app`

#### オプション A: Cursor CLI をインストール (推奨)

1. **Cursorアプリを起動**
2. **コマンドパレット** を開く (`Cmd+Shift+P`)
3. **"Shell Command: Install 'cursor' command in PATH"** を実行
4. これで `cursor` コマンドがターミナルから使えるようになります

```bash
# インストール確認
which cursor
# /usr/local/bin/cursor (または類似のパス)
```

#### オプション B: 直接パスを指定

VSCode設定 (`.vscode/settings.json`) で以下を追加:

```json
{
  "aiDevWorkspace.cliTools": {
    "cursor-cli": {
      "command": "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
      "args": [],
      "enabled": true,
      "env": {}
    }
  }
}
```

**注意:** 現在のデフォルト設定 (`open -a Cursor .`) では、worktreeフォルダではなく新規ウィンドウが開きます。上記のCLI設定を推奨します。

---

### 3. Aider (オプション)

**インストール:** Python pip経由

```bash
# pipxでインストール (推奨)
pip install pipx
pipx install aider-chat

# または通常のpipで
pip install aider-chat

# 確認
which aider
aider --version
```

VSCode設定で有効化:

```json
{
  "aiDevWorkspace.cliTools": {
    "aider": {
      "command": "aider",
      "args": [],
      "enabled": true,
      "env": {
        "OPENAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**ドキュメント:** https://aider.chat/docs/install.html

---

### 4. Gemini CLI (オプション)

**インストール:** npm経由

```bash
# グローバルインストール
npm install -g @google/generative-ai-cli

# または
yarn global add @google/generative-ai-cli

# 確認
which gemini-cli
gemini-cli --version
```

VSCode設定で有効化:

```json
{
  "aiDevWorkspace.cliTools": {
    "gemini": {
      "command": "gemini-cli",
      "args": ["--model", "gemini-2.0-flash"],
      "enabled": true,
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**注意:** `gemini-cli` は正式な公式CLIではない可能性があります。代替として以下を検討:
- Google AI Studio Webインターフェース
- カスタムスクリプト (`gcloud` + API)

---

## 🔧 カスタムCLIツールの追加

独自のAI CLIツールを追加することも可能です:

### VSCode設定 (`.vscode/settings.json`)

```json
{
  "aiDevWorkspace.cliTools": {
    "my-custom-ai": {
      "command": "/path/to/my-cli",
      "args": ["--option", "value"],
      "enabled": true,
      "env": {
        "API_KEY": "your-key",
        "CUSTOM_VAR": "value"
      }
    }
  }
}
```

### グローバル設定 (VSCode Settings)

1. **VSCode設定を開く** (`Cmd+,`)
2. **"aiDevWorkspace.cliTools"** を検索
3. **"Edit in settings.json"** をクリック
4. 上記と同じJSON形式で追加

---

## ✅ 現在のデフォルト設定

```json
{
  "claude": {
    "command": "claude",
    "args": [],
    "enabled": true  // ✅ すぐに使える
  },
  "cursor": {
    "command": "open",
    "args": ["-a", "Cursor", "."],
    "enabled": true  // ⚠️ 新規ウィンドウが開く (要CLI設定)
  },
  "aider": {
    "command": "aider",
    "args": [],
    "enabled": false  // インストール必要
  },
  "gemini": {
    "command": "gemini-cli",
    "args": ["--model", "gemini-2.0-flash"],
    "enabled": false  // インストール必要
  }
}
```

---

## 🧪 動作確認

### 手動テスト

各ツールが正しくインストールされているか確認:

```bash
# Claude Code
claude --version

# Cursor CLI
cursor --version

# Aider
aider --version

# Gemini CLI
gemini-cli --version
```

### 拡張機能内でテスト

1. **Extension Development Host** で拡張機能を起動 (F5)
2. **Worktreeを作成** (`AI Dev: Create Worktree`)
3. **AI CLI選択画面** で有効なツールだけが表示されます
4. 選択したツールが並列で起動することを確認

---

## ❓ トラブルシューティング

### "command not found" エラー

**原因:** CLIツールがPATHに含まれていない

**解決策:**
1. ツールが本当にインストールされているか確認
2. `which <command>` でパスを確認
3. 見つからない場合は再インストール
4. フルパスを設定ファイルに直接記述

### ターミナルが開かない

**原因:** 設定が間違っているか、ツールが無効化されている

**解決策:**
1. VSCode設定で `"enabled": true` になっているか確認
2. コマンドのパスが正しいか確認 (`which <command>`)
3. Developer Toolsコンソール (`Cmd+Shift+I`) でエラーを確認

### 並列起動が動かない

**原因:** 拡張機能のバージョンが古い

**解決策:**
1. 最新版をgit pullで取得
2. `npm install && npm run compile` で再コンパイル
3. Extension Development Hostを再起動 (Cmd+R)

---

## 📚 参考リンク

- **Claude Code:** https://claude.com/claude-code
- **Cursor:** https://cursor.sh
- **Aider:** https://aider.chat
- **Google AI Studio:** https://ai.google.dev/tutorials/setup

---

作成日: 2025-10-20
