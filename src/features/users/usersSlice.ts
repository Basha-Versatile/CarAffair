import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User, UserRole } from '@/types';
import { api } from '@/lib/apiClient';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk<User[], { role?: UserRole } | undefined>(
  'users/fetch',
  async (filter) => {
    const qs = filter?.role ? `?role=${encodeURIComponent(filter.role)}` : '';
    const res = await api.get<{ users: User[] }>(`/api/users${qs}`);
    return res.users ?? [];
  }
);

export const createUserThunk = createAsyncThunk<
  { user: User; devInviteUrl?: string },
  { name: string; email: string; role: UserRole }
>('users/create', async (data) => {
  const res = await api.post<{ user: User; devInviteUrl?: string }>('/api/users', data);
  return { user: res.user, devInviteUrl: res.devInviteUrl };
});

export const resendInviteThunk = createAsyncThunk<{ user: User; devInviteUrl?: string }, string>(
  'users/resendInvite',
  async (id) => {
    const res = await api.post<{ user: User; devInviteUrl?: string }>(`/api/users/${id}?action=resend-invite`, {});
    return { user: res.user, devInviteUrl: res.devInviteUrl };
  }
);

export const updateUserThunk = createAsyncThunk<User, { id: string; name?: string; role?: UserRole }>(
  'users/update',
  async ({ id, ...patch }) => {
    const res = await api.patch<{ user: User }>(`/api/users/${id}`, patch);
    return res.user;
  }
);

export const deleteUserThunk = createAsyncThunk<string, string>('users/delete', async (id) => {
  await api.del(`/api/users/${id}`);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchUsers.pending, (s) => {
      s.isLoading = true;
    })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.users = a.payload;
        s.isLoading = false;
      })
      .addCase(fetchUsers.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message ?? null;
      })
      .addCase(createUserThunk.fulfilled, (s, a) => {
        s.users.unshift(a.payload.user);
      })
      .addCase(resendInviteThunk.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u.id === a.payload.user.id);
        if (idx !== -1) s.users[idx] = a.payload.user;
      })
      .addCase(updateUserThunk.fulfilled, (s, a) => {
        const idx = s.users.findIndex((u) => u.id === a.payload.id);
        if (idx !== -1) s.users[idx] = a.payload;
      })
      .addCase(deleteUserThunk.fulfilled, (s, a) => {
        s.users = s.users.filter((u) => u.id !== a.payload);
      });
  },
});

export default usersSlice.reducer;
