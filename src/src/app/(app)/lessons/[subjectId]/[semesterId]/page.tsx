

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Book, Download, FileText, FileVideo, CheckCircle, PencilRuler, Users, Milestone, BookA, Search } from 'lucide-react';
import { getSubjectById, getLessonsBySemesterId, getSemesterById, getTopicsBySemesterId, getCompletedLessonsForUser, getHistoricalDates, getHistoricalPersonalities, getTerminology, type HistoricalDate, type HistoricalPersonality, type TerminologyItem } from '@/lib/services/lessons';
import LessonsLoading from '../../../lessons/loading';
import Link from 'next/link';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import type { Topic, Lesson, Article, Subject, Semester } from '@/lib/data';
import { auth } from '@/lib/firebase/config';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import CustomLoader from '@/components/ui/custom-loader';
import { Input } from '@/components/ui/input';


function TopicList({ topics }: { topics: Topic[] }) {
    if (topics.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">لا توجد مواضيع متاحة حاليًا.</p>;
    }

    const assignments = topics.filter(t => t.type === 'assignment');
    const exams = topics.filter(t => t.type === 'exam');

    return (
        <Accordion type="multiple" className="w-full space-y-2">
            {assignments.length > 0 && (
                 <AccordionItem value="assignments" className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary"/>
                            الفروض
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-3">
                         {assignments.map(topic => (
                            <div key={topic.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg">
                                <span className="font-semibold">{topic.title}</span>
                                <Button asChild>
                                    <Link href={topic.downloadUrl} target="_blank" rel="noopener noreferrer">
                                        تحميل
                                        <Download className="mr-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
             {exams.length > 0 && (
                 <AccordionItem value="exams" className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-3">
                            <FileVideo className="h-5 w-5 text-primary"/>
                            الامتحانات
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-3">
                         {exams.map(topic => (
                            <div key={topic.id} className="flex items-center justify-between p-3 bg-card-foreground/5 rounded-lg">
                                <span className="font-semibold">{topic.title}</span>
                                <Button asChild>
                                    <Link href={topic.downloadUrl} target="_blank" rel="noopener noreferrer">
                                        تحميل
                                        <Download className="mr-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
    )
}

function SemesterDetailsComponent({ subjectId, semesterId }: { subjectId: string; semesterId: string }) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [semester, setSemester] = useState<Omit<Semester, 'lessons' | 'subjectId'> & { subjectId: string } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Social studies specific state
  const [historicalDates, setHistoricalDates] = useState<HistoricalDate[]>([]);
  const [historicalPersonalities, setHistoricalPersonalities] = useState<HistoricalPersonality[]>([]);
  const [terminology, setTerminology] = useState<TerminologyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');


  const isSocialStudies = subjectId === 'history' || subjectId === 'geography';
  const isHistory = subjectId === 'history';
  const isGeography = subjectId === 'geography';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if(currentUser) {
            getCompletedLessonsForUser(currentUser.uid).then(setCompletedLessons);
        }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjectData, semesterData, lessonsData] = await Promise.all([
                getSubjectById(subjectId),
                getSemesterById(subjectId, semesterId),
                getLessonsBySemesterId(semesterId),
            ]);

            setSubject(subjectData);
            setSemester(semesterData);
            setLessons(lessonsData);

            // Fetch topics for social studies combined, or for the specific subject otherwise
            let topicsData: Topic[] = [];
            if (isSocialStudies) {
                const historySemesterId = semesterId.replace('geography', 'history');
                const geographySemesterId = semesterId.replace('history', 'geography');

                const [historyTopics, geographyTopics] = await Promise.all([
                    getTopicsBySemesterId(historySemesterId),
                    getTopicsBySemesterId(geographySemesterId),
                ]);
                
                const combinedTopics = [...historyTopics, ...geographyTopics];
                const uniqueTopics = Array.from(new Map(combinedTopics.map(item => [item.title, item])).values());
                topicsData = uniqueTopics.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

            } else {
                topicsData = await getTopicsBySemesterId(semesterId);
            }
            setTopics(topicsData);

            // Fetch social studies specific content
            if (isHistory) {
                const [dates, personalities, terms] = await Promise.all([
                    getHistoricalDates('history'),
                    getHistoricalPersonalities('history'),
                    getTerminology('history'),
                ]);
                setHistoricalDates(dates);
                setHistoricalPersonalities(personalities);
                setTerminology(terms);
            }
            if (isGeography) {
                const terms = await getTerminology('geography');
                setTerminology(terms);
            }

        } catch (error) {
            console.error("Failed to fetch semester details", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchData();
    return () => unsubscribe();
  }, [subjectId, semesterId, isSocialStudies, isHistory, isGeography]);

  const filteredDates = useMemo(() => 
    historicalDates.filter(d => 
        d.year.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.event.toLowerCase().includes(searchQuery.toLowerCase())
    ), [historicalDates, searchQuery]);

  const filteredPersonalities = useMemo(() => 
    historicalPersonalities.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.definition.toLowerCase().includes(searchQuery.toLowerCase())
    ), [historicalPersonalities, searchQuery]);

  const filteredTerminology = useMemo(() => 
    terminology.filter(t => 
        t.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.definition.toLowerCase().includes(searchQuery.toLowerCase())
    ), [terminology, searchQuery]);


  if (loading) {
    return <LessonsLoading />;
  }

  if (!subject || !semester) {
    return (
      <div className="text-center py-10" dir="rtl">
        <h2 className="text-2xl font-bold">لم يتم العثور على الفصل الدراسي</h2>
      </div>
    );
  }

  const isPhilosophy = subjectId === 'philosophy';
  
  return (
    <div className="animate-in fade-in-50" dir="rtl">
      <header className="mb-8 text-center">
            <h1 className="text-2xl font-headline font-bold">{subject.name}</h1>
            <p className="text-muted-foreground">{semester.name}</p>
      </header>

      <div className="space-y-8">
        {/* Lessons Section */}
        <div>
            <h2 className="text-xl font-bold text-center mb-4 text-primary">الدروس</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
            {lessons && lessons.length > 0 ? (
                lessons.map((lesson, index) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const hasArticles = isPhilosophy && lesson.articles && lesson.articles.length > 0;

                  return (
                      <AccordionItem key={lesson.id} value={`item-${index}`} className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                              <div className="flex items-center gap-3">
                                  <Book className="h-5 w-5 text-primary"/>
                                  <span className={cn(isCompleted && 'line-through text-muted-foreground')}>{lesson.title}</span>
                                  {isCompleted && <CheckCircle className="h-5 w-5 text-yellow-400" />}
                              </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-4">
                              {hasArticles ? (
                                  <div className="space-y-2 pl-6">
                                      <h4 className="font-semibold text-muted-foreground mb-2">المقالات</h4>
                                      {lesson.articles?.map(article => (
                                          <Link key={article.id} href={`/lesson/${lesson.id}?articleId=${article.id}`} passHref>
                                              <Button variant="ghost" className="w-full justify-start">
                                                  <PencilRuler className="ml-2 h-4 w-4"/>
                                                  {article.title}
                                              </Button>
                                          </Link>
                                      ))}
                                  </div>
                              ) : (
                                  <div className="text-center">
                                      <p className="text-base text-muted-foreground mb-4">هذا ملخص بسيط للدرس يمكنك عرض الدرس الكامل.</p>
                                      <Link href={`/lesson/${lesson.id}`} passHref>
                                          <Button className='rounded-xl'>
                                              عرض الدرس
                                              <ArrowLeft className="mr-2 h-4 w-4"/>
                                          </Button>
                                      </Link>
                                  </div>
                              )}
                          </AccordionContent>
                      </AccordionItem>
                  )
                })
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                <p>لا توجد دروس متاحة في هذا الفصل حاليًا.</p>
                </div>
            )}
            </Accordion>
        </div>
        
        {/* Topics Section */}
        <div>
            <h2 className="text-xl font-bold text-center mb-4 text-primary">
                {isSocialStudies ? 'مواضيع الاجتماعيات' : 'المواضيع'}
            </h2>
            <TopicList topics={topics} />
        </div>

        {/* History & Geography Extra Sections */}
        {(isHistory || isGeography) && (
            <div>
                <h2 className="text-xl font-bold text-center mb-4 text-primary">مراجع إضافية</h2>
                <div className="relative mb-4">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="ابحث في التواريخ، الشخصيات والمصطلحات..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-10"
                    />
                </div>

                <Accordion type="multiple" className="w-full space-y-2">
                    {/* Terminology */}
                    <AccordionItem value="terms" className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex items-center gap-3">
                                <BookA className="h-5 w-5 text-primary"/>
                                المصطلحات
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4 space-y-2 max-h-80 overflow-y-auto">
                            {filteredTerminology.length > 0 ? filteredTerminology.map(term => (
                                <Card key={term.id} className="p-3 bg-card-foreground/5">
                                    <p className="font-bold text-primary">{term.term}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{term.definition}</p>
                                </Card>
                            )) : <p className="text-center text-muted-foreground py-4">لا توجد مصطلحات تطابق بحثك.</p>}
                        </AccordionContent>
                    </AccordionItem>
                    
                    {/* Dates (History only) */}
                    {isHistory && (
                         <AccordionItem value="dates" className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Milestone className="h-5 w-5 text-primary"/>
                                    التواريخ
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 space-y-2 max-h-80 overflow-y-auto">
                                {filteredDates.length > 0 ? filteredDates.map(date => (
                                    <Card key={date.id} className="p-3 bg-card-foreground/5">
                                        <p className="font-bold text-primary">{date.year}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{date.event}</p>
                                    </Card>
                                )) : <p className="text-center text-muted-foreground py-4">لا توجد تواريخ تطابق بحثك.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Personalities (History only) */}
                    {isHistory && (
                         <AccordionItem value="personalities" className="bg-card/80 border border-border/60 shadow-md rounded-2xl px-4">
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-primary"/>
                                    الشخصيات
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 space-y-2 max-h-80 overflow-y-auto">
                               {filteredPersonalities.length > 0 ? filteredPersonalities.map(p => (
                                    <Card key={p.id} className="p-3 bg-card-foreground/5">
                                        <p className="font-bold text-primary">{p.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{p.definition}</p>
                                    </Card>
                                )) : <p className="text-center text-muted-foreground py-4">لا توجد شخصيات تطابق بحثك.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    )}
                </Accordion>
            </div>
        )}

      </div>
    </div>
  );
}


export default function SemesterPage({ params }: { params: { subjectId: string; semesterId: string } }) {
  const { subjectId, semesterId } = params;

  return (
    <Suspense fallback={<LessonsLoading />}>
      <SemesterDetailsComponent subjectId={subjectId} semesterId={semesterId} />
    </Suspense>
  );
}
