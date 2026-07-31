import { MarkerList } from "../components/MarkerList";
import { SectionLabel } from "../components/SectionLabel";
import { TitleMetaRow } from "../components/TitleMetaRow";
import { about } from "../content/about";
import { buildPageMeta } from "../lib/seo";

export function meta() {
  const description = about.intro[0];
  if (!description) {
    throw new Error(
      "content/about.yaml: intro must have at least one paragraph for meta",
    );
  }
  return buildPageMeta({
    title: "About",
    description,
    path: "/about",
  });
}

export default function About() {
  return (
    <div className="pt-14 flex flex-col gap-13">
      <section className="flex flex-col gap-4">
        <SectionLabel>About</SectionLabel>
        {about.intro.map((paragraph) => (
          <p key={paragraph} className="text-base text-muted max-w-lg">
            {paragraph}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-3.5">
        <SectionLabel hasBorder>Stack</SectionLabel>
        {about.stack.map(({ group, items }) => (
          <div
            key={group}
            className="grid grid-cols-[8rem_1fr] gap-4 items-baseline"
          >
            <div className="text-xs text-faint">{group}</div>
            <div className="text-sm text-fg">{items.join(", ")}</div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6.5">
        <SectionLabel hasBorder>Experience</SectionLabel>
        {about.experience.map(({ company, role, period, bullets }) => (
          <div key={`${company}-${period}`} className="flex flex-col gap-2">
            <TitleMetaRow
              title={<span className="font-semibold">{company}</span>}
              meta={
                <span className="text-xs text-faint whitespace-nowrap">
                  {period}
                </span>
              }
            />
            <p className="text-sm text-muted">{role}</p>
            {bullets.length > 0 ? (
              <MarkerList
                items={bullets}
                marker="—"
                className="flex flex-col gap-1 pt-1"
              />
            ) : null}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6.5">
        <SectionLabel hasBorder>Education</SectionLabel>
        {about.education.map(
          ({ school, degree, period, thesis, description, papers }) => (
            <div key={`${school}-${period}`} className="flex flex-col gap-1.5">
              <TitleMetaRow
                title={<span className="font-semibold">{school}</span>}
                meta={
                  <span className="text-xs text-faint whitespace-nowrap">
                    {period}
                  </span>
                }
              />
              <p className="text-sm text-muted">{degree}</p>
              {thesis ? <p className="text-sm text-fg">{thesis}</p> : null}
              {description ? (
                <p className="text-sm text-muted max-w-lg">{description}</p>
              ) : null}
              {papers && papers.length > 0 ? (
                <MarkerList
                  items={papers}
                  marker="·"
                  className="flex flex-col gap-1 pt-1.5"
                  itemClassName="text-xs text-muted"
                />
              ) : null}
            </div>
          ),
        )}
      </section>

      {about.works.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionLabel hasBorder>Works</SectionLabel>
          {about.works.map(({ title, year, meta }) => (
            <div key={`${title}-${year}`} className="flex flex-col gap-0.5">
              <TitleMetaRow
                title={<span className="text-sm text-fg">{title}</span>}
                meta={
                  <span className="text-xs text-faint whitespace-nowrap">
                    {year}
                  </span>
                }
              />
              <p className="text-sm text-muted">{meta}</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
