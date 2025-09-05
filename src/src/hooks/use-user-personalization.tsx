
'use client';

import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

type Gender = 'male' | 'female' | null;

interface PersonalizationContextType {
    user: User | null;
    gender: Gender;
    loading: boolean;
    isFemale: boolean;
    isMale: boolean;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [gender, setGender] = useState<Gender>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                setGender(null);
                 document.body.classList.remove('theme-female');
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (user) {
            const progressRef = doc(db, 'progress', user.uid);
            const unsubscribeFirestore = onSnapshot(progressRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const userGender = data.gender || null;
                    setGender(userGender);
                    
                    if (userGender === 'female') {
                        document.body.classList.add('theme-female');
                    } else {
                        document.body.classList.remove('theme-female');
                    }
                } else {
                    // Handle case where progress doc might not exist yet
                    setGender(null);
                    document.body.classList.remove('theme-female');
                }
                setLoading(false);
            }, (error) => {
                console.error("Failed to listen to user progress:", error);
                setLoading(false);
                setGender(null);
            });

            return () => unsubscribeFirestore();
        }
    }, [user]);

    const value = useMemo(() => ({
        user,
        gender,
        loading,
        isFemale: gender === 'female',
        isMale: gender === 'male' || gender === null, // Default to male if not set
    }), [user, gender, loading]);

    return (
        <PersonalizationContext.Provider value={value}>
            {children}
        </PersonalizationContext.Provider>
    );
}

export function useUserPersonalization() {
    const context = useContext(PersonalizationContext);
    if (context === undefined) {
        throw new Error('useUserPersonalization must be used within a PersonalizationProvider');
    }
    return context;
}
