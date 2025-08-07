"use client";
export const dynamic = "force-dynamic";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, BookOpen, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { listenToArticles, addArticle } from "@/services/knowledgeBaseService";
import { type KnowledgeBaseArticle as Article } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogHeaderDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";


export default function KnowledgeBasePage() {
    const [articles, setArticles] = React.useState<Article[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isAddArticleOpen, setIsAddArticleOpen] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const unsubscribe = listenToArticles((fetchedArticles) => {
            setArticles(fetchedArticles);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddArticleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const title = formData.get("title") as string;
        
        const newArticleData: Omit<Article, 'id' | 'slug'> = {
            title,
            category: formData.get("category") as string,
            summary: formData.get("summary") as string,
            content: formData.get("content") as string,
        };

        try {
            await addArticle(newArticleData);
            toast({ title: "Success", description: "Article created successfully." });
            setIsAddArticleOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create article.", variant: "destructive" });
        }
    };

    return (
    <AppShell>
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground">Find guides, tutorials, and answers to your questions.</p>
                </div>
                 <Button onClick={() => setIsAddArticleOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Article
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search articles..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <Card>
                <CardContent className="pt-6">
                     {isLoading ? (
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Card key={index} className="h-full">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-5 w-3/4" />
                                                <Skeleton className="h-4 w-1/2" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {filteredArticles.length > 0 ? filteredArticles.map((article) => (
                                <Link href={`/knowledge-base/${article.slug}`} key={article.id} className="group">
                                    <Card className="h-full hover:border-primary transition-all">
                                        <CardHeader>
                                            <div className="flex items-center gap-4">
                                                <div className="bg-primary/10 p-2 rounded-lg">
                                                    <BookOpen className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{article.title}</CardTitle>
                                                    <CardDescription className="text-sm">{article.category}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-3">{article.summary}</p>
                                            <div className="flex items-center justify-end text-sm font-medium text-primary mt-4 group-hover:underline">
                                                Read more
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )) : (
                                <p className="text-muted-foreground md:col-span-3 text-center py-8">No articles found matching your search.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Article</DialogTitle>
                    <DialogHeaderDescription>Fill in the details for your new knowledge base article.</DialogHeaderDescription>
                </DialogHeader>
                <form onSubmit={handleAddArticleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" name="title" placeholder="e.g. How to Onboard a New Client" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" placeholder="e.g. Client Management" required />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="summary">Summary</Label>
                        <Textarea id="summary" name="summary" placeholder="A short summary of the article." required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content">Content</Label>
                        <Textarea id="content" name="content" placeholder="Write the full article content here. You can use Markdown." className="min-h-48" required />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Create Article</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    </AppShell>
  );
}
