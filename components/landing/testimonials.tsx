import { Marquee } from "@/components/magicui/marquee"

const testimonials = [
  {
    name: "Maria Santos",
    username: "Accountant, Manila",
    body: "I manage 12 clients and OpportunityOS saves me 10 hours per client every month. Reconciliation is finally reliable.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Kenji Tanaka",
    username: "Startup CFO, Tokyo",
    body: "Multi-currency was always a nightmare. Now FX conversions and tax rules are automated across Japan, US, and EU.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Sophie Müller",
    username: "Freelance Designer, Berlin",
    body: "I scan receipts from my phone and OpportunityOS categorizes everything. I finally understand my cash flow.",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Rajesh Kumar",
    username: "Small Business Owner, Mumbai",
    body: "Bank feeds sync overnight and transactions are categorized by morning. We close our books in 2 hours, not 2 days.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Emily Chen",
    username: "Finance Manager, Singapore",
    body: "The AI explains every decision with sources and history. I trust it because I can verify everything inline.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Carlos Rodriguez",
    username: "Accounting Firm Partner, Madrid",
    body: "Our team switched from QuickBooks in one weekend. Migration was smooth and clients love the real-time dashboards.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Sarah Williams",
    username: "E-commerce Founder, New York",
    body: "Shopify orders sync to revenue automatically. Tax compliance across states is handled without me thinking about it.",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Ahmed Hassan",
    username: "Consultant, Dubai",
    body: "I invoice in 3 currencies and OpportunityOS handles conversions and revaluation. Monthly close is finally predictable.",
    img: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Lisa Zhang",
    username: "SaaS Controller, San Francisco",
    body: "Anomaly detection caught a duplicate vendor payment before we processed it. Saved us $15K and hours of cleanup.",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

const TestimonialCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <div className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b from-[#D4AF37]/10 to-transparent blur-md"></div>

      <div className="text-gray-700 leading-relaxed">{body}</div>

      <div className="mt-5 flex items-center gap-2">
        <img src={img || "/placeholder.svg"} alt={name} height="40" width="40" className="h-10 w-10 rounded-full" />
        <div className="flex flex-col">
          <div className="leading-5 font-medium tracking-tight text-gray-900">{name}</div>
          <div className="leading-5 tracking-tight text-gray-500">{username}</div>
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  return (
    <section id="testimonials" className="mb-24 bg-white py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-[540px]">
          <div className="flex justify-center">
            <button
              type="button"
              className="group relative z-[60] mx-auto rounded-full border border-gray-200 bg-white px-6 py-1 text-xs backdrop-blur transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-100 md:text-sm"
            >
              <div className="absolute inset-x-0 -top-px mx-auto h-0.5 w-1/2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-2xl transition-all duration-500 group-hover:w-3/4"></div>
              <div className="absolute inset-x-0 -bottom-px mx-auto h-0.5 w-1/2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-2xl transition-all duration-500 group-hover:h-px"></div>
              <span className="relative text-gray-700">Testimonials</span>
            </button>
          </div>
          <h2 className="mt-5 bg-gradient-to-r from-gray-600 via-gray-900 to-gray-600 bg-clip-text text-center text-4xl font-semibold tracking-tighter text-transparent md:text-[54px] md:leading-[60px] relative z-10">
            Trusted by accountants and founders
          </h2>

          <p className="mt-5 relative z-10 text-center text-lg text-gray-600">
            From solo freelancers to multi-client accounting firms, OpportunityOS automates the work that slows you
            down.
          </p>
        </div>

        <div className="my-16 flex max-h-[738px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]">
          <div>
            <Marquee pauseOnHover vertical className="[--duration:20s]">
              {firstColumn.map((testimonial) => (
                <TestimonialCard key={testimonial.username} {...testimonial} />
              ))}
            </Marquee>
          </div>

          <div className="hidden md:block">
            <Marquee reverse pauseOnHover vertical className="[--duration:25s]">
              {secondColumn.map((testimonial) => (
                <TestimonialCard key={testimonial.username} {...testimonial} />
              ))}
            </Marquee>
          </div>

          <div className="hidden lg:block">
            <Marquee pauseOnHover vertical className="[--duration:30s]">
              {thirdColumn.map((testimonial) => (
                <TestimonialCard key={testimonial.username} {...testimonial} />
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  )
}
