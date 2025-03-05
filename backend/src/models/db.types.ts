export interface User {
    id: string;
    princeton_id: string;
    name: string | null;
    email: string;
    created_at: Date;
}

export interface Pattern {
    id: string;
    name: string;
    description: string;
    category: string;
    created_at: Date;
}

export interface Question {
    id: string;
    pattern_id: string;
    title: string;
    description: string;
    difficulty: string;
    created_at: Date;
}

export interface UserProgress {
    id: string;
    user_id: string;
    question_id: string;
    status: string;
    last_attempted: Date;
}

export interface Submission {
    id: string;
    user_id: string;
    question_id: string;
    code: string;
    language: string;
    status: string;
    created_at: Date;
}

export interface Leaderboard {
    id: string;
    user_id: string;
    score: number;
    last_updated: Date;
}

export interface Media {
    id: string;
    entity_type: string;
    entity_id: string;
    media_type: string;
    file_path: string;
    original_name: string | null;
    content_type: string;
    created_at: Date;
}
