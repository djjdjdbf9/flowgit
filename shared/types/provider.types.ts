// Provider types — GitHub, GitLab, Gitea

export type ProviderType = 'github' | 'gitlab' | 'gitea'

export interface ProviderAccount {
  id: string
  type: ProviderType
  name: string        // Display name / username
  baseUrl: string     // https://github.com, https://gitlab.com, or self-hosted
  avatarUrl?: string
  connectedAt: string
}

export interface ProviderRepo {
  id: string
  name: string
  fullName: string
  description?: string
  defaultBranch: string
  isPrivate: boolean
  cloneUrl: string
  sshUrl: string
  webUrl: string
  stars: number
  forks: number
  updatedAt: string
}

export type PRState = 'open' | 'closed' | 'merged' | 'draft'

export interface PullRequest {
  id: number
  number: number
  title: string
  description: string
  state: PRState
  author: string
  authorAvatar?: string
  sourceBranch: string
  targetBranch: string
  createdAt: string
  updatedAt: string
  webUrl: string
  reviewCount: number
  commentCount: number
  isDraft: boolean
  isMergeable?: boolean
}

export interface CreatePRInput {
  title: string
  description: string
  sourceBranch: string
  targetBranch: string
  isDraft: boolean
}
