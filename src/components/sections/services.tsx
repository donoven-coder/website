import { useId } from "react";
import type { LucideIcon } from "lucide-react";
import { Clapperboard, Megaphone, MonitorSmartphone, Search } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";

type Service = {
  icon: LucideIcon;
  title: string;
  summary: string;
  included: string[];
};

const services: Service[] = [
  {
    icon: Megaphone,
    title: "Facebook & Instagram ads",
    summary: "Lead campaigns and offers aimed at people within driving distance of your business.",
    included: [
      "Audiences built by town and zip code",
      "Ongoing creative and offer testing",
      "Lead forms that text you instantly",
      "Retargeting for people who visited but didn’t call",
    ],
  },
  {
    icon: Search,
    title: "Google Ads",
    summary: "Show up when someone nearby searches for exactly what you do, right when they’re ready to hire.",
    included: [
      "Keyword research for your service area",
      "Local Services Ads setup and verification",
      "Call tracking on every campaign",
      "Weekly search-term cleanup so you stop paying for junk clicks",
    ],
  },
  {
    icon: MonitorSmartphone,
    title: "Landing pages & tracking",
    summary: "Fast pages that turn clicks into calls, with tracking that shows which ads paid for themselves.",
    included: [
      "One-page landers built for each offer",
      "Meta Pixel and Conversions API setup",
      "Google Analytics 4 and call tracking",
      "Instant text alerts for every new lead",
    ],
  },
  {
    icon: Clapperboard,
    title: "Ad creative",
    summary: "Video and images made for each platform, so your ads look like they belong in the feed.",
    included: [
      "Short-form video edits for Reels and Stories",
      "Static and carousel ads",
      "Headline and offer testing",
      "Fresh creative every month so ads don’t go stale",
    ],
  },
];

export function Services() {
  return (
    <section className="services services-dark" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="services-title" className="section-title">What we run for you</h2>
          <p className="section-sub">
            Ads find the homeowners who need you. Pages turn them into calls. Tracking shows exactly which dollars came
            back as booked jobs. One system, run by one person who actually answers your texts.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {services.map((service) => (
            <li key={service.title} className="flex">
              <ServiceCard {...service} />
            </li>
          ))}
        </ul>

        <div className="inline-cta inline-cta-dark" data-reveal>
          <p>Not sure which you need? That’s what the call is for.</p>
          <a className="btn btn-sky" href="#book" data-cta="services">
            Book a discovery call
          </a>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ icon: Icon, title, summary, included }: Service) {
  // On phones the "What's included" list folds away behind a toggle; on larger screens it's always shown.
  // The toggle is wired up in plain TypeScript (src/lib/service-cards.ts).
  const listId = useId();

  return (
    <GlowCard
      glowColor="sky"
      customSize
      className="service-card w-full grid-rows-[auto_1fr]! gap-5! p-7! md:p-9!"
    >
      <div className="flex items-start gap-4">
        <span className="service-card-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.5} />
        </span>
        <div>
          <h3 className="service-card-title">{title}</h3>
          <p className="service-card-summary">{summary}</p>
        </div>
      </div>
      <div className="service-card-body" data-expanded="false">
        <button
          type="button"
          className="service-card-toggle"
          aria-expanded="false"
          aria-controls={listId}
          data-service-toggle
        >
          What’s included
          <span className="faq-icon" aria-hidden="true"></span>
        </button>
        <div className="service-card-collapse">
          <ul id={listId} className="service-card-list">
            {included.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </GlowCard>
  );
}
