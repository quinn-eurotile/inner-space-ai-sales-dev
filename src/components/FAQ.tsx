import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: "Why is this tile £36 per sq.m?",
    answer: `This is a limited factory allocation secured at export pricing.

To preserve this price, orders must meet pallet quantities and structured delivery terms.

This is first-quality Italian porcelain. It is not clearance, surplus, or graded stock.

Once the allocation is exhausted, pricing returns to standard showroom levels.`
  },
  {
    question: "What is the minimum order?",
    answer: `The allocation price applies to 57 sq.m and above (full pallet quantity).

Smaller quantities are available at standard retail pricing.`
  },
  {
    question: "Is VAT included?",
    answer: "All prices are exclusive of VAT."
  },
  {
    question: "How do I secure the allocation price?",
    answer: `1. Order a sample
2. Check delivery eligibility
3. Reserve your required sq.m (maximum 200 sq.m per project)
4. Full payment secures dispatch

Reservations are held for 7 days pending payment.`
  },
  {
    question: "What if I require more than 200 sq.m?",
    answer: "Submit your desired quantity which will reserve the maximum allocation of 200 sq.m and a representative will contact you to coordinate the remainder of your order."
  },
  {
    question: "Why is full payment required upfront?",
    answer: `Allocation stock is secured specifically against confirmed orders at this price.

Full payment is required prior to delivery. We do not operate deposit or staged payment terms on allocation releases.`
  },
  {
    question: "Is the sample fee refundable?",
    answer: "No. Sample fees cover postage, handling, and packaging costs and are not refundable or credited against your order."
  },
  {
    question: "How long does delivery take?",
    answer: `Delivery is approximately 3 weeks from cleared payment.

This timeframe includes import coordination and transport scheduling.`
  },
  {
    question: "What does delivery include?",
    answer: `Delivery is kerbside via tail lift.

Clients must ensure:
• Suitable HGV access
• On-site personnel to receive and manage the pallet

Drivers are not responsible for moving goods beyond kerbside.`
  },
  {
    question: "What happens if access is unsuitable?",
    answer: "If delivery cannot be completed due to site access or readiness issues, a £65 per pallet redelivery charge will apply."
  },
  {
    question: "When does risk transfer?",
    answer: "All deliveries require signed acceptance. Risk transfers to the client upon kerbside delivery."
  },
  {
    question: "What are Delivery Tiers?",
    answer: `Some locations incur additional carrier tariffs due to routing and handling controls.

Where applicable, a per sq.m delivery tariff will apply in line with the Delivery Tier shown at checkout.

Please confirm your postcode prior to placing your order.`
  },
  {
    question: "How much additional material should I order?",
    answer: `We recommend allowing 10–15% additional material above your contractor's requirement to account for:
• Installation waste
• Cutting
• Breakages
• Future spares

Example: If advised to purchase 100 sq.m, we recommend ordering 110–115 sq.m.`
  },
  {
    question: "What if I need more tiles later?",
    answer: `Additional quantities cannot be supplied at the allocation price.

Top-up orders will be charged at standard showroom pricing (£75 per sq.m + VAT) and shade or batch matching cannot be guaranteed.

We strongly recommend securing your full project quantity at the outset.`
  },
  {
    question: "What is your breakage policy?",
    answer: `All goods must be inspected immediately upon delivery.

In the event of damage:
• Photographic evidence must be submitted within 24 hours of delivery
• Breakages must exceed 5% of the tile surface area
• Minor chips or edge imperfections are not classified as breakages

We do not provide replacement shipments for allocation stock. Where eligible, a credit will be issued for confirmed damaged tiles.`
  },
  {
    question: "Do you offer storage?",
    answer: `Seven days complimentary storage is provided from your requested dispatch date.

Thereafter, storage is charged at £10 per pallet per week.`
  },
  {
    question: "Can I return allocation stock?",
    answer: `Returns are permitted in accordance with UK trading regulations.

• Return transport is charged at £500 per pallet
• Goods must be unused and in original condition
• Returns can only be for the entire complete order, not part of the order

Please ensure full specification approval before confirming your order.`
  },
  {
    question: "Do I need a trade account?",
    answer: "No trade account is required. This allocation is available to private and professional clients under identical terms."
  },
  {
    question: "Is this suitable for all projects?",
    answer: `This format is ideally suited to:
• Ground floors
• Open-plan living
• Large-format contemporary interiors
• Indoor–outdoor continuity (9/20mm outdoor formats in R11 slip rating)

Due to pallet quantities, it is generally unsuitable for small bathroom installations.`
  },
];

interface FAQProps {
  showHeader?: boolean;
}

export function FAQ({ showHeader = true }: FAQProps) {
  return (
    <div>
      {showHeader && <p className="section-label">Frequently Asked Questions</p>}
      <div className="max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-border/60">
              <AccordionTrigger className="text-left text-[15px] font-normal hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed pb-1">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
