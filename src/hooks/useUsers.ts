import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI, PaginationParams, PaginatedResponse } from '@/services/api';

export interface User {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  bloodGroup?: string;
  address?: string;
  medicalConditions?: string[];
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
}

export interface UseUsersParams extends PaginationParams {
  role?: string;
}

export interface CreateUserData {
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  bloodGroup?: string;
  address?: string;
  medicalConditions?: string[];
  emergencyContacts?: Array<{ name: string; phone: string; relation: string }>;
}

/**
 * Custom hook for fetching users with React Query
 * Provides automatic caching, background refetching, and loading states
 * 
 * @param params - Pagination and filter parameters
 * @returns Query result with data, loading state, and error
 */
export function useUsers(params: UseUsersParams = {}) {
  const { role = 'user', page = 1, limit = 10, search } = params;

  return useQuery({
    queryKey: ['users', role, page, limit, search],
    queryFn: async () => {
      const response = await adminAPI.getAllUsers(role, { page, limit, search });
      return response.data as PaginatedResponse<User>;
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refetch when tab gains focus
    placeholderData: (previousData) => previousData, // Show previous data while fetching
  });
}

/**
 * Hook for creating a new user
 * Automatically invalidates users cache on success
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const response = await adminAPI.createUser(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all user queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook for deleting a user
 * Automatically invalidates users cache on success
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminAPI.deleteUser(userId);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all user queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook for updating a user
 * Automatically invalidates users cache on success
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const response = await adminAPI.updateUser(id, data as Parameters<typeof adminAPI.updateUser>[1]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/**
 * Hook for fetching a single user by ID
 */
export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await adminAPI.getUserById(userId);
      return response.data as User;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
  });
}
