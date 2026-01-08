// Common types for dashboard pages

// Decimal type that works with Prisma
interface DecimalLike { 
  toNumber: () => number 
}

export interface RecentOrder {
  id: string
  orderId: string
  companyName: string
  status: string
  totalAmount: DecimalLike
  createdAt: Date
  priority: string
}

export interface UserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  avatarUrl: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
  _count: {
    orders: number
    businesses: number
    subscriptions: number
  }
}

export interface OrderListItem {
  id: string
  orderId: string
  companyName: string
  contactFirstName: string
  contactLastName: string
  contactEmail: string
  status: string
  paymentStatus: string
  priority: string
  totalAmount: DecimalLike
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  } | null
}

export interface BusinessListItem {
  id: string
  name: string
  entityType: string
  state: string
  status: string
  formationDate: Date | null
  einNumber: string | null
  createdAt: Date
  isPublicListed: boolean
  publicCategory: string | null
  publicDescription: string | null
  publicLocation: string | null
  publicTags: string[]
  publicLink: string | null
  publicImageUrl: string | null
  owner: {
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    members: number
    documents: number
    complianceTasks: number
  }
}

export interface SubscriptionListItem {
  id: string
  name: string | null
  amount: DecimalLike
  billingCycle: string | null
  status: string
  startDate: Date
  endDate: Date | null
  createdAt: Date
  business: {
    name: string
    state: string
  } | null
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface WebsiteSubscriptionItem {
  id: string
  tier: string
  monthlyPrice: DecimalLike
  status: string
  startDate: Date
  endDate: Date | null
  createdAt: Date
  order: {
    business: {
      name: string
    } | null
  }
}

export interface SubscriptionIntentItem {
  id: string
  serviceName: string
  amount: DecimalLike
  status: string
  createdAt: Date
  completedAt: Date | null
}

export interface PartnerItem {
  id: string
  name: string
  description: string
  url: string
  location: string | null
  imageUrl: string | null
  icon: string | null
  isActive: boolean
  tags: string[]
  sortOrder: number
  createdAt: Date
}

export interface BlogPostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: string
  category: string | null
  publishedAt: Date | null
  createdAt: Date
  featuredImage: string | null
  author: {
    firstName: string
    lastName: string
  }
}

export interface AdminActivityLogItem {
  id: string
  action: string
  resourceType: string
  resourceId: string | null
  details: unknown
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface ComplianceTaskItem {
  id: string
  title: string
  description: string | null
  taskType: string
  status: string
  priority: string
  dueDate: Date
  reminderDate: Date | null
  completedAt: Date | null
  completedBy: string | null
  completedByType: string | null
  notes: string | null
  isSystemGenerated: boolean
  createdAt: Date
  business: {
    id: string
    name: string
    state: string
    owner: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

export interface QuestionnaireItem {
  id: string
  stateCode: string
  status: string
  currentSection: string | null
  completedAt: Date | null
  lastSavedAt: Date | null
  createdAt: Date
  order: {
    id: string
    orderId: string
    companyName: string
  }
  user: {
    firstName: string
    lastName: string
    email: string
  }
}
