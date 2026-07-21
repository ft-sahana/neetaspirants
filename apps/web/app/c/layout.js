import SubforumSidebar from "@/components/SubforumSidebar";

export default function CommunityLayout({ children }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row">
      <SubforumSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
