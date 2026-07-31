import { SectionLabel } from "../components/SectionLabel";
import { TitleMetaRow } from "../components/TitleMetaRow";
import { projects } from "../content/projects";
import { buildPageMeta } from "../lib/seo";

export function meta() {
  return buildPageMeta({
    title: "Projects",
    description: projects.intro,
    path: "/projects",
  });
}

export default function Projects() {
  return (
    <div className="pt-14 flex flex-col gap-7.5">
      <div className="flex flex-col gap-3.5">
        <SectionLabel>projects</SectionLabel>
        <p className="text-base text-muted max-w-lg">{projects.intro}</p>
      </div>

      <div>
        {projects.projects.map(({ name, year, description, tech, link }) => {
          const title = link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="font-semibold hover:text-accent"
            >
              {name}
            </a>
          ) : (
            <span className="font-semibold">{name}</span>
          );

          return (
            <article
              key={name}
              className="py-5 border-t border-line flex flex-col gap-1.5"
            >
              <TitleMetaRow
                title={title}
                meta={
                  year ? (
                    <span className="text-xs text-faint whitespace-nowrap">
                      {year}
                    </span>
                  ) : null
                }
              />
              <p className="text-sm text-muted max-w-lg">{description}</p>
              {tech.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tech.map((item) => (
                    <span
                      key={item}
                      className="text-xs text-faint border border-line rounded-xs px-1.5 py-px"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
