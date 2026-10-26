import Image from "next/image";
const logos = ["amazon", "razorpay", "tcs", "deloitte", "paypal", "walmart", "accenture", "bosch-group"];
export function Logos() {
  return (
    <section className="py-14">
      <p className="mb-7 text-center text-[13.5px] text-muted-foreground">Candidates practise here for roles at</p>
      <div className="mask-x overflow-hidden">
        <div className="flex w-max items-center gap-16 [animation:marquee_40s_linear_infinite]">
          {[...logos, ...logos].map((l, i) => (
            <Image key={i} src={`/marketing-2026/logos/${l}.png`} alt={i < logos.length ? l : ""} width={110} height={30} className="h-7 w-auto opacity-60 grayscale" />
          ))}
        </div>
      </div>
    </section>
  );
}
