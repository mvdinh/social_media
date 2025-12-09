export interface Group {
  id: string;
  name: string;
  description: string;
  groupType: number;
  autoApprove: boolean;
  owner: string;
  createdAt: number;
  memberCount: number;
  coverImage: string;
  exists: boolean;
}

export interface PendingGroup {
  id: number;
  name: string;
  image: string;
  requestedDate: string;
}