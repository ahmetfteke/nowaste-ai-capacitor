"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface OnboardingSlide {
  title: string;
  description: string;
  image: string;
}

const slides: OnboardingSlide[] = [
  {
    title: "Add Food in Seconds",
    description:
      "Take a photo, use your voice, or scan a barcode. AI adds everything to your kitchen instantly.",
    image: "/onboarding/snap.png",
  },
  {
    title: "See Everything You Have",
    description:
      "All your food in one place with expiration dates. No more guessing what's in the back of the fridge.",
    image: "/onboarding/track.png",
  },
  {
    title: "Get Reminded Before It's Too Late",
    description:
      "We'll nudge you before food goes bad. Cook it, eat it, share it. Just don't throw it away.",
    image: "/onboarding/remind.png",
  },
  {
    title: "Share With Your Family",
    description:
      "Create a household and invite your family. Everyone sees the same fridge, shopping list, and alerts in real time.",
    image: "/onboarding/household.png",
  },
];

const premiumBenefits = [
  "Unlimited photo & voice scans",
  "AI recipes from your expiring food",
  "Smart alerts so nothing goes to waste",
  "Share with your whole family",
];

// Total steps = slides + 1 premium offer
const TOTAL_STEPS = slides.length + 1;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const isPremiumStep = currentStep === slides.length;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentStep < TOTAL_STEPS - 1) {
        setCurrentStep((prev) => prev + 1);
      } else if (diff < 0 && currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      }
    }

    touchStartX.current = null;
  };

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem("onboarding_complete", "true");
      router.push("/signup");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_complete", "true");
    router.push("/signup");
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip Button */}
      <div className="p-4 flex justify-end shrink-0">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {isPremiumStep ? (
          /* Premium offer step */
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold text-foreground mb-2">
              The average family throws away $1,500 of food a year
            </h1>
            <p className="text-muted-foreground mb-8">
              NoWaste Premium pays for itself in the first week.
            </p>

            <div className="space-y-3 text-left mb-8">
              {premiumBenefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Less than a coffee per month. Cancel anytime.
            </p>
          </div>
        ) : (
          /* Normal slides */
          <>
            <div className="w-full max-w-[280px] aspect-square relative mb-6">
              <Image
                src={slides[currentStep].image}
                alt={slides[currentStep].title}
                fill
                className="object-contain"
                priority
              />
            </div>

            <div className="max-w-md text-center">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                {slides[currentStep].title}
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                {slides[currentStep].description}
              </p>
            </div>
          </>
        )}

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-primary"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-8 pb-8 pt-4 shrink-0">
        <div className="max-w-md mx-auto space-y-2">
          <Button onClick={handleNext} className="w-full h-12 text-base">
            {isLastStep ? "Let's Start" : "Next"}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
