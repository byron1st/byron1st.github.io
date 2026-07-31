import { SocialLinks } from "../components/SocialLinks";
import { profile } from "../content/profile";
import { buildPageMeta } from "../lib/seo";

export function meta() {
  return buildPageMeta({
    description: profile.tagline,
    path: "/",
  });
}

export default function Home() {
  return (
    <div className="pt-24 min-h-[52vh]">
      <div className="flex flex-col gap-6.5 items-start">
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.name}
        </h1>
        <p className="text-base text-muted max-w-lg">{profile.tagline}</p>
        <SocialLinks
          socials={profile.socials}
          className="flex gap-4.5 items-center"
          linkClassName="text-muted hover:text-fg"
          iconClassName="size-5"
        />
      </div>
    </div>
  );
}
