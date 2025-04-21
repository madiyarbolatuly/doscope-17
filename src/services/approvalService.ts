
import { Document } from '@/types/document';

// Mock approval types and interfaces
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  documentId: string;
  requestedBy: string;
  requestedAt: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  comment?: string;
}

// Mock approval requests
const MOCK_APPROVAL_REQUESTS: ApprovalRequest[] = [
  {
    id: '1',
    documentId: '1',
    requestedBy: 'Alex Johnson',
    requestedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: '2',
    documentId: '2',
    requestedBy: 'Sarah Miller',
    requestedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: 'pending',
  },
  {
    id: '3',
    documentId: '3',
    requestedBy: 'David Chen',
    requestedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    status: 'approved',
    reviewedBy: 'Current User',
    reviewedAt: new Date(Date.now() - 70 * 3600000).toISOString(),
    comment: 'Approved after review',
  },
  {
    id: '4',
    documentId: '4',
    requestedBy: 'Emily Wang',
    requestedAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    status: 'rejected',
    reviewedBy: 'Current User',
    reviewedAt: new Date(Date.now() - 95 * 3600000).toISOString(),
    comment: 'Need more details',
  },
];

// Get all approval requests
export const getApprovalRequests = async (): Promise<ApprovalRequest[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...MOCK_APPROVAL_REQUESTS];
};

// Get approval requests by status
export const getApprovalRequestsByStatus = async (status: ApprovalStatus): Promise<ApprovalRequest[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_APPROVAL_REQUESTS.filter(request => request.status === status);
};

// Get approval request by ID
export const getApprovalRequestById = async (id: string): Promise<ApprovalRequest | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_APPROVAL_REQUESTS.find(request => request.id === id) || null;
};

// Create approval request
export const createApprovalRequest = async (documentId: string): Promise<ApprovalRequest> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newRequest: ApprovalRequest = {
    id: `new-${Date.now()}`,
    documentId,
    requestedBy: 'Current User',
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };
  
  // In a real app, this would make an API call to create the request
  console.log('Created approval request:', newRequest);
  
  return newRequest;
};

// Approve a document
export const approveDocument = async (requestId: string, comment?: string): Promise<ApprovalRequest> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would make an API call to approve the document
  console.log(`Approving document request ${requestId} with comment: ${comment || 'No comment'}`);
  
  // Return a mock updated request
  return {
    id: requestId,
    documentId: '1', // Mock document ID
    requestedBy: 'Someone',
    requestedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'approved',
    reviewedBy: 'Current User',
    reviewedAt: new Date().toISOString(),
    comment,
  };
};

// Reject a document
export const rejectDocument = async (requestId: string, comment?: string): Promise<ApprovalRequest> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would make an API call to reject the document
  console.log(`Rejecting document request ${requestId} with comment: ${comment || 'No comment'}`);
  
  // Return a mock updated request
  return {
    id: requestId,
    documentId: '1', // Mock document ID
    requestedBy: 'Someone',
    requestedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'rejected',
    reviewedBy: 'Current User',
    reviewedAt: new Date().toISOString(),
    comment,
  };
};
