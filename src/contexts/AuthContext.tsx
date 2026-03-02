import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../../types';

interface AuthContextType {
    user: any;
    userMetadata: any;
    role: UserRole | null;
    loading: boolean;
    signIn: (email: string, password: string, role: UserRole, rememberMe?: boolean) => Promise<void>;
    signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (fullName: string) => Promise<void>;
    resetProgress: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if we should persist session
        const isRemembered = localStorage.getItem('remember_me');
        const isTempSession = sessionStorage.getItem('temp_session');

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // If we have a session but it was marked as temp (not remembered) AND 
                // we are in a new tab/window (temp_session missing from sessionStorage but present in logic before)
                // Actually simpler: 
                // If 'remember_me' is NOT set in localStorage, and we have a session, it means it's a persistent session from Supabase default.
                // We want to force sign out if it wasn't supposed to be remembered.
                // But wait, if user refreshes page, we want them to stay logged in.

                // Logic:
                // 1. Login with Remember Me -> set 'remember_me' in LocalStorage.
                // 2. Login WITHOUT Remember Me -> set 'temp_session' in SessionStorage.

                // On Load:
                // If Session exists:
                //   If 'remember_me' exists -> Keep logged in.
                //   If 'temp_session' exists -> Keep logged in (refresh).
                //   If NEITHER exists -> It means user closed tab and reopened (SessionStorage cleared). 
                //      -> Sign out (because Supabase persisted it by default).

                if (!isRemembered && !isTempSession) {
                    supabase.auth.signOut();
                    setUser(null);
                    setRole(null);
                    setLoading(false);
                    return;
                }

                // If temporary session, ensure it stays in sessionStorage
                if (!isRemembered) {
                    sessionStorage.setItem('temp_session', 'true');
                }

                setUser(session.user);
                // Optimistically set role from metadata 
                const metaRole = session.user.user_metadata?.role;
                if (metaRole) {
                    setRole(metaRole.toLowerCase() === 'instructor' ? UserRole.INSTRUCTOR : UserRole.STUDENT);
                }

                fetchUserProfile(session.user.id, session.user.user_metadata?.role);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_OUT') {
                localStorage.removeItem('remember_me');
                localStorage.removeItem('user_role'); // Clear role persistence
                sessionStorage.removeItem('temp_session');
                setUser(null);
                setRole(null);
                setLoading(false);
            } else if (session?.user) {
                const isRemembered = localStorage.getItem('remember_me');
                const isTempSession = sessionStorage.getItem('temp_session');

                if (!isRemembered && !isTempSession && _event === 'INITIAL_SESSION') {
                    supabase.auth.signOut();
                    setUser(null);
                    setRole(null);
                    setLoading(false);
                    return;
                }

                setUser(session.user);

                // Deeply check metadata for role
                const metadata = session.user.user_metadata || {};
                const metaRole = metadata.role || metadata.user_role || metadata.role_name;

                console.log('--- AUTH UPDATE ---');
                console.log('Event:', _event);
                console.log('User Metadata:', metadata);
                console.log('Detected MetaRole:', metaRole);

                // Persisted role fallback (useful right after registration)
                const persistedRole = localStorage.getItem('user_role') as UserRole;

                // Optimistically set role
                if (metaRole) {
                    const resolved = metaRole.toLowerCase().includes('instructor') ? UserRole.INSTRUCTOR : UserRole.STUDENT;
                    setRole(resolved);
                    console.log('Setting optimistic role from metadata:', resolved);
                } else if (persistedRole) {
                    setRole(persistedRole);
                    console.log('Setting optimistic role from persistence:', persistedRole);
                }

                fetchUserProfile(session.user.id, metaRole);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, metadataRole?: string) => {
        // CRITICAL: Only show global loading if we have NO user and NO role yet.
        // If we already have a session, we must NEVER toggle global loading to true
        // as it causes the entire app to unmount via {!loading && children}.
        if (!user && !role) setLoading(true);
        console.log('--- ROLE RESOLUTION START ---');
        try {
            // Priority 1: Check localStorage first for immediate arayüz response
            const persistedRole = localStorage.getItem('user_role') as UserRole;

            // Priority 2: Check metadata hint
            const metaRoleResolved = (metadataRole?.toLowerCase().includes('instructor')) ? UserRole.INSTRUCTOR : UserRole.STUDENT;

            // Optimistic setting
            const bestGuess = (persistedRole === UserRole.INSTRUCTOR || metaRoleResolved === UserRole.INSTRUCTOR) ? UserRole.INSTRUCTOR : UserRole.STUDENT;
            console.log('Best optimistic guess:', bestGuess);
            setRole(bestGuess);

            // Priority 3: Fetch from DB (Discovering columns with *)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                console.log('DB Profile data found:', data);
                // Look for common role column names
                const dbRoleValue = (data.role || data.user_role || data.role_name || '').toString().toLowerCase();
                if (dbRoleValue.includes('instructor')) {
                    console.log('Confirmed INSTRUCTOR from DB.');
                    setRole(UserRole.INSTRUCTOR);
                    localStorage.setItem('user_role', UserRole.INSTRUCTOR);
                } else if (dbRoleValue.includes('student')) {
                    // Only override to student if metadata doesn't strongly suggest instructor
                    if (metaRoleResolved !== UserRole.INSTRUCTOR) {
                        console.log('Confirmed STUDENT from DB.');
                        setRole(UserRole.STUDENT);
                        localStorage.setItem('user_role', UserRole.STUDENT);
                    } else {
                        console.log('DB says student but metadata says instructor. Trusting metadata.');
                    }
                }
            } else if (error) {
                console.warn('DB Fetch Error (possibly no profile yet):', error);
            }

            // If we are instructor but DB is empty/wrong, try a MINIMAL sync
            if (bestGuess === UserRole.INSTRUCTOR) {
                try {
                    // Try to update just 'id' and 'role' - most likely to exist
                    await supabase.from('profiles').upsert({ id: userId, role: 'instructor' });
                } catch (e) {
                    console.log('Silent DB sync failed:', e);
                }
            }

        } catch (error) {
            console.error('Fatal role resolution error:', error);
        } finally {
            setLoading(false);
            console.log('--- ROLE RESOLUTION END ---');
        }
    };

    const signIn = async (email: string, password: string, selectedRole: UserRole, rememberMe: boolean = false) => {
        // Set optimistic role in localStorage to bridge the gap during redirect/reload
        localStorage.setItem('user_role', selectedRole);
        setRole(selectedRole);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            localStorage.removeItem('user_role');
            throw error;
        }

        if (data.user) {
            // Check metadata immediately to confirm if the selection was correct
            const metadata = data.user.user_metadata || {};
            const metaRole = metadata.role || metadata.user_role;
            if (metaRole) {
                const resolved = metaRole.toLowerCase().includes('instructor') ? UserRole.INSTRUCTOR : UserRole.STUDENT;
                setRole(resolved);
                localStorage.setItem('user_role', resolved);
            }
        }

        if (!rememberMe) {
            sessionStorage.setItem('temp_session', 'true');
        } else {
            sessionStorage.removeItem('temp_session');
            localStorage.setItem('remember_me', 'true');
        }
    };

    const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
        const roleStr = role === UserRole.INSTRUCTOR ? 'instructor' : 'student';

        // Store in localStorage so even across confirmation/sign-in we remember what they picked
        localStorage.setItem('user_role', role);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: roleStr,
                },
            },
        });

        if (error) {
            localStorage.removeItem('user_role');
            throw error;
        }

        // Try to create profile if user is instantly active
        if (data.user) {
            try {
                // Minimalist upsert to prevent 400 errors from non-existent columns
                // We'll try to include full_name but wrap it in individual try/catches if needed
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    role: roleStr,
                    full_name: fullName
                });
            } catch (profileError) {
                console.warn('Initial profile sync failed:', profileError);
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setRole(null);
    };

    const updateProfile = async (fullName: string) => {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        if (error) throw error;

        // Optimistically update data
        setUser((prev: any) => ({
            ...prev,
            user_metadata: {
                ...prev?.user_metadata,
                full_name: fullName
            }
        }));
    };

    const resetProgress = async () => {
        if (!user) return;
        setLoading(true);

        try {
            console.log('--- TAM SIFIRLAMA BAŞLATILDI ---');
            console.log('Kullanıcı ID:', user.id);

            // 1. Kurs/Ders İlerlemelerini Temizle
            const { error: enrollError } = await supabase
                .from('enrollments')
                .update({
                    progress: 0,
                    lesson_progress: {},
                    completed_lesson_ids: [],
                    last_accessed_lesson_id: null
                })
                .eq('user_id', user.id);

            if (enrollError) {
                console.error('Kurs ilerlemesi sıfırlanırken hata oluştu:', enrollError);
                throw new Error(`Kurs ilerlemesi sıfırlanamadı: ${enrollError.message}`);
            }
            console.log('Kurs ilerlemeleri sıfırlandı.');

            // 2. Sınav Geçmişini Veritabanından TAMAMEN Sil
            // Bu işlem Exams sayfasındaki sınavların "Browse" sekmesine dönmesini sağlar.

            // First check if they have any results at all
            const { count: existingCount } = await supabase
                .from('exam_results')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { error: deleteExamError, count } = await supabase
                .from('exam_results')
                .delete({ count: 'exact' })
                .eq('user_id', user.id);

            if (deleteExamError) {
                console.error('Sınav kayıtları silinirken hata oluştu:', deleteExamError);
                throw new Error(`Sınav ilerlemeleri silinemedi: ${deleteExamError.message}`);
            } else {
                console.log(`${count} adet sınav kaydı kalıcı olarak silindi.`);
                if (existingCount && existingCount > 0 && count === 0) {
                    // This means they have results, but the delete policy blocked it!
                    alert('UYARI: Sınav ilerlemeleriniz silinemedi! Bu durum büyük ihtimalle Supabase veritabanınızda "exam_results" tablosu için DELETE (Silme) RLS Policy ayarlarının eksik olmasından kaynaklanmaktadır. Lütfen Supabase panelinden "exam_results" tablosu için kullanıcıların kendi verilerini silebilmesine (Delete - user_id = auth.uid()) izin verin.');
                }
            }

            console.log('--- SIFIRLAMA TAMAMLANDI ---');
            alert('Hesabınız başarıyla sıfırlandı. Tüm sınav sonuçlarınız veritabanından kalıcı olarak silindi ve ders ilerlemeleriniz temizlendi. Artık tüm sınavları tekrar çözebilirsiniz.');

            // Verilerin taze çekilmesi için uygulamayı kökten yenile
            window.location.href = '/';
        } catch (error: any) {
            console.error('Sıfırlama hatası:', error);
            alert(`Sıfırlama işlemi başarısız oldu: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const userMetadata = user?.user_metadata;

    return (
        <AuthContext.Provider value={{ user, userMetadata, role, loading, signIn, signUp, signOut, updateProfile, resetProgress }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
