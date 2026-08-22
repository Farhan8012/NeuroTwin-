import { CalendarDays, MapPin, Image as ImageIcon, Mic, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Memory } from "@/lib/mock-data";

type Props = { memory: Memory };

export function MemoryCard({ memory }: Props) {
  return (
    <Card className="group rounded-2xl border-border shadow-none transition-colors hover:border-primary/30">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="secondary"
            className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary"
          >
            {memory.category}
          </Badge>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {memory.hasPhoto ? (
              <span aria-label="Includes photo">
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
            ) : null}
            {memory.hasAudio ? (
              <span aria-label="Includes audio">
                <Mic className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
            {memory.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {memory.description}
          </p>
        </div>

        <dl className="mt-1 grid gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{memory.date}</span>
          </div>
          {memory.location ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{memory.location}</span>
            </div>
          ) : null}
          {memory.people.length ? (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="truncate">{memory.people.join(", ")}</span>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
