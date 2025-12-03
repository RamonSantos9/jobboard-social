"use client";

import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import MainFeed from "@/components/MainFeed";
import RightSidebar from "@/components/RightSidebar";
import FloatingMessages from "@/components/FloatingMessages";
import LeftSidebarJobs from "@/app/jobs/components/LeftSidebarJobs";
import TourGuide from "@/components/TourGuide";

export default function FeedPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f3f2ef]">
        {/* HEADER */}
        <Header sticky={false} />

        {/* MAIN CONTAINER */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-2 pb-6 transition-all overflow-x-hidden">
          <div className="flex flex-col lg:flex-row lg:gap-2 justify-between">
            {/* LEFT SIDEBAR */}
            <aside className="w-full lg:max-w-[280px]">
              <LeftSidebarJobs />
            </aside>

            {/* MAIN FEED */}
            <section className="flex-1 max-w-2xl w-full">
              <MainFeed />
            </section>

            {/* RIGHT SIDEBAR */}
            <aside className="hidden xl:block w-full max-w-[300px]">
              <RightSidebar />
            </aside>
          </div>
        </div>

        {/* FLOATING CHAT */}
        <div>
          <FloatingMessages />
        </div>
        <TourGuide />
      </div>
    </AuthGuard>
  );
}
