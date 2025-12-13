"use client";

import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { IconArrowDown } from "@tabler/icons-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Badge } from "@/components/ui/badge"; 
import homeImage from "../../assets/nsae-logo.png";
import blogPlaceholder1 from "../../assets/posts/blog/blog-placeholder-1.jpg";
import blogPlaceholder2 from "../../assets/posts/blog/blog-placeholder-2.jpg";
import Autoplay from "embla-carousel-autoplay"

gsap.registerPlugin(useGSAP, SplitText, ScrollTrigger);

const SLIDES = [
  { id: 1, image: homeImage },
//   { id: 2, image: blogPlaceholder1 },
//   { id: 3, image: blogPlaceholder2 },
];

const HeroSlide = ({ data }: { data: (typeof SLIDES)[0] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const splitTargets = containerRef.current.querySelectorAll(".subtitle-lines");
      
      let subtitleInner: SplitText | null = null;
      
      if (splitTargets.length > 0) {
      
        subtitleInner = new SplitText(splitTargets, {
          type: "lines",
          linesClass: "line-inner will-change-transform",
        });
      }

      
      gsap.set(".home-hero-redg-text", { y: -16, autoAlpha: 0 });
      gsap.set(".engineering-text-anim", { autoAlpha: 1 }); 
      gsap.set(".subtitle-lines", { autoAlpha: 1 }); 
      gsap.set(".hero-desc-anim", { y: 16, autoAlpha: 0 });
      gsap.set(".hero-actions-anim", { y: 16, autoAlpha: 0 });
      gsap.set(".scroll-indicator", { autoAlpha: 0 });
      gsap.set(".badge-anim-wrapper", { opacity: 0, scale: 0, rotation: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.2,
      });

      tl.to(".hero-image-anim", {
        scale: 1,
        duration: 2.5,
        ease: "expo.out",
      }, 0);

      tl.to(".home-hero-redg-text", {
        y: 0,
        autoAlpha: 1, 
        duration: 1.5,
      }, 0.2);

      tl.from(".engineering-text-anim", {
        yPercent: 100,
        rotation: 2,
        autoAlpha: 0,
        duration: 1.2,
        ease: "power4.out",
      }, 0.3);

      tl.to(".badge-anim-wrapper", {
        opacity: 1,
        scale: 1,
        rotation: 12,
        duration: 0.8,
        ease: "back.out(1.7)",
      }, 0.8);

      if (subtitleInner && subtitleInner.lines.length > 0) {
        tl.from(subtitleInner.lines, {
          yPercent: 100,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: "power4.out",
        }, 0.5);
      }

      tl.to([".hero-desc-anim", ".hero-actions-anim"], {
        y: 0,
        autoAlpha: 1,
        stagger: 0.1,
        duration: 0.5,
      }, "-=1");

      tl.to(".scroll-indicator", { autoAlpha: 1, duration: 1 }, "-=1");
      tl.to(".scroll-line", { width: 48, duration: 1, ease: "expo.out" }, "-=0.5");

      gsap.to(".hero-image-anim", {
        yPercent: 20,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => {
        if (subtitleInner) subtitleInner.revert();
      };
    },
    { 
      scope: containerRef, 
      dependencies: [data] 
    }
  );

  return (
    <section
      ref={containerRef}
      className="home-hero-section relative flex min-h-[85vh] items-center overflow-hidden rounded-2xl px-6 py-20 md:px-12 md:py-32"
    >
      <div className="home-hero-redg-text invisible absolute top-32 left-6 md:left-12 z-20 hidden md:block opacity-0 -translate-y-4">
        <span className="font-mono text-xs text-white/60 tracking-widest uppercase vertical-lr">
          [ Regd.No.29/046/047 ]
        </span>
      </div>

      <div className="home-hero-text relative z-20 flex max-w-5xl flex-col gap-8 md:gap-10 mt-12">
        <h2 className="font-sans text-[3.5rem] font-medium leading-[0.9] text-white md:text-[7rem] tracking-tighter">
          <div className="relative inline-block">
            <div className="overflow-hidden inline-block align-bottom pb-4">
              <span className="engineering-text-anim invisible inline-block font-bold italic underline decoration-2 underline-offset-12 decoration-white/30">
                NSAE
              </span>
            </div>
            <Badge className="badge-anim-wrapper opacity-0 absolute -top-8 -right-18 rotate-12 font-mono text-xs tracking-wide border-white/40">
              EST. 1990
            </Badge>
          </div>

          <br />
          <span className="subtitle-lines invisible inline-block text-white/80">
            Nepalese Society of
          </span>
          <br />
          <span className="subtitle-lines invisible inline-block text-white/80">
            Agricultural Engineers
          </span>
        </h2>

        <p className="hero-desc-anim opacity-0 max-w-xl text-lg text-white/70 font-sans leading-relaxed translate-y-4">
          NSAE connects leading engineers, scientists, and students dedicated to
          creating practical solutions for real‑world agricultural challenges.
        </p>

        <div className="hero-actions-anim opacity-0 flex translate-y-4 items-center gap-6 mt-4">
          <Button
            asChild
            className="rounded-full px-8 py-4 font-sans font-medium"
          >
            <a href="/contact">Get in Touch</a>
          </Button>

          <a
            href="#mission-brief"
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
          >
            ( Explore ) <IconArrowDown className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="scroll-indicator opacity-0 absolute bottom-10 right-12 z-20 hidden md:flex items-center gap-4">
        <span className="font-mono text-xs text-white/50 uppercase">
          Scroll to explore
        </span>
        <div className="scroll-line h-[1px] w-0 bg-white/30"></div>
      </div>

      <div className="absolute inset-0 z-10">
        <div className="bg-gradient-to-r absolute inset-0 z-20 rounded-2xl from-black/80 via-black/50 to-transparent"></div>
        <div className="hero-image-wrapper absolute inset-0 z-10 rounded-2xl bg-black/40"></div>
        <img
          className="hero-image-anim absolute inset-0 h-full w-full scale-110 rounded-2xl object-cover"
          alt="Agricultural Engineering"
          src={typeof data.image === 'string' ? data.image : data.image.src} 
        />
      </div>
    </section>
  );
};

export function HeroCarousel() {
  return (
    <div className="relative w-full">
      <Carousel
        opts={{
          loop: true,
          duration: 20,
        }}
        plugins={[
        Autoplay({
          delay: 4000,
        }),
      ]}
        className="w-full"
      >
        <CarouselContent>
          {SLIDES.map((slide) => (
            <CarouselItem key={slide.id}>
              <HeroSlide data={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>
        {SLIDES.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 gap-4 md:bottom-12 md:left-auto md:right-12 md:translate-x-0">
            <CarouselPrevious
              className="static translate-y-0 border-white/20 bg-black/20 text-white cursor-pointer "
              variant="outline"
            />
            <CarouselNext
              className="static translate-y-0 border-white/20 bg-black/20 text-white cursor-pointer"
              variant="outline"
            />
          </div>
        )}
      </Carousel>
    </div>
  );
}