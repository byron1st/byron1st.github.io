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
          <p key={paragraph} className="text-base text-muted">
            {paragraph}
          </p>
        ))}
        {/* Stub CTA: clickable, no handler yet */}
        {/*<Button>Request a resume</Button>*/}
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
        {about.experience.map(({ company, period, roles }) => {
          const single = roles.length === 1 ? roles[0] : null;
          const companyPeriod = single?.period ?? period;
          return (
            <div
              key={`${company}-${companyPeriod ?? ""}`}
              className="flex flex-col gap-3"
            >
              {companyPeriod ? (
                <TitleMetaRow
                  title={<span className="font-semibold">{company}</span>}
                  meta={
                    <span className="text-xs text-faint whitespace-nowrap">
                      {companyPeriod}
                    </span>
                  }
                />
              ) : (
                <p className="font-semibold">{company}</p>
              )}
              {single ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted">{single.role}</p>
                  {single.bullets.length > 0 ? (
                    <MarkerList
                      items={single.bullets}
                      marker="—"
                      className="flex flex-col gap-1 pt-1"
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {roles.map(({ role, period: rolePeriod, bullets }) => (
                    <div
                      key={`${role}-${rolePeriod}`}
                      className="flex flex-col gap-2"
                    >
                      <TitleMetaRow
                        title={
                          <span className="text-sm text-muted">{role}</span>
                        }
                        meta={
                          <span className="text-xs text-faint whitespace-nowrap">
                            {rolePeriod}
                          </span>
                        }
                      />
                      {bullets.length > 0 ? (
                        <MarkerList
                          items={bullets}
                          marker="—"
                          className="flex flex-col gap-1 pt-1"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
          <SectionLabel hasBorder>Articles & Talks</SectionLabel>
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
