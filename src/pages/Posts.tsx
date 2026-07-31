import { Link } from "react-router";

import { SectionLabel } from "../components/SectionLabel";
import { TitleMetaRow } from "../components/TitleMetaRow";
import { groupPostsByYear } from "../content/postMeta";
import { posts } from "../content/posts";
import { formatShortDate } from "../lib/date";

export default function Posts() {
  const groups = groupPostsByYear(posts);

  return (
    <div className="pt-14 flex flex-col gap-11">
      <SectionLabel>posts</SectionLabel>
      {groups.map(({ year, posts: yearPosts }) => (
        <div key={year} className="grid grid-cols-[4rem_1fr] gap-5 items-start">
          <div className="text-xs text-faint pt-0.5">{year}</div>
          <div className="flex flex-col gap-2">
            {yearPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/posts/${post.slug}`}
                className="group"
              >
                <TitleMetaRow
                  title={
                    <span className="text-base text-fg group-hover:text-accent">
                      {post.title}
                    </span>
                  }
                  meta={
                    <span className="text-xs text-faint whitespace-nowrap">
                      {formatShortDate(post.date)}
                    </span>
                  }
                />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
