import { supabase } from '@/lib/supabase';
import type { KnowledgeBaseArticle as Article } from '@/lib/types';

const TABLE = 'knowledge-base';

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

export function listenToArticles(callback: (articles: Article[]) => void): () => void {
  const channel = supabase
    .channel('public:knowledge-base')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, async () => {
      const { data } = await supabase.from(TABLE).select('*');
      callback(data ?? []);
    })
    .subscribe();

  supabase
    .from(TABLE)
    .select('*')
    .then(({ data }: { data: Article[] | null }) => callback(data ?? []));

  return () => supabase.removeChannel(channel);
}

export async function addArticle(articleData: Omit<Article, 'id' | 'slug'>): Promise<Article> {
  const slug = createSlug(articleData.title);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...articleData, slug })
    .select()
    .single();
  if (error) {
    console.error('Error adding article: ', error);
    throw new Error('Failed to add article.');
  }
  return data!;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('Error fetching article by slug: ', error);
    throw new Error('Could not fetch article.');
  }
  return data;
}

export async function updateArticle(article: Article): Promise<void> {
  const newSlug = createSlug(article.title);
  const { error } = await supabase
    .from(TABLE)
    .update({ ...article, slug: newSlug })
    .eq('id', article.id);
  if (error) {
    console.error('Error updating article: ', error);
    throw new Error('Failed to update article.');
  }
}

export async function deleteArticle(articleId: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('id', articleId);
  if (error) {
    console.error('Error deleting article: ', error);
    throw new Error('Failed to delete article.');
  }
}
