/**
 * pokecavers - Core Type Definitions
 * TASK-010: ドメインモデルの TypeScript 型定義
 */

// =============================================================================
// Card Category
// =============================================================================

export type CardCategory = 'pokemon' | 'trainer' | 'energy';

// =============================================================================
// Regulation
// =============================================================================

export type Regulation = 'standard' | 'expanded' | 'unlimited';

// =============================================================================
// CardEntry - デッキ内のカード1種類を表す
// =============================================================================

export interface CardEntry {
  /** カード名（プライマリキー） */
  cardName: string;
  /** 将来拡張用のカードID（カードマスタ連携時に使用） */
  cardId?: string;
  /** カードカテゴリ */
  category: CardCategory;
  /** 枚数（1-4、基本エネルギーは無制限） */
  count: number;
  /** カード画像URL（カードマスタから取得） */
  imageUrl?: string;
}

// =============================================================================
// DiffEntry - カード差分を表す
// =============================================================================

export type DiffType = 'added' | 'removed' | 'changed';

export interface DiffEntry {
  /** カード名 */
  cardName: string;
  /** 将来拡張用のカードID */
  cardId?: string;
  /** カードカテゴリ */
  category: CardCategory;
  /** 差分タイプ */
  type: DiffType;
  /** 変更前の枚数（changed/removed の場合） */
  beforeCount?: number;
  /** 変更後の枚数（changed/added の場合） */
  afterCount?: number;
}

// =============================================================================
// Version - デッキのバージョン履歴
// =============================================================================

export interface Version {
  /** バージョンID */
  id: string;
  /** 所属デッキID */
  deckId: string;
  /** バージョン番号（1から開始） */
  versionNumber: number;
  /** 修正メッセージ（必須） */
  message: string;
  /** 差分情報 */
  diff: DiffEntry[];
  /** 作成日時 */
  createdAt: Date;
}

// =============================================================================
// Deck - デッキ
// =============================================================================

export interface Deck {
  /** デッキID */
  id: string;
  /** 所有者のユーザーID（Anonymous Auth UID） */
  userId: string;
  /** デッキ名 */
  name: string;
  /** レギュレーション */
  regulation: Regulation;
  /** メモ（任意） */
  memo?: string;
  /** 現在のカード構成 */
  currentCards: CardEntry[];
  /** バージョン採番用カウンター */
  versionCount: number;
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

// =============================================================================
// Input Types - 作成・更新用の入力型
// =============================================================================

export interface CreateDeckInput {
  name: string;
  regulation: Regulation;
  memo?: string;
  initialCards?: CardEntry[];
}

export interface UpdateDeckInput {
  name?: string;
  regulation?: Regulation;
  memo?: string;
}

// =============================================================================
// Validation Types
// =============================================================================

export type ValidationErrorCode =
  | 'DECK_OVER_60'
  | 'CARD_OVER_4'
  | 'MESSAGE_REQUIRED'
  | 'CARD_NAME_REQUIRED'
  | 'INVALID_COUNT';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  field?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// =============================================================================
// CardMaster - 将来拡張用のカードマスタ
// =============================================================================

export interface CardMaster {
  /** カードID */
  id: string;
  /** カード名 */
  name: string;
  /** カードカテゴリ */
  category: CardCategory;
  /** 画像URL */
  imageUrl: string;
  /** 使用可能レギュレーション */
  regulation: Regulation[];
  /** 最大枚数（通常4、ACE SPEC=1、基本エネ=60） */
  maxCount: number;
}
