"use client";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function NetworkPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f2ef]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar minha rede</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm text-gray-600">
                    <li className="flex justify-between items-center cursor-pointer hover:text-black">
                      <span>Conexões</span>
                      <span className="font-semibold">0</span>
                    </li>
                    <li className="flex justify-between items-center cursor-pointer hover:text-black">
                      <span>Seguindo e seguidores</span>
                      <span className="font-semibold">0</span>
                    </li>
                    <li className="flex justify-between items-center cursor-pointer hover:text-black">
                      <span>Grupos</span>
                      <span className="font-semibold">0</span>
                    </li>
                    <li className="flex justify-between items-center cursor-pointer hover:text-black">
                      <span>Eventos</span>
                      <span className="font-semibold">0</span>
                    </li>
                    <li className="flex justify-between items-center cursor-pointer hover:text-black">
                      <span>Páginas</span>
                      <span className="font-semibold">0</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-3">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Sem convites pendentes</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Pessoas que você pode conhecer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                     <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium">Expandindo sua rede</h3>
                      <p className="text-muted-foreground mt-2">
                        Em breve você poderá encontrar e se conectar com outros profissionais aqui.
                      </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
