import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function TodoistNotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/todoist/notifications"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/todoist/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todoist/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#0F6570]">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 bg-[#0f172a] border-white/10 text-white p-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-3.5 bg-[#162032] border-b border-white/10 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Notificações TODOIST</h4>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-bold">
              {unreadCount} não lida(s)
            </span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">Nenhuma notificação.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 flex items-start justify-between gap-3 text-xs ${
                  n.isRead ? "bg-transparent opacity-60" : "bg-slate-900/60"
                }`}
              >
                <div className="flex-1 space-y-1">
                  <h5 className="font-semibold text-amber-300">{n.title}</h5>
                  <p className="text-slate-300 leading-snug">{n.message}</p>
                  <span className="text-[10px] text-slate-500 block">
                    {format(new Date(n.createdAt), "dd/MM 'às' HH:mm")}
                  </span>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 shrink-0"
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
