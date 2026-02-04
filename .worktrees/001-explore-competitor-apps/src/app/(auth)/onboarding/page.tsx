"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface OnboardingSlide {
  title: string;
  description: string;
  image: string;
}

const slides: OnboardingSlide[] = [
  {
    title: "Snap Your Groceries",
    description: "Take a photo of your groceries or receipt, and our AI will instantly add them to your inventory.",
    image: "/onboarding/snap.png",
  },
  {
    title: "Track Expiration Dates",
    description: "Never forget what's in your fridge. See all your food items with AI-estimated expiration dates.",
    image: "/onboarding/track.png",
  },
  {
    title: "Get Timely Reminders",
    description: "Receive alerts before food expires so you can use it in time. No more waste!",
    image: "/onboarding/remind.png",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const isLastSlide = currentSlide === slides.length - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        // Swipe left - next slide
        setCurrentSlide((prev) => prev + 1);
      } else if (diff < 0 && currentSlide > 0) {
        // Swipe right - previous slide
        setCurrentSlide((prev) => prev - 1);
      }
    }

    touchStartX.current = null;
  };

  const handleNext = () => {
    if (isLastSlide) {
      // Mark onboarding as complete and go to signup
      localStorage.setItem("onboarding_complete", "true");
      router.push("/signup");
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_complete", "true");
    router.push("/signup");
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip Button */}
      <div className="p-4 flex justify-end shrink-0">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
          Skip
        </Button>
      </div>

      {/* Main Content - centered vertically */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Illustration */}
        <div className="w-full max-w-[280px] aspect-square relative mb-6">
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Text */}
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {slide.title}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Button - fixed at bottom */}
      <div className="px-8 pb-8 pt-4 shrink-0">
        <div className="max-w-md mx-auto">
          <Button onClick={handleNext} className="w-full h-12 text-base">
            {isLastSlide ? "Get Started" : "Next"}
            {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
