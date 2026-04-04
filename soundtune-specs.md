# SoundTune 仕様書

## プロジェクト概要
- **名前**: SoundTune
- **目的**: ユーザー投稿型の知識アーカイブ
- **フレームワーク**: Next.js（App Router）+ TypeScript + Tailwind CSS
- **認証**: Supabase Auth（Google SSO）
- **データベース**: Supabase PostgreSQL
- **ストレージ**: Supabase Storage

---

## 第1章: ページコンポーネント・ルート一覧

### 1. トップページ (`/`)
**ファイル**: `src/app/page.tsx`  
**権限**: 未認証・認証済み両対応  

**機能**:
- 公開済み記事（`published = true`）一覧表示
- 最大30件、新着順（`created_at` DESC）
- 記事カード表示：タイトル、著者名、作成日時、プレビュー本文
- ログイン中の場合、ユーザーのプロフィール情報（表示名、アイコン）表示
- 未ログイン者へのログイン導線

**データ取得**:
```
SELECT article_id, title, content, created_at, 
       profiles!author_id (display_name, account_id, avatar_url)
FROM posts
WHERE published = true
ORDER BY created_at DESC
LIMIT 30
```

**ユーザーメタデータの優先順位**:
1. `profiles.display_name`
2. `auth.users.user_metadata.name`
3. `auth.users.user_metadata.full_name`
4. メールプレフィックス（`user@example.com` → `user`）
5. 'user' (デフォルト)

---

### 2. ログインページ (`/auth/login`)
**ファイル**: `src/app/auth/login/page.tsx`  
**権限**: 未認証のみ  

**機能**:
- Google SSO ログインボタン表示
- ログイン後に `/auth/callback` を経由してトップページへリダイレクト
- 説明文："Phase 2 では Google SSO のみを利用します。"

**コンポーネント**:
- `LoginButton` (`src/app/auth/login/login-button.tsx`)
  - Supabase Auth の `signInWithOAuth` を利用
  - プロバイダー: `google`

**コールバック処理** (`src/app/auth/callback/route.ts`):
- Supabase SDK 標準コールバック処理
- セッション確立後、トップページへリダイレクト

---

### 3. 新規投稿ページ (`/posts/new`)
**ファイル**: `src/app/posts/new/page.tsx`  
**権限**: 認証済みのみ  

**機能**:
- 記事投稿フォーム
- タイトル（必須）、本文（必須）入力

**フォームコンポーネント**: `NewPostForm` (`src/app/posts/new/new-post-form.tsx`)
- Client Component (`'use client'`)
- フォーム入力フィールド：
  - `title`: テキスト入力、プレースホルダー "記事のタイトルを入力"
  - `content`: テキストエリア（16行）、プレースホルダー "記事の内容を入力"
- エラーメッセージ表示
- 送信ボタン："投稿する"（送信中は "投稿中..."）
- キャンセルボタン（トップに戻る）
- `isPending` 状態でボタンを無効化

**フォーム送信**:
- `createPost()` Server Action を呼び出し
- タイトル・本文が空の場合、エラー返却
- 成功時：`/preview?article={previewToken}` へリダイレクト

---

### 4. 記事編集ページ (`/posts/edit?articleId={articleId}`)
**ファイル**: `src/app/posts/edit/page.tsx`  
**権限**: 認証済み + 著者本人のみ  

**機能**:
- 既存記事のタイトル・本文を編集
- Article ID は再設定不可（作成時に14文字で自動採番）

**データ取得**:
- `article_id` パラメータで記事を取得
- RLS + `author_id = user.id` チェックで本人のみアクセス可能
- 記事が見つからない場合は404

**フォームコンポーネント**: `EditPostForm` (`src/app/posts/edit/edit-post-form.tsx`)
- タイトル・本文の編集フィールド
- 送信ボタン："更新する"

**フォーム送信**:
- `updatePost(articleId, formData)` Server Action を呼び出し
- 成功時：`/{account_id}/{articleId}` へリダイレクト

---

### 5. 記事詳細ページ (`/{accountId}/{articleId}`)
**ファイル**: `src/app/[accountId]/[articleId]/page.tsx`  
**権限**: 公開済み記事のみ表示  

**機能**:
- 記事内容表示（タイトル、本文、作成日時）
- 著者プロフィール情報表示（著者名、アイコン）
- 著者本人の場合、編集・削除ボタン表示
- メタデータ動的生成（タイトルを Page Title に使用）

**データ取得**:
```
SELECT id, title, content, created_at, approval_status, author_id,
       profiles!author_id (display_name, account_id, avatar_url)
FROM posts
WHERE article_id = {articleId}
  AND profiles.account_id = {accountId}
  AND published = true
```

**認可ロジック**:
- 記事の `published = true` の場合のみ表示
- 非公開（`published = false`）の記事は表示不可

**著者本人向けUI**:
- 編集ボタン（`/posts/edit?articleId={articleId}` へリンク）
- 削除ボタン（`deletePost()` Server Action実行）

---

### 6. 公開プロフィール (`/{accountId}`)
**ファイル**: `src/app/[accountId]/page.tsx`  
**権限**: 未認証・認証済み両対応  

**機能**:
- ユーザープロフィール表示
- 著者の記事一覧表示（最新順）
- プロフィール情報：表示名、アイコン、自己紹介、アカウント作成日

**データ取得**:
```
SELECT id, display_name, account_id, avatar_url, bio, created_at
FROM profiles
WHERE account_id = {accountId}

SELECT article_id, title, created_at
FROM posts
WHERE author_id = {profile_id}
  AND published = true
ORDER BY created_at DESC
```

**メタデータ**: Page Title に表示名を使用

**アカウント作成日表記**: `toLocaleDateString('ja-JP')` で "YYYY年M月" 形式

---

### 7. 記事検索ページ (`/search?query=...`)
**ファイル**: `src/app/search/page.tsx`  
**権限**: 未認証・認証済み両対応  

**機能**:
- タイトル・本文のキーワード検索
- 検索結果は最新順（`created_at` DESC）
- 最大50件表示
- 空白のみ入力は送信防止

**検索クエリ**:
```
SELECT article_id, title, created_at,
       profiles!author_id (display_name, account_id)
FROM posts
WHERE published = true
  AND (title ILIKE '%{query}%' OR content ILIKE '%{query}%')
ORDER BY created_at DESC
LIMIT 50
```

**フォームコンポーネント**: `SearchForm` (`src/app/search/search-form.tsx`)
- 検索入力フィールド
- 初期値に `query` パラメータを反映
- 空白チェック（送信防止）

---

### 8. 限定公開プレビュー (`/preview?article={previewToken}`)
**ファイル**: `src/app/preview/page.tsx`  
**権限**: `previewToken` 保有者のみ  

**機能**:
- 投稿直後の記事プレビュー表示
- 承認前の `pending` 状態の記事を一時公開
- 承認後、記事を公開URLに自動リダイレクト可能

**データ取得**:
```
SELECT article_id, title, content, created_at, approval_status,
       profiles!author_id (display_name, account_id, avatar_url)
FROM posts
WHERE preview_token = {previewToken}
```

**プレビュートークン概要**:
- 24文字ランダム文字列（NanoID）
- 投稿時に自動生成
- 一度承認されたら、URL形式が変更（`/preview` → `/{accountId}/{articleId}`）

**承認後のリダイレクト**:
- `PreviewApproveActions` コンポーネント内で `published = true` に更新時、記事詳細ページへリダイレクト可能

---

### 9. 管理者レビューページ (`/admin/review`)
**ファイル**: `src/app/admin/review/page.tsx`  
**権限**: Admin ロール のみ  

**機能**:
- `pending` 状態の投稿一覧表示
- 各投稿に対して"承認"/"却下"ボタン
- 投稿者情報、作成日時表示

**データ取得**:
```
SELECT article_id, preview_token, title, created_at, approval_status,
       profiles!author_id (account_id, display_name)
FROM posts
WHERE approval_status = 'pending'
```

**UI コンポーネント**: `PostReviewActions` (`src/app/admin/review/post-review-actions.tsx`)
- 承認ボタン（`approvePost()` Server Action）
- 却下ボタン（`rejectPost()` Server Action）

---

### 10. 管理者コンソール (`/admin/control_console`)
**ファイル**: `src/app/admin/control_console/page.tsx`  
**権限**: Admin ロール のみ  

**機能**:
- ユーザー一覧表示（ID、表示名、アカウントID、ロール、作成日時）
- ユーザーのロール変更（member ↔ admin）
- ユーザー削除（関連投稿も削除）
- 投稿一覧表示
- 投稿削除

**データ取得**:
```
SELECT id, display_name, account_id, role, created_at FROM profiles

SELECT article_id, title, author_id, created_at, published FROM posts
```

**UI コンポーネント**:
- `UserRowActions`: 各ユーザー行のアクション（ロール変更、削除）
- `PostRowActions`: 各投稿行のアクション（削除）

---

### 11. アカウント設定ページ (`/profile`)
**ファイル**: `src/app/profile/page.tsx`  
**権限**: 認証済みのみ  

**機能**:
- プロフィール編集（表示名、アカウントID、アイコン、自己紹介）
- アイコンアップロード
- アカウント削除（確認ダイアログ→ユーザー削除）

**データ取得**:
```
SELECT display_name, account_id, avatar_url, bio
FROM profiles
WHERE id = {user_id}
```

**UI コンポーネント**:
- `AvatarUpload`: アイコンアップロード
  - Supabase Storage にアップロード
  - バリデーション：画像ファイルのみ
  - CBR（Client-side Browser Compression）対応準備
- `InlineEdit`: 表示名・アカウントID・自己紹介のインライン編集
  - フィールド選択式（必要なフィールドのみ FormData に含める）
- `DeleteAccountForm`: アカウント削除フォーム
  - 確認テキスト入力（`/confirm` など）を求める
  - 削除実行時はユーザー削除（関連投稿も削除）

---

## 第2章: Server Actions（API）一覧

### 記事関連 (`src/lib/actions/posts.ts`)

#### 1. `createPost(formData: FormData)`
**概要**: 新規記事投稿  

**入力**:
- `formData.title`: 記事タイトル
- `formData.content`: 記事本文

**検証**:
- タイトル・本文が空でないか
- ユーザーがログインしているか
- プロフィールが存在するか

**処理**:
- `article_id`: NanoID（14文字）を自動生成（編集での変更不可）
- `preview_token`: NanoID（24文字）で自動生成
- `approval_status`: `'pending'` で投稿
- `published`: `false` (デフォルト、承認後に true に更新)

**出力**:
- 成功時：`/preview?article={previewToken}` へリダイレクト
- 失敗時：`{ error: 'エラーメッセージ' }` 返却

**エラーメッセージ**:
- "タイトルと本文を入力してください"
- "ログインが必要です"
- "プロフィールが見つかりません"
- "投稿に失敗しました"

---

#### 2. `updatePost(articleId: string, formData: FormData)`
**概要**: 既存記事を編集  

**入力**:
- `articleId`: 編集対象の article_id
- `formData.title`: 新しいタイトル
- `formData.content`: 新しい本文

**検証**:
- タイトル・本文が空でないか
- article_id が14文字固定（英数字・`_`・`-`）か
- ユーザーがログインしているか
- 投稿の著者が現在ユーザーか（RLS）

**処理**:
- `posts` テーブル更新（title, content）

**出力**:
- 成功時：`/{account_id}/{articleId}` へリダイレクト
- 失敗時：`{ error: 'エラーメッセージ' }` 返却

**エラーメッセージ**:
- "タイトルと本文を入力してください"
- "記事IDが不正です"
- "ログインが必要です"
- "プロフィールが見つかりません"
- "更新に失敗しました"

---

#### 3. `deletePost(articleId: string)`
**概要**: 投稿者が記事を削除  

**入力**:
- `articleId`: 削除対象の article_id

**検証**:
- article_id が不正でないか
- ユーザーがログインしているか
- 投稿の著者が現在ユーザーか（RLS）
- プロフィールが存在するか

**処理**:
- `posts` テーブルから削除（`article_id` と `author_id` で特定）

**出力**:
- 成功時：`/{account_id}` （著者の公開プロフィール）へリダイレクト
- 失敗時：`{ error: 'エラーメッセージ' }` 返却

**エラーメッセージ**:
- "記事IDが不正です"
- "ログインが必要です"
- "プロフィールが見つかりません"
- "記事削除に失敗しました"

---

### プロフィール関連 (`src/lib/actions/profile.ts`)

#### 4. `updateProfile(formData: FormData)`
**概要**: ユーザープロフィール編集（表示名・アカウントID・アイコン・自己紹介）  

**入力**:
- `formData.display_name`: （オプション）新しい表示名
- `formData.account_id`: （オプション）新しいアカウントID
- `formData.avatar_url`: （オプション）新しいアイコンURL
- `formData.bio`: （オプション）新しい自己紹介

**検証**:
- 最低1つのフィールドが含まれているか
- 表示名：空でないか
- アカウントID：
  - 4〜14文字
  - 英数字・`_`・`-` のみ
  - 数字のみではない
- アイコンURL：`http://` または `https://` で始まるか（指定時）
- 自己紹介：500文字以下

**処理**:
- `profiles` テーブル更新（指定されたフィールドのみ）

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

**エラーメッセージ**:
- "更新対象がありません"
- "表示名は必須です"
- "アカウントIDは4〜14文字の英数字・_・-のみ"
- "アカウントIDは数字のみは使えません"
- "アイコンURLはhttp://またはhttps://で始まる必要があります"
- "自己紹介は500文字以内にしてください"
- "ログインが必要です"
- "そのアカウントIDは既に使われています"
- "更新に失敗しました"

---

#### 5. `uploadAvatar(formData: FormData)`
**概要**: アイコン画像を Supabase Storage にアップロード  

**入力**:
- `formData.avatar`: アップロード対象ファイル

**検証**:
- ファイルが与えられているか
- MIME タイプが `image/` で始まるか
- ファイルサイズなど（実装詳細）

**処理**:
- Supabase Storage `avatars` バケットにアップロード
- ファイル名：`{userId}-{timestamp}` など
- 画像圧縮（Phase 10 で CBR 導入予定）
- 圧縮後のパブリック URL を取得

**出力**:
- 成功時：`{ avatarUrl: 'https://...' }`
- 失敗時：`{ error: 'エラーメッセージ' }`

**エラーメッセージ**:
- "画像ファイルを選択してください"
- "画像ファイルのみアップロードできます"
- （その他アップロード失敗エラー）

---

### アカウント削除 (`src/lib/actions/account.ts`)

#### 6. `deleteUser()`
**概要**: ログイン中のユーザーがアカウント削除  

**検証**:
- ユーザーがログインしているか

**処理**:
1. 当該ユーザーの全投稿を削除
2. `auth.users` からユーザーを削除（Supabase Admin API）

**出力**:
- 成功時：`/` (トップページ)へリダイレクト
- 失敗時：`{ error: 'エラーメッセージ' }`

**エラーメッセージ**:
- "ログインが必要です"
- "投稿記事の削除に失敗しました"
- "アカウント削除に失敗しました"

---

#### 7. `deleteUserByAccountId(accountId: string)`
**概要**: 管理者が特定ユーザーをアカウント削除  

**検証**:
- ユーザーがログインしているか
- ユーザーが Admin ロールか（`requireAdmin()` で確認）
- `accountId` が不正でないか

**処理**:
1. `account_id` で当該プロフィールを取得
2. 当該ユーザーの全投稿を削除
3. 当該ユーザーを削除

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

---

### 管理者操作 (`src/lib/actions/admin.ts`)

#### 8. `adminGrantRole(targetUserId: string)`
**概要**: Admin ロール付与  

**検証**:
- 実行者が Admin か
- `targetUserId` が不正でないか

**処理**:
- `set_user_role` RPC 関数を呼び出し
- 対象ユーザーの `role` を `'admin'` に設定

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

**エラーメッセージ**:
- "ログインが必要です"
- "管理者のみ実行できます"
- "対象ユーザーが不正です"
- "権限変更に失敗しました"

---

#### 9. `adminDeleteUser(targetUserId: string)`
**概要**: Admin が特定ユーザーを削除  

**検証**:
- 実行者が Admin か
- `targetUserId` が不正でないか
- 自分自身を削除しようとしていないか

**処理**:
1. 対象ユーザーの全投稿を削除
2. 対象ユーザーを削除（Supabase Admin API）

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

**エラーメッセージ**:
- "ログインが必要です"
- "管理者のみ実行できます"
- "対象ユーザーが不正です"
- "自分自身はここから削除できません"
- "投稿記事の削除に失敗しました"
- "アカウント削除に失敗しました"

---

#### 10. `adminDeletePost(articleId: string)`
**概要**: Admin が特定投稿を削除  

**検証**:
- 実行者が Admin か
- `articleId` が不正でないか

**処理**:
- 指定 `article_id` の投稿を削除

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

---

#### 11. `approvePost(articleId: string)`
**概要**: Admin が投稿を承認  

**検証**:
- 実行者が Admin か
- `articleId` が不正でないか

**処理**:
- `approval_status` を `'pending'` → `'approved'` に更新
- `published` を `false` → `true` に更新

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

---

#### 12. `rejectPost(articleId: string)`
**概要**: Admin が投稿を却下  

**検証**:
- 実行者が Admin か
- `articleId` が不正でないか

**処理**:
- `approval_status` を `'pending'` → `'rejected'` に更新
- 投稿を削除するか保持するか（仕様確認必要）

**出力**:
- 成功時：`{ success: true }`
- 失敗時：`{ error: 'エラーメッセージ' }`

---

## 第3章: 認証・権限管理

### ロール体系 (`src/lib/roles.ts`)

#### `getCurrentUserRole(): Promise<AppRole | null>`
**概要**: 現在ログイン中のユーザーのロールを取得  

**処理**:
1. `supabase.auth.getUser()` で認証ユーザー取得
2. ユーザーが存在しない場合は `null` 返却
3. `profiles` テーブルから `role` を取得
4. `role` が存在しない場合は `'member'` デフォルト
5. `'admin'` / `'member'` を返却

**戻り値**: `'admin'` | `'member'` | `null`

---

#### `requireAdmin(redirectTo = "/"): Promise<void>`
**概要**: Admin ロールチェック（ガード）  

**処理**:
1. `getCurrentUserRole()` でロール確認
2. Admin でない場合、指定ページへリダイレクト

**用途**: Admin ページ (`/admin/*`) でのルート保護

---

### Supabase クライアント設定

#### Server-side (`src/lib/supabase/server.ts`)
- `createClient()`: サーバーコンポーネント・Server Actions 用クライアント
- Cookie ベースのセッション管理

#### Admin Client (`src/lib/supabase/admin.ts`)
- `createAdminClient()`: Admin API 用クライアント
- `SUPABASE_SERVICE_ROLE_KEY` を使用
- ユーザー削除、RPC 関数実行時に使用

#### Config (`src/lib/supabase/config.ts`)
- `supabaseUrl`: Supabase プロジェクト URL
- `supabaseKey`: Anon Key （パブリック）

---

## 第4章: ミドルウェア

### `middleware.ts`
**用途**: 認証セッション管理、Cookie 更新

**処理**:
1. リクエスト単位でセッション確認
2. セッションが存在しない場合、認証 Cookie (`sb-*`) を削除
3. エラー時も同様に Cookie 削除
4. レスポンスに Cookie 変更を反映

**対象パス**: すべてのパス（除外: `_next/static`, `_next/image`, ファイルなど）

---

## 第5章: データモデル

### `profiles` テーブル
| 項目 | 型 | 制約 | 説明 |
|------|-----|------|------|
| `id` | uuid | PK, FK(auth.users.id) | ユーザーID |
| `display_name` | text | NOT NULL | ユーザー表示名 |
| `account_id` | text | NOT NULL, UNIQUE | ユーザーのアカウントID（4〜14文字、英数字・`_`・`-`） |
| `avatar_url` | text | NULL | アイコン URL |
| `bio` | text | NULL | 自己紹介（500文字以下） |
| `role` | text | DEFAULT 'member' | ロール（`'member'` \| `'admin'`） |
| `created_at` | timestamp | DEFAULT NOW() | 作成日時 |

### `posts` テーブル
| 項目 | 型 | 制約 | 説明 |
|------|-----|------|------|
| `id` | uuid | PK | 投稿ID |
| `author_id` | uuid | FK(profiles.id) | 著者ID |
| `article_id` | text | UNIQUE | 記事URL ID（14文字固定、英数字・`_`・`-`。作成時に14文字NanoIDを自動採番） |
| `preview_token` | text | UNIQUE | プレビュートークン（24文字、NanoID） |
| `title` | text | NOT NULL | 記事タイトル |
| `content` | text | NOT NULL | 記事本文 |
| `published` | boolean | DEFAULT false | 公開フラグ |
| `approval_status` | text | DEFAULT 'pending' | 承認ステータス（`'pending'` \| `'approved'` \| `'rejected'`） |
| `created_at` | timestamp | DEFAULT NOW() | 作成日時 |
| `updated_at` | timestamp | DEFAULT NOW() | 更新日時 |

---

## 第6章: UI コンポーネント一覧

### 公開UI コンポーネント

| ファイル | 説明 |
|---------|------|
| `Header` (`src/app/header.tsx`) | ページ共通ヘッダー |
| `Footer` (`src/app/footer.tsx`) | ページ共通フッター |
| `LogoutButton` (`src/app/logout-button.tsx`) | ログアウトボタン |
| `LoginButton` (`src/app/auth/login/login-button.tsx`) | Google SSO ログインボタン |
| `NewPostForm` (`src/app/posts/new/new-post-form.tsx`) | 新規投稿フォーム |
| `EditPostForm` (`src/app/posts/edit/edit-post-form.tsx`) | 記事編集フォーム |
| `SearchForm` (`src/app/search/search-form.tsx`) | 検索フォーム |
| `AvatarUpload` (`src/app/profile/avatar-upload.tsx`) | アイコンアップロード |
| `InlineEdit` (`src/app/profile/inline-edit.tsx`) | インライン編集コンポーネント |
| `DeleteAccountForm` (`src/app/profile/delete-account-form.tsx`) | アカウント削除フォーム |
| `PreviewApproveActions` (`src/app/preview/preview-approve-actions.tsx`) | プレビューの承認/却下ボタン（投稿者向け）|
| `PostReviewActions` (`src/app/admin/review/post-review-actions.tsx`) | 投稿の承認/却下ボタン（Admin 向け） |
| `UserRowActions` (`src/app/admin/control_console/user-row-actions.tsx`) | ユーザー行のロール変更/削除（Admin 向け） |
| `PostRowActions` (`src/app/admin/control_console/post-row-actions.tsx`) | 投稿行の削除（Admin 向け） |

---

## 第7章: スタイリング・設定

### Tailwind CSS
- **Utility-first** アプローチ
- `globals.css` で共通スタイル定義

### PostCSS 設定
- `postcss.config.mjs`: Tailwind CSS プラグイン設定

### Biome (コード品質)
- `biome.json`: フォーマッター・リンター設定

### TypeScript
- `tsconfig.json`: Strictモード有効

---

## 第8章: 環境変数

### `.env.local` （Git 除外）
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

---