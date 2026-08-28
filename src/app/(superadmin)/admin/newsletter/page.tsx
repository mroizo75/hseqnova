"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Loader2, Users, Send, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  publishedAt: string | null;
  coverImage: string | null;
}

interface NewsletterStats {
  totalSubscribers: number;
  lastSentAt: string | null;
}

export default function AdminNewsletterPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const postsRes = await fetch("/api/admin/blog");
      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        const publishedPosts = allPosts.filter((p: BlogPost) => p.status === "PUBLISHED");
        setPosts(publishedPosts);
      }

      const statsRes = await fetch("/api/admin/newsletter/send");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePost = (postId: string) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSendNewsletter = async () => {
    if (selectedPosts.length === 0) {
      toast({
        title: "No articles selected",
        description: "Select at least one article to send",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Send newsletter with ${selectedPosts.length} article(s) to ${stats?.totalSubscribers || 0} subscribers?`)) {
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postIds: selectedPosts }),
      });

      if (!res.ok) {
        throw new Error("Failed to send newsletter");
      }

      const result = await res.json();

      toast({
        title: "Newsletter sent!",
        description: `${result.successCount} emails sent to subscribers`,
      });

      setSelectedPosts([]);
      fetchData();
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Error!",
        description: "Could not send newsletter",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <p className="text-muted-foreground mt-2">
            Send blog articles to all newsletter subscribers
          </p>
        </div>
        <Button
          onClick={handleSendNewsletter}
          disabled={selectedPosts.length === 0 || isSending}
          size="lg"
        >
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Send newsletter ({selectedPosts.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscribers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active newsletter subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastSentAt
                ? format(new Date(stats.lastSentAt), "dd/MM/yyyy", { locale: enGB })
                : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSentAt
                ? format(new Date(stats.lastSentAt), "HH:mm", { locale: enGB })
                : "No newsletters sent yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected articles</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              Articles in next dispatch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select articles to send</CardTitle>
          <CardDescription>
            Select one or more published articles to include in the newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No published articles</h3>
              <p className="text-muted-foreground">
                Publish some articles before sending a newsletter
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPosts.length === posts.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPosts(posts.map((p) => p.id));
                        } else {
                          setSelectedPosts([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedPosts.includes(post.id)}
                        onCheckedChange={() => handleTogglePost(post.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {post.title}
                      {post.coverImage && (
                        <Badge variant="secondary" className="ml-2">
                          Image
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                      {post.excerpt}
                    </TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? format(new Date(post.publishedAt), "dd/MM/yyyy", { locale: enGB })
                        : "Not published"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Info */}
      {selectedPosts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Recipients:</strong> {stats?.totalSubscribers || 0} subscribers
              </p>
              <p className="text-sm">
                <strong>Subject:</strong> HSEQ Nova: {posts.find((p) => p.id === selectedPosts[0])?.title}
              </p>
              <p className="text-sm">
                <strong>Articles:</strong> {selectedPosts.length}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: The newsletter will contain article summaries with links to the full articles on the website.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
