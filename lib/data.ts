import * as fs from 'fs';
import * as path from 'path';
import { Post } from '@/types/Post';

const postsFilePath = path.join(process.cwd(), 'data', 'posts.json');
const initialPosts: Post[] = [];

if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}
if (!fs.existsSync(postsFilePath)) {
  fs.writeFileSync(postsFilePath, JSON.stringify(initialPosts, null, 2));
}

export function getPosts(): Post[] {
  try {
    const data = fs.readFileSync(postsFilePath, 'utf-8');
    return JSON.parse(data) as Post[];
  } catch (error) {
    console.error('Failed to read posts file:', error);
    return [];
  }
}

export function addPost(newPostData: Omit<Post, 'id' | 'likes' | 'userName'>): Post {
  const posts = getPosts();
  const newId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;

  const newPost: Post = {
    ...newPostData,
    id: newId,
    userName: 'Guest User',
    likes: 0,
  };

  posts.unshift(newPost);
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
  return newPost;
}