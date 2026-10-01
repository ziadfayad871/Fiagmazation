export type RoomRole = "Owner" | "Editor" | "Viewer";

export type ElementType =
  | "Rectangle"
  | "Ellipse"
  | "Line"
  | "Pencil"
  | "Text"
  | "Image"
  | "Frame";

export type FontWeightValue = "Light" | "Regular" | "Medium" | "Semibold" | "Bold" | "Extrabold";
export type TextAlignValue = "Left" | "Center" | "Right" | "Justify";

export interface User {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  displayName: string;
  createdAt: string;
}

export interface UserBrief {
  id: string;
  fullName: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
  email: string;
}

export interface CommentAuthor {
  id: string;
  fullName: string;
  displayName: string;
  avatarUrl: string | null;
  color: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface ExternalProvider {
  provider: string;
  displayName: string;
  isConfigured: boolean;
  authorizeUrl: string | null;
}

export interface RoomSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  accentColor: string | null;
  owner: UserBrief;
  role: RoomRole;
  isOwner: boolean;
  memberCount: number;
  onlineCount: number;
  designCount: number;
  createdAt: string;
  updatedAt: string;
  relativeUpdatedAt: string;
  primaryDesignId: string | null;
}

export interface RoomMember {
  id: string;
  roomId: string;
  role: RoomRole;
  joinedAt: string;
  user: UserBrief;
  isOnline: boolean;
}

export interface DesignSummary {
  id: string;
  roomId: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  updatedAt: string;
  elementCount: number;
}

export interface RoomDetail extends RoomSummary {
  members: RoomMember[];
  designs: DesignSummary[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoomStats {
  myRooms: number;
  sharedRooms: number;
  totalCollaborators: number;
  onlineNow: number;
}

export interface DesignElementDto {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string | null;
  stroke: string | null;
  strokeWidth: number;
  cornerRadius: number;
  text: string | null;
  fontFamily: string;
  fontSize: number;
  fontWeight: FontWeightValue;
  textAlign: TextAlignValue;
  lineHeight: number;
  src: string | null;
  points: string | null;
  zIndex: number;
  isVisible: boolean;
  isLocked: boolean;
  parentId: string | null;
  linkToDesignId: string | null;
  updatedAt: string;
}

export interface DesignDto extends DesignSummary {
  zoom: number;
  panX: number;
  panY: number;
  elements: DesignElementDto[];
  updatedBy: string | null;
}

export interface CreateElementPayload {
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string | null;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeightValue;
  textAlign?: TextAlignValue;
  src?: string | null;
  points?: string | null;
  parentId?: string | null;
  linkToDesignId?: string | null;
  name?: string;
}

export interface UpdateElementPayload {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  cornerRadius?: number;
  text?: string | null;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeightValue;
  textAlign?: TextAlignValue;
  lineHeight?: number;
  src?: string | null;
  points?: string | null;
  zIndex?: number;
  isVisible?: boolean;
  isLocked?: boolean;
  parentId?: string | null;
  linkToDesignId?: string | null;
}

export interface SaveDesignPayload {
  name?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  zoom?: number;
  panX?: number;
  panY?: number;
  elements?: DesignElementDto[];
}

export interface RevisionSummary {
  id: string;
  createdAt: string;
  label: string | null;
  createdByName: string;
  elementCount: number;
}

export interface CreateRevisionResult {
  created: boolean;
  revision: RevisionSummary | null;
}

export interface CommentDto {
  id: string;
  designId: string;
  roomId: string;
  parentId: string | null;
  body: string;
  x: number;
  y: number;
  resolved: boolean;
  createdAt: string;
  editedAt: string | null;
  author: CommentAuthor;
  replies: CommentDto[];
}

export type NotificationType =
  | "System"
  | "RoomShared"
  | "MemberJoined"
  | "CommentAdded"
  | "CommentReply"
  | "Mention";

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  actor: CommentAuthor | null;
}

export type ToolType =
  | "select"
  | "frame"
  | "rectangle"
  | "ellipse"
  | "line"
  | "pencil"
  | "text"
  | "image"
  | "comment"
  | "hand";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface RemoteCursor {
  userId: string;
  displayName: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number;
}

export interface PresenceUser {
  userId: string;
  displayName: string;
  color: string;
  avatarUrl: string | null;
  role: RoomRole;
  isSelf?: boolean;
}
