"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronUp, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FloatingMessages() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardContent className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder/userplaceholder.svg" />
              </Avatar>
              <span className="text-sm font-medium">Mensagens</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-xs text-black text-center">
            Nenhuma mensagem nova
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
