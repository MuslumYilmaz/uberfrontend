export interface User {
    _id: string;
    username: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
}