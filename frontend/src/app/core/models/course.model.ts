export type LessonType = 'reading' | 'coding';

export interface Lesson {
    id: string;
    title: string;
    type: LessonType;     // 'reading' | 'coding'
    ref?: string;         // e.g. coding question id, or article slug
    summary?: string;
}

export interface Topic {
    id: string;
    title: string;
    lessons: Lesson[];
}

export interface Course {
    id: string;
    title: string;
    subtitle?: string;
    description?: string;
    hero?: string;        // optional image url
    topics: Topic[];
}