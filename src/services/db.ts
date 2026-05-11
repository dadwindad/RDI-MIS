export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  dept: string;
  role: 'admin' | 'manager' | 'staff';
  status: 'Active' | 'Inactive';
}

export interface FiscalYear {
  year: string;
  start_date: string;
  end_date: string;
  state: 'Planning' | 'Active' | 'Archived';
  desc: string;
}

export interface AppRegistry {
  app_id: string;
  name: string;
  entry_url: string;
  api_endpoint: string;
  required_roles: string; // JSON string from SQLite
  status: 'Active' | 'Maintenance';
}

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
}

const API_URL = '/api';

const getHeaders = () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const savedUser = localStorage.getItem('ricp_current_user');
  if (savedUser) {
    headers['X-User-Name'] = JSON.parse(savedUser).name;
  }
  return headers;
};

export const db = {
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  login: async (username: string, password: string): Promise<User | null> => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_URL}/users/${id}`, { 
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (e) {
      console.error(e);
    }
  },

  addUser: async (user: Omit<User, 'id'>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(user)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch(`${API_URL}/audit`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  getFiscalYears: async (): Promise<FiscalYear[]> => {
    try {
      const res = await fetch(`${API_URL}/fiscal-years`);
      if (!res.ok) throw new Error('Failed to fetch fiscal years');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addFiscalYear: async (fy: FiscalYear): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/fiscal-years`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(fy)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateFiscalYearState: async (year: string, state: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/fiscal-years/${year}/state`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ state })
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateFiscalYear: async (year: string, data: Partial<FiscalYear>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/fiscal-years/${year}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteFiscalYear: async (year: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/fiscal-years/${year}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  getApps: async (): Promise<AppRegistry[]> => {
    try {
      const res = await fetch(`${API_URL}/apps`);
      if (!res.ok) throw new Error('Failed to fetch apps');
      return await res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addApp: async (app: AppRegistry): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/apps`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(app)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  updateApp: async (id: string, data: Partial<AppRegistry>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/apps/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteApp: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/apps/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
