"use client";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import MainFeed from "@/components/MainFeed";
import RightSidebar from "@/components/RightSidebar";
import FloatingMessages from "@/components/FloatingMessages";
import LoadingWrapper from "@/components/LoadingWrapper";

export default function FeedPage() {
  return (
    <LoadingWrapper duration={1200}>
      <AuthGuard>
        <div className="min-h-screen bg-[#f3f2ef]">
          {/* ======= HEADER ======= */}
          <Header />

          {/* ======= MAIN CONTAINER ======= */}
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 transition-all">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between">
              {/* ======= LEFT SIDEBAR ======= */}
              <aside className="hidden lg:block w-full max-w-[230px]">
                <div className="sticky top-[80px] h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar ">
                  <LeftSidebar />
                </div>
              </aside>

              {/* ======= MAIN FEED ======= */}
              <section className="flex-1 max-w-2xl w-full">
                <MainFeed />
              </section>

              {/* ======= RIGHT SIDEBAR ======= */}
              <aside className="hidden xl:block w-full max-w-[300px]">
                <div className="sticky top-[80px] h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
                  <RightSidebar />
                </div>
              </aside>
            </div>
          </div>

          {/* ======= FLOATING CHAT ======= */}
          <div>
            <FloatingMessages />
          </div>
        </div>
      </AuthGuard>
    </LoadingWrapper>
  );
}
