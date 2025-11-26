"use client";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f2ef]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Mensagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Nenhuma conversa recente.
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-3">
              <Card className="h-[calc(100vh-140px)] flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Suas mensagens</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Selecione uma conversa para começar a trocar mensagens.
                    <br />
                    <span className="text-xs mt-2 block text-blue-600 font-medium">
                      (Funcionalidade em desenvolvimento)
                    </span>
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
