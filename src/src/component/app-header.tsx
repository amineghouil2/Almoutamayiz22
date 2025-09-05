
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bell, Star, Settings, LogOut, ImageIcon, User as UserIcon, AlertCircle, Trash2, Upload, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { getNotificationsForUser, deleteNotification as deleteUserNotification } from '@/lib/services/notifications';
import type { Notification } from '@/lib/services/notifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getUserProgress, getStarLevel } from '@/lib/services/progress';
import { cn } from '@/lib/utils';
import CustomLoader from '@/components/ui/custom-loader';


const avatars = [
  { src: 'https://i.ibb.co/v4kNXt9M/images-1.png', alt: 'شاب 1' },
  { src: 'https://i.ibb.co/jvx9kb7k/memoji-emoji-bel-homme-souriant-fond-blanc-826801-6987.png', alt: 'شاب 2' },
  { src: 'https://i.ibb.co/qScjTrs/images-2.png', alt: 'شاب 3' },
  { src: 'https://i.ibb.co/601CGSvj/IMG-20250715-134727.png', alt: 'شابة 1' },
  { src: 'https://i.ibb.co/whk1cFWb/IMG-20250715-134656.png', alt: 'شابة 2' },
];

const LAST_SEEN_NOTIF_KEY = 'lastSeenNotificationTimestamp';

function NotificationMenu({ user }: { user: User | null }) {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [hasNew, setHasNew] = React.useState(false);
    const [isClient, setIsClient] = React.useState(false);
    const { toast } = useToast();
    const router = useRouter();

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    React.useEffect(() => {
        if (!user || !isClient) return;
        const checkNew = async () => {
            try {
                const latestNotifs = await getNotificationsForUser(user.uid, 1);
                if (latestNotifs.length > 0 && latestNotifs[0].createdAt) {
                    const lastSeenTimestamp = localStorage.getItem(`${LAST_SEEN_NOTIF_KEY}_${user.uid}`);
                    const latestTimestamp = new Date(latestNotifs[0].createdAt).getTime();
                    if (!lastSeenTimestamp || latestTimestamp > parseInt(lastSeenTimestamp, 10)) {
                        setHasNew(true);
                    }
                }
            } catch (e) {
                console.error("Failed to check for new notifications", e);
            }
        };
        checkNew();
    }, [user, isClient]);

    const handleFetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const fetchedNotifications = await getNotificationsForUser(user.uid);
            setNotifications(fetchedNotifications);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "فشل تحميل الإشعارات.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent the collapsible from opening
        try {
            await deleteUserNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast({ title: 'تم حذف الإشعار بنجاح' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل حذف الإشعار.' });
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (open && user) {
            handleFetchNotifications();
            setHasNew(false);
            localStorage.setItem(`${LAST_SEEN_NOTIF_KEY}_${user.uid}`, new Date().getTime().toString());
        }
    };

    const formatNotificationDate = (date: Date) => {
        if (!isClient) return null;
        return formatDistanceToNow(date, { addSuffix: true, locale: ar });
    };

    const handleNotificationClick = (notif: Notification) => {
        if (notif.actionURL) {
            router.push(notif.actionURL);
        }
    }

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {hasNew && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                    )}
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">الإشعارات</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end" dir="rtl">
                <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-2 space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : error ? (
                        <div className="p-2 flex items-center gap-2 text-destructive">
                           <AlertCircle className="text-destructive"/>
                           <span>{error}</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            لا توجد إشعارات جديدة.
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className="group/notif relative hover:bg-accent/50 rounded-md" onClick={() => handleNotificationClick(notif)}>
                                <Collapsible className="px-2 py-1.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <CollapsibleTrigger className="flex-1 text-right cursor-pointer">
                                            <p className="font-semibold text-sm">{notif.title}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {notif.content}
                                            </p>
                                        </CollapsibleTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CollapsibleContent className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap border-t pt-2">
                                        {notif.content}
                                    </CollapsibleContent>
                                    <p className="text-xs text-muted-foreground text-left mt-1 px-1">
                                        {notif.createdAt ? formatNotificationDate(new Date(notif.createdAt)) : ''}
                                    </p>
                                </Collapsible>
                            </div>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StarRating({ level }: { level: number }) {
    if (level === 0) return null;
    return (
        <div className="absolute -top-1 inset-x-0 h-4 flex justify-center items-center">
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-3 w-3 text-gray-500",
                            i < level && "text-yellow-400 fill-yellow-400"
                        )}
                        style={{
                            transform: `rotate(${(i - 2) * 15}deg) translateY(-2px)`,
                            marginLeft: '-2px',
                            marginRight: '-2px',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function UserProfile({user, onLogout, onAvatarChange, onAvatarUpload}: {user: User, onLogout: () => void, onAvatarChange: (src: string) => void, onAvatarUpload: (file: File) => void}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [userPoints, setUserPoints] = React.useState(0);

  React.useEffect(() => {
    getUserProgress(user.uid).then(progress => {
        setUserPoints(progress.totalPoints);
    });
  }, [user.uid]);

  const handleFileSelect = () => {
      fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onAvatarUpload(file);
      }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <StarRating level={getStarLevel(userPoints)} />
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName || 'User'} />
                <AvatarFallback>
                <UserIcon className="h-4 w-4" />
                </AvatarFallback>
            </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1" dir="rtl">
            <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0] || 'المستخدم'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         <DropdownMenuItem asChild dir="rtl">
          <Link href="/leaderboard" className="w-full flex items-center">
            <Trophy className="ml-2 h-4 w-4" />
            <span>لائحة المتقدمين</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger dir="rtl">
            <ImageIcon className="ml-2 h-4 w-4" />
            <span>تغيير الأفاتار</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {avatars.map((avatar) => (
                <DropdownMenuItem key={avatar.src} onClick={() => onAvatarChange(avatar.src)}>
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={avatar.src} alt={avatar.alt} />
                    <AvatarFallback>{avatar.alt.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{avatar.alt}</span>
                </DropdownMenuItem>
              ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFileSelect}>
                    <Upload className="ml-2 h-4 w-4" />
                    <span>رفع صورة من الجهاز</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                    />
                </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem asChild dir="rtl">
          <Link href="/settings" className="w-full flex items-center">
            <Settings className="ml-2 h-4 w-4" />
            <span>إعدادات الحساب</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem dir="rtl" onClick={onLogout}>
          <LogOut className="ml-2 h-4 w-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppHeader() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    document.documentElement.classList.add('dark');
    return () => unsubscribe();
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'تم تسجيل الخروج بنجاح',
      });
      router.push('/');
    } catch (error) {
      console.error('Logout Error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.',
      });
    }
  };

  const handleAvatarChange = async (avatarSrc: string) => {
      if (auth.currentUser) {
          try {
              await updateProfile(auth.currentUser, { photoURL: avatarSrc });
              setUser(auth.currentUser ? {...auth.currentUser} : null);
              toast({ title: 'تم تغيير الأفاتار بنجاح' });
          } catch(e) {
              console.error(e);
              toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تغيير الأفاتار.'});
          }
      }
  }
  
  const handleAvatarUpload = async (file: File) => {
        if (!auth.currentUser) return;
        
        toast({ title: 'جاري رفع الصورة...', description: 'قد يستغرق هذا بضع لحظات.' });
        
        const storageRef = ref(storage, `avatars/${auth.currentUser.uid}/${file.name}`);
        
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            await handleAvatarChange(downloadURL); // Reuse the same update logic
            
        } catch (error) {
            console.error("Avatar upload error:", error);
            toast({
                variant: 'destructive',
                title: 'خطأ في رفع الصورة',
                description: 'فشل رفع الصورة. تأكد من أن حجمها أقل من 1 ميجابايت.',
            });
        }
    };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex-1 flex justify-start">
            {authLoading && <Skeleton className="h-8 w-8 rounded-full" />}
            {!authLoading && user && (
              <UserProfile 
                user={user} 
                onLogout={handleLogout} 
                onAvatarChange={handleAvatarChange} 
                onAvatarUpload={handleAvatarUpload}
              />
            )}
        </div>
        
        <div className="flex-1 flex justify-center">
            <Image src="https://i.ibb.co/bjLDwBbd/IMG-20250722-114332.png" alt="المتميز Logo" width={110} height={38} />
        </div>

        <div className="flex-1 flex justify-end">
          <NotificationMenu user={user} />
        </div>
      </div>
    </header>
  );
}
