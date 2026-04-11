# SoundTune 開発計画

## すり合わせ結果（2026-04-10）
- 記事URLは `/[account_id]/notes/[article_id]` で統一する。
- 管理画面は `/admin/console` にレビュー機能とユーザー管理機能を統合する。
- 管理者によるユーザー削除は `user_id`（UUID）を基準に行う。
- 却下投稿はレコードを保持し、投稿者が修正して再申請できる設計にする（実装は後続）。
- 却下後の編集は下書き保存とし、明示的な「再申請」操作で `pending` に戻す。
- 状態管理は `approval_status` を唯一の真実として扱う。
- `approval_status` は `draft | pending | approved | rejected` で運用する。
- `published` カラムは早期廃止を前提とし、公開判定は `approval_status = approved` に一本化する。
- 承認済み記事の編集は保存時に即時反映し、再審査は行わない。
- 管理者は必要に応じて `approved` から `pending` / `rejected` へ戻せる。
- 検索仕様（中間確定）:
	- 公開検索対象は `approval_status = approved` のみ。
	- 検索方式は全文検索を採用する。
	- 並び順は「関連度優先、同点は新着順」。
	- DB拡張や辞書などの検索基盤詳細は未確定（後続ですり合わせ）。
- Stage 5 の優先順位は「タグ先行、いいね後回し」。
- タグ仕様（委任により推奨案で確定）:
	- 投稿者の自由入力でタグを作成可能。
	- 保存時に正規化し、日本語タグを許可。
	- 正規化ルールは `trim` + 連続空白圧縮 + Unicode NFKC + 英字のみ小文字化。
	- 1投稿あたり最大5タグ、1タグ最大20文字。
	- 同一投稿内の重複タグは正規化後に自動統合。
	- データモデルは `tags` + `post_tags`（多対多）。
	- `tags` は表示名と正規化キーを分離して保持。
	- 正規化キーで一意判定。
	- 同一キーの表示名が競合した場合は「最初に登録された表示名」を固定。
	- 未使用タグは削除せず保持。
- いいね仕様（最小実装）:
	- Stage 5 で実装。
	- 認証ユーザーのみ操作可能。
	- 自己いいねは許可。
	- データモデルは `post_likes`、`(post_id, user_id)` を一意制約、取り消し時は行削除。
	- いいね数は表示時に `COUNT` 集計。
	- 初期UIは記事詳細ページのみ。
	- 未ログイン時は件数表示のみ、ボタン無効化＋ログイン導線表示。
	- UI更新は楽観的更新、失敗時ロールバック。
	- 記事が `pending` / `rejected` に戻っても、いいねは保持。

## Stage 0 用件定義
- サービスの目標と設計を確定する: `soundtune-plans.md`

## Stage 1 環境構築
- プロジェクト作成
- .vscode/settings.jsonの設定
- Biomeのフォーマッター・リンター設定
- Supabase DB作成

## Stage 2 ログイン・記事CRUD実装
- Google SSOでのログインを実装 → /auth/login
- 記事ページの作成 → /[account_id]/notes/[article_id]
- 記事の投稿画面の作成 → /posts/new
- 記事の編集・削除画面の作成 → /posts/edit?articleId=[article_id]
- アカウント削除の実装

## Stage 3 記事ページプロトタイプ
- 記事一覧の作成 → /
- ユーザープロフィール表示画面の作成 → /[account_id]
- ユーザープロフィール編集画面の作成 → /profile

## Stage 4 ロール設定と承認フロー
- admin/memberのロールを割り当て
- 記事公開時の承認ロジックを実装
- adminの管理ページの作成 → /admin/console
- プレビュー用限定公開URLの発行 → /preview?article=[preview_token]

## Stage 5 エディター改良・md対応
- Markdownエディタの実装 → /posts/new, /posts/edit
- Markdownに対応するcssの適応
- article_idは14文字固定（編集不可）の前提で運用
- タグ機能を記事につける → /posts/new, /posts/edit
- いいね機能を実装
- thumbnail/tagsはのちに実装。
- 検索機能の実装 → /search, /search?query={query}
	- 仕様は中間確定済み（詳細は「すり合わせ結果」を参照）
	- 検索基盤詳細（DB拡張や辞書）のみ未確定

## Stage 6 最適化
- 検索機能の強化 → /search
	- Stage 5 で仕様確定後に実施
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