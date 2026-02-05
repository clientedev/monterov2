import { useTestimonials } from "@/hooks/use-content";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Star, MessageSquarePlus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function TestimonialsSection() {
    const { data: testimonials } = useTestimonials();
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/testimonials", { name, text, rating });
            toast({ title: "Enviado!", description: "Sua avaliação foi enviada para aprovação." });
            setOpen(false);
            setName("");
            setText("");
        } catch (err) {
            toast({ variant: "destructive", title: "Erro", description: "Houve um erro ao enviar." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <span className="text-primary font-semibold tracking-wider text-sm uppercase">Depoimentos</span>
                    <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4 text-slate-900">
                        O que dizem nossos clientes
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Histórias reais de quem confia em nosso trabalho.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {testimonials?.map((t) => (
                        <Card key={t.id} className="bg-slate-50 border-none shadow-sm">
                            <CardHeader className="flex flex-row gap-1 pb-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                                ))}
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 mb-4 italic">"{t.text}"</p>
                                <p className="font-bold text-slate-900">- {t.name}</p>
                            </CardContent>
                        </Card>
                    ))}
                    {testimonials?.length === 0 && (
                        <div className="col-span-full text-center text-slate-400 italic">
                            Nenhuma avaliação ainda. Seja o primeiro!
                        </div>
                    )}
                </div>

                <div className="flex justify-center">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <MessageSquarePlus className="w-4 h-4" />
                                Enviar Avaliação
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enviar Avaliação</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>Nome</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Avaliação (1-5)</Label>
                                    <Input type="number" min="1" max="5" value={rating} onChange={e => setRating(parseInt(e.target.value))} required />
                                </div>
                                <div>
                                    <Label>Comentário</Label>
                                    <Textarea value={text} onChange={e => setText(e.target.value)} required />
                                </div>
                                <Button type="submit" disabled={submitting}>Enviar</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </section>
    );
}
