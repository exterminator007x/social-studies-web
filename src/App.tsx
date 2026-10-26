import { useEffect, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Download, ExternalLink, FileText } from "lucide-react";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { subjects, type Subject, type Unit } from "@/content";
import credits from "@/hero-credits.json";

// Hash routing (#/m5/u3) so the site works from any static host, GitHub Pages included.
const subscribe = (cb: () => void) => {
  addEventListener("hashchange", cb);
  return () => removeEventListener("hashchange", cb);
};
const useHash = () => useSyncExternalStore(subscribe, () => location.hash);

export default function App() {
  const hash = useHash();
  useEffect(() => {
    scrollTo(0, 0);
  }, [hash]);
  const [sid, uid] = hash.replace(/^#\/?/, "").split("/");
  const subject = subjects.find((s) => s.id === sid);
  const units = subject?.terms.flatMap((t) => t.units) ?? [];
  const unit = units.find((u) => u.id === uid);

  return (
    <div className="min-h-svh">
      {subject && unit ? (
        <UnitPage subject={subject} unit={unit} units={units} />
      ) : subject ? (
        <SubjectPage subject={subject} />
      ) : (
        <Home />
      )}
      <Footer />
    </div>
  );
}

function Home() {
  return (
    <>
      <TiltedGridHero
        images={credits.map((c) => ({ src: `hero/${c.file}`, alt: c.title }))}
        className="h-svh min-h-[560px] w-full bg-[oklch(0.17_0.03_255)] text-white"
        speed={5}
        aspectRatio={4 / 3}
      >
        <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 py-12 text-center sm:py-16">
          <div>
            <p className="text-sm tracking-widest text-white/60">ครูอัศวิน · สังคมศึกษา ศาสนา และวัฒนธรรม</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-7xl">
              มาเรียน<span className="text-brand">สังคม</span>
            </h1>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[oklch(0.17_0.03_255)] via-[oklch(0.17_0.03_255/0.85)] to-transparent" />
          <div className="relative flex flex-col items-center gap-5">
            <p className="max-w-md text-balance text-white/80">
              ทบทวนบทเรียน อ่านสรุป และดาวน์โหลดใบความรู้ ใบงาน ได้ทุกที่ ทุกเวลา แม้ครูไม่อยู่
            </p>
            <button
              onClick={() => document.getElementById("subjects")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 font-medium text-white shadow-lg transition hover:brightness-110"
            >
              เริ่มเรียน <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </TiltedGridHero>

      <section id="subjects" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold">รายวิชา</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {subjects.map((s) => {
            const us = s.terms.flatMap((t) => t.units);
            return (
              <a key={s.id} href={`#/${s.id}`} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-lg">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={s.cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-sm font-medium text-brand">{s.grade}</p>
                  <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {us.length} หน่วย · {us.reduce((n, u) => n + u.files.length, 0)} เอกสาร
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}

function SubjectPage({ subject }: { subject: Subject }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <BackLink href="#/">หน้าแรก</BackLink>
      <div className="sm:flex sm:items-start sm:justify-between sm:gap-8">
        <div>
          <p className="mt-6 font-medium text-brand">{subject.grade}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{subject.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{subject.blurb}</p>
        </div>
        {subject.line && (
          <figure className="mt-6 flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:w-56 sm:shrink-0 sm:flex-col sm:text-center">
            <img src={subject.line} alt="QR code กลุ่ม LINE ของวิชา" className="size-28 shrink-0 rounded-lg sm:size-40" />
            <figcaption className="text-sm font-medium leading-relaxed">ให้นักเรียนทุกคนเข้ากลุ่ม Line เพื่อติดตามและส่งงาน</figcaption>
          </figure>
        )}
      </div>

      {subject.terms.map((term) => (
        <section key={term.code} className="mt-12">
          <h2 className="flex items-baseline gap-3 text-xl font-semibold">
            {term.name} <span className="text-sm font-normal text-muted-foreground">{term.code}</span>
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {term.units.map((u) => (
              <a key={u.id} href={`#/${subject.id}/${u.id}`} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={u.cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-medium text-white/90">หน่วยที่ {u.no}</p>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold leading-snug">{u.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {u.files.length ? `${u.files.length} เอกสาร` : "สรุปบทเรียน · เอกสารกำลังจัดทำ"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

function UnitPage({ subject, unit, units }: { subject: Subject; unit: Unit; units: Unit[] }) {
  const i = units.indexOf(unit);
  const prev = units[i - 1];
  const next = units[i + 1];
  return (
    <main className="pb-16">
      <header className="relative h-72 overflow-hidden sm:h-96">
        <img src={unit.cover} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.17_0.03_255)] via-[oklch(0.17_0.03_255/0.55)] to-black/20" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-between px-4 py-4 text-white sm:px-6">
          <BackLink href={`#/${subject.id}`} light>
            {subject.title} {subject.grade}
          </BackLink>
          <div className="pb-4">
            <p className="font-medium text-brand">หน่วยที่ {unit.no}</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{unit.title}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-12 px-4 pt-10 sm:px-6">
        <section>
          <SectionTitle>สาระสำคัญ</SectionTitle>
          <p className="text-lg leading-relaxed">{unit.summary}</p>
        </section>

        <section>
          <SectionTitle>ประเด็นที่ต้องจำ</SectionTitle>
          <ol className="space-y-3">
            {unit.keyPoints.map((p, k) => (
              <li key={k} className="flex gap-4 rounded-xl border bg-card p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{k + 1}</span>
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ol>
        </section>

        {unit.timeline && (
        <section>
          <SectionTitle>เส้นเวลา</SectionTitle>
          <ol className="relative ml-2 border-l-2 border-brand/30">
            {unit.timeline.map((t, k) => (
              <li key={k} className="relative pb-6 pl-6 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 size-3 rounded-full bg-brand ring-4 ring-background" />
                <p className="text-sm font-semibold text-brand">{t.when}</p>
                <p className="mt-0.5">{t.what}</p>
              </li>
            ))}
          </ol>
        </section>
        )}

        {unit.facts && (
          <section>
            <SectionTitle>รู้หรือไม่</SectionTitle>
            <ul className="space-y-3">
              {unit.facts.map((f, k) => (
                <li key={k} className="rounded-xl border-l-4 border-brand bg-card p-4 leading-relaxed">
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {unit.myths && (
          <section>
            <SectionTitle>เรื่องเล่าที่มักเข้าใจผิด</SectionTitle>
            <ul className="space-y-3">
              {unit.myths.map((m, k) => (
                <li key={k} className="rounded-xl border bg-card p-4 leading-relaxed">
                  <p className="text-muted-foreground">
                    <span className="mr-2 font-semibold text-brand">เข้าใจว่า</span>
                    {m.myth}
                  </p>
                  <p className="mt-2">
                    <span className="mr-2 font-semibold text-brand">ความจริง</span>
                    {m.fact}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unit.thinkAbout && (
          <section>
            <SectionTitle>ชวนคิด</SectionTitle>
            <ol className="list-decimal space-y-3 pl-6 marker:font-semibold marker:text-brand">
              {unit.thinkAbout.map((q, k) => (
                <li key={k} className="pl-1 leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <SectionTitle>เอกสารประกอบการเรียน</SectionTitle>
          {unit.files.length ? (
            <ul className="space-y-3">
              {unit.files.map((f) => (
                <li key={f.file} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
                  <FileText className="size-8 shrink-0 text-brand" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.kind} · PDF</p>
                  </div>
                  <div className="flex basis-full gap-2 sm:basis-auto">
                    <a href={f.file} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm hover:bg-muted sm:flex-none">
                      <ExternalLink className="size-4" /> เปิดอ่าน
                    </a>
                    <a href={f.file} download={`${f.title}.pdf`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 sm:flex-none">
                      <Download className="size-4" /> ดาวน์โหลด
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-3 rounded-xl border border-dashed p-5 text-muted-foreground">
              <BookOpen className="size-5 shrink-0" /> ครูกำลังจัดทำใบความรู้และใบงานของหน่วยนี้ ระหว่างนี้อ่านสรุปด้านบนไปก่อนได้เลย
            </p>
          )}
        </section>

        {unit.videos.length > 0 && (
          <section>
            <SectionTitle>คลิปแนะนำ</SectionTitle>
            <div className="grid gap-5">
              {unit.videos.map((v) => (
                <figure key={v.youtubeId}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
                    title={v.title}
                    loading="lazy"
                    allowFullScreen
                    className="aspect-video w-full rounded-xl border"
                  />
                  <figcaption className="mt-2 text-sm text-muted-foreground">{v.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <nav className="grid gap-3 border-t pt-8 sm:grid-cols-2">
          {prev ? <UnitLink subject={subject} unit={prev} dir="prev" /> : <span />}
          {next && <UnitLink subject={subject} unit={next} dir="next" />}
        </nav>
      </div>
    </main>
  );
}

function UnitLink({ subject, unit, dir }: { subject: Subject; unit: Unit; dir: "prev" | "next" }) {
  return (
    <a href={`#/${subject.id}/${unit.id}`} className={`rounded-xl border bg-card p-4 transition hover:shadow-md ${dir === "next" ? "sm:text-right" : ""}`}>
      <p className="text-sm text-muted-foreground">{dir === "prev" ? "← หน่วยก่อนหน้า" : "หน่วยถัดไป →"}</p>
      <p className="mt-1 font-medium">หน่วยที่ {unit.no} {unit.title}</p>
    </a>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-sm font-semibold tracking-widest text-brand">{children}</h2>;
}

function BackLink({ href, light, children }: { href: string; light?: boolean; children: React.ReactNode }) {
  return (
    <a href={href} className={`inline-flex items-center gap-1.5 pt-6 text-sm ${light ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}>
      <ArrowLeft className="size-4" /> {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted/40 px-4 py-10 text-sm text-muted-foreground sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="font-medium text-foreground">มาเรียนสังคม ครูอัศวิน</p>
        <details className="mt-4">
          <summary className="cursor-pointer">เครดิตภาพ (สาธารณสมบัติ จาก Wikimedia Commons)</summary>
          <ul className="mt-3 space-y-1">
            {credits.map((c) => (
              <li key={c.file}>
                <a href={c.source} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                  {c.title}
                </a>{" "}
                — {c.artist} · {c.license}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </footer>
  );
}
