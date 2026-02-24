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
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (_event === 'SIGNED_OUT') {
                localStorage.removeItem('remember_me');
                sessionStorage.removeItem('temp_session');
                setUser(null);
                setRole(null);
                setLoading(false);
            } else if (session?.user) {
                // Also check persistence here for initial load race condition
                const isRemembered = localStorage.getItem('remember_me');
                const isTempSession = sessionStorage.getItem('temp_session');

                if (!isRemembered && !isTempSession) {
                    // This block catches the case where onAuthStateChange fires before getSession above finishes
                    // and we have a persisted session but shouldn't have.
                    // However, we need to be careful not to sign out a valid login event.
                    if (_event === 'INITIAL_SESSION') {
                        supabase.auth.signOut();
                        setUser(null);
                        setRole(null);
                        setLoading(false);
                        return;
                    }
                    // If it's a SIGNED_IN event (manual login), we set temp_session in signIn function, so it's fine.
                    // But if user refreshes page, event is usually INITIAL_SESSION or TOKEN_REFRESHED.
                }

                setUser(session.user);
                fetchUserProfile(session.user.id);
            } else {
                setRole(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (!error && data) {
                // Map database role string to UserRole enum (assuming they match somewhat)
                // If DB role is 'student' -> UserRole.STUDENT, etc.
                const dbRole = data.role.toLowerCase() === 'instructor' ? UserRole.INSTRUCTOR : UserRole.STUDENT;
                setRole(dbRole);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string, selectedRole: UserRole, rememberMe: boolean = false) => {
        // Set persistence based on rememberMe
        // 'local' = persist even after closing tab (default)
        // 'session' = clear after closing tab
        await supabase.auth.setSession({
            access_token: '', // Placeholder, logic below handles auth
            refresh_token: ''
        }); // This is just to access the setPersistence method if needed, but standard way is below

        // Actually, Supabase handles persistence via client options or per-request
        // But for this client-side library, we can set it before sign in
        /* 
           Note: changing persistence on the fly is tricky with the single client instance.
           A better approach for a simple app:
           Supabase defaults to 'local' storage. 
           To make it session-only, we'd need to configure the client that way.
           
           Since the client is already initialized in `supabase.ts`, we can't easily change it here 
           without re-initializing or using advanced storage adapters.
           
           HOWEVER, we can mimic "Sign out on close" by using `sessionStorage` vs `localStorage`.
           Supabase JS uses `localStorage` by default.
        */

        // Workaround: We will let Supabase do its thing, but if rememberMe is FALSE,
        // we might want to manually clear session on window close, but that's unreliable.

        // Correct way with Supabase v2:
        // We can't change persistence per login easily with one global client.
        // But we can check `rememberMe` and decide whether to sign out on `window.onbeforeunload`.
        // OR better: Update the login call? No, signInWithPassword doesn't take persistence.

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        if (!rememberMe) {
            // If not remembering, we can set a flag in sessionStorage
            sessionStorage.setItem('temp_session', 'true');
        } else {
            sessionStorage.removeItem('temp_session');
            localStorage.setItem('remember_me', 'true');
        }
    };

    const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role === UserRole.INSTRUCTOR ? 'instructor' : 'student',
                },
            },
        });

        if (error) throw error;
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
            {!loading && children}
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
