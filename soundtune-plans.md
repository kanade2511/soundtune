# SoundTune 開発計画

## Stage 0 用件定義
- サービスの目標と設計を確定する: `soundtune-plans.md`, `soundtune-specs.md`

## Stage 1 環境構築
- プロジェクト作成
- .vscode/settings.jsonの設定
- Biomeのフォーマッター・リンター設定
- Supabase DB作成

## Stage 2 ログイン・記事CRUD実装
- Google SSOでのログインを実装 → /auth/login
- 記事ページの作成 → /[account_id]/[article_id]
- 記事の投稿画面の作成 → /posts/new
- 記事の編集・削除画面の作成 → /posts/edit?articleId=[article_id]
- アカウント削除の実装

## Stage 3 記事ページプロトタイプ
- 記事一覧の作成 → /
- 検索機能の実装 (タイトル・本文のみ) → /search, /search?query={query}
- ユーザープロフィール表示画面の作成 → /[account_id]
- ユーザープロフィール編集画面の作成 → /profile

## Stage 4 ロール設定と承認フロー
- admin/memberのロールを割り当て
- 記事公開時の承認ロジックを実装
- adminの管理ページの作成 → /admin/control_console, /admin/review
- プレビュー用限定公開URLの発行 → /preview?article=[preview_token]

## Stage 5 エディター改良・md対応
- Markdownエディタの実装 → /posts/new, /posts/edit
- Markdownに対応するcssの適応
- article_idは14文字固定（編集不可）の前提で運用
- タグ機能を記事につける → /posts/new, /posts/edit
- いいね機能を実装
- category/description/readTime/date/thumbnail/tagsはのちに実装。

## Stage 6 最適化
- 検索機能の強化 → /search
- プロフィールのアイコン最適化 (`browser-image-compression`)
- アップロード後の画像の最適化
- ヘッダー・フッターのUI/UX改善
- 記事一覧ページのUI/UX改善
- 記事ページのUI改善
- 全体デザイン世界観の統一
- レスポンシブ対応の強化

## Stage 7 adminページ最適化
- 管理者ページのUX改善
- レビュー/コンソール導線の改善
- 管理画面の可読性と操作性改善

## 問題点
rejectedを削除するか保持するか