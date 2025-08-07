"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getArticleBySlug, deleteArticle } from "@/services/knowledgeBaseService";
import { type KnowledgeBaseArticle as Article } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from "react-markdown";

export default function ArticlePage({ params }: any) {
  const [article, setArticle] = React.useState<Article | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchArticle() {
      setIsLoading(true);
      try {
        const fetchedArticle = await getArticleBySlug(params.slug);
        setArticle(fetchedArticle);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch article.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticle();
  }, [params.slug, toast]);

  const handleDelete = async () => {
    if (!article) return;
    try {
      await deleteArticle(article.id);
      toast({
        title: "Article Deleted",
        description: `The article "${article.title}" has been removed.`,
      });
      router.push("/knowledge-base");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete article.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (!article) {
    return (
      <AppShell>
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <p className="text-muted-foreground">The article you are looking for does not exist.</p>
          <Button asChild className="mt-4">
            <Link href="/knowledge-base">Back to Knowledge Base</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleEdit = () => {
    router.push(`/knowledge-base/edit/${article.slug}`);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/knowledge-base">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Knowledge Base
            </Link>
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <Badge variant="secondary" className="mb-2">
                {article.category}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">{article.title}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="prose dark:prose-invert max-w-none pt-6 text-base">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
