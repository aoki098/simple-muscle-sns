// lib/data.ts
import * as fs from 'fs';
import * as path from 'path';
import { Post } from '@/types/Post';

// 投稿データを保存するファイルのパス
const postsFilePath = path.join(process.cwd(), 'data', 'posts.json');

// 初期データを含む空の投稿リスト
const initialPosts: Post[] = [];

// 投稿データファイルが存在しない場合は作成
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}
if (!fs.existsSync(postsFilePath)) {
  fs.writeFileSync(postsFilePath, JSON.stringify(initialPosts, null, 2));
}


/**
 * すべての投稿を取得します (GET)
 */
export function getPosts(): Post[] {
  try {
    const data = fs.readFileSync(postsFilePath, 'utf-8');
    return JSON.parse(data) as Post[];
  } catch (error) {
    console.error('Failed to read posts file:', error);
    return [];
  }
}

/**
 * 新しい投稿を追加します (POST)
 */
export function addPost(newPostData: Omit<Post, 'id' | 'likes' | 'userName'>): Post {
  const posts = getPosts();
  
  // IDを生成 (最も大きなID + 1)
  const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;

  // 実際のユーザー名と初期いいね数でPostオブジェクトを作成
  const newPost: Post = {
    ...newPostData,
    id: newId,
    userName: 'Guest User', // 認証機能がないため仮のユーザー名
    likes: 0,
  };

  posts.unshift(newPost); // リストの先頭に追加

  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
  return newPost;
}