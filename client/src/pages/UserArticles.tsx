import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";

const articleSchema = z.object({
  title: z.string().min(5, "Título muito curto"),
  slug: z.string().min(5, "Slug muito curto"),
  summary: z.string().min(10, "Resumo muito curto"),
  content: z.string().min(50, "Conteúdo muito curto"),
  coverImage: z.string().url("URL de imagem inválida"),
});

export default function UserArticles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles, isLoading } = useQuery<any[]>({
    queryKey: ["/api/user/posts"],
  });

  const form = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: "",
      slug: "",
      summary: "",
      content: "",
      coverImage: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof articleSchema>) => {
      const res = await apiRequest("POST", "/api/user/posts", values);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Artigo enviado para aprovação!" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/user/posts"] });
    },
    onError: () => {
      toast({ title: "Erro ao enviar artigo", variant: "destructive" });
    },
  });

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-3xl font-bold mb-6">Escrever Artigo</h2>
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input placeholder="Título do seu artigo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL amigável)</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: meu-primeiro-artigo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coverImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL da Imagem de Capa</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resumo</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Um breve resumo..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo (HTML ou Texto)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Escreva seu artigo aqui..." className="h-64" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                    Enviar para Aprovação
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-6">Meus Artigos</h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {articles?.map((article) => (
                <Card key={article.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">{article.title}</CardTitle>
                    <Badge variant={article.approved ? "default" : "secondary"}>
                      {article.approved ? "Aprovado" : "Pendente"}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Enviado em: {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {articles?.length === 0 && (
                <p className="text-center text-muted-foreground py-12">Você ainda não enviou nenhum artigo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
