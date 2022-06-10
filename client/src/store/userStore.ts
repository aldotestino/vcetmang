import create from 'zustand';
import shallow from 'zustand/shallow';
import { Client, Cook, LoginVariables, User, UserRole } from '../utils/types';
import { API_URL } from '../utils/vars';

interface LoginApiResponse {
  success: boolean
  data: {
    user?: Client | Cook
    erroMessage?: string
  }
}

interface LogoutApiResponse {
  success: boolean
  data?: {
    errorMessage: string
  }
}

interface UserStore {
  user: User | null,
  isAuth: boolean,
  fetch: () => void
  login: (values: LoginVariables) => Promise<LoginApiResponse>
  logout: () => Promise<LogoutApiResponse>
}

const useStore = create<UserStore>((setState, getState) => ({
  user: null,
  isAuth: false,
  fetch: async () => {
    const userRole = localStorage.getItem('user-role') as UserRole;
    if(!userRole) {
      return null;
    }
    const res = await fetch(`${API_URL}/${userRole}/me`, {
      credentials: 'include'
    }).then(r => r.json());
    if(res.success) {
      setState({
        isAuth: true,
        user: {
          role: userRole,
          client: userRole === UserRole.CLIENT ? res.data.user : null,
          cook: userRole === UserRole.COOK ? res.data.user : null
        }
      });
    }
  },
  login: async ({ role, ...values }) => {
    const userRole = role.toLowerCase();
    const res = await fetch(`${API_URL}/${userRole}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(values)
    }).then(r => r.json());
    if(res.success) {
      localStorage.setItem('user-role', role);
      setState({
        isAuth: true,
        user: {
          role,
          client: role === UserRole.CLIENT ? res.data.user : null,
          cook: role === UserRole.COOK ? res.data.user: null
        }
      });
    }
    return res;
  },
  logout: async () => {
    const userRole = getState().user?.role.toLowerCase();
    const res = await fetch(`${API_URL}/${userRole}/logout`, {
      credentials: 'include',
    }).then(r => r.json());
    if(res.success) {
      localStorage.removeItem('user-role');
      setState({ user: null, isAuth: false });
    }
    return res;
  }
}));

function useUserStore() {
  return useStore(({ user, isAuth, fetch, login, logout }) => ({ user, isAuth, fetch, login, logout }), shallow);
}

export default useUserStore;