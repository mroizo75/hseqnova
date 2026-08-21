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
import { nb } from "date-fns/locale";
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
      
      // Fetch published posts
      const postsRes = await fetch("/api/admin/blog");
      if (postsRes.ok) {
        const allPosts = await postsRes.json();
        const publishedPosts = allPosts.filter((p: BlogPost) => p.status === "PUBLISHED");
        setPosts(publishedPosts);
      }

      // Fetch newsletter stats
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
        title: "Ingen artikler valgt",
        description: "Velg minst én artikkel å sende",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Send nyhetsbrev med ${selectedPosts.length} artikkel(er) til ${stats?.totalSubscribers || 0} abonnenter?`)) {
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
        title: "Nyhetsbrev sendt!",
        description: `${result.successCount} e-poster sendt til abonnenter`,
      });

      setSelectedPosts([]);
      fetchData(); // Refresh stats
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Feil!",
        description: "Kunne ikke sende nyhetsbrev",
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
        <p className="ml-4 text-lg">Laster...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Nyhetsbrev</h1>
          <p className="text-muted-foreground mt-2">
            Send blogg-artikler til alle som har meldt seg på nyhetsbrev
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
          Send nyhetsbrev ({selectedPosts.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt abonnenter</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSubscribers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aktive nyhetsbrev-abonnenter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siste utsendelse</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastSentAt
                ? format(new Date(stats.lastSentAt), "dd.MM.yyyy", { locale: nb })
                : "Aldri"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSentAt
                ? format(new Date(stats.lastSentAt), "HH:mm", { locale: nb })
                : "Ingen nyhetsbrev sendt ennå"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valgte artikler</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              Artikler i neste utsendelse
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Posts Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Velg artikler å sende</CardTitle>
          <CardDescription>
            Velg én eller flere publiserte artikler som skal sendes i nyhetsbrevet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen publiserte artikler</h3>
              <p className="text-muted-foreground">
                Publiser noen artikler før du sender nyhetsbrev
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
                  <TableHead>Tittel</TableHead>
                  <TableHead>Sammendrag</TableHead>
                  <TableHead>Publisert</TableHead>
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
                          Bilde
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                      {post.excerpt}
                    </TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? format(new Date(post.publishedAt), "dd.MM.yyyy", { locale: nb })
                        : "Ikke publisert"}
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
            <CardTitle>Forhåndsvisning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Mottakere:</strong> {stats?.totalSubscribers || 0} abonnenter
              </p>
              <p className="text-sm">
                <strong>Emne:</strong> HMS Nova: {posts.find((p) => p.id === selectedPosts[0])?.title}
              </p>
              <p className="text-sm">
                <strong>Artikler:</strong> {selectedPosts.length} stk
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Tips: Nyhetsbrevet vil inneholde sammendrag av artiklene med link til full artikkel på nettsiden
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

