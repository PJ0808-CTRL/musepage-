
"use client";

type ShareButtonProps = {
  username: string;
};

export default function ShareButton({
  username,
}: ShareButtonProps) {
  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${username}`,
          text: `Check out @${username}'s creator page`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Profile link copied!");
      }
    } catch (error) {
      // User cancelled the share menu.
      console.log("Share cancelled:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-5 flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:scale-105 hover:bg-white/20 active:scale-95"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>

      Share
    </button>
  );
}

