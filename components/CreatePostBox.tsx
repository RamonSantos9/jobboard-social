"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Image as ImageIcon, FileText } from "lucide-react";
import CreatePostModal from "./CreatePostModal";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function CreatePostBox({
  onPostCreated,
}: {
  onPostCreated?: () => void;
}) {
  const { data: session } = useSession();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white shadow-sm border rounded-lg p-4">
        {/* Linha superior - avatar + botão */}
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11">
            <AvatarImage
              src={session?.user?.image || "/placeholder-avatar.svg"}
            />
            <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>

          <CreatePostModal onPostCreated={onPostCreated}>
            <Button className="flex-1 justify-start border hover:bg-gray-100 rounded-full px-4 py-2 text-xs ">
              Comece uma publicação
            </Button>
          </CreatePostModal>
        </div>

        {/* Linha inferior - ações */}
        <div className="flex items-center justify-around mt-3">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
          >
            <Video className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Vídeo</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          >
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Foto</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
          >
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium">Escrever artigo</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
