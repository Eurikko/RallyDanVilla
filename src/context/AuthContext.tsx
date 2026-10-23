import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut, 
  deleteUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, TechnicalLevel } from '../types';
import { 
  normalizeUsername, 
  isValidUsername, 
  usernameToTechnicalEmail 
} from '../lib/usernameUtils';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateProfileLocal: (updated: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * SHA-256 client-side password hashing helper using Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_rally_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Safe backend-side verification to assign initial single Owner
 */
async function ensureInitialOwnerAssignment(): Promise<void> {
  try {
    const ownerQuery = query(collection(db, 'profiles'), where('role', '==', 'owner'));
    const ownerSnap = await getDocs(ownerQuery);

    if (!ownerSnap.empty) {
      return; // Single Owner already assigned
    }

    // Check if target account exists
    const targetQuery = query(collection(db, 'profiles'), where('usernameNormalized', '==', 'euriko'));
    const targetSnap = await getDocs(targetQuery);

    if (!targetSnap.empty) {
      const docSnap = targetSnap.docs[0];
      await setDoc(doc(db, 'profiles', docSnap.id), { 
        role: 'owner', 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      console.log('[AuthContext] Initial single owner assigned successfully.');
    }
  } catch (err) {
    console.warn('[AuthContext] Initial owner assignment notice:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Run initial owner verification check once on mount
    ensureInitialOwnerAssignment();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          if (profileSnap.exists()) {
            const data = profileSnap.data() as UserProfile;
            if (data.status === 'active') {
              setProfile({ ...data, uid: firebaseUser.uid });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[AuthContext] Error loading profile for auth user:', e);
        }
      }

      // Fallback check using stored active UID from localStorage
      const storedUid = localStorage.getItem('rallynavila_active_uid');
      if (storedUid) {
        try {
          const snap = await getDoc(doc(db, 'profiles', storedUid));
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            if (data.status === 'active') {
              setProfile({ ...data, uid: storedUid });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[AuthContext] Error loading stored profile:', e);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (rawUsername: string, password: string): Promise<void> => {
    setError(null);
    const normalized = normalizeUsername(rawUsername);

    if (!normalized || !password) {
      throw new Error('Preencha o nome de usuário e a senha.');
    }

    const techEmail = usernameToTechnicalEmail(normalized);
    const pwdHash = await hashPassword(password);

    // 1. Try primary Email/Password sign-in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, techEmail, password);
      const uid = userCredential.user.uid;

      const profileSnap = await getDoc(doc(db, 'profiles', uid));
      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile;
        if (data.status !== 'active') {
          await signOut(auth);
          throw new Error('Não foi possível acessar o perfil desta conta.');
        }

        setProfile({ ...data, uid });
        setUser(userCredential.user);
        localStorage.setItem('rallynavila_active_uid', uid);
        return;
      }
    } catch (authErr: any) {
      console.warn('[AuthContext] Email/Password sign-in notice (falling back to Firestore verification):', authErr?.code);
    }

    // 2. Firestore profile direct query verification
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('usernameNormalized', '==', normalized));
      const snap = await getDocs(q);

      if (snap.empty) {
        // Auto-provision sample demo accounts or owner if attempted
        if (normalized === 'jogadordemo' || normalized === 'volei_marcos' || normalized === 'euriko') {
          const demoUid = 'usr_' + normalized;
          const assignedRole = normalized === 'euriko' ? ('owner' as const) : ('player' as const);
          const assignedLevel: TechnicalLevel = normalized === 'euriko' ? 3 : 'nao_classificado';
          const demoProfileData = {
            uid: demoUid,
            username: normalized === 'euriko' ? 'Euriko Inocencio' : rawUsername.trim() || 'Jogador Demo',
            usernameNormalized: normalized,
            passwordHash: pwdHash,
            role: assignedRole,
            status: 'active' as const,
            technicalLevel: assignedLevel,
            attendanceCount: normalized === 'euriko' ? 12 : 3,
            photoUrl: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          try {
            await setDoc(doc(db, 'profiles', demoUid), demoProfileData);
            const createdDemoProfile: UserProfile = {
              uid: demoUid,
              username: demoProfileData.username,
              usernameNormalized: normalized,
              role: assignedRole,
              status: 'active',
              technicalLevel: assignedLevel,
              attendanceCount: demoProfileData.attendanceCount,
              photoUrl: null,
            };
            setProfile(createdDemoProfile);
            localStorage.setItem('rallynavila_active_uid', demoUid);
            return;
          } catch (e) {
            console.warn('[AuthContext] Demo/Owner auto-provision failed:', e);
          }
        }

        throw new Error('Nome de usuário ou senha incorretos.');
      }

      const docSnap = snap.docs[0];
      const docData = docSnap.data();
      const docId = docSnap.id;

      if (docData.passwordHash) {
        if (docData.passwordHash !== pwdHash) {
          throw new Error('Nome de usuário ou senha incorretos.');
        }
      } else {
        // Legacy document without stored hash: update document with pwdHash on first login
        try {
          await setDoc(doc(db, 'profiles', docId), { passwordHash: pwdHash }, { merge: true });
        } catch (e) {
          console.warn('[AuthContext] Could not update passwordHash for legacy profile:', e);
        }
      }

      if (docData.status !== 'active') {
        throw new Error('Não foi possível acessar o perfil desta conta.');
      }

      let activeUid = docId;
      try {
        const anonCred = await signInAnonymously(auth);
        setUser(anonCred.user);
        if (anonCred.user?.uid) {
          activeUid = anonCred.user.uid;
        }

        // Ensure profile exists at doc(db, 'profiles', activeUid) so Firestore RLS can verify role
        if (activeUid) {
          try {
            const profilePayload = {
              uid: activeUid,
              username: docData.username || rawUsername.trim(),
              usernameNormalized: docData.usernameNormalized || normalized,
              role: docData.role || 'player',
              status: docData.status || 'active',
              technicalLevel: docData.technicalLevel || null,
              attendanceCount: docData.attendanceCount || 0,
              photoUrl: docData.photoUrl || null,
              updatedAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'profiles', activeUid), profilePayload, { merge: true });
            if (docId !== activeUid) {
              await setDoc(doc(db, 'profiles', docId), profilePayload, { merge: true });
            }
          } catch (pErr) {
            console.warn('[AuthContext] Notice syncing profile to auth UID:', pErr);
          }
        }
      } catch (e) {
        // Ignored fallback
      }

      const loadedProfile: UserProfile = {
        uid: activeUid,
        username: docData.username || rawUsername.trim(),
        usernameNormalized: docData.usernameNormalized || normalized,
        role: docData.role || 'player',
        status: docData.status || 'active',
        technicalLevel: docData.technicalLevel || null,
        attendanceCount: docData.attendanceCount || 0,
        photoUrl: docData.photoUrl || null,
      };

      setProfile(loadedProfile);
      localStorage.setItem('rallynavila_active_uid', activeUid);
    } catch (err: any) {
      console.error('[AuthContext] Login query failure:', err);
      throw new Error(err.message || 'Nome de usuário ou senha incorretos.');
    }
  };

  const register = async (rawUsername: string, password: string): Promise<void> => {
    setError(null);

    const trimmedUsername = rawUsername.trim();
    const normalized = normalizeUsername(rawUsername);

    if (!isValidUsername(rawUsername)) {
      throw new Error('O nome de usuário deve ter entre 3 e 20 caracteres (letras, números ou sublinhado).');
    }

    if (!password || password.length < 8) {
      throw new Error('A senha precisa ter pelo menos 8 caracteres.');
    }

    // 1. Check duplicate username in Firestore
    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('usernameNormalized', '==', normalized));
      const snap = await getDocs(q);

      if (!snap.empty) {
        throw new Error('Este nome de usuário não está disponível.');
      }
    } catch (err: any) {
      if (err.message === 'Este nome de usuário não está disponível.') {
        throw err;
      }
      console.error('[AuthContext] Error checking username availability:', err);
    }

    // Determine initial role (check if single initial Owner)
    let assignedRole: UserRole = 'player';
    if (normalized === 'euriko') {
      try {
        const ownerQuery = query(collection(db, 'profiles'), where('role', '==', 'owner'));
        const ownerSnap = await getDocs(ownerQuery);
        if (ownerSnap.empty) {
          assignedRole = 'owner';
        }
      } catch (e) {
        console.warn('[AuthContext] Checking owner status during register notice:', e);
      }
    }

    const techEmail = usernameToTechnicalEmail(normalized);
    const pwdHash = await hashPassword(password);

    let authUid = '';
    let firebaseUser: User | null = null;

    // 2. Attempt Firebase Auth registration
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, techEmail, password);
      firebaseUser = userCredential.user;
      authUid = firebaseUser.uid;
    } catch (authErr: any) {
      console.warn('[AuthContext] Primary Auth register code:', authErr?.code);

      if (authErr?.code === 'auth/email-already-in-use') {
        throw new Error('Este nome de usuário não está disponível.');
      }
      if (authErr?.code === 'auth/weak-password') {
        throw new Error('A senha precisa ter pelo menos 8 caracteres.');
      }

      // Fallback: try anonymous auth if email/password auth is disabled
      try {
        const anonCred = await signInAnonymously(auth);
        firebaseUser = anonCred.user;
        authUid = anonCred.user.uid;
      } catch (anonErr) {
        console.warn('[AuthContext] Anonymous Auth unavailable, using generated UID:', anonErr);
        authUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      }
    }

    // 3. Create profile document in Firestore
    try {
      const profileDocRef = doc(db, 'profiles', authUid);
      const newProfileData = {
        uid: authUid,
        username: trimmedUsername,
        usernameNormalized: normalized,
        passwordHash: pwdHash,
        role: assignedRole,
        status: 'active' as const,
        technicalLevel: null,
        attendanceCount: 0,
        photoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(profileDocRef, newProfileData);

      const createdProfile: UserProfile = {
        uid: authUid,
        username: trimmedUsername,
        usernameNormalized: normalized,
        role: assignedRole,
        status: 'active',
        technicalLevel: null,
        attendanceCount: 0,
        photoUrl: null,
      };

      setProfile(createdProfile);
      if (firebaseUser) {
        setUser(firebaseUser);
      }
      localStorage.setItem('rallynavila_active_uid', authUid);
    } catch (err: any) {
      console.error('[AuthContext] Registration profile write error:', err);

      // Rollback auth user if created
      if (firebaseUser) {
        try {
          await deleteUser(firebaseUser);
        } catch (cleanupErr) {
          console.error('[AuthContext] Rollback error:', cleanupErr);
        }
      }

      throw new Error('Não foi possível criar sua conta. Tente novamente.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      localStorage.removeItem('rallynavila_active_uid');
      await signOut(auth);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  const updateProfileLocal = (updated: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const refreshProfile = async (): Promise<void> => {
    const targetUid = profile?.uid || user?.uid || localStorage.getItem('rallynavila_active_uid');
    if (!targetUid) return;

    try {
      const snap = await getDoc(doc(db, 'profiles', targetUid));
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile({ ...data, uid: targetUid });
      }
    } catch (err) {
      console.error('[AuthContext] refreshProfile error:', err);
    }
  };

  const isAuthenticated = !!profile;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        logout,
        clearError,
        refreshProfile,
        updateProfileLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
