export default function LoadingScreen({ message = "로딩 중..." }) {
  return (
    <div className="flex h-screen items-center justify-center text-muted">
      <div className="flex flex-col items-center gap-3">
        {/* 스피너 (원하면) */}
        <div className="h-20 w-20 animate-spin rounded-full border-2 border-hairline border-t-accent" />
        <span className="hud-label">{message}</span>
      </div>
    </div>
  );
}
