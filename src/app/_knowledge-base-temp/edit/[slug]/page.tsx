
"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { type KnowledgeBaseArticle as Article } from "@/lib/types";
import { getArticleBySlug, updateArticle } from "@/services/knowledgeBaseService";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditArticlePage({ params }: { params: { slug: string } }) {
    const [article, setArticle] = React.useState<Article | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const router = useRouter();
    const { toast } = useToast();

    React.useEffect(() => {
        async function fetchArticle() {
            setIsLoading(true);
            try {
                const fetchedArticle = await getArticleBySlug(params.slug);
                setArticle(fetchedArticle);
            } catch (error) {
                toast({ title: "Error", description: "Could not fetch article.", variant: "destructive" });
                router.push("/knowledge-base");
            } finally {
                setIsLoading(false);
            }
        }
        fetchArticle();
    }, [params.slug, toast, router]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!article) return;

        const formData = new FormData(event.currentTarget);
        
        const updatedArticleData: Article = {
            ...article,
            title: formData.get("title") as string,
            category: formData.get("category") as string,
            summary: formData.get("summary") as string,
            content: formData.get("content") as string,
        };

        try {
            await updateArticle(updatedArticleData);
            toast({ title: "Success", description: "Article updated successfully." });
            router.push(`/knowledge-base/${updatedArticleData.slug}`);
        } catch (error) {
            toast({ title: "Error", description: "Failed to update article.", variant: "destructive" });
        }
    };
    
    if (isLoading) {
        return (
            <AppShell>
                 <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-48" />
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                         <Skeleton className="h-10 w-24 ml-auto" />
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
                    <p className="text-muted-foreground">The article you are trying to edit does not exist.</p>
                    <Button asChild className="mt-4">
                        <Link href="/knowledge-base">Back to Knowledge Base</Link>
                    </Button>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <div>
                     <Button variant="ghost" asChild className="mb-4">
                        <Link href={`/knowledge-base/${article.slug}`}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back to Article
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Article</h1>
                    <p className="text-muted-foreground">Make changes to your article.</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" defaultValue={article.title} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Input id="category" name="category" defaultValue={article.category} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Textarea id="summary" name="summary" defaultValue={article.summary} required className="min-h-24" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea id="content" name="content" defaultValue={article.content} required className="min-h-64" />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
